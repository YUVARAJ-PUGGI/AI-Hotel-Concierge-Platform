import { Router } from "express";
import { Hotel } from "../models/Hotel.js";
import { Room } from "../models/Room.js";
import { Booking } from "../models/Booking.js";
import { ok } from "../utils/apiResponse.js";

const router = Router();

router.post("/hotels/search", async (req, res, next) => {
  try {
    const {
      lng,
      lat,
      maxDistanceMeters = 20000,
      maxPrice = null,
      minRating = 0,
      amenities = [],
      limit = 30,
      showAll = false
    } = req.body;

    const parsedLng = Number(lng);
    const parsedLat = Number(lat);
    const parsedMaxDistance = Number(maxDistanceMeters);
    const parsedMaxPrice = Number(maxPrice);
    const parsedMinRating = Number(minRating);
    const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 50);

    const hasGeo =
      lng !== null &&
      lat !== null &&
      lng !== undefined &&
      lat !== undefined &&
      Number.isFinite(parsedLng) &&
      Number.isFinite(parsedLat);

    const baseMatch = {};
    if (Number.isFinite(parsedMaxPrice)) {
      baseMatch.startingPrice = { $lte: parsedMaxPrice };
    }
    if (Number.isFinite(parsedMinRating) && parsedMinRating > 0) {
      baseMatch.rating = { $gte: parsedMinRating };
    }
    if (Array.isArray(amenities) && amenities.length > 0) {
      baseMatch.amenities = { $all: amenities };
    }

    const hotels = hasGeo && !showAll
      ? await Hotel.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [parsedLng, parsedLat] },
              distanceField: "distanceMeters",
              maxDistance: Number.isFinite(parsedMaxDistance) ? parsedMaxDistance : 20000,
              spherical: true,
              query: baseMatch
            }
          },
          { $limit: parsedLimit }
        ])
      : await Hotel.aggregate([
          { $match: baseMatch },
          { $sort: { rating: -1, startingPrice: 1 } },
          { $limit: parsedLimit }
        ]);

    console.log(`Found ${hotels.length} hotels, hasGeo: ${hasGeo}, showAll: ${showAll}`);

    const hotelIds = hotels.map((hotel) => hotel._id);
    const readyRooms = await Room.aggregate([
      { $match: { hotelId: { $in: hotelIds }, status: "ready" } },
      { $group: { _id: "$hotelId", readyRooms: { $sum: 1 } } }
    ]);

    const roomCountByHotel = new Map();
    readyRooms.forEach((room) => {
      roomCountByHotel.set(String(room._id), room.readyRooms);
    });

    const maxDistanceForScore = Number.isFinite(parsedMaxDistance) ? parsedMaxDistance : 20000;
    const maxPriceForScore = Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : 12000;
    const clamp01 = (value) => Math.max(0, Math.min(1, value));

    const data = hotels
      .map((hotel) => {
        const readyRoomCount = roomCountByHotel.get(String(hotel._id)) || 0;
        const ratingScore = clamp01((hotel.rating || 0) / 5);
        const priceScore = clamp01(1 - (hotel.startingPrice || 0) / maxPriceForScore);
        const distanceScore = hasGeo
          ? clamp01(1 - (hotel.distanceMeters || maxDistanceForScore) / maxDistanceForScore)
          : 0.5;
        const availabilityScore = clamp01(readyRoomCount / 10);
        const rankScore = Number(
          (ratingScore * 0.45 + priceScore * 0.2 + distanceScore * 0.25 + availabilityScore * 0.1).toFixed(3)
        );

        return {
          id: hotel._id,
          name: hotel.name,
          locationText: hotel.locationText,
          rating: hotel.rating,
          startingPrice: hotel.startingPrice,
          photoUrl: hotel.photoUrl,
          amenities: hotel.amenities,
          readyRooms: readyRoomCount,
          distanceMeters: hasGeo ? Math.round(hotel.distanceMeters || 0) : null,
          rankScore
        };
      })
      // Remove the filter that requires readyRooms > 0
      // .filter((hotel) => hotel.readyRooms > 0)
      .sort((a, b) => b.rankScore - a.rankScore);

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
});

router.get("/hotels/:hotelId", async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const readyRooms = await Room.countDocuments({ hotelId: hotel._id, status: "ready" });
    return ok(res, { ...hotel, readyRooms });
  } catch (err) {
    return next(err);
  }
});

router.get("/hotels/:hotelId/rooms", async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const rooms = await Room.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 }).lean();
    
    // Format rooms for frontend
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity || room.maxOccupancy,
      amenities: room.amenities || [],
      status: room.status,
      price: room.price || hotel.startingPrice
    }));

    return ok(res, formattedRooms);
  } catch (err) {
    return next(err);
  }
});

router.post("/hotels/:hotelId/rooms/availability", async (req, res, next) => {
  try {
    const { checkInDate, checkOutDate } = req.body;
    
    console.log("Availability check request:", {
      hotelId: req.params.hotelId,
      checkInDate,
      checkOutDate
    });
    
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        error: { code: "VALIDATION_ERROR", message: "checkInDate and checkOutDate are required" } 
      });
    }

    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const rooms = await Room.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 }).lean();
    console.log("Found rooms:", rooms.length);
    
    const requestedCheckIn = new Date(checkInDate);
    const requestedCheckOut = new Date(checkOutDate);
    
    // Get all bookings that might conflict with the requested dates
    const conflictingBookings = await Booking.find({
      hotelId: req.params.hotelId,
      status: { $in: ["confirmed", "checked_in"] }, // Only consider active bookings
      $or: [
        // Booking starts during requested period
        {
          checkInDate: { $gte: requestedCheckIn, $lt: requestedCheckOut }
        },
        // Booking ends during requested period
        {
          checkOutDate: { $gt: requestedCheckIn, $lte: requestedCheckOut }
        },
        // Booking spans the entire requested period
        {
          checkInDate: { $lte: requestedCheckIn },
          checkOutDate: { $gte: requestedCheckOut }
        }
      ]
    }).lean();
    
    console.log("Conflicting bookings found:", conflictingBookings.length);
    console.log("Conflicting bookings:", conflictingBookings);
    
    // Create a set of booked room IDs for the requested dates
    const bookedRoomIds = new Set(conflictingBookings.map(booking => booking.roomId.toString()));
    console.log("Booked room IDs:", Array.from(bookedRoomIds));
    
    // Format rooms with availability status
    const roomsWithAvailability = rooms.map(room => {
      const isBooked = bookedRoomIds.has(room._id.toString());
      const isReady = room.status === "ready";
      const isAvailable = isReady && !isBooked;
      
      console.log(`Room ${room.roomNumber}:`, {
        status: room.status,
        isReady,
        isBooked,
        isAvailable
      });
      
      return {
        id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity || room.maxOccupancy,
        amenities: room.amenities || [],
        status: room.status,
        price: room.price || hotel.startingPrice,
        isAvailable
      };
    });

    console.log("Returning rooms with availability:", roomsWithAvailability);
    return ok(res, roomsWithAvailability);
  } catch (err) {
    console.error("Error in availability check:", err);
    return next(err);
  }
});

// Hotel chat endpoints for RAG-based chatbot
router.get("/hotels/:hotelId/chat/topics", async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    // Get hotel documents to extract topics
    const { HotelDocument } = await import("../models/HotelDocument.js");
    const documents = await HotelDocument.find({ hotelId: req.params.hotelId }).lean();
    
    console.log(`Found ${documents.length} documents for topics extraction`);
    
    // Extract topics from document content - look for headings and sections
    const topics = [];
    const topicMap = new Map();
    
    documents.forEach(doc => {
      console.log(`Processing document: ${doc.title}`);
      const content = doc.content;
      
      // Check if document contains PDF metadata/binary data
      if (content.includes('%PDF') || content.includes('%%EOF') || content.includes('/Type') || content.includes('startxref')) {
        console.log(`Document contains PDF metadata, skipping heading extraction`);
        // Skip this document for heading extraction as it contains binary data
        return;
      }
      
      const lines = content.split('\n');
      
      // Look for proper headings (lines that end with colon or are in title case)
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // Filter out PDF technical content and metadata
        if (trimmedLine.includes('/') || 
            trimmedLine.includes('>>') || 
            trimmedLine.includes('<<') ||
            trimmedLine.includes('%') ||
            trimmedLine.includes('obj') ||
            trimmedLine.includes('endobj') ||
            trimmedLine.includes('xref') ||
            trimmedLine.includes('startxref') ||
            trimmedLine.match(/^\d+\s+\d+\s+R/) ||
            trimmedLine.length > 100) {
          return; // Skip PDF metadata lines
        }
        
        // Check if line looks like a proper heading
        const isHeading = 
          (trimmedLine.endsWith(':') && // Lines ending with colon (e.g., "Room Services:")
           trimmedLine.length < 50 && // Not too long
           trimmedLine.length > 5 && // Not too short
           !trimmedLine.includes('•') && // Not a bullet point
           !trimmedLine.includes('-') && // Not a dash item
           !trimmedLine.includes('₹') && // Not a price line
           !trimmedLine.match(/^\d/) && // Doesn't start with number
           trimmedLine.split(' ').length <= 6 && // Not too many words
           /^[A-Z]/.test(trimmedLine) // Starts with capital letter
          );
        
        if (isHeading) {
          const cleanHeading = trimmedLine.replace(':', '').trim();
          const headingId = cleanHeading.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          if (!topicMap.has(headingId)) {
            console.log(`Found valid heading: "${cleanHeading}"`);
            
            // Generate description based on heading content
            let description = `Information about ${cleanHeading.toLowerCase()}`;
            
            // Find content under this heading
            const headingIndex = lines.indexOf(line);
            const nextHeadingIndex = lines.slice(headingIndex + 1).findIndex(nextLine => {
              const nextTrimmed = nextLine.trim();
              return nextTrimmed.endsWith(':') && 
                     nextTrimmed.length < 50 && 
                     nextTrimmed.length > 5 &&
                     !nextTrimmed.includes('/') &&
                     !nextTrimmed.includes('>>');
            });
            
            const endIndex = nextHeadingIndex === -1 ? Math.min(lines.length, headingIndex + 10) : headingIndex + 1 + nextHeadingIndex;
            const sectionLines = lines.slice(headingIndex + 1, endIndex);
            
            // Extract clean content items for description
            const cleanItems = sectionLines
              .filter(sectionLine => {
                const trimmed = sectionLine.trim();
                return trimmed && 
                       !trimmed.includes('/') && 
                       !trimmed.includes('>>') && 
                       !trimmed.includes('<<') &&
                       !trimmed.includes('%') &&
                       trimmed.length < 100;
              })
              .map(sectionLine => sectionLine.trim().replace(/^[-•]\s*/, ''))
              .filter(item => item.length > 0)
              .slice(0, 3);
            
            if (cleanItems.length > 0) {
              description = cleanItems.join(', ');
              if (description.length > 60) {
                description = description.substring(0, 60) + '...';
              }
            }
            
            topicMap.set(headingId, {
              id: headingId,
              title: cleanHeading,
              description: description
            });
          }
        }
      });
    });
    
    // Convert map to array
    let extractedTopics = Array.from(topicMap.values());
    
    console.log(`Extracted ${extractedTopics.length} clean topics:`, extractedTopics.map(t => t.title));
    
    // If no clean topics extracted or document has PDF data, provide default topics based on common hotel sections
    if (extractedTopics.length === 0) {
      console.log(`No clean headings found, providing default hotel topics`);
      extractedTopics = [
        {
          id: 'room-services',
          title: 'Room Services',
          description: '24/7 room service, laundry, housekeeping'
        },
        {
          id: 'food-menu',
          title: 'Food Menu',
          description: 'Breakfast, lunch, dinner options'
        },
        {
          id: 'amenities',
          title: 'Hotel Amenities',
          description: 'Wi-Fi, parking, facilities'
        },
        {
          id: 'policies',
          title: 'Hotel Policies',
          description: 'Check-in/out, cancellation policy'
        }
      ];
    }
    
    return ok(res, { topics: extractedTopics });
  } catch (err) {
    console.error("Error extracting topics:", err);
    return next(err);
  }
});

router.post("/hotels/:hotelId/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: { code: "VALIDATION_ERROR", message: "Message is required" } 
      });
    }

    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    // Get hotel documents for RAG
    const { HotelDocument } = await import("../models/HotelDocument.js");
    const documents = await HotelDocument.find({ hotelId: req.params.hotelId }).lean();
    
    console.log(`Found ${documents.length} documents for hotel ${hotel.name}`);
    
    // Enhanced RAG implementation with section-specific extraction
    const messageLower = message.toLowerCase();
    const relevantContent = [];
    const sources = [];
    
    // Define search keywords for different categories
    const searchCategories = {
      booking: ['booking', 'reservation', 'book', 'reserve', 'availability', 'rates', 'price', 'cost'],
      services: ['service', 'room service', 'laundry', 'housekeeping', 'concierge', 'pickup', 'transport'],
      menu: ['menu', 'food', 'dining', 'restaurant', 'breakfast', 'lunch', 'dinner', 'snacks', 'meal'],
      amenities: ['amenities', 'facilities', 'wifi', 'gym', 'pool', 'parking', 'spa', 'fitness'],
      policies: ['policy', 'policies', 'check-in', 'check-out', 'cancellation', 'rules', 'terms']
    };
    
    // Find the most relevant category
    let primaryCategory = null;
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(searchCategories)) {
      const matches = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryCategory = category;
      }
    }
    
    console.log(`Primary category detected: ${primaryCategory}`);
    console.log(`User message: "${message}"`);
    
    // Extract specific sections from documents based on the query
    documents.forEach(doc => {
      console.log(`Processing document: ${doc.title}`);
      
      // Extract specific section based on user query
      const extractedSection = extractSpecificSection(doc.content, messageLower);
      
      if (extractedSection && extractedSection.content.trim()) {
        console.log(`Found relevant section: ${extractedSection.heading}`);
        relevantContent.push({
          title: doc.title,
          content: extractedSection.content,
          heading: extractedSection.heading,
          relevanceScore: extractedSection.relevanceScore
        });
        sources.push(doc.title);
      }
    });
    
    // Sort by relevance score
    relevantContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log(`Found ${relevantContent.length} relevant sections`);
    
    // Generate response based on extracted sections
    let reply = "";
    
    if (relevantContent.length > 0) {
      const topContent = relevantContent.slice(0, 2); // Use top 2 most relevant sections
      
      if (primaryCategory === 'menu' || messageLower.includes('food') || messageLower.includes('menu')) {
        reply = generateSectionResponse(topContent, hotel, 'Food Menu');
      } else if (primaryCategory === 'services' || messageLower.includes('service')) {
        reply = generateSectionResponse(topContent, hotel, 'Room Services');
      } else if (primaryCategory === 'amenities' || messageLower.includes('amenities')) {
        reply = generateSectionResponse(topContent, hotel, 'Hotel Amenities');
      } else if (primaryCategory === 'policies' || messageLower.includes('policy')) {
        reply = generateSectionResponse(topContent, hotel, 'Hotel Policies');
      } else {
        reply = generateSectionResponse(topContent, hotel, 'Information');
      }
    } else {
      // No relevant sections found
      reply = `I'd be happy to help you with information about ${hotel.name}. We're located in ${hotel.locationText}. ` +
              `I can provide information about our services, dining options, amenities, and policies. ` +
              `What specific aspect would you like to know more about?`;
    }
    
    return ok(res, { 
      reply: reply.trim(),
      sources: sources.slice(0, 3),
      category: primaryCategory
    });
  } catch (err) {
    console.error("Chat error:", err);
    return next(err);
  }
});

// Function to extract specific sections from document content
function extractSpecificSection(content, query) {
  const lines = content.split('\n');
  let bestSection = null;
  let maxScore = 0;
  
  // Find headings and their content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a heading
    const isHeading = line.endsWith(':') && line.length < 50 && line.length > 3;
    
    if (isHeading) {
      const heading = line.replace(':', '').trim();
      const headingLower = heading.toLowerCase();
      
      // Calculate relevance score for this heading
      let score = 0;
      const queryWords = query.split(' ').filter(word => word.length > 2);
      
      queryWords.forEach(word => {
        if (headingLower.includes(word)) {
          score += 3; // High score for heading match
        }
      });
      
      // Specific keyword matching
      if (query.includes('food') || query.includes('menu')) {
        if (headingLower.includes('food') || headingLower.includes('menu')) {
          score += 5;
        }
      }
      if (query.includes('service')) {
        if (headingLower.includes('service')) {
          score += 5;
        }
      }
      if (query.includes('amenities')) {
        if (headingLower.includes('amenities') || headingLower.includes('facilities')) {
          score += 5;
        }
      }
      
      if (score > 0) {
        // Extract content under this heading
        let sectionContent = '';
        let j = i + 1;
        
        // Get all lines until next heading or end of document
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          // Stop if we hit another heading
          if (nextLine.endsWith(':') && nextLine.length < 50 && nextLine.length > 3) {
            break;
          }
          
          if (nextLine) {
            sectionContent += nextLine + '\n';
          }
          j++;
        }
        
        if (score > maxScore && sectionContent.trim()) {
          maxScore = score;
          bestSection = {
            heading: heading,
            content: sectionContent.trim(),
            relevanceScore: score
          };
        }
      }
    }
  }
  
  console.log(`Best section found: ${bestSection?.heading} (score: ${maxScore})`);
  return bestSection;
}

// Function to generate response for specific sections
function generateSectionResponse(content, hotel, sectionType) {
  let response = `Here's information about ${sectionType} at ${hotel.name}:\n\n`;
  
  content.forEach(section => {
    if (section.heading) {
      response += `📋 ${section.heading}:\n`;
    }
    
    const lines = section.content.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        if (trimmedLine.startsWith('- ')) {
          response += `• ${trimmedLine.substring(2)}\n`;
        } else if (trimmedLine.startsWith('•')) {
          response += `${trimmedLine}\n`;
        } else {
          response += `• ${trimmedLine}\n`;
        }
      }
    });
    response += '\n';
  });
  
  if (response === `Here's information about ${sectionType} at ${hotel.name}:\n\n`) {
    response += `I don't have specific information about ${sectionType.toLowerCase()} right now. Please contact our front desk for detailed information.`;
  }
  
  return response;
}

export default router;

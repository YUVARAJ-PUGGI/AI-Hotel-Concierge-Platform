# How to Upload Hotel Documents to HotelOS

This guide explains how to upload hotel-specific documents that will be used by the concierge AI to provide accurate information to guests.

---

## Why Upload Documents?

Hotel documents help the concierge AI provide accurate answers about:
- Room types and pricing
- Available services and amenities
- Hotel policies and procedures
- Local attractions and recommendations
- Special offers and packages

Without documents, the AI will escalate most questions to the front desk. With documents, guests get instant, accurate answers.

---

## Steps to Upload Hotel Documents

### 1. Access Hotel Management
- Log in to HotelOS admin panel
- Navigate to **Hotels** → **Your Hotel Name** → **Documents** tab
- You'll see an upload form on the left side

### 2. Fill Document Details

**Document Title**: Give it a clear name
- Examples: "Room Types & Pricing", "Hotel Policies", "Room Service Menu"

**Source Name**: Where the document comes from (auto-filled but can be changed)
- Examples: "Manual Upload", "Hotel Handbook", "Website"

**Tags**: Add searchable keywords (comma-separated)
- Examples: "pricing, rooms, amenities" or "menu, room service, food"

**Content**: Paste the document content
- You can copy-paste from Word, PDF text, or type directly
- Use the file upload feature to attach PDF or TXT files
- For PDFs, the system will extract text (manual editing may be needed)

### 3. Upload the Document
- Click **"Upload Document"** button
- Wait for confirmation message
- The document is now active

### 4. View Uploaded Documents
- Scroll down to see all uploaded documents
- Each document shows title, source, tags, and date
- You can delete documents if needed

---

## Document Best Practices

### ✅ DO's:
- Use clear, concise language
- Organize information with headings and bullet points
- Include specific details (prices, timings, contact info)
- Update documents regularly
- Include multiple documents covering different topics
- Use simple formatting that's easy to read

### ❌ DON'Ts:
- Don't upload very long documents (break into smaller, focused documents)
- Don't include sensitive information (passwords, security codes)
- Don't use complex formatting or images
- Don't duplicate information across documents
- Don't leave outdated information

---

## Document Categories to Create

### Essential Documents (Must Have)

1. **Room Information**
   - Room types with detailed descriptions
   - Pricing for each room type
   - Capacity and amenities
   - Example: Use the `SAMPLE_HOTEL_DOCUMENT.md` "Room Types & Pricing" section

2. **Hotel Policies**
   - Check-in/check-out times and policies
   - Cancellation and refund policies
   - House rules and guidelines
   - Pet, smoking, and noise policies

3. **Services & Amenities**
   - Available services (room service, laundry, etc.)
   - Service timings and costs
   - Facilities (pool, gym, restaurant hours)
   - 24-hour available services

4. **Room Service Menu**
   - Food menu with items and prices
   - Meal timings (breakfast, lunch, dinner)
   - Special dietary options
   - Beverage menu

### Recommended Documents

5. **Local Area Information**
   - Nearby attractions (2-5 km)
   - Restaurants and shopping areas
   - Transport options
   - Emergency contacts for local services

6. **Special Services**
   - Airport transfers with pricing
   - Tour packages
   - Business center services
   - Concierge services

7. **Emergency & Safety**
   - Important contact numbers
   - Medical services and hospitals
   - Emergency procedures
   - Safety features

---

## Example: How to Prepare a Document

### Bad Example (Too Long, Unstructured):
```
We have many rooms at the hotel. The rooms have AC and WiFi. 
Some rooms have city view and some don't. The prices are different. 
You can call for more information about the rooms.
```

### Good Example (Structured, Clear):
```
## Room Types

### Standard Room
- Price: Rs. 3,000 per night
- Capacity: 2 guests
- Amenities: AC, WiFi, TV, Attached bathroom
- Bed: 1 King or 2 Single beds

### Deluxe Room
- Price: Rs. 4,500 per night
- Capacity: 2-3 guests
- Amenities: AC, WiFi, Work desk, City view
- Bed: 1 King bed
```

---

## Tips for AI Accuracy

### Use Specific Information:
Instead of: "We have good food"
Use: "Breakfast menu includes Idli, Dosa, Upma, served from 6-11 AM"

### Include Prices and Timings:
Instead of: "Room service available"
Use: "Room service available 24/7. Standard service charge: Rs. 100"

### Provide Alternatives:
Instead of: "We have rooms"
Use: "Standard (Rs. 3000), Deluxe (Rs. 4500), Suite (Rs. 6500)"

### Cross-Reference Information:
Link related information in documents to help AI make connections

---

## Troubleshooting

### Problem: AI is still escalating questions
**Solution**: Your documents might not have the information. Check if:
- The document is uploaded and appears in the list
- The information is clearly written
- You've tagged it appropriately
- Consider uploading more detailed documents

### Problem: PDF upload is not extracting text properly
**Solution**: 
- Try uploading as TXT or MD file instead
- Copy-paste the PDF text into the content field
- Manually type the information

### Problem: Cannot find the Documents tab
**Solution**:
- Make sure you're logged in as admin/hotel owner
- Navigate to: Hotels → Select Your Hotel → Click Documents tab
- If still not found, refresh the page

---

## When to Update Documents

Update your documents:
- When prices change (quarterly or seasonally)
- When services are added or removed
- When operating hours change
- After renovations or upgrades
- When special offers are launched
- Seasonally for availability changes

---

## Document Upload Frequency

- **Prices & Menus**: Update quarterly or with changes
- **Amenities**: Update annually or after improvements
- **Policies**: Update as needed (usually annually)
- **Local Info**: Update periodically (1-2 years)

---

## Sample Document Structure (Copy This!)

Use this template structure for your documents:

```
# Document Title

## Section 1
- Detail with specific information
- Contact or pricing information
- Clear, concise writing

## Section 2
- Organized bullet points
- Include timings or availability
- Add important details

## Notes
- Any special information
- Exceptions or special cases
```

---

## Getting Help

If you need help:
1. Refer to this guide
2. Use the sample document template provided
3. Contact hotel support
4. Ask the concierge AI for guidance (it may help with document creation)

---

**Next Steps**: Upload your first document using the sample template!

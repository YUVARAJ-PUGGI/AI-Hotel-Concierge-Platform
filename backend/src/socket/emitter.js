import { events } from "./events.js";

let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

export function emitToBooking(bookingId, eventKey, payload) {
  if (!ioRef) return;
  ioRef.to(`booking:${bookingId}`).emit(events[eventKey], payload);
}

export function emitToHotelStaff(hotelId, eventKey, payload) {
  if (!ioRef) return;
  ioRef.to(`hotel:${hotelId}:staff`).emit(events[eventKey], payload);
  ioRef.to("staff:global").emit(events[eventKey], payload);
}

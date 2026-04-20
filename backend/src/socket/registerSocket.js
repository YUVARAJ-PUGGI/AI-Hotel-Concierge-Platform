export function registerSocket(io) {
  io.on("connection", (socket) => {
    socket.on("subscribe:booking", ({ bookingId }) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("subscribe:staff", ({ hotelId }) => {
      if (hotelId) {
        socket.join(`hotel:${hotelId}:staff`);
      } else {
        socket.join("staff:global");
      }
    });

    socket.on("subscribe:admin", () => {
      socket.join("admin:global");
    });
  });
}

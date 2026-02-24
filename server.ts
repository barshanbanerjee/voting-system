import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
// Force restart for new models
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      if (!req.headers['x-forwarded-for'] && req.socket.remoteAddress) {
        req.headers['x-forwarded-for'] = req.socket.remoteAddress;
      }
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join admin room
    socket.on("join-admin", () => {
      socket.join("admins");
      console.log(`Admin joined: ${socket.id}`);
    });

    // Handle vote session request
    socket.on("request-vote-session", (data) => {
      console.log("Voter requesting session:", data);
      io.to("admins").emit("vote-session-requested", { ...data, socketId: socket.id });
    });

    // Handle session approval
    socket.on("approve-vote-session", (data) => {
      console.log("Admin approved session for:", data.socketId);
      io.to(data.socketId).emit("session-approved", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

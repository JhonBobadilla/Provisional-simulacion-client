// server/index.js
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: true,
    credentials: true,
    allowedHeaders: [
      "x-acarreosya-auth-token",
      "authorization",
      "content-type",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

app.locals.io = io;

// === Handshake / Auth ========================================================
io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth || {};
    const authToken = typeof auth.token === "string" ? auth.token : undefined;

    const rawHeader = socket.handshake.headers["x-acarreosya-auth-token"];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    const bearer = socket.handshake.headers["authorization"];
    const bearerToken =
      typeof bearer === "string" && bearer.toLowerCase().startsWith("bearer ")
        ? bearer.slice(7).trim()
        : undefined;

    // También acepta query ?authToken=...
    const queryToken =
      typeof socket.handshake.query?.authToken === "string"
        ? socket.handshake.query.authToken
        : undefined;

    const token = (
      (authToken || headerToken || bearerToken || queryToken || "") + ""
    ).trim();

    console.log("[HS] path           =", socket.handshake.url);
    console.log("[HS] headers keys   =", Object.keys(socket.handshake.headers));
    console.log("[HS] has X-ACY?     =", !!headerToken);
    console.log("[HS] has Authorization?", !!bearerToken);
    console.log("[HS] query.authToken =", !!queryToken);

    if (!token) return next(new Error("El token no ha sido encontrado"));

    // >>> Aquí normalmente validarías el JWT y extraerías el userId <<<
    // const payload = verify(token, process.env.JWT_SECRET);
    // const userId = Number(payload.id);
    const userId = Number(socket.handshake.query?.driverId) || 43; // demo para pruebas locales

    console.log("[HS] token OK → userId =", userId);

    socket.data.user = { id: userId, fullname: "Demo User" };
    socket.data.token = token;

    next();
  } catch (e) {
    console.error("[HS] ERROR:", e?.message);
    next(e);
  }
});

// === Conexión ================================================================
io.on("connection", async (socket) => {
  const user = socket.data?.user;
  const userId = user?.id;
  console.log(`✅ conectado user=${userId} socket=${socket.id}`);

  // Cerrar sockets duplicados del mismo usuario
  /*const sockets = await io.fetchSockets();
  for (const s of sockets) {
    if (s.id !== socket.id && s.data?.user?.id === userId) {
      console.log(`Cerrando duplicado de user=${userId}: ${s.id}`);
      s.disconnect(true);
    }
  }*/

  const room = `user:${userId}`;
  socket.join(room);
  console.log(`[SOCKET] ${socket.id} unido a room ${room}`);

  // === Evento principal: driver:location ====================================
  socket.on("driver:location", async (payload, cb) => {
    try {
      console.log("[SVR] driver:location payload =", payload);

      const vehicleId = Number(payload?.vehicleId);
      const driverId = Number(payload?.driverId);
      const lat = payload?.lat;
      const lon = payload?.lon;
      const speed = typeof payload?.speed === "number" ? payload.speed : 0;
      const heading =
        typeof payload?.heading === "number" ? payload.heading : 0;
      const sentAt =
        typeof payload?.sentAt === "string"
          ? payload.sentAt
          : new Date().toISOString();

      if (
        !vehicleId ||
        !driverId ||
        typeof lat !== "number" ||
        typeof lon !== "number"
      ) {
        console.warn("[SVR] payload inválido", payload);
        cb && cb({ ok: false, error: "Payload inválido" });
        return;
      }

      // ACK al emisor
      const ack = { ok: true, receivedAt: new Date().toISOString() };
      console.log("[SVR] ACK →", ack);
      cb && cb(ack);

      // Broadcast (a su room y a todos)
      io.to(room).emit("server:broadcast", {
        vehicleId,
        lat,
        lon,
        speed,
        heading,
        sentAt,
      });
      io.emit("driver:location:ack", {
        vehicleId,
        lat,
        lon,
        speed,
        heading,
        sentAt,
      });

      // TODO: persistir en DB si aplica
    } catch (e) {
      console.error("[SVR] ERROR", e);
      cb && cb({ ok: false, error: e?.message || "Error interno" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `👋 disconnect user=${userId} socket=${socket.id} reason=${reason}`
    );
  });
});

const PORT = process.env.PORT || 50210; // ⬅️ tu puerto real local
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP + Socket.IO escuchando en :${PORT}`);
});

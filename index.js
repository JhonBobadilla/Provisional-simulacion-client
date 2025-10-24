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
  path: "/socket.io/", // ⬅️ con slash final
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
  transports: ["polling", "websocket"], // polling primero, luego WS
  allowEIO3: true,
  pingInterval: 20000,
  pingTimeout: 45000,
  connectTimeout: 20000,
});

app.locals.io = io;

// === Handshake / Auth ========================================================
io.use((socket, next) => {
  try {
    const hs = socket.handshake;
    const auth = hs.auth || {};

    // Tokens posibles
    const authToken = typeof auth.token === "string" ? auth.token : undefined;

    const rawHeader = hs.headers["x-acarreosya-auth-token"];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    const bearer = hs.headers["authorization"];
    const bearerToken =
      typeof bearer === "string" && bearer.toLowerCase().startsWith("bearer ")
        ? bearer.slice(7).trim()
        : undefined;

    const queryToken =
      typeof hs.query?.authToken === "string" ? hs.query.authToken : undefined;

    const token = (
      (authToken || headerToken || bearerToken || queryToken || "") + ""
    ).trim();

    // Ids posibles en handshake
    const queryDriverId = Number(hs.query?.driverId);
    const authDriverId = Number(auth.driverId);
    const userId = Number.isFinite(queryDriverId)
      ? queryDriverId
      : Number.isFinite(authDriverId)
      ? authDriverId
      : undefined;

    const queryVehicleId = Number(hs.query?.vehicleId);
    const authVehicleId = Number(auth.vehicleId);
    const vehicleId = Number.isFinite(queryVehicleId)
      ? queryVehicleId
      : Number.isFinite(authVehicleId)
      ? authVehicleId
      : undefined;

    console.log("[HS] path =", hs.url);
    console.log(
      "[HS] has X-ACY? =",
      !!headerToken,
      "has Bearer? =",
      !!bearerToken,
      "has queryToken? =",
      !!queryToken
    );
    console.log("[HS] driverId =", userId, "vehicleId =", vehicleId);

    if (!token) return next(new Error("El token no ha sido encontrado"));
    if (!userId) return next(new Error("driverId faltante en handshake"));

    // >>> Aquí normalmente validarías el JWT y extraerías el userId <<<
    // const payload = verify(token, process.env.JWT_SECRET);
    // if (Number(payload.id) !== userId) return next(new Error("JWT inválido"));

    socket.data.user = { id: userId };
    socket.data.token = token;
    if (Number.isFinite(vehicleId)) socket.data.vehicleId = vehicleId;

    next();
  } catch (e) {
    console.error("[HS] ERROR:", e?.message);
    next(e);
  }
});

// === Conexión ================================================================
io.on("connection", async (socket) => {
  const userId = socket.data?.user?.id;
  const vehicleId = socket.data?.vehicleId;

  console.log(
    `✅ conectado user=${userId} vehicleId=${vehicleId ?? "N/A"} socket=${
      socket.id
    }`
  );

  // Rooms por usuario y (si aplica) por vehículo
  const userRoom = `user:${userId}`;
  socket.join(userRoom);
  console.log(`[SOCKET] ${socket.id} unido a room ${userRoom}`);

  if (Number.isFinite(vehicleId)) {
    const vehicleRoom = `vehicle:${vehicleId}`;
    socket.join(vehicleRoom);
    console.log(`[SOCKET] ${socket.id} unido a room ${vehicleRoom}`);

    // (Opcional) cierra duplicados por vehículo
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      if (s.id !== socket.id && s.data?.vehicleId === vehicleId) {
        console.log(`Cerrando duplicado vehicleId=${vehicleId}: ${s.id}`);
        s.disconnect(true);
      }
    }
  } else {
    console.warn(`[WARN] vehicleId faltante en handshake para user ${userId}`);
  }

  // === Evento principal: driver:location ====================================
  socket.on("driver:location", async (payload, cb) => {
    try {
      console.log("[SVR] driver:location payload =", payload);

      const vehicleIdP = Number(payload?.vehicleId);
      const driverIdP = Number(payload?.driverId);
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
        !vehicleIdP ||
        !driverIdP ||
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

      // Broadcast: al room del usuario y, si está, al del vehículo
      io.to(userRoom).emit("server:broadcast", {
        vehicleId: vehicleIdP,
        lat,
        lon,
        speed,
        heading,
        sentAt,
      });

      if (Number.isFinite(vehicleId)) {
        io.to(`vehicle:${vehicleId}`).emit("server:broadcast", {
          vehicleId: vehicleIdP,
          lat,
          lon,
          speed,
          heading,
          sentAt,
        });
      }

      io.emit("driver:location:ack", {
        vehicleId: vehicleIdP,
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
      `👋 disconnect user=${userId} vehicleId=${vehicleId ?? "N/A"} socket=${
        socket.id
      } reason=${reason}`
    );
  });
});

const PORT = process.env.PORT || 50210;
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP + Socket.IO escuchando en :${PORT}`);
});

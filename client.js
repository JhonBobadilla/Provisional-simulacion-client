// client.js
require("dotenv").config();
const { io } = require("socket.io-client");

// === 1) ENV / FLAGS ==========================================================
const URL = process.env.SOCKET_URL || "http://localhost:50210";
const SOCKET_PATH = process.env.SOCKET_PATH || "/socket.io/"; // DEJA el slash final si tu server lo usa
const TOKEN = (process.env.TOKEN || "").trim();
const VEHICLE_ID = Number(process.env.VEHICLE_ID || 1);
const DRIVER_ID = Number(process.env.DRIVER_ID || 1);
const DRIVER_NAME = process.env.DRIVER_NAME || `D${DRIVER_ID}`;
const NAMESPACE = (process.env.SOCKET_NAMESPACE || "").trim();
const USE_QUERY = (process.env.USE_QUERY || "true").toLowerCase() === "true";
const SEND_INTERVAL_MS = Number(process.env.SEND_INTERVAL_MS || 60000);
const EVENT_NAME = process.env.EVENT_NAME || "driver:location";
const ONLY_WEBSOCKET =
  (process.env.ONLY_WEBSOCKET || "false").toLowerCase() === "true";

// Coordenadas iniciales por env
let lat = Number(process.env.START_LAT || 4.711);
let lon = Number(process.env.START_LON || -74.0721);

// Offset automático para evitar colisiones exactas
const AUTO_OFFSET =
  (process.env.AUTO_OFFSET || "true").toLowerCase() === "true";
if (AUTO_OFFSET) {
  const seed = (DRIVER_ID * 73856093) ^ (VEHICLE_ID * 19349663);
  const offA = ((seed % 2001) - 1000) / 1e7;
  const offB = ((((seed / 2003) | 0) % 2001) - 1000) / 1e7;
  lat = Number((lat + offA).toFixed(6));
  lon = Number((lon + offB).toFixed(6));
}

const TARGET_URL = NAMESPACE ? `${URL}${NAMESPACE}` : URL;

// === 2) CONEXIÓN =============================================================
const transports =
  (process.env.ONLY_WEBSOCKET || "false").toLowerCase() === "true"
    ? ["websocket"]
    : ["polling"];

const upgrade =
  (process.env.ONLY_WEBSOCKET || "false").toLowerCase() === "true";

const clientOptions = {
  path: SOCKET_PATH,
  transports,
  upgrade,
  withCredentials: true,
  forceNew: true,
  timeout: 15000,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  auth: { token: TOKEN },
  extraHeaders: {
    "X-ACARREOSYA-Auth-Token": TOKEN,
    Authorization: `Bearer ${TOKEN}`,
  },
};

if (USE_QUERY) {
  clientOptions.query = {
    authToken: TOKEN,
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
  };
}

console.log("[BOOT] TARGET_URL:", TARGET_URL);
console.log("[BOOT] PATH:", SOCKET_PATH);
console.log("[BOOT] TRANSPORTS:", transports, "upgrade:", upgrade);

const socket = io(TARGET_URL, clientOptions);

// === 3) LOGS ================================================================
function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

socket.on("connect", () => {
  log("[connect]", socket.id);

  // === JOIN INMEDIATO =======================================================
  const joinPayload = {
    type: "driver",
    id: DRIVER_ID,
    rooms: [`driver:${DRIVER_ID}`, `vehicle:${VEHICLE_ID}`],
    user: { id: DRIVER_ID, fullname: DRIVER_NAME, role: "driver" },
  };
  socket.emit("join", joinPayload, (resp) => {
    log("[join ACK]", resp);
  });

  // primer envío inmediato y luego intervalo
  sendLocation(lat, lon);
  startEmitting();
});

socket.on("connect_error", (e) => {
  log("[connect_error]", e?.message || e);
  if (e && e.description) log("[connect_error:desc]", e.description);
});
socket.on("error", (e) => log("[error]", e));
socket.on("disconnect", (r) => log("[disconnect]", r));

// === 4) EVENTOS =============================================================
socket.on("driver:location:ack", (data) => log("[ACK driver:location]", data));
socket.on("server:broadcast", (data) => log("[broadcast]", data));
socket.on("vehicle:location:update", (data) => log("[vehicle:update]", data));
socket.on("driver:location:update", (data) => log("[driver:update]", data));

// === 5) EMISIÓN =============================================================
function sendLocation(latV, lonV) {
  const payload = {
    vehicleId: VEHICLE_ID,
    driverId: DRIVER_ID,
    lat: latV,
    lon: lonV,
    speed: 0,
    heading: 0,
    sentAt: new Date().toISOString(),
  };
  log("[try emit]", EVENT_NAME, payload);
  socket.emit(EVENT_NAME, payload, (ack) => log("[emit ACK]", EVENT_NAME, ack));
}

let tick = 0,
  interval = null;
function startEmitting() {
  if (interval) return;
  log("[emitter] START interval =", SEND_INTERVAL_MS, "ms");
  interval = setInterval(() => {
    tick++;
    lat += (Math.random() - 0.5) * 0.0005;
    lon += (Math.random() - 0.5) * 0.0005;
    const la = Number(lat.toFixed(6));
    const lo = Number(lon.toFixed(6));
    log(`[tick ${tick}]`, { la, lo });
    sendLocation(la, lo);
  }, SEND_INTERVAL_MS);
}

process.on("SIGINT", () => {
  if (interval) clearInterval(interval);
  socket.close();
  log("Bye!");
  process.exit(0);
});

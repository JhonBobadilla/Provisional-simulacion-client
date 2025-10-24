// client.js
require("dotenv").config();
const { io } = require("socket.io-client");

// === 1) ENV / FLAGS ==========================================================
const URL = process.env.SOCKET_URL || "https://acyrealtime.inkubo.co/";
let SOCKET_PATH = process.env.SOCKET_PATH || "/socket.io"; // sin "/" al final
const TOKEN = (process.env.TOKEN || "").trim();
const VEHICLE_ID = Number(process.env.VEHICLE_ID || 1);
const DRIVER_ID = Number(process.env.DRIVER_ID || 1);
const NAMESPACE = (process.env.SOCKET_NAMESPACE || "").trim(); // ej: "/tracking" o vacío
const ONLY_WS = (process.env.ONLY_WEBSOCKET || "true").toLowerCase() === "true"; // true=solo websocket
const USE_QUERY = (process.env.USE_QUERY || "true").toLowerCase() === "true";
const SEND_INTERVAL_MS = Number(process.env.SEND_INTERVAL_MS || 60000);
const EVENT_NAME = process.env.EVENT_NAME || "driver:location";

// Coordenadas iniciales por env
let lat = Number(process.env.START_LAT || 4.711);
let lon = Number(process.env.START_LON || -74.0721);

// Offset automático opcional para evitar colisiones exactas al nacer
const AUTO_OFFSET =
  (process.env.AUTO_OFFSET || "true").toLowerCase() === "true";
if (AUTO_OFFSET) {
  // Pequeño offset determinístico basado en DRIVER_ID y VEHICLE_ID
  const seed = (DRIVER_ID * 73856093) ^ (VEHICLE_ID * 19349663);
  const offA = ((seed % 2001) - 1000) / 1e7; // ~±0.0001 deg
  const offB = ((((seed / 2003) | 0) % 2001) - 1000) / 1e7;
  lat = Number((lat + offA).toFixed(6));
  lon = Number((lon + offB).toFixed(6));
}

// Mantén el slash final en SOCKET_PATH si viene así por env (proxies suelen usar /socket.io/)
if (!SOCKET_PATH.startsWith("/")) SOCKET_PATH = `/${SOCKET_PATH}`;

// No agregues slash al final del URL base
const baseURL = URL.replace(/\/+$/, "");

// Apunta a namespace si existe (sin duplicar slashes)
const TARGET_URL = NAMESPACE
  ? `${baseURL}${NAMESPACE.startsWith("/") ? "" : "/"}${NAMESPACE}`
  : baseURL;

// === 2) CONEXIÓN =============================================================
// Poner polling primero ayuda en proxies que bloquean upgrade; luego intenta WS
const transports = ONLY_WS ? ["websocket"] : ["polling", "websocket"];

const clientOptions = {
  path: SOCKET_PATH, // respeta "/socket.io/" si así lo define el proxy
  transports,
  withCredentials: true,
  forceNew: true,
  timeout: 15000,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,

  // Enviar token en todas las formas comunes
  auth: { token: TOKEN },
  extraHeaders: {
    "X-ACARREOSYA-Auth-Token": TOKEN,
    Authorization: `Bearer ${TOKEN}`,
  },

  // Asegura HTTPS correcto en Node (no es necesario en la mayoría, pero no estorba)
  secure: true,
};

// Si el backend acepta token por querystring en el handshake
if (USE_QUERY) {
  clientOptions.query = {
    authToken: TOKEN,
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
  };
}

const socket = io(TARGET_URL, clientOptions);

// === 3) LOGS BÁSICOS =========================================================
function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

socket.on("connect", () => {
  log("[connect]", socket.id);

  // PRIMER DISPARO: usar las coords iniciales configuradas (NO hardcode)
  sendLocation(lat, lon);

  // Arranca la emisión periódica
  startEmitting();
});

socket.on("connect_error", (e) => log("[connect_error]", e?.message || e));
socket.on("error", (e) => log("[error]", e));
socket.on("disconnect", (r) => log("[disconnect]", r));

// === 4) EVENTOS QUE ESPERAMOS DEL SERVER ====================================
socket.on("driver:location:ack", (data) => log("[ACK driver:location]", data));
socket.on("server:broadcast", (data) => log("[broadcast]", data));

// === 5) EMISIÓN DE COORDENADAS ==============================================
function sendLocation(latV, lonV) {
  const payload = {
    vehicleId: VEHICLE_ID,
    driverId: DRIVER_ID,
    lat: latV, // si tu backend usa "lng", cámbialo
    lon: lonV,
    speed: 0,
    heading: 0,
    sentAt: new Date().toISOString(),
  };
  log("[try emit]", EVENT_NAME, payload);
  socket.emit(EVENT_NAME, payload, (ack) => {
    log("[emit ACK]", EVENT_NAME, ack);
  });
}

let tick = 0;
let interval = null;

function startEmitting() {
  if (interval) return;
  log("[emitter] START interval =", SEND_INTERVAL_MS, "ms");
  interval = setInterval(() => {
    tick++;
    // Random walk
    lat += (Math.random() - 0.5) * 0.0005;
    lon += (Math.random() - 0.5) * 0.0005;
    const la = Number(lat.toFixed(6));
    const lo = Number(lon.toFixed(6));
    log(`[tick ${tick}]`, { la, lo });
    sendLocation(la, lo);
  }, SEND_INTERVAL_MS);
}

// === 6) SALIDA LIMPIA ========================================================
process.on("SIGINT", () => {
  if (interval) clearInterval(interval);
  socket.close();
  log("Bye!");
  process.exit(0);
});

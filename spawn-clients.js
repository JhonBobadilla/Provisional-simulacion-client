// spawn-clients.js
require("dotenv").config();
const { fork } = require("child_process");

// ⚙️ Config común tomada de tu .env (SOCKET_URL, PATH, etc.)
const COMMON = {
  SOCKET_URL: process.env.SOCKET_URL || "http://localhost:50210",
  SOCKET_PATH: process.env.SOCKET_PATH || "/socket.io",
  SOCKET_NAMESPACE: process.env.SOCKET_NAMESPACE || "",
  ONLY_WEBSOCKET: process.env.ONLY_WEBSOCKET || "true",
  USE_QUERY: process.env.USE_QUERY || "true",
  SEND_INTERVAL_MS: process.env.SEND_INTERVAL_MS || "2000",
  EVENT_NAME: process.env.EVENT_NAME || "driver:location",
};

// 👇 Lista de conductores (usa el TOKEN real de CADA driver)
const DRIVERS = [
  {
    name: "D1",
    DRIVER_ID: 43,
    VEHICLE_ID: 21,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTcwMTgwNjJ9.TR9IWXFxKuj6y4YSdZeJETgwjsWuYi25HEY6bpfPQfg",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D2",
    DRIVER_ID: 44,
    VEHICLE_ID: 34,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0IiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTcwMTgwOTZ9.wF2DQGtQ8IDAYmVHFo552ctU7J40O180bXT6owJQw7Q",
    START_LAT: 4.722,
    START_LON: -74.065,
  },
  {
    name: "D3",
    DRIVER_ID: 108,
    VEHICLE_ID: 32,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU3MDE4MTE5fQ.PDWKgN2F3IL4kYmXskhg89sXWVzzMgRbV9w126LqKCE",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D4",
    DRIVER_ID: 110,
    VEHICLE_ID: 27,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU3MDE4MTM4fQ.D26akhYBjV0g5Z9lwXR71JlLLsht2RbN_RziJd1a9Dw",
    START_LAT: 4.718,
    START_LON: -74.09,
  },
  {
    name: "D5-Cali",
    DRIVER_ID: 115,
    VEHICLE_ID: 38,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU3MDAwODkwfQ._KlO-bcMoDkgkGfSsS7Di-nRmxbEcGp8BZEu1yrF6LQ",
    START_LAT: 3.4216,
    START_LON: -76.5205,
  },
];

console.log(`Lanzando ${DRIVERS.length} conductores...\n`);

DRIVERS.forEach((cfg) => {
  const env = {
    ...process.env,
    ...COMMON,
    DRIVER_ID: String(cfg.DRIVER_ID),
    VEHICLE_ID: String(cfg.VEHICLE_ID),
    TOKEN: cfg.TOKEN,
    START_LAT: String(cfg.START_LAT),
    START_LON: String(cfg.START_LON),
  };

  const child = fork("./client.js", [], { env });
  console.log(
    `[spawn] ${cfg.name} → DRIVER_ID=${cfg.DRIVER_ID} VEHICLE_ID=${cfg.VEHICLE_ID}`
  );

  child.on("exit", (code) => {
    console.log(`[exit] ${cfg.name} (driver ${cfg.DRIVER_ID}) → code ${code}`);
  });
});

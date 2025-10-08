require("dotenv").config();
const { fork } = require("child_process");

// Config común tomada de .env (SOCKET_URL, PATH, etc.)
const COMMON = {
  SOCKET_URL: process.env.SOCKET_URL || "http://localhost:50210",
  SOCKET_PATH: process.env.SOCKET_PATH || "/socket.io",
  SOCKET_NAMESPACE: process.env.SOCKET_NAMESPACE || "",
  ONLY_WEBSOCKET: process.env.ONLY_WEBSOCKET || "true",
  USE_QUERY: process.env.USE_QUERY || "true",
  SEND_INTERVAL_MS: process.env.SEND_INTERVAL_MS || "60000",
  EVENT_NAME: process.env.EVENT_NAME || "driver:location",
};

// Lista de conductores => usa el TOKEN real de CADA driver.
const DRIVERS = [
  /////////////////////////////43/////////////////////////////////
  {
    name: "D1",
    DRIVER_ID: 43,
    VEHICLE_ID: 21,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D11",
    DRIVER_ID: 43,
    VEHICLE_ID: 23,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D12",
    DRIVER_ID: 43,
    VEHICLE_ID: 24,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D13",
    DRIVER_ID: 43,
    VEHICLE_ID: 25,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 26,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 33,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 35,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 43,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 44,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 45,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 46,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 47,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  {
    name: "D14",
    DRIVER_ID: 43,
    VEHICLE_ID: 48,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzIiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEyODN9.NfvRZA1_jfQFkleVaN_xf8KnlAlMz99xP9NzmFXX7pc",
    START_LAT: 4.711,
    START_LON: -74.0721,
  },
  /////////////////////////////44/////////////////////////////////
  {
    name: "D2",
    DRIVER_ID: 44,
    VEHICLE_ID: 34,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0IiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEzNTN9.a2yaebRQ9fKrLaGSX1c74k-9rvjkrXmSkICyPSEv0Bw",
    START_LAT: 4.722,
    START_LON: -74.065,
  },
  {
    name: "D2",
    DRIVER_ID: 44,
    VEHICLE_ID: 36,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0IiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEzNTN9.a2yaebRQ9fKrLaGSX1c74k-9rvjkrXmSkICyPSEv0Bw",
    START_LAT: 4.722,
    START_LON: -74.065,
  },
  {
    name: "D2",
    DRIVER_ID: 44,
    VEHICLE_ID: 37,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0IiwibW9kZWxOYW1lIjoidXNlci1kcml2ZXIiLCJpYXQiOjE3NTk5NjEzNTN9.a2yaebRQ9fKrLaGSX1c74k-9rvjkrXmSkICyPSEv0Bw",
    START_LAT: 4.722,
    START_LON: -74.065,
  },
  /////////////////////////////108////////////////////////////////
  {
    name: "D3",
    DRIVER_ID: 108,
    VEHICLE_ID: 32,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwOCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxNDcwfQ.0n_IunKlw1NacCj1aksQC-Szv12IfGit5tbzKgK9vlw",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  /////////////////////////////110////////////////////////////////
  {
    name: "D4",
    DRIVER_ID: 110,
    VEHICLE_ID: 27,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D41",
    DRIVER_ID: 110,
    VEHICLE_ID: 22,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D41",
    DRIVER_ID: 110,
    VEHICLE_ID: 23,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D41",
    DRIVER_ID: 110,
    VEHICLE_ID: 24,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D41",
    DRIVER_ID: 110,
    VEHICLE_ID: 25,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  {
    name: "D41",
    DRIVER_ID: 110,
    VEHICLE_ID: 26,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMCIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxMzkwfQ.WrQxV1fZEotPPnqhscLS_ujJRP7cV2bC3gaqB93LQug",
    START_LAT: 4.7035,
    START_LON: -74.08,
  },
  /////////////////////////////115////////////////////////////////
  {
    name: "D5-Cali",
    DRIVER_ID: 115,
    VEHICLE_ID: 38,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxNDM3fQ.3nXLh68gLkSiUOtTJEpYQ9Wa0qBy4JaVdf3PDc_kveU",
    START_LAT: 3.4216,
    START_LON: -76.5205,
  },
  {
    name: "D5-Cali",
    DRIVER_ID: 115,
    VEHICLE_ID: 40,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxNDM3fQ.3nXLh68gLkSiUOtTJEpYQ9Wa0qBy4JaVdf3PDc_kveU",
    START_LAT: 3.4216,
    START_LON: -76.5205,
  },
  {
    name: "D5-Cali",
    DRIVER_ID: 115,
    VEHICLE_ID: 41,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxNDM3fQ.3nXLh68gLkSiUOtTJEpYQ9Wa0qBy4JaVdf3PDc_kveU",
    START_LAT: 3.4216,
    START_LON: -76.5205,
  },
  {
    name: "D5-Cali",
    DRIVER_ID: 115,
    VEHICLE_ID: 42,
    TOKEN:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNSIsIm1vZGVsTmFtZSI6InVzZXItZHJpdmVyIiwiaWF0IjoxNzU5OTYxNDM3fQ.3nXLh68gLkSiUOtTJEpYQ9Wa0qBy4JaVdf3PDc_kveU",
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

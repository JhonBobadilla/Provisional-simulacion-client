// launcher.js
require("dotenv").config();
const { fork } = require("child_process");

// Config común tomada de .env (SOCKET_URL, PATH, etc.)
const COMMON = {
  SOCKET_URL: process.env.SOCKET_URL || "http://localhost:50210",
  SOCKET_PATH: process.env.SOCKET_PATH || "/socket.io",
  SOCKET_NAMESPACE: process.env.SOCKET_NAMESPACE || "",
  ONLY_WEBSOCKET: process.env.ONLY_WEBSOCKET || "false",
  USE_QUERY: process.env.USE_QUERY || "true",
  SEND_INTERVAL_MS: process.env.SEND_INTERVAL_MS || "600000",
  EVENT_NAME: process.env.EVENT_NAME || "driver:location",
};

/** Descubre todos los DRIVER_ID configurados en el .env */
function getDriverIdsFromEnv() {
  const ids = new Set();
  for (const key of Object.keys(process.env)) {
    const m = key.match(/^DRIVER_(\d+)_TOKEN$/);
    if (m) ids.add(m[1]);
  }
  return Array.from(ids).sort((a, b) => Number(a) - Number(b));
}

/** Lee y valida la config de un driver desde el .env */
function loadDriverConfig(driverId) {
  const prefix = `DRIVER_${driverId}_`;
  const token = process.env[`${prefix}TOKEN`];
  if (!token) throw new Error(`Falta ${prefix}TOKEN en .env`);

  const vehiclesStr = process.env[`${prefix}VEHICLES`];
  if (!vehiclesStr)
    throw new Error(`Falta ${prefix}VEHICLES (lista separada por comas)`);

  const START_LAT = Number(process.env[`${prefix}START_LAT`]);
  const START_LON = Number(process.env[`${prefix}START_LON`]);
  if (!Number.isFinite(START_LAT) || !Number.isFinite(START_LON)) {
    throw new Error(
      `Faltan/son inválidos ${prefix}START_LAT / ${prefix}START_LON`
    );
  }

  const name = process.env[`${prefix}NAME`] || `D${driverId}`;
  const VEHICLE_IDS = vehiclesStr
    .split(",")
    .map(v => Number(v.trim()))
    .filter(v => Number.isFinite(v));

  if (VEHICLE_IDS.length === 0) {
    throw new Error(`${prefix}VEHICLES no contiene IDs válidos`);
  }

  return {
    name,
    driverId: Number(driverId),
    token,
    START_LAT,
    START_LON,
    VEHICLE_IDS,
  };
}

/** Construye el arreglo DRIVERS expandido por vehículo (uno por proceso) */
function buildDriversFromEnv() {
  const driverIds = getDriverIdsFromEnv();
  const list = [];
  driverIds.forEach(id => {
    const cfg = loadDriverConfig(id);
    cfg.VEHICLE_IDS.forEach((vehicleId, idx) => {
      list.push({
        name: cfg.VEHICLE_IDS.length > 1 ? `${cfg.name}-${idx + 1}` : cfg.name,
        DRIVER_ID: cfg.driverId,
        VEHICLE_ID: vehicleId,
        TOKEN: cfg.token,
        START_LAT: cfg.START_LAT,
        START_LON: cfg.START_LON,
      });
    });
  });
  return list;
}

let DRIVERS = [];
try {
  DRIVERS = buildDriversFromEnv();
} catch (err) {
  console.error(`[config:error] ${err.message}`);
  process.exit(1);
}

console.log(`Lanzando ${DRIVERS.length} conductores...\n`);

DRIVERS.forEach(cfg => {
  const env = {
    ...process.env,
    ...COMMON,
    DRIVER_ID: String(cfg.DRIVER_ID),
    VEHICLE_ID: String(cfg.VEHICLE_ID),
    TOKEN: cfg.TOKEN,
    START_LAT: String(cfg.START_LAT),
    START_LON: String(cfg.START_LON),
    DRIVER_NAME: cfg.name, // para el join.user.fullname
  };

  const child = fork("./client.js", [], {
    env,
    stdio: "inherit", //////////////////////////////
  });

  console.log(
    `[spawn] ${cfg.name} → DRIVER_ID=${cfg.DRIVER_ID} VEHICLE_ID=${cfg.VEHICLE_ID}`
  );

  child.on("exit", code => {
    console.log(`[exit] ${cfg.name} (driver ${cfg.DRIVER_ID}) → code ${code}`);
  });
});

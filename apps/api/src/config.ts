import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const port = Number(process.env.API_PORT ?? 4000);
const locationTtlSeconds = Number(process.env.LOCATION_TTL_SECONDS ?? 90);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("API_PORT must be a valid TCP port.");
}
if (!Number.isInteger(locationTtlSeconds) || locationTtlSeconds < 10) {
  throw new Error("LOCATION_TTL_SECONDS must be an integer of at least 10.");
}

export const config = {
  port,
  webOrigin: required("WEB_ORIGIN"),
  jwtSecret,
  redisUrl: required("REDIS_URL"),
  locationTtlSeconds
};

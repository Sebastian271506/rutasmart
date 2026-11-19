import type { Redis } from "ioredis";
import { Server } from "socket.io";
import { z } from "zod";
import { authenticateSocket, type AccessClaims } from "./auth.js";
import { config } from "./config.js";

export interface CourierLocation {
  tenantId: string;
  courierId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  recordedAt: string;
  expiresAt: string;
}

interface ClientToServerEvents {
  "courier:location:update": (location: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    headingDegrees?: number;
  }) => void;
}

interface ServerToClientEvents {
  "map:courier:location": (location: CourierLocation) => void;
  "map:couriers:snapshot": (locations: CourierLocation[]) => void;
  "realtime:error": (error: { message: string }) => void;
}

interface InterServerEvents {}

interface SocketData {
  auth: AccessClaims;
}

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(100_000).optional(),
  headingDegrees: z.number().min(0).lt(360).optional()
}).strict();

const lastUpdateBySocket = new WeakMap<object, number>();

function tenantRoom(tenantId: string): string {
  return `tenant:${tenantId}:map`;
}

function locationKey(tenantId: string, courierId: string): string {
  return `tenant:${tenantId}:courier:${courierId}:location`;
}

function activeCouriersKey(tenantId: string): string {
  return `tenant:${tenantId}:couriers:active`;
}

async function getActiveLocations(redis: Redis, tenantId: string): Promise<CourierLocation[]> {
  const activeKey = activeCouriersKey(tenantId);
  const now = Date.now();
  const ttlMilliseconds = config.locationTtlSeconds * 1000;

  await redis.zremrangebyscore(activeKey, 0, now - ttlMilliseconds);
  const courierIds = await redis.zrange(activeKey, 0, -1);
  if (courierIds.length === 0) {
    return [];
  }

  const serialized = await redis.mget(
    ...courierIds.map(courierId => locationKey(tenantId, courierId))
  );
  const locations: CourierLocation[] = [];

  for (const value of serialized) {
    if (!value) continue;
    try {
      locations.push(JSON.parse(value) as CourierLocation);
    } catch (error) {
      console.error("Could not parse a cached courier location.", error);
    }
  }

  return locations;
}

export function configureRealtime(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, redis: Redis): void {
  io.use(authenticateSocket);

  io.on("connection", socket => {
    const claims = socket.data.auth;

    if (claims.role === "courier") {
      socket.on("courier:location:update", async payload => {
        const now = Date.now();
        const lastUpdate = lastUpdateBySocket.get(socket) ?? 0;
        if (now - lastUpdate < 1000) {
          socket.emit("realtime:error", { message: "Location updates are limited to one per second." });
          return;
        }

        const parsed = locationSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("realtime:error", { message: "Invalid location coordinates." });
          return;
        }

        lastUpdateBySocket.set(socket, now);
        const location: CourierLocation = {
          tenantId: claims.tenantId,
          courierId: claims.sub,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          accuracyMeters: parsed.data.accuracyMeters ?? null,
          headingDegrees: parsed.data.headingDegrees ?? null,
          recordedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + config.locationTtlSeconds * 1000).toISOString()
        };

        try {
          const key = locationKey(claims.tenantId, claims.sub);
          const activeKey = activeCouriersKey(claims.tenantId);
          const ttlMilliseconds = config.locationTtlSeconds * 1000;

          const results = await redis
            .multi()
            .set(key, JSON.stringify(location), "EX", config.locationTtlSeconds)
            .zadd(activeKey, now, claims.sub)
            .zremrangebyscore(activeKey, 0, now - ttlMilliseconds)
            .expire(activeKey, config.locationTtlSeconds * 2)
            .exec();

          if (!results) {
            throw new Error("Redis location update transaction returned no result.");
          }
          const failedCommand = results.find(([error]) => error)?.[0];
          if (failedCommand) {
            throw failedCommand;
          }

          io.to(tenantRoom(claims.tenantId)).emit("map:courier:location", location);
        } catch (error) {
          console.error("Failed to store or broadcast courier location.", error);
          socket.emit("realtime:error", { message: "Location update could not be saved." });
        }
      });

      return;
    }

    socket.join(tenantRoom(claims.tenantId));
    void getActiveLocations(redis, claims.tenantId)
      .then(locations => socket.emit("map:couriers:snapshot", locations))
      .catch(error => {
        console.error("Failed to load courier locations for map snapshot.", error);
        socket.emit("realtime:error", { message: "Could not load active courier locations." });
      });
  });
}

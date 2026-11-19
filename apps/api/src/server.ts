import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "node:http";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { config } from "./config.js";
import { configureRealtime } from "./realtime.js";

const app = express();
const httpServer = createServer(app);
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});
const redisPublisher = new Redis(config.redisUrl);
const redisSubscriber = redisPublisher.duplicate();

redis.on("error", error => console.error("Redis location cache error.", error));
redisPublisher.on("error", error => console.error("Redis Socket.IO publisher error.", error));
redisSubscriber.on("error", error => console.error("Redis Socket.IO subscriber error.", error));

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.webOrigin }));
app.use(express.json({ limit: "32kb" }));

app.get("/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/readyz", async (_request, response) => {
  try {
    await redis.ping();
    response.json({ status: "ready" });
  } catch (error) {
    console.error("Readiness check failed because Redis is unavailable.", error);
    response.status(503).json({ status: "not-ready" });
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: config.webOrigin,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 16_384
});

io.adapter(createAdapter(redisPublisher, redisSubscriber));
configureRealtime(io, redis);

httpServer.listen(config.port, () => {
  console.info(`RutaSmart API listening on http://localhost:${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; shutting down RutaSmart API.`);

  try {
    await new Promise<void>((resolve, reject) => {
      io.close(error => error ? reject(error) : resolve());
    });
    await Promise.all([redis.quit(), redisPublisher.quit(), redisSubscriber.quit()]);
  } catch (error) {
    console.error("RutaSmart API shutdown failed.", error);
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

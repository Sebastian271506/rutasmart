"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface CourierLocation {
  tenantId: string;
  courierId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  recordedAt: string;
  expiresAt: string;
}

interface ServerToClientEvents {
  "map:courier:location": (location: CourierLocation) => void;
  "map:couriers:snapshot": (locations: CourierLocation[]) => void;
  "realtime:error": (error: { message: string }) => void;
}

interface ClientToServerEvents {}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function MapLive({ accessToken }: { accessToken: string | null }) {
  const [locations, setLocations] = useState<CourierLocation[]>([]);
  const [connection, setConnection] = useState("Desconectado");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setConnection("Inicia sesión para ver el mapa");
      return;
    }

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(apiUrl, {
      auth: { token: accessToken },
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      setConnection("Conectado");
      setError(null);
    });
    socket.on("disconnect", () => setConnection("Desconectado"));
    socket.on("connect_error", connectError => {
      setConnection("Error de conexión");
      setError(connectError.message);
    });
    socket.on("realtime:error", realtimeError => setError(realtimeError.message));
    socket.on("map:couriers:snapshot", snapshot => setLocations(snapshot));
    socket.on("map:courier:location", update => {
      setLocations(current => [
        ...current.filter(location => location.courierId !== update.courierId),
        update
      ]);
    });

    const expiryTimer = window.setInterval(() => {
      const now = Date.now();
      setLocations(current => current.filter(location => Date.parse(location.expiresAt) > now));
    }, 5000);

    return () => {
      window.clearInterval(expiryTimer);
      socket.disconnect();
    };
  }, [accessToken]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ruta-deepOrange">En vivo</p>
          <h2 className="mt-1 font-heading text-lg font-bold">Domiciliarios activos</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-ruta-asphalt">{connection}</span>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {!accessToken ? (
        <p className="mt-5 text-sm text-ruta-asphalt">
          La vista se conectará cuando la sesión administrativa entregue un token de acceso válido.
        </p>
      ) : locations.length === 0 ? (
        <p className="mt-5 text-sm text-ruta-asphalt">No hay ubicaciones recientes de domiciliarios.</p>
      ) : (
        <ul className="mt-5 divide-y divide-stone-100">
          {locations.map(location => (
            <li key={location.courierId} className="flex flex-wrap justify-between gap-2 py-4 text-sm">
              <span className="font-semibold">Domiciliario {location.courierId}</span>
              <span className="text-ruta-asphalt">
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </span>
              <time className="w-full text-xs text-stone-500">
                Actualizado {new Date(location.recordedAt).toLocaleTimeString("es-CO")}
              </time>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">
        Esta base recibe y distribuye coordenadas en tiempo real; falta conectar un proveedor cartográfico para dibujar el mapa.
      </p>
    </section>
  );
}

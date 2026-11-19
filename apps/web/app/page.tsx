import { MapLive } from "@/components/map-live";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ruta-bone p-6 text-ruta-black md:p-10">
      <header className="mb-8 flex items-center justify-between rounded-xl bg-ruta-black px-6 py-5 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">RutaSmart</p>
          <h1 className="mt-1 font-heading text-xl font-bold">Mapa operativo</h1>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Panel B2B</span>
      </header>
      <MapLive accessToken={null} />
    </main>
  );
}

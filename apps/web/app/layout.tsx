import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RutaSmart | Operación de domicilios",
  description: "Panel web de operación de domicilios para negocios locales."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

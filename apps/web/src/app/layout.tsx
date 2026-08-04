import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Fastex WhatsApp | QR-Scanner Integration Suite",
  description: "Enterprise unofficial WhatsApp Web QR-code integration & CRM lead messaging platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

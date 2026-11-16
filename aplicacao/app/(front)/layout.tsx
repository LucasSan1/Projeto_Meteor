import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import ProtecaoAuth from "./components/protecaoAuth";

// Inter é a fonte de interface do Cosmo e Playfair dá aquele ar de título
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cosmo",
  description: "Sistema de gestão industrial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ProtecaoAuth>{children}</ProtecaoAuth>
      </body>
    </html>
  );
}

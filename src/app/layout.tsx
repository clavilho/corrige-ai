import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CorrigeAI", template: "%s | CorrigeAI" },
  description: "Correção de provas de múltipla escolha por imagem.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

import { LandingHeader } from "../app/components/landing/components/LandingHeader";
import { LandingHero } from "../app/components/landing/components/LandingHero";
import { LandingFeatures } from "../app/components/landing/components/LandingFeatures";

export const metadata = {
  title: "CorrigeAI — Correção automática de provas por foto",
  description:
    "Cadastre o gabarito, fotografe a folha de respostas e receba nota e relatório.",
};

export default function Home() {
  return (
    <main>
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
    </main>
  );
}
import Link from "next/link";
import Image from "next/image";

import { Button } from "../../ui/button";
import heroImage from "../../../assets/hero-correcao.jpg";

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Corrija provas de múltipla escolha com uma foto
        </h1>

        <p className="text-lg text-muted-foreground">
          Feito para escolas, cursinhos e universidades: cadastre o gabarito,
          envie a imagem da folha do aluno e receba a nota e o relatório
          completo em segundos.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/auth">Começar agora</Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">Ver painel</Link>
          </Button>
        </div>
      </div>

      <Image
        src={heroImage}
        alt="Professor fotografando uma folha de respostas de múltipla escolha"
        width={1280}
        height={960}
        className="rounded-2xl border border-border shadow-[var(--shadow-card)]"
        priority
      />
    </section>
  );
}
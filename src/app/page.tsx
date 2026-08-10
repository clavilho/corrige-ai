import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, ListChecks, ScanLine } from "lucide-react";
import heroImage from "./assets/hero-correcao.jpg";

const features = [
  {
    icon: ListChecks,
    title: "Gabarito oficial",
    text: "Cadastre provas com até 100 questões e defina a resposta correta de cada uma.",
  },
  {
    icon: FileText,
    title: "Folha padronizada",
    text: "Gere o modelo em PDF com marcadores de alinhamento para leitura precisa.",
  },
  {
    icon: ScanLine,
    title: "Leitura por imagem",
    text: "A IA identifica as marcações da foto e compara com o gabarito automaticamente.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e painel",
    text: "Nota, acertos, erros, histórico e desempenho da turma em um só lugar.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfbf7]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Image
      src="/logo-icon.png"
      alt="CorrigeAI"
      width={48}
      height={48}
      className="h-12 w-12 object-contain"
      priority
    />
    <span className="ml-3 text-lg font-semibold tracking-tight">
      CorrigeAI
    </span>
        <Button render={<Link href="/auth" />}>
          Entrar
        </Button>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Corrija provas de múltipla escolha com uma foto
          </h1>
          <p className="text-lg text-slate-500">
            Feito para escolas, cursinhos e universidades: cadastre o gabarito,
            envie a imagem da folha do aluno e receba a nota e o relatório
            completo em segundos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/auth" />}>
              Começar agora
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/dashboard" />}>
              Ver painel
            </Button>
          </div>
        </div>
        <Image
          src={heroImage}
          alt="Professor fotografando uma folha de respostas de múltipla escolha"
          priority
          className="w-full rounded-2xl border border-slate-200 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]"
        />
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]"
            >
              <Icon className="size-6 text-amber-500" />
              <h2 className="mt-3 font-medium">{title}</h2>
              <p className="mt-3 text-sm text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

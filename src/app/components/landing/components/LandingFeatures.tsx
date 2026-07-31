import { Card, CardContent } from "../../ui/card";
import { ScanLine, ListChecks, FileText, BarChart3 } from "lucide-react";

// Lista de diferenciais do produto, exibida em cards na landing page.
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

// Seção de funcionalidades da landing: grade de cards com ícone, título e descrição.
export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="shadow-[var(--shadow-card)]">
            <CardContent className="space-y-3 pt-6">
              <f.icon className="size-6 text-accent" />
              <h2 className="font-medium">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

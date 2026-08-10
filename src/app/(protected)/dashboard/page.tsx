import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ScanLine, Target, TrendingUp } from "lucide-react";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";

export default async function DashboardPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const [exams, corrections] = await Promise.all([
    ExamModel.find({ teacherId }).lean(),
    CorrectionModel.find({ teacherId }).sort({ createdAt: -1 }).lean(),
  ]);
  const average = corrections.length
    ? corrections.reduce((sum, item) => sum + item.score, 0) /
    corrections.length
    : 0;
  const accuracy =
    (corrections.reduce((sum, item) => sum + item.correctAnswers, 0) /
      Math.max(
        1,
        corrections.reduce((sum, item) => sum + item.totalQuestions, 0),
      )) *
    100;
  const stats = [
    { label: "Provas criadas", value: exams.length, icon: FileText },
    { label: "Provas corrigidas", value: corrections.length, icon: ScanLine },
    { label: "Média das notas", value: average.toFixed(1), icon: Target },
    {
      label: "Taxa de acerto",
      value: `${accuracy.toFixed(0)}%`,
      icon: TrendingUp,
    },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Visão geral das suas provas e correções.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Link href="/exams">Nova prova</Link>
          </Button>
          <Button>
            <Link href="/correct">Corrigir prova</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-[#e8f5f5] text-[#007782]">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
          <h2 className="font-medium">Evolução das notas</h2>
          <p className="mt-1 text-sm text-slate-500">
            As últimas correções aparecerão aqui.
          </p>
          <div className="mt-8 grid h-36 place-items-center rounded-lg bg-slate-50 text-sm text-slate-400">
            {corrections.length
              ? `${corrections.length} correção(ões) registrada(s)`
              : "Ainda não há dados para exibir."}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
          <h2 className="font-medium">Questões com mais erros</h2>
          <p className="mt-1 text-sm text-slate-500">
            Identifique os principais pontos de atenção da turma.
          </p>
          <div className="mt-8 grid h-36 place-items-center rounded-lg bg-slate-50 text-sm text-slate-400">
            Os dados serão exibidos após as correções.
          </div>
        </section>
      </div>
    </div>
  );
}

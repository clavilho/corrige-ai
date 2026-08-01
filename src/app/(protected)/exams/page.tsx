import Link from "next/link";
import { createExam, deleteExam } from "@/features/exams/actions";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function ExamsPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const exams = await ExamModel.find({ teacherId })
    .sort({ createdAt: -1 })
    .lean();
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form
        action={createExam}
        className="h-fit space-y-3 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h1 className="text-xl font-bold">Nova prova</h1>
        <input
          name="title"
          placeholder="Título da prova"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="subject"
          placeholder="Disciplina"
          className="w-full rounded border p-2"
        />
        <input
          name="className"
          placeholder="Turma"
          className="w-full rounded border p-2"
        />
        <label className="block text-sm">
          Data
          <input
            name="examDate"
            type="date"
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label className="block text-sm">
          Quantidade de questões
          <input
            name="questionCount"
            type="number"
            min="1"
            max="120"
            defaultValue="10"
            required
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <label className="block text-sm">
          Alternativas por questão
          <select
            name="alternativeCount"
            defaultValue="5"
            className="mt-1 w-full rounded border p-2"
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </label>
        <button className="w-full rounded bg-teal-700 p-2 font-semibold text-white">
          Criar prova
        </button>
      </form>
      <section>
        <h2 className="text-2xl font-bold">Minhas provas</h2>
        <div className="mt-4 space-y-3">
          {exams.length === 0 ? (
            <p className="text-slate-600">Nenhuma prova criada ainda.</p>
          ) : (
            exams.map((exam) => (
              <article
                key={exam._id.toString()}
                className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{exam.title}</h3>
                  <p className="text-sm text-slate-600">
                    {exam.subject || "Sem disciplina"} ·{" "}
                    {exam.className || "Sem turma"} · {exam.questionCount}{" "}
                    questões
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-teal-800"
                  href={`/exams/${exam._id.toString()}`}
                >
                  Gabarito
                </Link>
                <form action={deleteExam}>
                  <input
                    type="hidden"
                    name="examId"
                    value={exam._id.toString()}
                  />
                  <button className="text-sm text-red-700">Excluir</button>
                </form>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

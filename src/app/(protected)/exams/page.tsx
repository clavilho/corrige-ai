import Link from "next/link";
import { createExam } from "@/features/exams/actions";
import DeleteExamButton from "@/components/delete-buttons/delete-exam-button";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function ExamsPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const exams = await ExamModel.find({ teacherId }).sort({ createdAt: -1 }).lean();

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form
        action={createExam}
        className="h-fit space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold">Nova prova</h2>

        <div className="space-y-3">
          <input
            name="title"
            placeholder="Título da prova"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
          />

          <input
            name="subject"
            placeholder="Disciplina"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
          />

          <input
            name="className"
            placeholder="Turma"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
          />

          <label className="block text-sm">
            <span className="text-sm text-slate-700">Data</span>
            <input
              name="examDate"
              type="date"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
            />
          </label>

          <label className="block text-sm">
            <span className="text-sm text-slate-700">Quantidade de questões</span>
            <input
              name="questionCount"
              type="number"
              min="1"
              max="120"
              defaultValue={10}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
            />
          </label>

          <label className="block text-sm">
            <span className="text-sm text-slate-700">Alternativas por questão</span>
            <select
              name="alternativeCount"
              defaultValue="5"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1E7F84]"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>
        </div>

        <button className="w-full rounded-xl bg-[#006F72] py-3.5 font-semibold text-white hover:brightness-105">
          Criar prova
        </button>
      </form>

      {/* EXAMS LIST */}
      <section>
        <h2 className="text-2xl font-bold">Minhas provas</h2>

        <div className="mt-4 space-y-4">
          {exams.length === 0 ? (
            <p className="text-slate-600">Nenhuma prova criada ainda.</p>
          ) : (
            exams.map((exam) => (
              <article
                key={exam._id.toString()}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
                  <p className="text-sm text-slate-600">
                    {exam.subject || "Sem disciplina"} · {exam.className || "Sem turma"} · {exam.questionCount} questões
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Gabarito: outlined teal button */}
                  <Link
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition"
                    href={`/exams/${exam._id.toString()}`}
                  >
                    Gabarito
                  </Link>

                  {/* Delete with confirmation modal */}
                  <DeleteExamButton examId={exam._id.toString()} examTitle={exam.title} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
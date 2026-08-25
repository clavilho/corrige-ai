import Link from "next/link";
import { Plus, FileText } from "lucide-react";

import { ExamModel } from "@/features/exams/exam.model";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

export default async function ExamsPage() {
  const teacherId = await currentUserId();

  if (!teacherId) {
    return null;
  }

  await connectDatabase();

  const exams = await ExamModel.find({
    teacherId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Minhas provas</h1>

          <p className="mt-1 text-slate-600">
            Gerencie suas provas e respectivos gabaritos.
          </p>
        </div>

        <Link
          href="/exams/form"
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#006F72]
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-[#005B5E]
          "
        >
          <Plus className="h-4 w-4" />
          Nova prova
        </Link>
      </div>

      {/* ====================================================== */}
      {/* LISTA */}
      {/* ====================================================== */}

      {exams.length === 0 ? (
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-6
            py-16
            text-center
            shadow-sm
          "
        >
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-teal-50
              text-[#006F72]
            "
          >
            <FileText className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Nenhuma prova cadastrada
          </h2>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Crie sua primeira prova para começar a cadastrar gabaritos e
            realizar correções.
          </p>

          <Link
            href="/exams/new"
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-[#006F72]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#005B5E]
            "
          >
            <Plus className="h-4 w-4" />
            Criar primeira prova
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            /*
             * ====================================================
             * TURMAS DA PROVA
             * ====================================================
             *
             * A estrutura atual da prova possui:
             *
             * classes: [
             *   {
             *     classId,
             *     className
             *   }
             * ]
             *
             * Portanto não devemos mais acessar:
             *
             * exam.className
             * exam.classId
             */

            const examClasses = Array.isArray(exam.classes) ? exam.classes : [];

            const classNames =
              examClasses.length > 0
                ? examClasses
                    .map((examClass) => examClass.className)
                    .filter(Boolean)
                    .join(", ")
                : "Sem turma";

            return (
              <article
                key={exam._id.toString()}
                className="
                  flex
                  flex-col
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
              >
                {/* ================================================= */}
                {/* CONTEÚDO */}
                {/* ================================================= */}

                <div className="flex-1 p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-teal-50
                        text-[#006F72]
                      "
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {exam.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-600">
                        {exam.subject || "Sem disciplina"} · {classNames} ·{" "}
                        {exam.questionCount} questões
                      </p>
                    </div>
                  </div>

                  {/* ================================================= */}
                  {/* INFORMAÇÕES */}
                  {/* ================================================= */}

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-500">Questões</span>

                      <span className="text-sm font-semibold text-slate-900">
                        {exam.questionCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-500">
                        Alternativas
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {exam.alternativeCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-500">Turmas</span>

                      <span className="text-sm font-semibold text-slate-900">
                        {examClasses.length}
                      </span>
                    </div>
                  </div>

                  {/* ================================================= */}
                  {/* TURMAS */}
                  {/* ================================================= */}

                  {examClasses.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Turmas
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {examClasses.map((examClass) => (
                          <span
                            key={examClass.classId.toString()}
                            className="
                              rounded-full
                              bg-teal-50
                              px-3
                              py-1
                              text-xs
                              font-medium
                              text-[#006F72]
                            "
                          >
                            {examClass.className}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================= */}
                {/* AÇÃO */}
                {/* ================================================= */}

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <Link
                    href={`/exams/${exam._id.toString()}`}
                    className="
                      inline-flex
                      w-full
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-teal-700
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-teal-700
                      transition
                      hover:bg-teal-700
                      hover:text-white
                    "
                  >
                    Ver prova
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

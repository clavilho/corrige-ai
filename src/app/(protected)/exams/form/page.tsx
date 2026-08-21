import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NewExamForm } from "@/components/exam-form";
import { currentUserId } from "@/lib/session";
import { connectDatabase } from "@/lib/database";
import { ClassModel } from "@/features/classes/class.model";

export default async function ExamForm() {
  const teacherId = await currentUserId();

  if (!teacherId) {
    return null;
  }

  await connectDatabase();

  const classes = await ClassModel.find({
    teacherId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const formattedClasses = classes.map((classItem) => ({
    id: classItem._id.toString(),
    name: classItem.name,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/exams"
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-2
          text-sm
          font-medium
          text-slate-700
          shadow-sm
          transition-all
          duration-200
          hover:-translate-x-1
          hover:border-[#006F72]
          hover:bg-[#EAF7F7]
          hover:text-[#006F72]
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às provas
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Nova prova
        </h1>

        <p className="mt-2 text-slate-600">
          Defina as informações da prova para gerar o gabarito e realizar as
          correções automaticamente.
        </p>

        {formattedClasses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 p-3">
                <Users className="h-6 w-6 text-amber-700" />
              </div>

              <div>
                <h2 className="font-semibold text-amber-900">
                  Nenhuma turma cadastrada
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Para criar uma prova, primeiro é necessário cadastrar pelo
                  menos uma turma.
                </p>

                <Link
                  href="/classes/form"
                  className="
                    mt-4
                    inline-flex
                    items-center
                    rounded-xl
                    bg-[#006F72]
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:brightness-105
                  "
                >
                  Criar turma
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <NewExamForm classes={formattedClasses} />
          </div>
        )}
      </div>
    </div>
  );
}

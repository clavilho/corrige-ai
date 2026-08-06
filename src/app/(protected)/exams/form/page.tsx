import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewExamForm } from "@/components/exam-form";

export default function ExamForm() {
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
          Defina as informações da prova para gerar o gabarito e realizar as correções automaticamente.
        </p>

        <div className="mt-8">
          <NewExamForm />
        </div>

      </div>
    </div>
  );
}
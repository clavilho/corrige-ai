import Link from "next/link";
import { NewExamForm } from "@/components/exam-form";
 
export default function ExamForm() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/exams" className="text-sm text-teal-800">
        ← Voltar às provas
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Nova prova</h1>
      <p className="mt-1 text-slate-600">
        Defina os dados da prova e o gabarito.
      </p>
      <div className="mt-6">
        <NewExamForm />
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { CorrectionForm } from "@/components/correction-form";

interface ExamClass {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  questionCount: number;
  classes: ExamClass[];
}

interface CorrectPageClientProps {
  exams: Exam[];
  initialExamId?: string;
  initialStudentId?: string;
  initialClassId?: string;
}

export default function CorrectPageClient({
  exams,
  initialExamId = "",
  initialStudentId = "",
  initialClassId = "",
}: CorrectPageClientProps) {
  const [imageDataUrl, setImageDataUrl] =
    useState<string | null>(null);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg md:p-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Corrigir prova
            </h1>

            <p className="mt-2 text-base text-slate-600">
              Tire uma foto ou envie a imagem da folha preenchida pelo aluno.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Envie imagem ou tire foto
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              Dica rápida: boa iluminação
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <strong className="block font-medium text-slate-900">
              Dicas para melhor precisão
            </strong>

            <p className="mt-1">
              Boa iluminação, folha totalmente enquadrada, sem sombras e
              marcações preenchidas por completo.
            </p>
          </div>

          <div className="mt-8">
            <div className="rounded-xl border border-slate-100 bg-white p-6">
              <CorrectionForm
                exams={exams}
                initialExamId={initialExamId}
                initialStudentId={initialStudentId}
                initialClassId={initialClassId}
                onImageSelected={(dataUrl) =>
                  setImageDataUrl(dataUrl)
                }
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-sm leading-relaxed text-slate-500">
              Aceitamos JPG/PNG — recomendamos comprimir imagens acima de 5MB
              para upload mais rápido.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
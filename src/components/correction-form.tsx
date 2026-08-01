"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCorrection } from "@/features/corrections/actions";

type ExamOption = { id: string; title: string; questionCount: number };
export function CorrectionForm({ exams }: { exams: ExamOption[] }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [error, setError] = useState("");
  async function submit(formData: FormData) { const file = formData.get("image"); if (!(file instanceof File) || file.size === 0) { setError("Selecione uma imagem da folha de respostas."); return; } if (file.size > 4_000_000) { setError("A imagem deve ter no máximo 4 MB."); return; } const imageDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível ler a imagem.")); reader.readAsDataURL(file); }); startTransition(async () => { try { const result = await createCorrection({ examId: String(formData.get("examId")), studentName: String(formData.get("studentName") ?? ""), imageDataUrl }); router.push(`/corrections/${result.correctionId}`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao corrigir a prova."); } }); }
  return <form action={submit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"><label className="block text-sm font-medium">Prova<select name="examId" required className="mt-1 w-full rounded border p-2">{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title} ({exam.questionCount} questões)</option>)}</select></label><label className="block text-sm font-medium">Nome do aluno (opcional)<input name="studentName" maxLength={120} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm font-medium">Foto da folha<input name="image" type="file" accept="image/*" capture="environment" required className="mt-1 block w-full text-sm" /></label>{error && <p className="text-sm text-red-700">{error}</p>}<button disabled={pending || !exams.length} className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Analisando…" : "Analisar e corrigir"}</button></form>;
}

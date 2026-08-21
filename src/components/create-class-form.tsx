"use client";

import { useState } from "react";
import { createClass } from "@/features/classes/actions";

export function NewClassForm({
  initial = { name: "", code: "", description: "", academicYear: "", term: "", turno: "manhã" },
}: {
  initial?: { name?: string; code?: string; description?: string; academicYear?: string; term?: string; turno?: "manhã" | "tarde" | "noite" };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
          await createClass(formData);
        } catch (err: any) {
          console.error("createClass action error:", err);
          setError(err?.message ?? "Erro ao criar turma");
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="rounded-xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-3">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Nome da turma</span>
          <input name="name" defaultValue={initial.name} required className="mt-1 rounded-md border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Código (opcional)</span>
            <input name="code" defaultValue={initial.code} className="mt-1 rounded-md border px-3 py-2" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium">Turno</span>
            <select name="turno" defaultValue={initial.turno} className="mt-1 rounded-md border px-3 py-2">
              <option value="manhã">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Descrição (opcional)</span>
          <textarea name="description" defaultValue={initial.description} className="mt-1 rounded-md border px-3 py-2" rows={3} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Ano</span>
            <input name="academicYear" defaultValue={initial.academicYear} className="mt-1 rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Período / Turma</span>
            <input name="term" defaultValue={initial.term} className="mt-1 rounded-md border px-3 py-2" />
          </label>
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <div className="mt-3">
          <button type="submit" disabled={isSubmitting} className="rounded bg-teal-700 px-4 py-2 text-white">
            {isSubmitting ? "Criando..." : "Criar turma"}
          </button>
        </div>
      </div>
    </form>
  );
}
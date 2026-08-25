"use client";

import { useState } from "react";
import { createStudent } from "@/features/students/actions";

export function CreateStudentForm({ classId }: { classId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
          await createStudent(formData);
        } catch (err: any) {
          console.error(err);
          setError(err?.message ?? "Erro ao criar aluno");
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="rounded-md border bg-white p-4"
    >
      <input type="hidden" name="classId" value={classId} />
      <label className="flex flex-col mb-2">
        <span className="text-sm font-medium">Nome do aluno</span>
        <input
          name="name"
          required
          className="mt-1 rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col mb-2">
        <span className="text-sm font-medium">Matrícula (opcional)</span>
        <input
          name="registration"
          className="mt-1 rounded-md border px-3 py-2"
        />
      </label>
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded bg-teal-700 px-4 py-2 text-white"
      >
        {isSubmitting ? "Criando..." : "Cadastrar aluno"}
      </button>
    </form>
  );
}

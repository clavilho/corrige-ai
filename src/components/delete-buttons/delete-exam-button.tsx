"use client";

import React, { useRef } from "react";
import ConfirmDialog from "../confirm-dialog";
import { deleteExam } from "@/features/exams/actions";

export default function DeleteExamButton({
  examId,
  examTitle,
}: {
  examId: string;
  examTitle?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  // onConfirm will submit the hidden form (Server Action)
  function onConfirm() {
    // requestSubmit triggers the form submission and preserves Server Action behavior
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={deleteExam} className="m-0">
        <input type="hidden" name="examId" value={examId} />
        <ConfirmDialog
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir a prova "${examTitle ?? ""}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Sim, excluir"
          cancelLabel="Cancelar"
          onConfirm={onConfirm}
        >
          {/* Trigger button (styled) */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-red-200 text-red-700 bg-white hover:bg-red-50 transition"
            aria-label={`Excluir prova ${examTitle ?? ""}`}
          >
            Excluir
          </button>
        </ConfirmDialog>
      </form>
    </>
  );
}
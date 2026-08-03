"use client";

import React, { useRef, useState } from "react";
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
  const [loading, setLoading] = useState(false);

  // onConfirm will submit the hidden form (Server Action)
  function onConfirm() {
   return new Promise((resolve) => {
      try {
        setLoading(true);
        
        formRef.current?.requestSubmit();

        const onPageHide = () => {
          cleanup();
          resolve();
        };

        const timeout = window.setTimeout(() => {
          cleanup();
          resolve();
        }, 10000); // 10s fallback

        function cleanup() {
          window.removeEventListener("pagehide", onPageHide);
          window.clearTimeout(timeout);
        }

        window.addEventListener("pagehide", onPageHide, { once: true });
      } catch (err) {
        console.error("deleteCorrection submit failed", err);
        setLoading(false);
        resolve();
      }
    });
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
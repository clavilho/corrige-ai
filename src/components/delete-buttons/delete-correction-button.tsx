"use client";

import React, { useRef } from "react";
import ConfirmDialog from "../confirm-dialog";
import { deleteCorrection } from "@/features/corrections/actions";

export default function DeleteCorrectionButton({
  correctionId,
  studentName,
}: {
  correctionId: string;
  studentName?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function onConfirm() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={deleteCorrection} className="m-0">
      <input type="hidden" name="correctionId" value={correctionId} />
      <ConfirmDialog
        title="Confirmar exclusão"
        description={`Deseja excluir esta correção${studentName ? ` do(a) ${studentName}` : ""}? Esta ação é irreversível.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
      >
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-red-200 text-red-700 bg-white hover:bg-red-50 transition"
          aria-label={`Excluir correção ${correctionId}`}
        >
          Excluir
        </button>
      </ConfirmDialog>
    </form>
  );
}
"use client";

import { useState, useRef } from "react";
import { saveAnswerKey } from "@/features/exams/actions";

export function AnswerKeyEditor({
  examId,
  examTitle,
  questionCount,
  alternativeCount,
  initialAnswers,
}: {
  examId: string;
  examTitle?: string;
  questionCount: number;
  alternativeCount: number;
  initialAnswers: Array<{ questionNumber: number; correctAnswer: string }>;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(initialAnswers.map((item) => [item.questionNumber, item.correctAnswer]))
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const letters = ["A", "B", "C", "D", "E", "F"].slice(0, alternativeCount);

  // Called when user clicks the Save button
  function handleSaveClick() {
    // If there is an existing gabarito (initialAnswers non-empty) and it's different -> ask confirmation
    const hasExisting = initialAnswers && initialAnswers.length > 0;
    // Also check if answers changed at all; if identical we can just submit
    const currentAsArray = Object.entries(answers).map(([questionNumber, correctAnswer]) => ({
      questionNumber: Number(questionNumber),
      correctAnswer,
    }));
    const changed =
      !hasExisting ||
      JSON.stringify(
        currentAsArray.sort((a, b) => a.questionNumber - b.questionNumber)
      ) !==
        JSON.stringify(
          initialAnswers
            .map((a) => ({ questionNumber: a.questionNumber, correctAnswer: a.correctAnswer }))
            .sort((a, b) => a.questionNumber - b.questionNumber)
        );

    if (hasExisting && changed) {
      setShowConfirm(true);
      return;
    }

    // no existing gabarito or nothing changed - submit directly
    formRef.current?.requestSubmit();
  }

  function handleConfirmReplace() {
    setShowConfirm(false);
    setIsSubmitting(true);
    // do the submit; server action will redirect on success
    formRef.current?.requestSubmit();
  }

  function handleCancelReplace() {
    setShowConfirm(false);
  }

  return (
    <>
      <form
        ref={formRef}
        action={saveAnswerKey}
        className="rounded-xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="examId" value={examId} />
        <input
          type="hidden"
          name="answers"
          value={JSON.stringify(
            Object.entries(answers).map(([questionNumber, correctAnswer]) => ({
              questionNumber: Number(questionNumber),
              correctAnswer,
            }))
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: questionCount }, (_, index) => index + 1).map((question) => (
            <fieldset key={question} className="flex items-center gap-2 rounded border p-3">
              <legend className="text-sm font-semibold">Questão {question}</legend>

              {letters.map((letter) => (
                <label key={letter} className="cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={`question-${question}`}
                    checked={answers[question] === letter}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question]: letter,
                      }))
                    }
                  />{" "}
                  {letter}
                </label>
              ))}
            </fieldset>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          className="mt-6 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : `Salvar gabarito (${Object.keys(answers).length}/${questionCount})`}
        </button>
      </form>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleCancelReplace}
            aria-hidden="true"
          />
          <div className="relative z-60 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirmar alteração do gabarito</h3>
            <p className="mt-3 text-sm text-slate-700">
              {examTitle ? (
                <>
                  Já existe um gabarito salvo para a prova <strong>{examTitle}</strong>.
                </>
              ) : (
                <>Já existe um gabarito salvo para esta prova.</>
              )}{" "}
              Deseja substituir o gabarito atual pelo novo?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleCancelReplace}
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReplace}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Sim, substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
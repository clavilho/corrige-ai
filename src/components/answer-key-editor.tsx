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
  initialAnswers: Array<{
    questionNumber: number;
    correctAnswer: string;
  }>;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      initialAnswers.map((item) => [
        item.questionNumber,
        item.correctAnswer,
      ]),
    ),
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  const letters = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    alternativeCount,
  );

  // ============================================
  // SALVAR
  // ============================================

  function handleSaveClick() {
    const hasExisting =
      initialAnswers && initialAnswers.length > 0;

    const currentAsArray = Object.entries(answers)
      .map(([questionNumber, correctAnswer]) => ({
        questionNumber: Number(questionNumber),
        correctAnswer,
      }))
      .sort(
        (a, b) =>
          a.questionNumber - b.questionNumber,
      );

    const initialAsArray = initialAnswers
      .map((answer) => ({
        questionNumber: answer.questionNumber,
        correctAnswer: answer.correctAnswer,
      }))
      .sort(
        (a, b) =>
          a.questionNumber - b.questionNumber,
      );

    const changed =
      JSON.stringify(currentAsArray) !==
      JSON.stringify(initialAsArray);

    // Se já existe gabarito e houve alteração,
    // pede confirmação.
    if (hasExisting && changed) {
      setShowConfirm(true);
      return;
    }

    submitForm();
  }

  // ============================================
  // ENVIA O FORMULÁRIO
  // ============================================

  function submitForm() {
    setIsSubmitting(true);

    formRef.current?.requestSubmit();
  }

  // ============================================
  // CONFIRMAR SUBSTITUIÇÃO
  // ============================================

  function handleConfirmReplace() {
    setShowConfirm(false);

    submitForm();
  }

  // ============================================
  // CANCELAR
  // ============================================

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
        {/* ==========================================
            DADOS ENVIADOS PARA SERVER ACTION
        ========================================== */}

        <input
          type="hidden"
          name="examId"
          value={examId}
        />

        <input
          type="hidden"
          name="answers"
          value={JSON.stringify(
            Object.entries(answers).map(
              ([questionNumber, correctAnswer]) => ({
                questionNumber: Number(questionNumber),
                correctAnswer,
              }),
            ),
          )}
        />

        {/* ==========================================
            QUESTÕES
        ========================================== */}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(
            { length: questionCount },
            (_, index) => index + 1,
          ).map((question) => (
            <div
              key={question}
              className="
                flex
                items-center
                justify-between
                gap-2
                rounded-lg
                border
                border-gray-200
                px-4
                py-2
              "
            >
              <span
                className="
                  mr-2
                  text-sm
                  font-semibold
                  text-gray-600
                "
              >
                Questão {question}
              </span>

              <div className="flex gap-1">
                {letters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question]: letter,
                      }))
                    }
                    className={`
                      flex
                      cursor-pointer
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-gray-500
                      transition

                      disabled:cursor-not-allowed
                      disabled:opacity-50

                      ${
                        answers[question] === letter
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-gray-200 hover:border-teal-700 hover:text-teal-700"
                      }
                    `}
                  >
                    <span className="font-semibold">
                      {letter}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ==========================================
            BOTÃO SALVAR
        ========================================== */}

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSubmitting}
          className="
            mt-6
            rounded
            bg-teal-700
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-teal-800
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isSubmitting
            ? "Salvando..."
            : `Salvar gabarito (${Object.keys(answers).length}/${questionCount})`}
        </button>
      </form>

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO
      ========================================== */}

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
          "
        >
          {/* Overlay */}

          <div
            className="
              fixed
              inset-0
              bg-black/50
            "
            onClick={handleCancelReplace}
            aria-hidden="true"
          />

          {/* Modal */}

          <div
            className="
              relative
              z-[60]
              mx-4
              w-full
              max-w-lg
              rounded-xl
              bg-white
              p-6
              shadow-lg
            "
          >
            <h3 className="text-lg font-semibold">
              Confirmar alteração do gabarito
            </h3>

            <p className="mt-3 text-sm text-slate-700">
              {examTitle ? (
                <>
                  Já existe um gabarito salvo para a prova{" "}
                  <strong>{examTitle}</strong>.
                </>
              ) : (
                <>
                  Já existe um gabarito salvo para esta prova.
                </>
              )}{" "}
              Deseja substituir o gabarito atual pelo novo?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelReplace}
                className="
                  rounded-md
                  border
                  px-4
                  py-2
                  text-sm
                  font-medium
                  transition
                  hover:bg-slate-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={isSubmitting}
                className="
                  rounded-md
                  bg-teal-700
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-teal-800
                  disabled:opacity-50
                "
              >
                {isSubmitting
                  ? "Salvando..."
                  : "Sim, substituir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
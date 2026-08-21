"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExam } from "@/features/exams/actions";

interface ClassOption {
  id: string;
  name: string;
}

interface NewExamFormProps {
  classes: ClassOption[];
}

const alternatives = ["A", "B", "C", "D", "E", "F"];

export function NewExamForm({ classes }: NewExamFormProps) {
  const router = useRouter();

  const [questionCount, setQuestionCount] = useState<number | "">(10);
  const [alternativeCount, setAlternativeCount] = useState(5);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Quantidade de questões que já possuem uma resposta.
   */
  const answeredQuestions =
    typeof questionCount === "number"
      ? Array.from({ length: questionCount }, (_, index) => index + 1).filter(
          (question) => Boolean(answerKey[question]),
        ).length
      : 0;

  /*
   * Verifica se todas as questões foram respondidas.
   */
  const isAnswerKeyComplete =
    typeof questionCount === "number" &&
    questionCount > 0 &&
    answeredQuestions === questionCount;

  function handleQuestionCountChange(value: string) {
    if (value === "") {
      setQuestionCount("");
      setAnswerKey({});
      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    const count = Math.max(1, Math.min(100, numericValue));

    setQuestionCount(count);

    setAnswerKey((current) => {
      const updated: Record<number, string> = {};

      for (let i = 1; i <= count; i++) {
        if (current[i]) {
          updated[i] = current[i];
        }
      }

      return updated;
    });
  }

  function handleAlternativeCountChange(value: number) {
    setAlternativeCount(value);

    const allowedAlternatives = alternatives.slice(0, value);

    setAnswerKey((current) => {
      const updated: Record<number, string> = {};

      Object.entries(current).forEach(([question, answer]) => {
        if (allowedAlternatives.includes(answer)) {
          updated[Number(question)] = answer;
        }
      });

      return updated;
    });
  }

  function handleAnswerChange(question: number, answer: string) {
    setAnswerKey((current) => ({
      ...current,
      [question]: answer,
    }));

    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (questionCount === "" || questionCount < 1 || questionCount > 100) {
      setError("Informe uma quantidade de questões entre 1 e 100.");
      return;
    }

    if (!selectedClassId) {
      setError("Selecione uma turma.");
      return;
    }

    if (!isAnswerKeyComplete) {
      setError("Preencha o gabarito de todas as questões.");
      return;
    }

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    const formData = new FormData(event.currentTarget);

    const selectedClass = classes.find(
      (classItem) => classItem.id === selectedClassId,
    );

    if (!selectedClass) {
      setError("A turma selecionada não foi encontrada.");
      return;
    }

    formData.set("classId", selectedClass.id);

    formData.set("className", selectedClass.name);

    formData.set("questionCount", String(questionCount));

    formData.set("alternativeCount", String(alternativeCount));

    const answers = Array.from({ length: questionCount }, (_, index) => ({
      questionNumber: index + 1,
      correctAnswer: answerKey[index + 1] ?? "",
    }));

    formData.set("answerKey", JSON.stringify(answers));
    try {
      setIsSubmitting(true);

      await createExam(formData);

      router.push("/exams");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Não foi possível criar a prova.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ========================================================= */}
      {/* DADOS DA PROVA */}
      {/* ========================================================= */}

      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Dados da prova
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informe os dados básicos da prova.
          </p>
        </div>

        <div className="space-y-5">
          {/* Nome + Data */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_190px]">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nome da prova
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Ex.: Avaliação de Matemática"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Data
              </label>

              <input
                id="date"
                name="date"
                type="date"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              />
            </div>
          </div>

          {/* Disciplina + Turma */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Disciplina
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="Ex.: Matemática"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              />
            </div>

            <div>
              <label
                htmlFor="classId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Turma
              </label>

              <select
                id="classId"
                name="classId"
                required
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              >
                <option value="" disabled>
                  Selecione uma turma
                </option>

                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>

              <input
                type="hidden"
                name="className"
                value={
                  classes.find((classItem) => classItem.id === selectedClassId)
                    ?.name ?? ""
                }
              />
            </div>
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Quantidade de questões */}
            <div>
              <label
                htmlFor="questionCount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Quantidade de questões
              </label>

              <input
                id="questionCount"
                name="questionCount"
                type="number"
                min={1}
                max={100}
                value={questionCount}
                onChange={(event) =>
                  handleQuestionCountChange(event.target.value)
                }
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              />
            </div>

            {/* Alternativas */}
            <div>
              <label
                htmlFor="alternativeCount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Alternativas por questão
              </label>

              <select
                id="alternativeCount"
                name="alternativeCount"
                value={alternativeCount}
                onChange={(event) =>
                  handleAlternativeCountChange(Number(event.target.value))
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              >
                <option value={2}>2 alternativas</option>

                <option value={3}>3 alternativas</option>

                <option value={4}>4 alternativas</option>

                <option value={5}>5 alternativas</option>

                <option value={6}>6 alternativas</option>
              </select>
            </div>

            {/* Nota */}
            <div>
              <label
                htmlFor="totalPoints"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nota da prova
              </label>

              <input
                id="totalPoints"
                name="totalPoints"
                type="number"
                min={0}
                step="0.1"
                defaultValue={10}
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#006F72]
                  focus:ring-2
                  focus:ring-[#006F72]/10
                "
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* GABARITO */}
      {/* ========================================================= */}

      <section className="border-t border-slate-100 pt-8">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Gabarito</h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecione a alternativa correta de cada questão.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {typeof questionCount === "number" &&
            Array.from({ length: questionCount }, (_, index) => {
              const question = index + 1;

              return (
                <div
                  key={question}
                  className="
                      flex
                      min-h-[60px]
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/50
                      px-4
                      py-3
                      transition
                      hover:border-slate-300
                    "
                >
                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    Questão {question}
                  </span>

                  <div className="flex gap-1.5">
                    {alternatives
                      .slice(0, alternativeCount)
                      .map((alternative) => {
                        const selected = answerKey[question] === alternative;

                        return (
                          <button
                            key={alternative}
                            type="button"
                            onClick={() =>
                              handleAnswerChange(question, alternative)
                            }
                            aria-label={`Questão ${question}, alternativa ${alternative}`}
                            aria-pressed={selected}
                            className={`
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                border
                                text-sm
                                font-medium
                                transition-all
                                ${
                                  selected
                                    ? "border-[#006F72] bg-[#006F72] text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-[#006F72] hover:text-[#006F72]"
                                }
                              `}
                          >
                            {alternative}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Progresso do gabarito */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">Progresso do gabarito</span>

          <span
            className={`text-sm font-semibold ${
              isAnswerKeyComplete ? "text-[#006F72]" : "text-slate-700"
            }`}
          >
            {answeredQuestions} de{" "}
            {typeof questionCount === "number" ? questionCount : 0} questões
          </span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ERRO */}
      {/* ========================================================= */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* ========================================================= */}
      {/* AÇÕES */}
      {/* ========================================================= */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-5
            py-3
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isAnswerKeyComplete}
          className={`
            rounded-xl
            px-6
            py-3
            text-sm
            font-semibold
            shadow-sm
            transition
            ${
              isAnswerKeyComplete && !isSubmitting
                ? "bg-[#006F72] text-white hover:bg-[#005B5E]"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }
          `}
        >
          {isSubmitting
            ? "Criando prova..."
            : `Criar prova (${answeredQuestions}/${typeof questionCount === "number" ? questionCount : 0})`}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";

interface QuestionStat {
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  questionNumber: number;
  attempts: number;
  wrongs: number;
  errorRate: number;
}

interface ClassOption {
  id: string;
  name: string;
}

interface DashboardQuestionStatsProps {
  questionStats: QuestionStat[];
  classes: ClassOption[];
}

export default function DashboardQuestionStats({
  questionStats,
  classes,
}: DashboardQuestionStatsProps) {
  const [selectedClassId, setSelectedClassId] =
    useState("all");

  const filteredStats = useMemo(() => {
    const filtered =
      selectedClassId === "all"
        ? questionStats
        : questionStats.filter(
            (item) =>
              item.classId === selectedClassId,
          );

    return [...filtered]
      .sort((a, b) => {
        if (b.wrongs !== a.wrongs) {
          return b.wrongs - a.wrongs;
        }

        return b.errorRate - a.errorRate;
      })
      .slice(0, 5);
  }, [questionStats, selectedClassId]);

  return (
    <section
      className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]
      "
    >
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">
            Questões com mais erros
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Identifique as questões que precisam de
            mais atenção.
          </p>
        </div>

        {/* FILTRO */}
        <div>
          <label
            htmlFor="class-filter"
            className="sr-only"
          >
            Filtrar por turma
          </label>

          <select
            id="class-filter"
            value={selectedClassId}
            onChange={(event) =>
              setSelectedClassId(event.target.value)
            }
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-sm
              text-slate-700
              outline-none
              transition
              focus:border-[#007782]
              focus:ring-2
              focus:ring-[#007782]/10
            "
          >
            <option value="all">
              Todas as turmas
            </option>

            {classes.map((classItem) => (
              <option
                key={classItem.id}
                value={classItem.id}
              >
                {classItem.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="mt-5 space-y-3">
        {filteredStats.length === 0 ? (
          <div
            className="
              rounded-lg
              bg-slate-50
              p-6
              text-center
              text-sm
              text-slate-400
            "
          >
            {selectedClassId === "all"
              ? "Ainda não há dados suficientes para identificar as questões mais problemáticas."
              : "Não existem dados suficientes para essa turma."}
          </div>
        ) : (
          filteredStats.map((question) => {
            const errorRate = Math.min(
              100,
              Math.max(0, question.errorRate),
            );

            return (
              <article
                key={`${question.classId}-${question.examId}-${question.questionNumber}`}
                className="
                  rounded-xl
                  border
                  border-slate-100
                  p-4
                  transition
                  hover:border-slate-200
                  hover:bg-slate-50/50
                "
              >
                {/* PRIMEIRA LINHA */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        Questão{" "}
                        {question.questionNumber}
                      </h3>

                      <span
                        className="
                          rounded-full
                          bg-slate-100
                          px-2
                          py-0.5
                          text-[11px]
                          font-medium
                          text-slate-600
                        "
                      >
                        {question.className}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {question.examTitle}
                    </p>
                  </div>

                  {/* PERCENTUAL */}
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-800">
                      {errorRate.toFixed(0)}%
                    </p>

                    <p className="text-[11px] text-slate-400">
                      de erro
                    </p>
                  </div>
                </div>

                {/* INFORMAÇÕES */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {question.wrongs}{" "}
                    {question.wrongs === 1
                      ? "erro"
                      : "erros"}{" "}
                    em{" "}
                    {question.attempts}{" "}
                    {question.attempts === 1
                      ? "tentativa"
                      : "tentativas"}
                  </span>

                  <span>
                    {100 - errorRate > 0
                      ? `${(
                          100 - errorRate
                        ).toFixed(0)}% de acerto`
                      : "0% de acerto"}
                  </span>
                </div>

                {/* BARRA */}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#007782] transition-all duration-500"
                    style={{
                      width: `${errorRate}%`,
                    }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* RODAPÉ */}
      {filteredStats.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Exibindo as 5 questões com maior número de
            erros
            {selectedClassId !== "all"
              ? " para a turma selecionada"
              : ""}
            .
          </p>
        </div>
      )}
    </section>
  );
}
"use client";

import { useState } from "react";
import { saveAnswerKey } from "@/features/exams/actions";

export function AnswerKeyEditor({ examId, questionCount, alternativeCount, initialAnswers }: { examId: string; questionCount: number; alternativeCount: number; initialAnswers: Array<{ questionNumber: number; correctAnswer: string }> }) {
  const [answers, setAnswers] = useState<Record<number, string>>(() => Object.fromEntries(initialAnswers.map((item) => [item.questionNumber, item.correctAnswer]))); const letters = ["A", "B", "C", "D", "E", "F"].slice(0, alternativeCount);
  return <form action={saveAnswerKey} className="rounded-xl border bg-white p-6 shadow-sm"><input type="hidden" name="examId" value={examId} /><input type="hidden" name="answers" value={JSON.stringify(Object.entries(answers).map(([questionNumber, correctAnswer]) => ({ questionNumber: Number(questionNumber), correctAnswer })))} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: questionCount }, (_, index) => index + 1).map((question) => <fieldset key={question} className="flex items-center gap-2 rounded border p-3"><legend className="text-sm font-semibold">Questão {question}</legend>{letters.map((letter) => <label key={letter} className="cursor-pointer text-sm"><input type="radio" name={`question-${question}`} checked={answers[question] === letter} onChange={() => setAnswers((current) => ({ ...current, [question]: letter }))} /> {letter}</label>)}</fieldset>)}</div><button className="mt-6 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Salvar gabarito ({Object.keys(answers).length}/{questionCount})</button></form>;
}

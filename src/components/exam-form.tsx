"use client";

import { useState, useTransition } from "react";
import { createExamWithAnswerKey } from "@/features/exams/actions";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { ExamFormData } from "@/types/ExamFormData";

const ALL_LETTERS = ["A", "B", "C", "D", "E", "F"];

const initialFormData: ExamFormData = {
  title: "",
  examDate: "",
  subject: "",
  className: "",
  questionCount: 10,
  alternativeCount: 5,
};

export function NewExamForm() {
  const [formData, setFormData] = useState<ExamFormData>(initialFormData);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
 
  const { title, examDate, subject, className, questionCount, alternativeCount } = formData;
 
  const letters = ALL_LETTERS.slice(0, alternativeCount);
  const questions = Array.from({ length: questionCount }, (_, i) => i + 1);
 
  const isFormValid =
    title.trim().length > 0 &&
    examDate.trim().length > 0 &&
    subject.trim().length > 0 &&
    className.trim().length > 0 &&
    questionCount > 0 &&
    Object.keys(answers).length === questionCount;
 
  function updateField<K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }
 
  function handleQuestionCountChange(value: number) {
    const clamped = Math.min(120, Math.max(1, value || 1));
    updateField("questionCount", clamped);
    // remove respostas de questões que deixaram de existir
    setAnswers((current) => {
      const next: Record<number, string> = {};
      for (const q of Object.keys(current).map(Number)) {
        if (q <= clamped) next[q] = current[q];
      }
      return next;
    });
  }
 
  function handleAlternativeCountChange(value: number) {
    updateField("alternativeCount", value);
    // remove respostas que apontam para uma letra que deixou de existir
    const validLetters = ALL_LETTERS.slice(0, value);
    setAnswers((current) => {
      const next: Record<number, string> = {};
      for (const [q, letter] of Object.entries(current)) {
        if (validLetters.includes(letter)) next[Number(q)] = letter;
      }
      return next;
    });
  }
 
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
 
    const answersArray = Object.entries(answers).map(([questionNumber, correctAnswer]) => ({
      questionNumber: Number(questionNumber),
      correctAnswer,
    }));
 
    startTransition(() => {
      createExamWithAnswerKey(formData, answersArray);
    });
  }
 
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-bold">Dados da prova</h2>
 
        <div className="mt-4 space-y-4">
          <div className="flex flex-row gap-2 md:gap-4 w-full">
            <Field>
              <FieldLabel htmlFor="name">Nome da prova</FieldLabel>
              <Input
                id="name"
                type="text"
                value={title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </Field>
 
            <Field className="md:w-1/3">
              <FieldLabel htmlFor="date">Data</FieldLabel>
              <Input
                id="date"
                type="date"
                value={examDate}
                onChange={(e) => updateField("examDate", e.target.value)}
              />
            </Field>
          </div>
 
          <div className="flex flex-row gap-2 md:gap-4">
            <Field>
              <FieldLabel htmlFor="subject">Disciplina</FieldLabel>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />
            </Field>
 
            <Field>
              <FieldLabel htmlFor="class">Turma</FieldLabel>
              <Input
                id="class"
                type="text"
                value={className}
                onChange={(e) => updateField("className", e.target.value)}
              />
            </Field>
          </div>
 
          <div className="flex flex-row gap-2 md:gap-4 w-full">
            <Field>
              <FieldLabel htmlFor="questionCount">Quantidade de questões</FieldLabel>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="120"
                value={questionCount}
                onChange={(e) => handleQuestionCountChange(Number(e.target.value))}
              />
            </Field>
 
            <Field>
              <FieldLabel htmlFor="alternativeCount">Alternativas por questão</FieldLabel>
              <Select
                value={String(alternativeCount)}
                onValueChange={(value) => handleAlternativeCountChange(Number(value))}
              >
                <SelectTrigger id="alternativeCount" className="w-full">
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </div>
 
      <div>
        <h3 className="text-base font-bold">Gabarito</h3>
        <p className="mt-1 text-sm text-slate-600">
          Selecione a alternativa correta de cada questão.
        </p>
 
        <div className="mt-4 grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
          {questions.map((question) => (
            <div
              key={question}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-lg border border-gray-200 p-4 md:py-2"
            >
              <span className="mr-2 text-sm font-semibold text-gray-600">
                Questão {question}
              </span>
 
              <div className="flex flex-row gap-2 justify-between md:justify-normal">
                {letters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    className={`flex cursor-pointer rounded-full outline outline-gray-200 text-sm px-3 py-1.5 text-gray-500 ${answers[question] === letter
                      ? "outline-teal-700 bg-teal-700 text-white"
                      : "hover:outline-2 hover:outline-teal-700 hover:text-teal-700"
                      }`}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question]: letter,
                      }))
                    }
                  >
                    <span className="font-semibold">{letter}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
 
      <Button disabled={!isFormValid || isPending} className="w-full" type="submit">
        {isPending
          ? "Criando..."
          : `Criar prova (${Object.keys(answers).length}/${questionCount} respondidas)`}
      </Button>
    </form>
  );
}
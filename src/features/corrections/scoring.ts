export type DetectedAnswer = { question: number; answer: string | null };
export type KeyItem = { questionNumber: number; correctAnswer: string };
export type AnswerRow = KeyItem & { markedAnswer: string | null; isCorrect: boolean };

export function scoreAnswers(
  key: KeyItem[],
  detected: DetectedAnswer[],
  options?: { totalPoints?: number; questionCount?: number },
) {
  const map = new Map<number, string | null>(
    detected.map((item) => [
      item.question,
      item.answer?.trim().toUpperCase().slice(0, 1) ?? null,
    ]),
  );

  const answers: AnswerRow[] = key.map((item) => {
    const markedAnswer = map.get(item.questionNumber) ?? null;
    return {
      ...item,
      markedAnswer,
      isCorrect: markedAnswer !== null && markedAnswer === item.correctAnswer,
    };
  });

  const totalQuestions = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const unidentified = answers.filter((a) => !a.markedAnswer).length;
  const wrongAnswers = totalQuestions - correctAnswers - unidentified;

  // legacy score (0..10) — mesmo cálculo antigo
  const legacyScore =
    totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 1000) / 100 : 0;

  // finalScore usando totalPoints/questionCount (se fornecidos)
  let finalScore: number | null = null;
  if (
    options &&
    typeof options.totalPoints === "number" &&
    typeof options.questionCount === "number"
  ) {
    const denom = Math.max(1, Math.floor(options.questionCount));
    const raw = (correctAnswers / denom) * options.totalPoints;
    finalScore = Math.round(raw * 100) / 100; // duas casas
  }

  return {
    answers,
    totalQuestions,
    correctAnswers,
    unidentified,
    wrongAnswers,
    legacyScore,
    finalScore,
  };
}
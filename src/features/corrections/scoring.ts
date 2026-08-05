export type DetectedAnswer = { question: number; answer: string | null };
export type AnswerRow = { questionNumber: number; markedAnswer: string | null; correctAnswer: string; isCorrect: boolean };

export function scoreAnswers(key: Array<{ questionNumber: number; correctAnswer: string }>, detected: DetectedAnswer[]) {
  const map = new Map(detected.map((item) => [item.question, item.answer?.trim().toUpperCase().slice(0, 1) ?? null]));
  const answers: AnswerRow[] = key.map((item) => { const markedAnswer = map.get(item.questionNumber) ?? null; return { ...item, markedAnswer, isCorrect: markedAnswer === item.correctAnswer }; });
  const correctAnswers = answers.filter((item) => item.isCorrect).length; const unidentified = answers.filter((item) => !item.markedAnswer).length;
  return { answers, totalQuestions: answers.length, correctAnswers, unidentified, wrongAnswers: answers.length - correctAnswers - unidentified, score: answers.length ? Math.round((correctAnswers / answers.length) * 1000) / 100 : 0 };
}

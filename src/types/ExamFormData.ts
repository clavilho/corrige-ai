export type ExamFormData = {
  title: string;
  examDate: string;
  subject: string;
  className: string;
  questionCount: number;
  alternativeCount: number;
};

export type AnswerKeyItem = {
  questionNumber: number;
  correctAnswer: string;
};
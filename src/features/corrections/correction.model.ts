import mongoose from "mongoose";

export type DetectedAnswer = { question: number; answer: string | null };
export type AnswerRow = {
  questionNumber: number;
  correctAnswer: string;
  markedAnswer?: string | null;
  isCorrect: boolean;
};

export interface ICorrection {
  teacherId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  studentName: string;
  imageDataUrl: string;
  detectedAnswers: DetectedAnswer[];
  answers: AnswerRow[];
  warnings: string[];
  totalQuestions: number;
  correctAnswers: number;
  unidentified: number;
  wrongAnswers: number;
  // score: oficial (baseado em totalPoints), legacyScore: 0..10
  score: number;
  legacyScore: number;
  totalPoints: number;
  createdAt: Date;
}

const DetectedAnswerSchema = new mongoose.Schema(
  {
    question: { type: Number, required: true },
    answer: { type: String, default: null },
  },
  { _id: false },
);

const AnswerRowSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    correctAnswer: { type: String, required: true },
    markedAnswer: { type: String, default: null },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const CorrectionSchema = new mongoose.Schema<ICorrection>({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  studentName: { type: String, required: true },

  imageDataUrl: { type: String, required: true },

  detectedAnswers: { type: [DetectedAnswerSchema], default: [] },
  answers: { type: [AnswerRowSchema], default: [] },

  warnings: { type: [String], default: [] },

  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  unidentified: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },

  score: { type: Number, default: 0 },
  legacyScore: { type: Number, default: 0 },

  totalPoints: { type: Number, default: 100 },

  createdAt: { type: Date, default: () => new Date() },
});

// export typed model (handles hot reload in dev)
export const CorrectionModel =
  (mongoose.models.Correction as mongoose.Model<ICorrection & mongoose.Document>) ||
  mongoose.model<ICorrection & mongoose.Document>("Correction", CorrectionSchema);
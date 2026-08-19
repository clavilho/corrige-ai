import mongoose from "mongoose";

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

const CorrectionSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  studentName: { type: String, required: true },

  // imagem como dataURL (poderia ser otimizado posteriormente)
  imageDataUrl: { type: String, required: true },

  // respostas detectadas a partir da imagem
  detectedAnswers: { type: [DetectedAnswerSchema], default: [] },

  // detalhe por questão (compara com gabarito)
  answers: { type: [AnswerRowSchema], default: [] },

  // avisos gerados pela leitura
  warnings: { type: [String], default: [] },

  // métricas
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  unidentified: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },

  // notas
  // score: nota oficial (baseada em totalPoints quando disponível)
  score: { type: Number, default: 0 },
  // legacyScore: nota no padrão antigo (0..10) para rastreio/comparação
  legacyScore: { type: Number, default: 0 },

  // referência do total usado para cálculo
  totalPoints: { type: Number, default: 100 },

  createdAt: { type: Date, default: () => new Date() },
});

// Se já existe o model em runtime, reusar (hot reload)
export const CorrectionModel =
  (mongoose.models && (mongoose.models.Correction as mongoose.Model<any>)) ||
  mongoose.model("Correction", CorrectionSchema);
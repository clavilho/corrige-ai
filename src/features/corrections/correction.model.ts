import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const answerSchema = new Schema({ questionNumber: Number, markedAnswer: { type: String, default: null }, correctAnswer: String, isCorrect: Boolean }, { _id: false });
const correctionSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, required: true, index: true },
  examId: { type: Schema.Types.ObjectId, required: true, index: true },
  studentName: { type: String, default: "", trim: true, maxlength: 120 },
  imageDataUrl: { type: String, default: null },
  totalQuestions: Number, correctAnswers: Number, wrongAnswers: Number, unidentified: Number, score: Number,
  warnings: { type: [String], default: [] }, answers: { type: [answerSchema], default: [] },
}, { timestamps: true });
correctionSchema.index({ teacherId: 1, createdAt: -1 });

export type Correction = InferSchemaType<typeof correctionSchema>;
export const CorrectionModel: Model<Correction> = models.Correction ?? model<Correction>("Correction", correctionSchema);

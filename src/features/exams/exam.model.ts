import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const answerSchema = new Schema(
  {
    questionNumber: { type: Number, required: true, min: 1 },
    correctAnswer: { type: String, required: true },
  },
  { _id: false },
);
const examSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, default: "", trim: true, maxlength: 120 },
    className: { type: String, default: "", trim: true, maxlength: 120 },
    examDate: { type: Date, default: null },
    questionCount: { type: Number, required: true, min: 1, max: 120 },
    alternativeCount: { type: Number, required: true, min: 2, max: 6 },
    examGrade: { type: Number, required: true, min: 5, max: 100},
    answerKey: { type: [answerSchema], default: [] },
  },
  { timestamps: true },
);
examSchema.index({ teacherId: 1, createdAt: -1 });

export type Exam = InferSchemaType<typeof examSchema>;
export const ExamModel: Model<Exam> =
  models.Exam ?? model<Exam>("Exam", examSchema);

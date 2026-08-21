import mongoose from "mongoose";

export type GradeRecord = {
  examId?: mongoose.Types.ObjectId;
  correctionId?: mongoose.Types.ObjectId;
  score: number; // nota obtida (usar mesma escala usada no correction.score)
  totalPoints?: number; // valor total da prova usada para referência
  note?: string;
  createdAt: Date;
};

export interface IStudent {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  name: string;
  registration?: string;
  grades: GradeRecord[];
  createdAt: Date;
}

const GradeSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: false,
    },
    correctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Correction",
      required: false,
    },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: false },
    note: { type: String, required: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const StudentSchema = new mongoose.Schema<IStudent>({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  registration: { type: String, required: false, trim: true },
  grades: { type: [GradeSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
});

StudentSchema.index(
  { teacherId: 1, classId: 1, registration: 1 },
  {
    unique: true,
    partialFilterExpression: { registration: { $type: "string" } },
  },
);

export const StudentModel =
  (mongoose.models?.Student as mongoose.Model<IStudent & mongoose.Document>) ||
  mongoose.model<IStudent & mongoose.Document>("Student", StudentSchema);

import { InferSchemaType, Model, Schema, model, models } from "mongoose";

export type Turno = "manhã" | "tarde" | "noite";

const ClassSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, required: false },
  description: { type: String, required: false },
  academicYear: { type: String, required: false },
  term: { type: String, required: false },
  turno: { type: String, enum: ["manhã", "tarde", "noite"], required: false },
  studentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() },
});

ClassSchema.index({ teacherId: 1, createdAt: -1 });

export type Class = InferSchemaType<typeof ClassSchema>;
export const ClassModel: Model<Class> =
  models.Class ?? model<Class>("Class", ClassSchema);

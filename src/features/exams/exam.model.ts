import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

const answerSchema = new Schema(
  {
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    _id: false,
  },
);

const examSchema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Nome da prova.
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    /**
     * Disciplina.
     */
    subject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    /**
     * Data da prova.
     */
    examDate: {
      type: Date,
      default: null,
    },

    /**
     * Quantidade de questões.
     */
    questionCount: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    /**
     * Quantidade de alternativas por questão.
     */
    alternativeCount: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },

    /**
     * Nota máxima da prova.
     */
    examGrade: {
      type: Number,
      required: true,
      min: 5,
      max: 100,
    },
    answerKey: {
      type: [answerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Índice para buscar rapidamente
 * as provas do professor.
 */
examSchema.index({
  teacherId: 1,
  createdAt: -1,
});

export type Exam = InferSchemaType<typeof examSchema>;

export const ExamModel: Model<Exam> =
  models.Exam ??
  model<Exam>("Exam", examSchema);
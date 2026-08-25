import { InferSchemaType, Model, Schema, model, models } from "mongoose";

/**
 * ============================================================
 * ANSWER SCHEMA
 * ============================================================
 */

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

/**
 * ============================================================
 * CLASS SCHEMA
 * ============================================================
 *
 * Uma prova pode pertencer a uma ou várias turmas.
 *
 * Exemplo:
 *
 * classes: [
 *   {
 *     classId: ObjectId("..."),
 *     className: "3º Ano A",
 *   },
 *   {
 *     classId: ObjectId("..."),
 *     className: "3º Ano B",
 *   },
 * ]
 *
 * Guardamos o ID e o nome juntos para manter
 * a relação entre eles mesmo que o nome da turma
 * seja alterado posteriormente.
 */

const classSchema = new Schema(
  {
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
  },
  {
    _id: false,
  },
);

/**
 * ============================================================
 * EXAM SCHEMA
 * ============================================================
 */

const examSchema = new Schema(
  {
    /**
     * Professor responsável pela prova.
     */
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * ========================================================
     * TURMAS
     * ========================================================
     *
     * Uma mesma prova pode pertencer a várias turmas.
     */
    classes: {
      type: [classSchema],
      required: true,

      validate: {
        validator: (classes: unknown[]) => classes.length > 0,

        message: "A prova deve possuir pelo menos uma turma.",
      },
    },

    /**
     * ========================================================
     * DADOS DA PROVA
     * ========================================================
     */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    subject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    examDate: {
      type: Date,
      default: null,
    },

    /**
     * ========================================================
     * CONFIGURAÇÕES
     * ========================================================
     */

    questionCount: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    alternativeCount: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },

    examGrade: {
      type: Number,
      required: true,
      min: 5,
      max: 100,
    },

    /**
     * ========================================================
     * GABARITO
     * ========================================================
     */

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
 * ============================================================
 * INDEXES
 * ============================================================
 */

/**
 * Busca as provas do professor
 * mais rapidamente.
 */
examSchema.index({
  teacherId: 1,
  createdAt: -1,
});

/**
 * Busca provas por turma.
 *
 * IMPORTANTE:
 *
 * O campo antigo era:
 *
 * classIds
 *
 * Agora o ID está dentro de:
 *
 * classes.classId
 */
examSchema.index({
  teacherId: 1,
  "classes.classId": 1,
});

/**
 * ============================================================
 * TYPE
 * ============================================================
 */

export type Exam = InferSchemaType<typeof examSchema>;

/**
 * ============================================================
 * MODEL
 * ============================================================
 */

if (models.Exam) {
  delete models.Exam;
}

export const ExamModel: Model<Exam> = model<Exam>("Exam", examSchema);

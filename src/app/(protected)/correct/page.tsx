import { CorrectionForm } from "@/components/correction-form";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function CorrectPage() {
  const teacherId = await currentUserId();

  await connectDatabase();

  const exams = await ExamModel.find({
    teacherId,
    $expr: {
      $eq: [{ $size: "$answerKey" }, "$questionCount"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();


  if (!exams.length) {
    return (
      <div>
        <h1>
          Nenhuma prova disponível
        </h1>

        <p>
          Cadastre uma prova com gabarito completo antes de corrigir.
        </p>
      </div>
    );
  }


  return (
    <div className="grid gap-8 lg:grid-cols-2">

      {/* Formulário */}
      <div className="
        rounded-3xl
        border
        border-slate-100
        bg-white
        p-8
        shadow-2xl
        shadow-slate-100
        md:p-10
      ">
        <div>
          <h1 className="
            text-3xl
            font-extrabold
            tracking-tight
            text-slate-950
          ">
            Corrigir prova
          </h1>

          <p className="mt-2 text-base text-slate-600">
            Tire uma foto ou envie a imagem da folha preenchida pelo aluno.
          </p>
        </div>


        <div className="mt-10">
          <CorrectionForm
            exams={exams.map((exam) => ({
              id: exam._id.toString(),
              title: exam.title,
              questionCount: exam.questionCount,
            }))}
          />
        </div>


        <div className="
          mt-10
          border-t
          border-slate-100
          pt-8
        ">
          <p className="text-sm leading-relaxed text-slate-500">
            Dicas para melhor precisão: boa iluminação, folha totalmente enquadrada, sem sombras e marcações preenchidas por completo.
          </p>
        </div>

      </div>



      {/* Preview */}
      <div className="
        rounded-3xl
        border
        border-slate-100
        bg-white
        p-8
        shadow-2xl
        shadow-slate-100
        md:p-10
        lg:min-h-[700px]
      ">

        <h2 className="
          text-3xl
          font-extrabold
          tracking-tight
          text-slate-950
        ">
          Pré-visualização
        </h2>


        <div className="
          mt-10
          flex
          min-h-[400px]
          items-center
          justify-center
          rounded-2xl
          border-2
          border-dashed
          border-slate-100
          bg-slate-50/50
          p-8
          text-center
        ">
          <p className="text-base text-slate-500">
            Nenhuma imagem selecionada. A prévia aparece aqui.
          </p>
        </div>

      </div>

    </div>
  );
}
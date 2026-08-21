import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ClassModel } from "@/features/classes/class.model";
import { StudentModel } from "@/features/students/student.model";
import { CreateStudentForm } from "@/components/create-student-form";
import DeleteStudentButton from "@/components/delete-buttons/delete-student-button";
import { ArrowLeft } from "lucide-react";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const teacherId = await currentUserId();
  await connectDatabase();

  const cls = await ClassModel.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    teacherId,
  }).lean();
  if (!cls) notFound();

  const students = await StudentModel.find({
    classId: cls._id,
    teacherId,
  }).lean();

  // compute per-student average (using score / totalPoints when totalPoints present, else use score as-is)
  const studentsWithAvg = (students || []).map((s: any) => {
    const grades = s.grades || [];
    let avg = null;
    if (grades.length) {
      // compute normalized percent average: if totalPoints present, use percentage; else assume score is already in same scale
      const normalized = grades.map((g: any) => {
        if (typeof g.totalPoints === "number" && g.totalPoints > 0) {
          return (g.score / g.totalPoints) * 100; // percent
        }
        return g.score; // fallback: raw score (not normalized)
      });
      avg =
        normalized.reduce((a: number, b: number) => a + b, 0) /
        normalized.length;
    }
    return { ...s, avg };
  });

  return (
    <div>
      <Link
        href="/classes"
        className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                shadow-sm
                transition-all
                duration-200
                hover:-translate-x-1
                hover:border-[#006F72]
                hover:bg-[#EAF7F7]
                hover:text-[#006F72]
              "
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às turmas
      </Link>

      <h1 className="mt-4 text-3xl font-bold">
        {(cls as any).name}{" "}
        <span className="text-sm text-slate-500">
          ({(cls as any).academicYear + "º " + (cls as any).term + " "}
          {(cls as any).turno ?? "—"})
        </span>
      </h1>
      <p className="mt-2 text-sm text-slate-600">{(cls as any).description}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border bg-white p-4">
          <h2 className="font-medium">Alunos</h2>
          <div className="mt-3 space-y-2">
            {studentsWithAvg.length === 0 ? (
              <div className="text-sm text-slate-400">
                Nenhum aluno cadastrado.
              </div>
            ) : (
              <ul className="space-y-2">
                {studentsWithAvg.map((s: any) => (
                  <li
                    key={String(s._id)}
                    className="flex items-center justify-between rounded p-3 border"
                  >
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-slate-500">
                        Matrícula: {s.registration ?? "—"}
                      </div>
                    </div>
                    <div className="text-sm text-slate-700">
                      {s.avg === null ? "—" : `${s.avg.toFixed(1)}%`}
                    </div>
                    <DeleteStudentButton
                      studentId={s._id.toString()}
                      studentName={s.name}
                      classId={s.classId.toString()}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-medium">Adicionar aluno</h3>
          <div className="mt-3">
            <CreateStudentForm classId={String(cls._id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

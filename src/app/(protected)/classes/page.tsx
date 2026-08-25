import Link from "next/link";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ClassModel } from "@/features/classes/class.model";
import DeleteClassButton from "@/components/delete-buttons/delete-class-button";

export default async function ClassPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const classes = await ClassModel.find({ teacherId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas turmas</h2>
        <Link
          href="/classes/form"
          className="rounded-xl bg-[#006F72] px-5 py-2.5 font-semibold text-white hover:brightness-105"
        >
          + Nova turma
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {classes.length === 0 ? (
          <p className="text-slate-600">Nenhuma turma criada ainda.</p>
        ) : (
          classes.map((classItem) => (
            <article
              key={classItem._id.toString()}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {classItem.name}
                </h3>
                <p className="text-sm text-slate-600">
                  {classItem.academicYear} · {classItem.term} ·{" "}
                  {classItem.turno} · {}
                  {classItem.studentCount} Alunos
                </p>
              </div>

              <div className="flex items-center gap-4">

                <Link
                  href={`/classes/${classItem._id.toString()}`}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition"
                >
                  Editar Turma
                </Link>
                
                <DeleteClassButton
                  classId={classItem._id.toString()}
                  className={classItem.name}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

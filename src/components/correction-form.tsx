"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, LoaderCircle } from "lucide-react";
import imageCompression from "browser-image-compression";

import {
  createCorrection,
  getStudentsByExam,
} from "@/features/corrections/actions";

interface Exam {
  id: string;
  title: string;
  questionCount: number;
}

interface Student {
  id: string;
  name: string;
  registration: string | null;
}

interface CorrectionFormProps {
  exams: Exam[];
  onImageSelected?: (dataUrl: string | null) => void;
}

export function CorrectionForm({
  exams,
  onImageSelected,
}: CorrectionFormProps) {
  const router = useRouter();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function loadStudents() {
      if (!selectedExamId) {
        setStudents([]);
        setSelectedStudentId("");
        return;
      }

      try {
        setLoadingStudents(true);
        setError("");
        setSelectedStudentId("");

        const result = await getStudentsByExam(selectedExamId);

        setStudents(result);
      } catch (err) {
        console.error(err);

        setStudents([]);

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os alunos.",
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [selectedExamId]);

  async function convertToBase64(file: File): Promise<string> {
    console.log("Imagem original:");

    console.log({
      nome: file.name,
      tamanhoKB: (file.size / 1024).toFixed(2),
      tamanhoMB: (file.size / 1024 / 1024).toFixed(2),
    });

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.75,
    });

    console.log("Imagem comprimida:");

    console.log({
      nome: compressed.name,
      tamanhoKB: (compressed.size / 1024).toFixed(2),
      tamanhoMB: (compressed.size / 1024 / 1024).toFixed(2),
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);

      reader.onerror = reject;

      reader.readAsDataURL(compressed);
    });
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!selectedExamId) {
      setError("Selecione uma prova.");
      return;
    }

    if (!selectedStudentId) {
      setError("Selecione o aluno.");
      return;
    }

    if (!selectedImage) {
      setError("Envie uma imagem da prova.");
      return;
    }

    const selectedStudent = students.find(
      (student) => student.id === selectedStudentId,
    );

    if (!selectedStudent) {
      setError("Aluno selecionado não encontrado.");
      return;
    }

    try {
      setLoading(true);

      console.log("Convertendo imagem...");

      const imageDataUrl = await convertToBase64(selectedImage);

      console.log("Criando correção...");

      const result = await createCorrection({
        examId: selectedExamId,

        studentId: selectedStudent.id,

        studentName: selectedStudent.name,

        imageDataUrl,
      });

      console.log("Correção criada:", result);

      router.push(`/corrections/${result.correctionId}`);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao corrigir prova.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* LOADING */}
      {loading && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/50
            backdrop-blur-sm
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              gap-4
              rounded-2xl
              bg-white
              p-8
              shadow-2xl
            "
          >
            <LoaderCircle className="h-10 w-10 animate-spin text-[#006F72]" />

            <div className="text-center">
              <p className="font-semibold text-slate-800">
                Corrigindo prova...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* PROVA */}
        <div>
          <label
            htmlFor="exam"
            className="
              mb-2
              block
              text-sm
              font-semibold
              text-slate-800
            "
          >
            Prova
          </label>

          <select
            id="exam"
            value={selectedExamId}
            onChange={(event) =>
              setSelectedExamId(event.target.value)
            }
            disabled={loading}
            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              outline-none
              transition
              focus:border-[#1E7F84]
              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:text-slate-400
            "
          >
            <option value="">
              Selecione a prova
            </option>

            {exams.map((exam) => (
              <option
                key={exam.id}
                value={exam.id}
              >
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {/* ALUNO */}
        <div>
          <label
            htmlFor="student"
            className="
              mb-2
              block
              text-sm
              font-semibold
              text-slate-800
            "
          >
            Aluno
          </label>

          <select
            id="student"
            value={selectedStudentId}
            onChange={(event) =>
              setSelectedStudentId(event.target.value)
            }
            disabled={
              !selectedExamId ||
              loadingStudents ||
              loading
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              outline-none
              transition
              focus:border-[#1E7F84]
              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:text-slate-400
            "
          >
            <option value="">
              {!selectedExamId
                ? "Selecione uma prova primeiro"
                : loadingStudents
                  ? "Carregando alunos..."
                  : students.length === 0
                    ? "Nenhum aluno encontrado"
                    : "Selecione o aluno"}
            </option>

            {students.map((student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.name}
                {student.registration
                  ? ` — ${student.registration}`
                  : ""}
              </option>
            ))}
          </select>

          {selectedExamId &&
            !loadingStudents &&
            students.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {students.length}{" "}
                {students.length === 1
                  ? "aluno encontrado"
                  : "alunos encontrados"}{" "}
                nesta turma.
              </p>
            )}
        </div>

        {/* UPLOAD */}
        <div className="grid grid-cols-2 gap-4">

          {/* GALERIA */}
          <label
            htmlFor="gallery"
            className="
              flex
              cursor-pointer
              flex-col
              items-center
              justify-center
              gap-2
              rounded-2xl
              border-2
              border-dashed
              border-slate-200
              p-6
              text-slate-600
              transition
              hover:border-[#1E7F84]
              hover:bg-slate-50
            "
          >
            <Upload className="h-6 w-6" />

            <span className="text-sm font-medium">
              Enviar imagem
            </span>
          </label>

          <input
            id="gallery"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* CAMERA */}
          <label
            htmlFor="camera"
            className="
              flex
              cursor-pointer
              flex-col
              items-center
              justify-center
              gap-2
              rounded-2xl
              border-2
              border-dashed
              border-slate-200
              p-6
              text-slate-600
              transition
              hover:border-[#1E7F84]
              hover:bg-slate-50
            "
          >
            <Camera className="h-6 w-6" />

            <span className="text-sm font-medium">
              Tirar foto
            </span>
          </label>

          <input
            id="camera"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* PREVIEW */}
        {selectedImage && (
          <div
            className="
              rounded-xl
              bg-slate-50
              p-4
            "
          >
            <p className="text-sm text-slate-600">
              Arquivo selecionado:
            </p>

            <p className="font-semibold text-slate-900">
              {selectedImage.name}
            </p>
          </div>
        )}

        {/* ERRO */}
        {error && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              text-red-600
            "
          >
            {error}
          </div>
        )}

        {/* BOTÃO */}
        <button
          type="submit"
          disabled={
            loading ||
            loadingStudents ||
            !selectedExamId ||
            !selectedStudentId ||
            !selectedImage
          }
          className="
            w-full
            rounded-xl
            bg-[#006F72]
            py-3.5
            font-semibold
            text-white
            transition
            hover:bg-[#005B5E]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading
            ? "Analisando prova..."
            : "Analisar e corrigir"}
        </button>
      </form>
    </>
  );
}
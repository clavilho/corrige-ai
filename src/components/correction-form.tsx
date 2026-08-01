"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";
import { createCorrection } from "@/features/corrections/actions.ts";

interface Exam {
  id: string;
  title: string;
  questionCount: number;
}

interface CorrectionFormProps {
  exams: Exam[];
}

export function CorrectionForm({ exams }: CorrectionFormProps) {
  const router = useRouter();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  }


  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setError("");
  }


  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");


    if (!selectedExamId) {
      setError("Selecione uma prova.");
      return;
    }


    if (!studentName.trim()) {
      setError("Informe o nome do aluno.");
      return;
    }


    if (!selectedImage) {
      setError("Envie uma imagem da prova.");
      return;
    }


    try {
      setLoading(true);


      console.log("Convertendo imagem...");

      const imageDataUrl = await convertToBase64(
        selectedImage
      );


      console.log("Criando correção...");


      const result = await createCorrection({
        examId: selectedExamId,
        studentName: studentName.trim(),
        imageDataUrl,
      });


      console.log(
        "Correção criada:",
        result
      );


      router.push(
        `/corrections/${result.correctionId}`
      );


    } catch (err) {

      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao corrigir prova."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* PROVA */}
      <div>
        <label
          htmlFor="exam"
          className="
            mb-2 block
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
          onChange={(e) =>
            setSelectedExamId(e.target.value)
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
            focus:border-[#1E7F84]
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
          htmlFor="studentName"
          className="
            mb-2 block
            text-sm
            font-semibold
            text-slate-800
          "
        >
          Nome do aluno
        </label>


        <input
          id="studentName"
          value={studentName}
          onChange={(e) =>
            setStudentName(e.target.value)
          }
          placeholder="Digite o nome do aluno"
          className="
            w-full
            rounded-xl
            border
            border-slate-200
            px-4
            py-3
            outline-none
            focus:border-[#1E7F84]
          "
        />

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
            hover:border-[#1E7F84]
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
            hover:border-[#1E7F84]
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


          <p className="font-semibold">
            {selectedImage.name}
          </p>

        </div>
      )}



      {/* ERRO */}
      {error && (
        <div
          className="
            rounded-xl
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
        disabled={loading}
        className="
          w-full
          rounded-xl
          bg-[#006F72]
          py-3.5
          font-semibold
          text-white
          disabled:opacity-50
        "
      >
        {loading
          ? "Analisando prova..."
          : "Analisar e corrigir"}
      </button>


    </form>
  );
}
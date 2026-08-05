"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";
import { createCorrection } from "@/features/corrections/actions";

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setError("");
  }

  // compress image using canvas to a jpeg blob
  async function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<Blob> {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (!blob) return reject(new Error("Falha ao comprimir imagem"));
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  const safeNavigate = (href: string) => {
    try {
      router.push(href);
    } catch (err) {
      console.warn("router.push falhou, usando fallback:", err);
      if (typeof window !== "undefined") {
        window.location.href = href;
      }
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      // compress the image before sending
      const compressedBlob = await compressImage(selectedImage, 1200, 0.75);
      const fileName = selectedImage.name.replace(/\.[^/.]+$/, ".jpg");
      const file = new File([compressedBlob], fileName, { type: "image/jpeg" });

      const result = await createCorrection({
        examId: selectedExamId,
        studentName: studentName.trim(),
        file,
      });

      safeNavigate(`/corrections/${result.correctionId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao corrigir prova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
          onChange={(e) => setSelectedExamId(e.target.value)}
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
          <option value="">Selecione a prova</option>

          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
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
          onChange={(e) => setStudentName(e.target.value)}
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
        {/* GALERIA (input dentro do label, oculto com sr-only em vez de hidden) */}
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

          <span className="text-sm font-medium">Enviar imagem</span>

          {/* input dentro do label e sem display:none */}
          <input
            id="gallery"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
          />
        </label>

        {/* CAMERA (input dentro do label) */}
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

          <span className="text-sm font-medium">Tirar foto</span>

          <input
            id="camera"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
          />
        </label>
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
          <p className="text-sm text-slate-600">Arquivo selecionado:</p>

          <p className="font-semibold">{selectedImage.name}</p>
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
        {loading ? "Analisando prova..." : "Analisar e corrigir"}
      </button>
    </form>
  );
}

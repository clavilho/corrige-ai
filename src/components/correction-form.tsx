"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, LoaderCircle } from "lucide-react";
import { createCorrection } from "@/features/corrections/actions";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Exam {
  id: string;
  title: string;
  questionCount: number;
}

interface CorrectionFormProps {
  exams: Exam[];
  onImageSelected?: (dataUrl: string | null) => void;
}

export function CorrectionForm({ exams, onImageSelected }: CorrectionFormProps) {
  const router = useRouter();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setError("");
  }

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

      console.log("Convertendo imagem...");

      const imageDataUrl = await convertToBase64(selectedImage);

      console.log("Criando correção...");

      const result = await createCorrection({
        examId: selectedExamId,
        studentName: studentName.trim(),
        imageDataUrl,
      });

      console.log("Correção criada:", result);

      router.push(`/corrections/${result.correctionId}`);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Erro ao corrigir prova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PROVA */}
      <Field>
        <FieldLabel htmlFor="exam">Prova</FieldLabel>
        <Select value={selectedExamId} onValueChange={(value) => setSelectedExamId(value)}>
          <SelectTrigger id="exam" className="w-full">
            <SelectValue placeholder="Selecione a prova" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* ALUNO */}
      <Field>
        <FieldLabel htmlFor="studentName">Nome do aluno</FieldLabel>
        <Input
          id="studentName"
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Digite o nome do aluno"
        />
      </Field>

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

          <span className="text-sm font-medium">Enviar imagem</span>
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

          <span className="text-sm font-medium">Tirar foto</span>
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
      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Analisando prova..." : "Analisar e corrigir"}
      </Button>
    </form>
    </>
  );
}

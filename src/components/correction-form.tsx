"use client";

import { useState } from "react";
import { Upload, Camera } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  questionCount: number;
}

interface CorrectionFormProps {
  exams: Exam[];
}

export function CorrectionForm({ exams }: CorrectionFormProps) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [error, setError] = useState("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedImage(file);
      setError("");
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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


    setError("");

    console.log({
      examId: selectedExamId,
      studentName,
      image: selectedImage,
    });


    // Aqui você chama sua API
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* PROVA */}
      <div>
        <label
          htmlFor="exam"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Prova
        </label>

        <select
          id="exam"
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setError("");
          }}
          className="
            w-full rounded-xl
            border border-slate-200
            bg-white
            px-4 py-3
            text-slate-700
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


      {/* NOME ALUNO */}
      <div>
        <label
          htmlFor="student"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Nome do aluno
        </label>

        <input
          id="student"
          type="text"
          value={studentName}
          onChange={(e) => {
            setStudentName(e.target.value);
            setError("");
          }}
          placeholder="Digite o nome do aluno"
          className="
            w-full rounded-xl
            border border-slate-200
            px-4 py-3
            outline-none
            focus:border-[#1E7F84]
          "
        />
      </div>


      {/* UPLOAD */}
      <div className="grid grid-cols-2 gap-4">

        {/* GALERIA */}
        <label
          htmlFor="gallery-upload"
          className="
            flex cursor-pointer
            flex-col items-center
            justify-center gap-2
            rounded-2xl
            border-2 border-dashed
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
          id="gallery-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />


        {/* CAMERA */}
        <label
          htmlFor="camera-upload"
          className="
            flex cursor-pointer
            flex-col items-center
            justify-center gap-2
            rounded-2xl
            border-2 border-dashed
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
          id="camera-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

      </div>


      {/* IMAGEM SELECIONADA */}
      {selectedImage && (
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Arquivo selecionado:
          </p>

          <p className="font-semibold text-slate-800">
            {selectedImage.name}
          </p>
        </div>
      )}


      {/* ERRO */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* BOTÃO */}
      <button
        type="submit"
        className="
          w-full rounded-xl
          bg-[#006F72]
          py-3.5
          font-semibold
          text-white
          transition
          hover:bg-[#00595c]
        "
      >
        Analisar e corrigir
      </button>

    </form>
  );
}
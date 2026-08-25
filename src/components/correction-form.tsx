"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  LoaderCircle,
  Upload,
} from "lucide-react";

import imageCompression from "browser-image-compression";

import {
  createCorrection,
  getExistingCorrection,
  getStudentsByExam,
} from "@/features/corrections/actions";

interface ExamClass {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  questionCount: number;
  classes: ExamClass[];
}

interface Student {
  id: string;
  name: string;
  registration: string | null;
}

interface ExistingCorrection {
  correctionId: string;
  score: number;
  createdAt: string;
}

interface CorrectionFormProps {
  exams: Exam[];
  initialExamId?: string;
  initialStudentId?: string;
  initialClassId?: string;
  onImageSelected?: (dataUrl: string | null) => void;
}

export function CorrectionForm({
  exams,
  initialExamId = "",
  initialStudentId = "",
  initialClassId = "",
  onImageSelected,
}: CorrectionFormProps) {
  const router = useRouter();

  const [selectedExamId, setSelectedExamId] = useState(initialExamId);

  const [selectedClassId, setSelectedClassId] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);

  const [students, setStudents] = useState<Student[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [loadingExistingCorrection, setLoadingExistingCorrection] =
    useState(false);

  const [existingCorrection, setExistingCorrection] =
    useState<ExistingCorrection | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  /*
   * ============================================================
   * PROVA SELECIONADA
   * ============================================================
   */

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);

  /*
   * ============================================================
   * TURMAS DA PROVA
   *
   * Sempre usamos [] como fallback.
   * Isso evita o erro:
   *
   * Cannot read properties of undefined (reading 'length')
   * ============================================================
   */

  const examClasses: ExamClass[] = selectedExam?.classes ?? [];

  const hasClasses = examClasses.length > 0;

  const hasSingleClass = examClasses.length === 1;

  const hasMultipleClasses = examClasses.length > 1;

  /*
   * ============================================================
   * SELECIONA AUTOMATICAMENTE A TURMA
   * ============================================================
   *
   * Se a prova tiver somente uma turma:
   *
   * Prova
   *   ↓
   * Turma selecionada automaticamente
   *   ↓
   * Busca alunos
   *   ↓
   * Professor seleciona aluno
   *
   * Se tiver mais de uma:
   *
   * Prova
   *   ↓
   * Professor escolhe turma
   *   ↓
   * Busca alunos
   */

  useEffect(() => {
    if (!selectedExamId) {
      setSelectedClassId("");
      setStudents([]);
      setSelectedStudentId("");
      setExistingCorrection(null);
      return;
    }

    const exam = exams.find((item) => item.id === selectedExamId);

    if (!exam) {
      setSelectedClassId("");
      setStudents([]);
      setSelectedStudentId("");
      setExistingCorrection(null);
      return;
    }

    const classes = exam.classes ?? [];

    /*
     * PROVA COM UMA TURMA
     */

    if (classes.length === 1) {
      const classId = classes[0].id;

      setSelectedClassId(classId);

      /*
       * Não limpamos o aluno aqui.
       *
       * O próximo useEffect será responsável
       * por buscar os alunos da turma.
       */

      return;
    }

    /*
     * PROVA COM MAIS DE UMA TURMA
     */

    if (classes.length > 1) {
      setSelectedClassId("");
      setStudents([]);
      setSelectedStudentId("");
      setExistingCorrection(null);
      return;
    }

    /*
     * PROVA SEM TURMA
     */

    setSelectedClassId("");
    setStudents([]);
    setSelectedStudentId("");
    setExistingCorrection(null);
  }, [selectedExamId, exams]);

  /*
   * ============================================================
   * CARREGA ALUNOS
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      if (!selectedExamId || !selectedClassId) {
        setStudents([]);

        /*
         * Só limpa o aluno quando realmente
         * não temos uma turma selecionada.
         */
        if (!selectedClassId) {
          setSelectedStudentId("");
        }

        setExistingCorrection(null);

        return;
      }

      try {
        setLoadingStudents(true);
        setError("");
        setExistingCorrection(null);

        const result = await getStudentsByExam(selectedExamId, selectedClassId);

        if (cancelled) {
          return;
        }

        setStudents(result);

        /*
         * Se veio com um aluno pré-selecionado,
         * tenta encontrar esse aluno na lista.
         */

        if (
          initialStudentId &&
          result.some((student) => student.id === initialStudentId)
        ) {
          setSelectedStudentId(initialStudentId);
        } else {
          setSelectedStudentId("");
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);

        setStudents([]);
        setSelectedStudentId("");
        setExistingCorrection(null);

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os alunos.",
        );
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [selectedExamId, selectedClassId, initialStudentId]);

  /*
   * ============================================================
   * VERIFICA CORREÇÃO EXISTENTE
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function checkExistingCorrection() {
      if (!selectedExamId || !selectedStudentId) {
        setExistingCorrection(null);
        return;
      }

      try {
        setLoadingExistingCorrection(true);
        setError("");

        const result = await getExistingCorrection(
          selectedExamId,
          selectedStudentId,
        );

        if (cancelled) {
          return;
        }

        setExistingCorrection(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);

        setExistingCorrection(null);

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível verificar a correção anterior.",
        );
      } finally {
        if (!cancelled) {
          setLoadingExistingCorrection(false);
        }
      }
    }

    checkExistingCorrection();

    return () => {
      cancelled = true;
    };
  }, [selectedExamId, selectedStudentId]);

  /*
   * ============================================================
   * COMPRESSÃO DA IMAGEM
   * ============================================================
   */

  async function convertToBase64(file: File): Promise<string> {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.75,
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = reject;

      reader.readAsDataURL(compressed);
    });
  }

  /*
   * ============================================================
   * SELEÇÃO DA IMAGEM
   * ============================================================
   */

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setError("");

    onImageSelected?.(null);
  }

  /*
   * ============================================================
   * VALIDAÇÃO
   * ============================================================
   */

  function validateForm(): boolean {
    if (!selectedExamId) {
      setError("Selecione uma prova.");
      return false;
    }

    if (!selectedClassId) {
      setError("Selecione a turma.");
      return false;
    }

    if (!selectedStudentId) {
      setError("Selecione o aluno.");
      return false;
    }

    if (!selectedImage) {
      setError("Envie uma imagem da prova.");
      return false;
    }

    const selectedStudent = students.find(
      (student) => student.id === selectedStudentId,
    );

    if (!selectedStudent) {
      setError("Aluno selecionado não encontrado.");
      return false;
    }

    return true;
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!validateForm()) {
      return;
    }

    if (existingCorrection) {
      setShowReplaceConfirm(true);
      return;
    }

    processCorrection(false);
  }

  /*
   * ============================================================
   * PROCESSA CORREÇÃO
   * ============================================================
   */

  async function processCorrection(replaceExisting: boolean) {
    const selectedStudent = students.find(
      (student) => student.id === selectedStudentId,
    );

    if (!selectedStudent) {
      setError("Aluno selecionado não encontrado.");
      return;
    }

    if (!selectedClassId) {
      setError("Selecione a turma.");
      return;
    }

    if (!selectedImage) {
      setError("Envie uma imagem da prova.");
      return;
    }

    try {
      setShowReplaceConfirm(false);
      setLoading(true);
      setError("");

      const imageDataUrl = await convertToBase64(selectedImage);

      const result = await createCorrection({
        examId: selectedExamId,

        classId: selectedClassId,

        studentId: selectedStudent.id,

        studentName: selectedStudent.name,

        imageDataUrl,

        replaceExisting,
      });

      router.push(`/corrections/${result.correctionId}`);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Erro ao corrigir prova.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * CANCELAR SUBSTITUIÇÃO
   * ============================================================
   */

  function handleCancelReplace() {
    setShowReplaceConfirm(false);
  }

  /*
   * ============================================================
   * ALUNO SELECIONADO
   * ============================================================
   */

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      {/* ======================================================= */}
      {/* LOADING */}
      {/* ======================================================= */}

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
            <LoaderCircle
              className="
                h-10
                w-10
                animate-spin
                text-[#006F72]
              "
            />

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

      {/* ======================================================= */}
      {/* CONFIRMAÇÃO */}
      {/* ======================================================= */}

      {showReplaceConfirm && existingCorrection && (
        <div
          className="
              fixed
              inset-0
              z-[10000]
              flex
              items-center
              justify-center
              bg-black/50
              px-4
              backdrop-blur-sm
            "
        >
          <div
            className="
                w-full
                max-w-md
                rounded-2xl
                bg-white
                p-6
                shadow-2xl
              "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-amber-100
                    text-amber-700
                  "
              >
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Correção já existente
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Este aluno já possui uma correção para esta prova.
                </p>
              </div>
            </div>

            <div
              className="
                  mt-5
                  rounded-xl
                  border
                  border-amber-200
                  bg-amber-50
                  p-4
                "
            >
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Aluno:</span>{" "}
                {selectedStudent?.name}
              </p>

              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Nota anterior:</span>{" "}
                {Number(existingCorrection.score).toFixed(1)}
              </p>

              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Data:</span>{" "}
                {new Date(existingCorrection.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Ao continuar, a correção anterior será substituída pelo resultado
              desta nova imagem.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelReplace}
                className="
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
              >
                Cancelar
              </button>

              <Link
                href={`/corrections/${existingCorrection.correctionId}`}
                className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
              >
                <Eye className="h-4 w-4" />
                Ver anterior
              </Link>

              <button
                type="button"
                onClick={() => processCorrection(true)}
                className="
                    rounded-xl
                    bg-[#006F72]
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#005B5E]
                  "
              >
                Sim, substituir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* FORM */}
      {/* ======================================================= */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===================================================== */}
        {/* PROVA */}
        {/* ===================================================== */}

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
            onChange={(event) => {
              const examId = event.target.value;

              setSelectedExamId(examId);

              setSelectedClassId("");
              setSelectedStudentId("");
              setExistingCorrection(null);
              setSelectedImage(null);
              setStudents([]);
              setError("");
            }}
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
            <option value="">Selecione a prova</option>

            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {/* ===================================================== */}
        {/* TURMA */}
        {/* ===================================================== */}

        {hasMultipleClasses && (
          <div>
            <label
              htmlFor="class"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-800
              "
            >
              Turma
            </label>

            <select
              id="class"
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(event.target.value);

                setSelectedStudentId("");
                setExistingCorrection(null);
                setStudents([]);
                setError("");
              }}
              disabled={!selectedExamId || loading}
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
              <option value="">Selecione a turma</option>

              {examClasses.map((examClass) => (
                <option key={examClass.id} value={examClass.id}>
                  {examClass.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ===================================================== */}
        {/* TURMA ÚNICA */}
        {/* ===================================================== */}

        {hasSingleClass && selectedClassId && (
          <div
            className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              px-4
              py-3
            "
          >
            <p className="text-xs font-medium text-slate-500">Turma</p>

            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {examClasses[0].name}
            </p>
          </div>
        )}

        {/* ===================================================== */}
        {/* PROVA SEM TURMA */}
        {/* ===================================================== */}

        {selectedExamId && !hasClasses && (
          <div
            className="
                rounded-xl
                border
                border-amber-200
                bg-amber-50
                p-4
                text-sm
                text-amber-800
              "
          >
            Esta prova não possui uma turma associada.
          </div>
        )}

        {/* ===================================================== */}
        {/* ALUNO */}
        {/* ===================================================== */}

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
            onChange={(event) => {
              setSelectedStudentId(event.target.value);

              setExistingCorrection(null);
              setError("");
            }}
            disabled={
              !selectedExamId || !selectedClassId || loadingStudents || loading
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
                : !selectedClassId
                  ? "Selecione uma turma primeiro"
                  : loadingStudents
                    ? "Carregando alunos..."
                    : students.length === 0
                      ? "Nenhum aluno encontrado"
                      : "Selecione o aluno"}
            </option>

            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}

                {student.registration ? ` — ${student.registration}` : ""}
              </option>
            ))}
          </select>

          {selectedExamId &&
            selectedClassId &&
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

        {/* ===================================================== */}
        {/* VERIFICANDO CORREÇÃO */}
        {/* ===================================================== */}

        {loadingExistingCorrection && selectedStudentId && (
          <div
            className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-3
                text-sm
                text-slate-600
              "
          >
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Verificando correções anteriores...
          </div>
        )}

        {/* ===================================================== */}
        {/* CORREÇÃO EXISTENTE */}
        {/* ===================================================== */}

        {!loadingExistingCorrection && existingCorrection && (
          <div
            className="
                rounded-2xl
                border
                border-amber-200
                bg-amber-50
                p-4
              "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-amber-100
                    text-amber-700
                  "
              >
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-900">
                  Este aluno já possui uma correção para esta prova.
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  Nota anterior:{" "}
                  <strong>{Number(existingCorrection.score).toFixed(1)}</strong>{" "}
                  ·{" "}
                  {new Date(existingCorrection.createdAt).toLocaleString(
                    "pt-BR",
                  )}
                </p>

                <Link
                  href={`/corrections/${existingCorrection.correctionId}`}
                  className="
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-amber-900
                      underline
                      underline-offset-2
                      hover:text-amber-700
                    "
                >
                  <Eye className="h-4 w-4" />
                  Ver correção anterior
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* UPLOAD */}
        {/* ===================================================== */}

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
              transition
              hover:border-[#1E7F84]
              hover:bg-slate-50
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

        {/* ===================================================== */}
        {/* PREVIEW */}
        {/* ===================================================== */}

        {selectedImage && (
          <div
            className="
              rounded-xl
              bg-slate-50
              p-4
            "
          >
            <p className="text-sm text-slate-600">Arquivo selecionado:</p>

            <p className="font-semibold text-slate-900">{selectedImage.name}</p>
          </div>
        )}

        {/* ===================================================== */}
        {/* ERRO */}
        {/* ===================================================== */}

        {error && (
          <div
            className="
              flex
              items-start
              gap-2
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              text-red-600
            "
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* ===================================================== */}
        {/* BOTÃO */}
        {/* ===================================================== */}

        <button
          type="submit"
          disabled={
            loading ||
            loadingStudents ||
            loadingExistingCorrection ||
            !selectedExamId ||
            !selectedClassId ||
            !selectedStudentId ||
            !selectedImage
          }
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
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
          {loading ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Analisando prova...
            </>
          ) : existingCorrection ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Substituir e corrigir novamente
            </>
          ) : (
            "Analisar e corrigir"
          )}
        </button>
      </form>
    </>
  );
}

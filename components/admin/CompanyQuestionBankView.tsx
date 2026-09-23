"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Building2,
  Layers,
  X,
  Loader2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  Settings2,
  Edit3,
} from "lucide-react";

interface OptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  prompt: string;
  type: string;
  difficulty: string;
  points: number;
  explanation: string | null;
  correctAnswer: string | null;
  options: OptionItem[] | null;
  category: { id: string; name: string } | null;
  skill: { id: string; name: string } | null;
  source: string;
  status: string;
}

interface AssessmentItem {
  id: string;
  name: string;
  durationMinutes: number;
  numQuestions: number;
  passingScorePct?: number | null;
  description?: string | null;
  isPublished?: boolean;
}

interface CompanyQuestionBankViewProps {
  company: {
    id: string;
    name: string;
    slug?: string;
    industry?: string | null;
    questions?: QuestionItem[];
  };
  assessment?: AssessmentItem | null;
  questions?: QuestionItem[];
}

export default function CompanyQuestionBankView({
  company,
  assessment: initialAssessment,
  questions: initialQuestions,
}: CompanyQuestionBankViewProps) {
  const router = useRouter();

  // Local state for assessment details
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentItem | null>(
    initialAssessment || null
  );

  useEffect(() => {
    setCurrentAssessment(initialAssessment || null);
  }, [initialAssessment]);

  // Local state for questions list
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>(
    initialQuestions || company.questions || []
  );

  useEffect(() => {
    setQuestionsList(initialQuestions || company.questions || []);
  }, [initialQuestions, company.questions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("ALL");

  // Selection & Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal 1: Create Manual Question
  const [showNewModal, setShowNewModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [formulaAnswer, setFormulaAnswer] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "1", text: "", isCorrect: true },
    { id: "2", text: "", isCorrect: false },
    { id: "3", text: "", isCorrect: false },
    { id: "4", text: "", isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Modal 2: AI Question Generator
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("INTERMEDIATE");
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiNotes, setAiNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  // Modal 3: Edit Quiz & Time Settings
  const [showEditQuizModal, setShowEditQuizModal] = useState(false);
  const [quizName, setQuizName] = useState(currentAssessment?.name || `${company.name} Assessment`);
  const [quizDuration, setQuizDuration] = useState<number>(currentAssessment?.durationMinutes || 30);
  const [quizPassingScore, setQuizPassingScore] = useState<number>(currentAssessment?.passingScorePct || 70);
  const [savingQuiz, setSavingQuiz] = useState(false);

  useEffect(() => {
    if (currentAssessment) {
      setQuizName(currentAssessment.name);
      setQuizDuration(currentAssessment.durationMinutes);
      setQuizPassingScore(currentAssessment.passingScorePct || 70);
    }
  }, [currentAssessment]);

  const filteredQuestions = questionsList.filter((q: QuestionItem) => {
    const matchesSearch =
      q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = filterDifficulty === "ALL" || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  // Check if all currently filtered questions are selected
  const isAllSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.has(q.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const allFilteredIds = filteredQuestions.map((q) => q.id);
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Save Quiz / Duration Settings Handler
  const handleSaveQuizSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssessment?.id) {
      alert("No active assessment found for this company to edit.");
      return;
    }

    setSavingQuiz(true);
    try {
      const res = await fetch(`/api/assessments/${currentAssessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quizName.trim(),
          durationMinutes: Math.max(Number(quizDuration) || 5, 1),
          passingScorePct: Number(quizPassingScore) || 70,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentAssessment((prev) =>
          prev
            ? {
                ...prev,
                name: quizName.trim(),
                durationMinutes: Math.max(Number(quizDuration) || 5, 1),
                passingScorePct: Number(quizPassingScore) || 70,
              }
            : null
        );
        setShowEditQuizModal(false);
        setStatusNotification({
          type: "success",
          message: `Quiz settings updated! Time is now set to ${quizDuration} minutes.`,
        });
        setTimeout(() => setStatusNotification(null), 3500);
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to update quiz settings");
      }
    } catch (err: any) {
      console.error(err);
      setStatusNotification({
        type: "error",
        message: err.message || "Failed to save quiz settings.",
      });
      setTimeout(() => setStatusNotification(null), 4000);
    } finally {
      setSavingQuiz(false);
    }
  };

  // Single Question Delete
  const handleDeleteQuestion = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this question? It will be permanently removed from Supabase and the assessment curriculum.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        setQuestionsList((prev) => prev.filter((q) => q.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setStatusNotification({
          type: "success",
          message: "Question deleted successfully.",
        });
        setTimeout(() => setStatusNotification(null), 3000);
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to delete question");
      }
    } catch (err: any) {
      console.error(err);
      setStatusNotification({
        type: "error",
        message: err.message || "Could not delete question. Please try again.",
      });
      setTimeout(() => setStatusNotification(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk Delete Selected Questions
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to permanently delete ${idsToDelete.length} selected question${
          idsToDelete.length > 1 ? "s" : ""
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingBulk(true);
    try {
      const res = await fetch("/api/questions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const deletedSet = new Set(idsToDelete);
        setQuestionsList((prev) => prev.filter((q) => !deletedSet.has(q.id)));
        setSelectedIds(new Set());
        setStatusNotification({
          type: "success",
          message: `Successfully deleted ${idsToDelete.length} question${
            idsToDelete.length > 1 ? "s" : ""
          } from the question bank.`,
        });
        setTimeout(() => setStatusNotification(null), 3500);
        router.refresh();
      } else {
        throw new Error(data.error || "Bulk deletion failed");
      }
    } catch (err: any) {
      console.error(err);
      setStatusNotification({
        type: "error",
        message: err.message || "Failed to delete selected questions. Please try again.",
      });
      setTimeout(() => setStatusNotification(null), 4000);
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleCreateManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalOptions: any = null;
    let finalCorrectAnswer: string | null = null;

    if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT" || type === "TRUE_FALSE") {
      finalOptions = options
        .filter((o) => o.text.trim())
        .map((o, idx) => ({
          id: String(idx + 1),
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        }));
      const correct = finalOptions.find((o: any) => o.isCorrect);
      finalCorrectAnswer = correct ? correct.text : null;
    } else {
      finalCorrectAnswer = formulaAnswer.trim();
    }

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          prompt,
          type,
          difficulty,
          points,
          explanation,
          options: finalOptions,
          correctAnswer: finalCorrectAnswer,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setPrompt("");
        setFormulaAnswer("");
        setExplanation("");
        router.refresh();
      } else {
        alert("Failed to create question. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAIQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerationMsg(null);

    const requestedCount = Math.max(Number(aiCount) || 1, 1);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          topic: aiTopic,
          industry: company.industry || "Financial Services",
          difficulty: aiDifficulty,
          count: requestedCount,
          numQuestions: requestedCount,
          notes: aiNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGenerationMsg(`Successfully generated and added ${data.generatedCount || requestedCount} questions to ${company.name}!`);
        setTimeout(() => {
          setShowAIModal(false);
          setGenerationMsg(null);
          router.refresh();
        }, 1500);
      } else {
        setGenerationMsg(data.error || "Failed to generate questions.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationMsg(err.message || "Failed to generate questions with AI.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Toast Notification */}
      {statusNotification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            statusNotification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusNotification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{statusNotification.message}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-current cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/admin/question-bank"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">{company.name}</h1>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  {company.industry || "General Analytics"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Company Question Bank & Timed Diagnostic Curriculum
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Edit Quiz / Time Settings Button */}
            <button
              onClick={() => setShowEditQuizModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 px-4 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Edit Quiz Title & Allocated Time in Minutes"
            >
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Edit Quiz & Duration</span>
            </button>

            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Generate Questions with AI</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              <span>Add Question Manually</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid with Interactive Duration Badge */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
            <p className="mt-1 text-2xl font-black text-slate-900">{questionsList.length}</p>
          </div>

          {/* Duration Card with Direct Edit Button */}
          <div
            onClick={() => setShowEditQuizModal(true)}
            className="rounded-xl bg-slate-50 p-4 border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-600 uppercase tracking-wider">
                Quiz Duration
              </span>
              <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="mt-1 text-2xl font-black text-blue-600">
              {currentAssessment?.durationMinutes || 30} <span className="text-xs font-bold text-slate-500">mins</span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multiple Choice</span>
            <p className="mt-1 text-2xl font-black text-slate-800">
              {questionsList.filter((q: QuestionItem) => q.type === "MULTIPLE_CHOICE").length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assessment Status</span>
            <p className="mt-1 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Live Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Select All & Bulk Delete */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            {/* Select All Checkbox Button */}
            {filteredQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                  isAllSelected
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={isAllSelected ? "Deselect All Questions" : "Select All Questions"}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {isAllSelected
                    ? "Deselect All"
                    : `Select All (${filteredQuestions.length})`}
                </span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions by formula, prompt, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>

        {/* Floating / Sticky Bulk Action Bar when questions are selected */}
        {selectedIds.size > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-extrabold">
                {selectedIds.size} Selected
              </span>
              <span className="text-xs text-slate-500">
                You can delete all selected items at once or uncheck items to refine.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Selection
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deletingBulk}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                {deletingBulk ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting {selectedIds.size}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-800">No questions found in this bank</h3>
          <p className="mt-1 text-xs text-slate-400">
            Click "Generate Questions with AI" or "Add Question Manually" to build this company's assessment curriculum.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q: QuestionItem, idx: number) => {
            const isSelected = selectedIds.has(q.id);
            const isDeleting = deletingId === q.id;

            return (
              <div
                key={q.id}
                onClick={() => handleToggleSelect(q.id)}
                className={`group rounded-2xl border bg-white p-5 shadow-2xs transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-blue-400 bg-blue-50/20 shadow-xs ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkbox + Question Number + Details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Checkbox */}
                    <div
                      className="pt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(q.id);
                      }}
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white hover:border-blue-400"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                      {idx + 1}
                    </span>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 border border-blue-200">
                          {q.type.replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            q.difficulty === "HARD" || q.difficulty === "EXPERT"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : q.difficulty === "INTERMEDIATE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {q.points} pt{q.points > 1 ? "s" : ""}
                        </span>
                        {q.source === "AI_GENERATED" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                            <Sparkles className="h-3 w-3" /> AI Generated
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-900 leading-snug">{q.prompt}</p>

                      {/* Options list if multiple choice */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs ${
                                opt.isCorrect
                                  ? "bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-slate-50 border border-slate-200 text-slate-600"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                                  opt.isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formula answer if practical */}
                      {q.correctAnswer && (
                        <div className="rounded-xl bg-slate-900 px-3.5 py-2 font-mono text-xs text-emerald-400 inline-block">
                          Answer: {q.correctAnswer}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="text-xs text-slate-500 italic pt-1">
                          <span className="font-semibold text-slate-600 not-italic">Rationale:</span>{" "}
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Individual Delete Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteQuestion(q.id, e)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Delete Question"
                      aria-label="Delete Question"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 3: EDIT QUIZ & TIME SETTINGS */}
      {showEditQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Quiz Settings & Time</h3>
                  <p className="text-xs text-slate-500">Configure duration and rules for {company.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditQuizModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuizSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Quiz Title / Evaluation Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="e.g. Core Financial Analytics Diagnostic"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Allocated Duration (Minutes) <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    required
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value))}
                    placeholder="e.g. 20, 30, 45"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Candidates will have exactly this amount of time.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Passing Score Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Target proficiency benchmark.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">Immediate Live Sync:</p>
                <p>
                  Changing the duration to <strong>{quizDuration} minutes</strong> updates the active assessment in Supabase. Any candidates launching their link from this moment forward will receive the updated timer.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditQuizModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {savingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <span>Save Quiz Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD MANUAL QUESTION */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Question</h3>
                <p className="text-xs text-slate-500">Adding to {company.name} Question Bank</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question Prompt / Scenario
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Which formula calculates the weighted average cost of capital given dynamic inputs?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="FORMULA_ENTRY">Formula Entry</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Multiple Choice Options */}
              {type === "MULTIPLE_CHOICE" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Answer Options (Select the correct radio button)
                  </label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                          setOptions(newOpts);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${String.fromCharCode(65 + idx)} Text`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx].text = e.target.value;
                          setOptions(newOpts);
                        }}
                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Formula entry */}
              {(type === "FORMULA_ENTRY" || type === "SHORT_ANSWER") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Correct Formula / Exact Answer
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. =XIRR(B2:B10, A2:A10)"
                    value={formulaAnswer}
                    onChange={(e) => setFormulaAnswer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Explanation & Learning Rationale
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this answer is correct..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Question to Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI QUESTION GENERATOR */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">AI Question Generation</h3>
                  <p className="text-xs text-slate-500">Powered by Gemini for {company.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAIQuestions} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Topic / Skill Domain <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Dynamic Array Formulas, DCF Valuation, SQL Window Functions, Power Query"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Number of Questions to Generate <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={aiCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAiCount(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    placeholder="e.g. 10, 25, 50"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Set any quantity. AI will generate full questions with detailed rationales.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Custom Curriculum / Company Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Provide specific scenarios, formula constraints, real-world case details, or job role focus..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {generationMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold ${
                    generationMsg.includes("Successfully")
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {generationMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating {aiCount} Questions with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate {aiCount} Questions with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

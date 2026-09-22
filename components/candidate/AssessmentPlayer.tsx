"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Maximize,
  Minimize,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Shield,
  HelpCircle,
} from "lucide-react";

export interface QuestionOption {
  id: string;
  key?: string;
  text: string;
  isCorrect?: boolean;
}

export interface PlayerQuestion {
  id: string;
  prompt: string;
  type: string;
  options?: QuestionOption[] | string | null;
  points: number;
  difficulty: string;
  skillName?: string;
  categoryName?: string;
}

export interface AssessmentPlayerProps {
  attemptId: string;
  assessmentName: string;
  companyName: string;
  candidateName: string;
  department?: string | null;
  durationMinutes: number;
  maxViolations?: number | null;
  requireFullscreen?: boolean;
  monitorTabSwitch?: boolean;
  questions: PlayerQuestion[];
  initialStartedAt?: string | null;
}

export default function AssessmentPlayer({
  attemptId,
  assessmentName,
  companyName,
  candidateName,
  department,
  durationMinutes,
  maxViolations = 5,
  requireFullscreen = true,
  monitorTabSwitch = true,
  questions,
  initialStartedAt,
}: AssessmentPlayerProps) {
  const router = useRouter();

  // Active state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [violations, setViolations] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer Calculation
  const totalSeconds = durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (initialStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(initialStartedAt).getTime()) / 1000);
      return Math.max(0, totalSeconds - elapsed);
    }
    return totalSeconds;
  });

  const currentQ = questions[currentIndex];

  // Parse options safely
  const parsedOptions: QuestionOption[] = (() => {
    if (!currentQ?.options) return [];
    if (Array.isArray(currentQ.options)) return currentQ.options;
    try {
      return JSON.parse(currentQ.options);
    } catch {
      return [];
    }
  })();

  // Log Violation Helper
  const logViolation = useCallback(
    async (type: string, detail: string) => {
      try {
        setViolations((prev) => {
          const next = prev + 1;
          if (maxViolations && next >= maxViolations) {
            handleFinalSubmit(true);
          }
          return next;
        });

        await fetch(`/api/attempts/${attemptId}/violations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, detail }),
        });
      } catch (err) {
        console.error("Failed to log violation:", err);
      }
    },
    [attemptId, maxViolations]
  );

  // Fullscreen Management
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
  };

  // Window event hygiene
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (submitting) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitting]);

  // Final Submission Handler
  const handleFinalSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed.");
      }

      router.push(`/results/${attemptId}`);
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err.message || "Failed to submit. Please contact your administrator.");
      setSubmitting(false);
    }
  };

  // Option Selection Handler - Strict radio vs checkbox behavior
  const handleOptionSelect = (optionIdentifier: string) => {
    if (!currentQ) return;
    if (currentQ.type === "MULTIPLE_SELECT") {
      const currentList: string[] = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
      const updated = currentList.includes(optionIdentifier)
        ? currentList.filter((id) => id !== optionIdentifier)
        : [...currentList, optionIdentifier];
      setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    } else {
      // Single Choice / True False (Strict Radio behavior)
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdentifier }));
    }
  };

  const handleTextAnswer = (text: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: text }));
  };

  // Format Time Remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== "" && (Array.isArray(answers[k]) ? answers[k].length > 0 : true)
  ).length;

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0f172a] flex flex-col select-none">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Assessment Details */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1d4ed8] p-1.5 shadow-xs flex items-center justify-center">
              <img
                src="/brand/aidlearn-symbol-transparent.png"
                alt="AidLearn Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#0f172a] leading-tight line-clamp-1">
                {assessmentName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
                {department ? ` · ${department}` : ""}
              </span>
            </div>
          </div>

          {/* Right Status Controls: Timer, Violations, Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                timeLeft < 300
                  ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                  : "bg-blue-50/70 border-blue-200 text-[#1d4ed8]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Violation Counter Badge */}
            {violations > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {violations}/{maxViolations} Flags
                </span>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Warning Notification Toast */}
      {warningMessage && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{warningMessage}</span>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="ml-4 underline text-[11px] opacity-90 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Question Interface */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-between">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          {/* Question Meta Header */}
          <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-extrabold">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {currentQ.skillName && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {currentQ.skillName}
                </span>
              )}
              {currentQ.categoryName && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {currentQ.categoryName}
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-slate-500">
              {currentQ.points || 1} {currentQ.points === 1 ? "point" : "points"}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-relaxed">
              {currentQ.prompt}
            </h2>
          </div>

          {/* Options Display */}
          {currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE" ? (
            <div className="flex flex-col gap-3">
              {parsedOptions.map((opt, idx) => {
                const optIdentifier = String(opt.id || opt.key || String.fromCharCode(65 + idx));
                const letter = String(opt.key || opt.id || String.fromCharCode(65 + idx));
                const isSelected =
                  answers[currentQ.id] !== undefined &&
                  answers[currentQ.id] !== null &&
                  String(answers[currentQ.id]) === optIdentifier;

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(optIdentifier)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-[#1d4ed8] text-[#0f172a] shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[#1d4ed8] text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 leading-normal">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          ) : currentQ.type === "MULTIPLE_SELECT" ? (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider mb-1">
                Select all options that apply:
              </p>
              {parsedOptions.map((opt, idx) => {
                const optIdentifier = String(opt.id || opt.key || String.fromCharCode(65 + idx));
                const selectedList: string[] = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                const isSelected = selectedList.includes(optIdentifier);

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(optIdentifier)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-[#1d4ed8] text-[#0f172a] shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 border transition-colors ${
                        isSelected ? "bg-[#1d4ed8] border-[#1d4ed8] text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="flex-1 leading-normal">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Type your formula or answer below:
              </label>
              <textarea
                rows={3}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleTextAnswer(e.target.value)}
                placeholder="e.g. =XLOOKUP(A2, Data!A:A, Data!B:B, 0)"
                className="w-full font-mono text-xs sm:text-sm rounded-xl border border-slate-300 p-3.5 bg-slate-50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        {/* Bottom Pagination & Navigation Controls */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Question Dots / Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 max-w-md">
            {questions.map((q, idx) => {
              const isAnswered =
                answers[q.id] !== undefined &&
                answers[q.id] !== "" &&
                (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : true);
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? "bg-[#1d4ed8] text-white shadow-xs"
                      : isAnswered
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-700"
                      : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Review & Submit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-6">
              You have answered <span className="font-bold text-[#0f172a]">{answeredCount}</span> out of{" "}
              <span className="font-bold text-[#0f172a]">{questions.length}</span> questions. Once submitted, your
              answers will be locked and evaluated by the AI diagnostic engine.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {submitting ? "Finalizing..." : "Yes, Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

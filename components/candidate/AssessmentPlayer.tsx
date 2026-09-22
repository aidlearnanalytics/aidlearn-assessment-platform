"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
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

  // Proctoring Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && monitorTabSwitch && !submitting) {
        setWarningMessage("Tab switch detected! Leaving this window is recorded as a proctoring violation.");
        logViolation("tab_switch", "Candidate navigated away from assessment window.");
      }
    };

    const handleWindowBlur = () => {
      if (monitorTabSwitch && !submitting) {
        logViolation("window_blur", "Assessment window lost focus.");
      }
    };

    const handleFullscreenChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFullscreen(fsActive);
      if (!fsActive && requireFullscreen && !submitting) {
        setWarningMessage("Fullscreen was exited. Please re-enable fullscreen to continue your assessment.");
        logViolation("fullscreen_exit", "Candidate exited fullscreen mode.");
      }
    };

    const preventKeys = (e: KeyboardEvent) => {
      // Prevent Copy / Paste / Developer Tools
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a", "u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", preventKeys);
    window.addEventListener("contextmenu", preventContext);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", preventKeys);
      window.removeEventListener("contextmenu", preventContext);
    };
  }, [monitorTabSwitch, requireFullscreen, submitting, logViolation]);

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

  // Option Selection Handler - Fixed for Radio vs Checkbox vs Text
  const handleOptionSelect = (optionIdentifier: string) => {
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col select-none">
      {/* Top Proctored Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3">
            <BrandLogo subtitle={companyName} href="" />
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[11px] font-bold text-[#0f172a] truncate max-w-[200px] md:max-w-xs">
                {assessmentName}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Candidate: <span className="text-slate-800 font-semibold">{candidateName}</span>
                {department ? ` • ${department}` : ""}
              </span>
            </div>
          </div>

          {/* Center: Timer & Violations */}
          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-colors ${
                timeLeft < 300
                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                  : "bg-blue-50 border-blue-200 text-[#1d4ed8]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Violation Counter Badge */}
            {violations > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{violations} Warnings</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Warning Alert Banner */}
      {warningMessage && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-white hover:opacity-80 text-sm font-bold ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col justify-between">
        {/* Question Header & Meta */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1d4ed8] text-xs font-bold">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {currentQ.skillName && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  {currentQ.skillName}
                </span>
              )}
              {currentQ.difficulty && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] uppercase font-semibold">
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-slate-500">
              {currentQ.points} {currentQ.points === 1 ? "Point" : "Points"}
            </span>
          </div>

          {/* Question Prompt Text */}
          <h2 className="text-base md:text-lg font-bold text-[#0f172a] leading-relaxed mb-6 whitespace-pre-wrap">
            {currentQ.prompt}
          </h2>

          {/* Options / Answer Input Section */}
          {currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE" ? (
            <div className="flex flex-col gap-3">
              {parsedOptions.map((opt, idx) => {
                const optIdentifier = opt.key || opt.id || String.fromCharCode(65 + idx);
                const isSelected = answers[currentQ.id] === optIdentifier;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(optIdentifier)}
                    className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
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
                const optIdentifier = opt.key || opt.id || String.fromCharCode(65 + idx);
                const selectedList: string[] = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                const isSelected = selectedList.includes(optIdentifier);

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(optIdentifier)}
                    className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
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
                className="w-full font-mono text-xs md:text-sm rounded-xl border border-slate-300 p-3.5 bg-slate-50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
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

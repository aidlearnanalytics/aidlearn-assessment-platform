"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldAlert,
  ShieldCheck,
  Lock,
  EyeOff,
  HelpCircle,
  Building2,
  User,
  ArrowRight,
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
  questions,
  initialStartedAt,
}: AssessmentPlayerProps) {
  const router = useRouter();

  // Pre-quiz instructions acknowledgment gate
  const [hasStarted, setHasStarted] = useState<boolean>(() => Boolean(initialStartedAt));

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Tab switch strike state (2-strike policy)
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [showStrike1Modal, setShowStrike1Modal] = useState(false);
  const [showStrike2Modal, setShowStrike2Modal] = useState(false);

  // Ref to track mutable state in event listeners
  const strikeCountRef = useRef(0);
  const submittingRef = useRef(false);
  const hasStartedRef = useRef(hasStarted);
  const answersRef = useRef(answers);

  useEffect(() => {
    strikeCountRef.current = strikeCount;
  }, [strikeCount]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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
        await fetch(`/api/attempts/${attemptId}/violations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, detail }),
        });
      } catch (err) {
        console.error("Failed to record violation:", err);
      }
    },
    [attemptId]
  );

  // Final Submit Handler (supports normal submit, timer expiry, or 2nd strike auto-submit)
  const handleFinalSubmit = useCallback(
    async (isAutoSubmit = false, reason = "NORMAL") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setShowSubmitModal(false);

      const timeTakenSecs = totalSeconds - timeLeft;

      try {
        const res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: answersRef.current,
            timeTakenSecs,
            isAutoSubmit,
            reason,
          }),
        });

        if (res.ok) {
          router.replace(`/results/${attemptId}`);
          router.refresh();
        } else {
          router.replace(`/results/${attemptId}`);
        }
      } catch (err) {
        console.error("Submit Error:", err);
        router.replace(`/results/${attemptId}`);
      }
    },
    [attemptId, router, timeLeft, totalSeconds]
  );

  // 1. Strict Copy / Paste / Context-Menu / Keydown Lockdown
  useEffect(() => {
    if (!hasStarted) return;

    // Prevent copy, cut, paste, context menu, drag, selection
    const handleBlockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+U
      if (isCtrlOrCmd && ["c", "v", "x", "a", "p", "s", "u"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block F12 and inspect element combinations (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.key === "F12" ||
        (isCtrlOrCmd && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("copy", handleBlockEvent, true);
    document.addEventListener("cut", handleBlockEvent, true);
    document.addEventListener("paste", handleBlockEvent, true);
    document.addEventListener("contextmenu", handleBlockEvent, true);
    document.addEventListener("selectstart", handleBlockEvent, true);
    document.addEventListener("dragstart", handleBlockEvent, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("copy", handleBlockEvent, true);
      document.removeEventListener("cut", handleBlockEvent, true);
      document.removeEventListener("paste", handleBlockEvent, true);
      document.removeEventListener("contextmenu", handleBlockEvent, true);
      document.removeEventListener("selectstart", handleBlockEvent, true);
      document.removeEventListener("dragstart", handleBlockEvent, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [hasStarted]);

  // 2. Strict Tab-Switch & Window Blur Detection (2-Strike Automatic Submission)
  useEffect(() => {
    if (!hasStarted || submitting) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleTabOrWindowExit = () => {
      if (!hasStartedRef.current || submittingRef.current) return;

      // Check if document is hidden or window lost focus
      const isHidden = document.hidden || document.visibilityState === "hidden";

      if (isHidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (submittingRef.current) return;

          const currentStrikes = strikeCountRef.current;

          if (currentStrikes === 0) {
            // First violation (Strike 1)
            setStrikeCount(1);
            setShowStrike1Modal(true);
            logViolation(
              "TAB_SWITCH",
              "First Warning: Participant switched browser tabs or left active window (Strike 1/2)"
            );
          } else if (currentStrikes >= 1) {
            // Second violation (Strike 2) -> Automatic Immediate Submission
            setStrikeCount(2);
            setShowStrike1Modal(false);
            setShowStrike2Modal(true);
            logViolation(
              "TAB_SWITCH",
              "Automatic Submission: Participant left browser window for the 2nd time (Strike 2/2)"
            );
            handleFinalSubmit(true, "STRIKE_2_TAB_EXIT");
          }
        }, 150);
      }
    };

    const handleWindowBlur = () => {
      handleTabOrWindowExit();
    };

    document.addEventListener("visibilitychange", handleTabOrWindowExit);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener("visibilitychange", handleTabOrWindowExit);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [hasStarted, submitting, logViolation, handleFinalSubmit]);

  // Countdown Timer
  useEffect(() => {
    if (!hasStarted || submitting) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true, "TIME_EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, submitting, handleFinalSubmit]);

  // Format Time Remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Option Selection Handlers
  const handleOptionSelect = (optionId: string) => {
    if (!currentQ) return;

    if (currentQ.type === "MULTIPLE_SELECT") {
      const currentList: string[] = Array.isArray(answers[currentQ.id]) ? [...answers[currentQ.id]] : [];
      const existsIndex = currentList.indexOf(optionId);
      if (existsIndex > -1) {
        currentList.splice(existsIndex, 1);
      } else {
        currentList.push(optionId);
      }
      setAnswers((prev) => ({ ...prev, [currentQ.id]: currentList }));
    } else {
      // Single Choice (MULTIPLE_CHOICE, TRUE_FALSE)
      setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
    }
  };

  const handleTextAnswer = (val: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== "" && (Array.isArray(answers[k]) ? answers[k].length > 0 : true)
  ).length;

  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 1: PRE-QUIZ INSTRUCTIONS & INTEGRITY RULES GATE
  // ──────────────────────────────────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <div
        className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between select-none"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center font-black text-sm">
              A
            </span>
            <span className="font-extrabold text-[#0f172a] text-sm tracking-tight">
              AidLearn Skills Diagnostic
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Building2 className="w-4 h-4 text-[#1d4ed8]" />
            <span>{companyName}</span>
          </div>
        </header>

        {/* Main Instruction Card */}
        <main className="max-w-2xl mx-auto w-full px-4 py-8 sm:py-12 my-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
            {/* Candidate & Assessment Intro */}
            <div className="space-y-2 border-b border-slate-100 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d4ed8] text-xs font-bold">
                <User className="w-3.5 h-3.5" />
                <span>Candidate: {candidateName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                {assessmentName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {department ? `Department: ${department} • ` : ""}{questions.length} Diagnostic Questions • {durationMinutes} Minutes
              </p>
            </div>

            {/* Mandatory Assessment Rules */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#1d4ed8]" />
                <span>Mandatory Assessment Rules & Guidelines</span>
              </h2>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Rule 1: No Copy Paste */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0f172a]">Zero Copy & Paste Allowed</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      Text highlighting, copying, pasting (Ctrl+C, Ctrl+V, right click menu), and text selection are strictly disabled across all desktop and mobile devices.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Tab-Switch Warning & 2-Strike Auto-Submit */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900">Strict Window Focus & 2-Strike Rule</h3>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Participants are <strong>not permitted to leave the browser or switch tabs</strong> during the assessment session:
                    </p>
                    <ul className="text-[11px] text-amber-900 font-medium list-disc list-inside mt-1.5 space-y-1">
                      <li><strong>1st Tab Switch / Exit:</strong> An immediate warning alert modal will appear on your screen.</li>
                      <li><strong>2nd Tab Switch / Exit:</strong> The assessment will <strong>automatically submit immediately without question</strong>.</li>
                    </ul>
                  </div>
                </div>

                {/* Rule 3: Continuous Timer */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center shrink-0 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0f172a]">Continuous Countdown Timer</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      The {durationMinutes}-minute countdown starts immediately when you click Begin. Ensure all external notifications are silenced.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Assessment CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setHasStarted(true)}
                className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#1d4ed8] hover:bg-[#1e40af] active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>I Understand and Agree — Begin Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-3">
                By clicking begin, you agree to maintain active screen focus throughout the diagnostic.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
          AidLearn Analytics Platform • Confidential Candidate Diagnostic Session
        </footer>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 2: ACTIVE SECURED QUIZ SESSION
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onCopy={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onCut={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onPaste={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* ── Fixed Secure Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Left: Branding & Candidate */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center font-black text-sm shrink-0">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0f172a] text-xs sm:text-sm tracking-tight truncate max-w-[150px] sm:max-w-xs">
                {assessmentName}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">
                • {companyName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
            </p>
          </div>
        </div>

        {/* Right: Countdown Timer & Submit Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold font-mono transition-colors ${
              timeLeft < 300
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                : "bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish & Submit</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className="bg-[#1d4ed8] h-1 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Main Quiz Card ────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 flex-1 flex flex-col justify-between">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Question Header & Metadata */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1d4ed8] font-bold text-xs border border-blue-100">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {currentQ?.categoryName && (
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  • {currentQ.categoryName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>{currentQ?.points || 1} {currentQ?.points === 1 ? "Point" : "Points"}</span>
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-snug">
              {currentQ?.prompt}
            </h2>
          </div>

          {/* Question Response Inputs */}
          {currentQ?.type === "MULTIPLE_CHOICE" || currentQ?.type === "TRUE_FALSE" ? (
            <div className="flex flex-col gap-3">
              {parsedOptions.map((opt, idx) => {
                const optIdentifier = String(opt.id || opt.key || String.fromCharCode(65 + idx));
                const isSelected =
                  answers[currentQ.id] !== undefined &&
                  answers[currentQ.id] !== null &&
                  String(answers[currentQ.id]) === optIdentifier;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    onClick={() => handleOptionSelect(optIdentifier)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-[#1d4ed8] text-[#0f172a] shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
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
          ) : currentQ?.type === "MULTIPLE_SELECT" ? (
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
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
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
                className="w-full font-mono text-xs sm:text-sm rounded-2xl border border-slate-300 p-3.5 bg-slate-50 text-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
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

          {/* Question Navigator */}
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

      {/* ── MODAL 1: STRIKE 1 WARNING ALERT MODAL ───────────────────────── */}
      {showStrike1Modal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-amber-300 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] uppercase tracking-wider">
                Warning 1 of 2
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#0f172a]">
                Browser Tab / Window Exit Detected
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                You have switched tabs or left the quiz assessment window. Participants of this quiz are strictly not permitted to leave their browser or switch between browser tabs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 leading-snug">
              🚨 Final Notice: If you leave this browser screen one more time, your assessment will automatically submit immediately without question.
            </div>

            <button
              type="button"
              onClick={() => setShowStrike1Modal(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              I Understand — Return to Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: STRIKE 2 TERMINATION & AUTO-SUBMIT MODAL ──────────── */}
      {showStrike2Modal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-300 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-[11px] uppercase tracking-wider">
                Strike 2 / Automatic Finalization
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#0f172a]">
                Assessment Automatically Submitted
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                You left the browser screen for the second time. As specified in the assessment rules, your answers have been automatically locked and submitted.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 py-2">
              <div className="w-4 h-4 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
              <span>Finalizing submission and generating diagnostic report...</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MANUAL SUBMIT CONFIRMATION ────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#0f172a]">Submit Assessment?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have answered <span className="font-bold text-[#0f172a]">{answeredCount}</span> out of{" "}
                <span className="font-bold text-[#0f172a]">{questions.length}</span> questions. Once submitted, your
                answers will be finalized and evaluated by the AI diagnostic engine.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false, "VOLUNTARY_SUBMIT")}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
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

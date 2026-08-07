"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Play, Pause, RotateCcw, User } from "lucide-react";

interface Stage {
  name: string;
  progress: number;
  duration: number;
}

const INITIAL_STAGES: Stage[] = [
  { name: "Connecting to Whop", progress: 0, duration: 1500 },
  { name: "Fetching members", progress: 0, duration: 2000 },
  { name: "Fetching courses", progress: 0, duration: 1200 },
  { name: "Evaluating candidates", progress: 0, duration: 3000 },
  { name: "Complete", progress: 0, duration: 800 },
];

const CANDIDATES = [
  { name: "Sarah Chen", match: 94, course: "Advanced React Patterns" },
  { name: "Marcus Webb", match: 87, course: "System Design Mastery" },
  { name: "Aisha Patel", match: 82, course: "Data Engineering Fundamentals" },
  { name: "Jordan Lee", match: 76, course: "Cloud Architecture" },
];

export function OperationsPreview() {
  const [stages, setStages] = useState<Stage[]>(
    INITIAL_STAGES.map((s) => ({ ...s }))
  );
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [discoveredCandidates, setDiscoveredCandidates] = useState(0);
  const [currentStage, setCurrentStage] = useState(-1);

  const reset = useCallback(() => {
    setStages(INITIAL_STAGES.map((s) => ({ ...s, progress: 0 })));
    setRunning(false);
    setElapsed(0);
    setDiscoveredCandidates(0);
    setCurrentStage(-1);
  }, []);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 50);
      setStages((prev) => {
        const next = [...prev];
        const stageIdx = next.findIndex((s) => s.progress < 100);
        if (stageIdx === -1) {
          setRunning(false);
          return prev;
        }
        setCurrentStage(stageIdx);

        const stage = next[stageIdx];
        const increment = 100 / (stage.duration / 50);
        const newProgress = Math.min(100, stage.progress + increment);
        next[stageIdx] = { ...stage, progress: newProgress };

        if (stageIdx === 3) {
          const newCount = Math.floor(
            (newProgress / 100) * CANDIDATES.length
          );
          setDiscoveredCandidates(newCount);
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [running]);

  const overallProgress =
    stages.reduce((sum, s) => sum + s.progress, 0) / stages.length;

  return (
    <div className="space-y-4">
      {/* Progress simulation card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5 backdrop-blur-sm"
      >
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                running
                  ? "bg-[var(--recovery-green)] animate-pulse"
                  : overallProgress === 100
                    ? "bg-[var(--recovery-green)]"
                    : "bg-[var(--ink-muted)]"
              }`}
            />
            <span className="text-[13px] font-medium text-[var(--ink-primary)]">
              First Whop Sync —{" "}
              {overallProgress === 100
                ? "Complete"
                : running
                  ? "In Progress"
                  : "Ready"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning(!running)}
              className="flex items-center gap-1.5 rounded-md bg-[var(--ink-primary)] px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 min-h-[44px] min-w-[44px] justify-center"
            >
              {running ? (
                <>
                  <Pause className="size-3" strokeWidth={2} /> Pause
                </>
              ) : (
                <>
                  <Play className="size-3" strokeWidth={2} />{" "}
                  {overallProgress > 0 ? "Resume" : "Start"}
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-1.5 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)] min-h-[44px] min-w-[44px]"
            >
              <RotateCcw className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[var(--ink-muted)]">
              Overall Progress
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-secondary)] tabular-nums">
              {Math.round(overallProgress)}% · {(elapsed / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--canvas-elevated)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#147D68] to-[#1A9E85]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stage dots + progress */}
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const isComplete = stage.progress === 100;
            const isActive = i === currentStage && running;

            return (
              <div key={i} className="flex items-center gap-3">
                {/* Stage dot */}
                <div className="relative">
                  <motion.div
                    className={`flex size-7 items-center justify-center rounded-full text-[11px] font-medium border ${
                      isComplete
                        ? "bg-[var(--recovery-green)] text-white border-[var(--recovery-green)]"
                        : isActive
                          ? "bg-[var(--warning)] text-white border-[var(--warning)]"
                          : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] border-[var(--hairline)]"
                    }`}
                    animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={
                      isActive
                        ? {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  >
                    {isComplete ? (
                      <svg
                        className="size-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : isActive ? (
                      <span className="font-mono text-[9px] tabular-nums">
                        {Math.round(stage.progress)}
                      </span>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </motion.div>
                  {/* Active pulse ring */}
                  {isActive && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-[var(--warning)]"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </div>

                {/* Stage name and mini progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[13px] ${
                        isComplete
                          ? "text-[var(--ink-primary)]"
                          : isActive
                            ? "text-[var(--ink-secondary)]"
                            : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {stage.progress > 0 && stage.progress < 100 && (
                      <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                        {Math.round(stage.progress)}%
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="mt-1 h-1 rounded-full bg-[var(--canvas-elevated)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--warning)]"
                        animate={{ width: `${stage.progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safe to leave banner */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#E8F5EF] border border-[#C7E6D5] px-3 py-2"
        >
          <ShieldCheck className="size-3.5 text-[#147D68]" strokeWidth={2} />
          <span className="text-[12px] text-[#147D68]">
            Safe to leave — progress is persisted
          </span>
        </motion.div>
      </motion.div>

      {/* Candidate discovery cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {CANDIDATES.filter((_, i) => i < discoveredCandidates).map(
            (c, i) => (
              <CandidateCard key={c.name} candidate={c} index={i} />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  index,
}: {
  candidate: (typeof CANDIDATES)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)]/80 p-4 backdrop-blur-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-[var(--canvas-elevated)] border border-[var(--hairline)]">
          <User className="size-4 text-[var(--ink-secondary)]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--ink-primary)] truncate">
            {candidate.name}
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] truncate">
            {candidate.course}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`font-mono text-[16px] font-semibold tabular-nums ${
              candidate.match > 90
                ? "text-[var(--recovery-green)]"
                : candidate.match > 80
                  ? "text-[var(--warning)]"
                  : "text-[var(--ink-secondary)]"
            }`}
          >
            {candidate.match}%
          </span>
          <span className="text-[9px] text-[var(--ink-muted)]">match</span>
        </div>
      </div>
    </motion.div>
  );
}

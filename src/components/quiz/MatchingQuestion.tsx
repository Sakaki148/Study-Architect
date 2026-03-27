'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingQuestionProps {
  questionId: string;
  pairs: MatchingPair[];
  answer: string | undefined;
  onChange: (value: string) => void;
  compact?: boolean;
  variant?: 'default' | 'editorial';
}

interface Point {
  x: number;
  y: number;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pathBetween(start: Point, end: Point) {
  const dx = Math.max(80, Math.abs(end.x - start.x) * 0.45);
  return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
}

export default function MatchingQuestion({
  questionId,
  pairs,
  answer,
  onChange,
  compact = false,
  variant = 'default',
}: MatchingQuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const rightOptions = useMemo(() => shuffle(pairs.map((pair) => pair.right)), [questionId, pairs]);
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [draftLine, setDraftLine] = useState<{ left: string; start: Point; current: Point } | null>(null);
  const [positions, setPositions] = useState<{ left: Record<string, Point>; right: Record<string, Point> }>({
    left: {},
    right: {},
  });

  useEffect(() => {
    try {
      const parsed = answer ? JSON.parse(answer) as Record<string, string> : {};
      setConnections(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setConnections({});
    }
  }, [answer]);

  useEffect(() => {
    const updatePositions = () => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const nextLeft: Record<string, Point> = {};
      const nextRight: Record<string, Point> = {};

      pairs.forEach((pair) => {
        const leftRect = leftRefs.current[pair.left]?.getBoundingClientRect();
        const rightRect = rightRefs.current[pair.right]?.getBoundingClientRect();

        if (leftRect) {
          nextLeft[pair.left] = {
            x: leftRect.right - bounds.left,
            y: leftRect.top + leftRect.height / 2 - bounds.top,
          };
        }

        if (rightRect) {
          nextRight[pair.right] = {
            x: rightRect.left - bounds.left,
            y: rightRect.top + rightRect.height / 2 - bounds.top,
          };
        }
      });

      setPositions({ left: nextLeft, right: nextRight });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [pairs, rightOptions, connections]);

  useEffect(() => {
    if (!draftLine) return;

    const move = (event: PointerEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      setDraftLine((current) => current ? {
        ...current,
        current: {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
      } : null);
    };

    const stop = () => setDraftLine(null);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [draftLine]);

  const connect = (left: string, right: string) => {
    const next = Object.fromEntries(
      Object.entries(connections).filter(([existingLeft, existingRight]) => existingLeft !== left && existingRight !== right)
    );
    next[left] = right;
    setConnections(next);
    onChange(JSON.stringify(next));
    setDraftLine(null);
  };

  const clearConnection = (left: string) => {
    const next = { ...connections };
    delete next[left];
    setConnections(next);
    onChange(JSON.stringify(next));
  };

  const isEditorial = variant === 'editorial';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${
        isEditorial
          ? 'rounded-lg border border-[#2A2927] bg-[#181816]'
          : 'rounded-[24px] border border-white/10 bg-white/[0.03]'
      } ${
        compact ? 'p-4' : isEditorial ? 'p-0' : 'p-6'
      }`}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {Object.entries(connections).map(([left, right]) => {
          const start = positions.left[left];
          const end = positions.right[right];
          if (!start || !end) return null;

          return (
            <path
              key={`${left}-${right}`}
              d={pathBetween(start, end)}
              fill="none"
              stroke={isEditorial ? '#4A4845' : 'rgba(59, 130, 246, 0.9)'}
              strokeWidth={isEditorial ? 3 : compact ? 3 : 4}
              strokeLinecap="round"
              className="pointer-events-auto cursor-pointer transition-colors hover:stroke-red-500/50"
              onClick={() => clearConnection(left)}
            />
          );
        })}

        {draftLine && (
          <path
            d={pathBetween(draftLine.start, draftLine.current)}
            fill="none"
            stroke={isEditorial ? '#5A5855' : 'rgba(96, 165, 250, 0.55)'}
            strokeWidth={isEditorial ? 3 : compact ? 3 : 4}
            strokeDasharray={isEditorial ? '14 10' : '10 8'}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div
        className={`relative z-10 grid ${
          isEditorial
            ? 'min-h-[360px] items-center gap-24 px-12 py-8 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]'
            : 'gap-4 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)]'
        }`}
      >
        <div className={isEditorial ? 'space-y-4 self-center' : 'space-y-3'}>
          {pairs.map((pair, index) => (
            <div key={pair.left} className="relative">
              <div
                className={`${
                  isEditorial
                    ? 'grid grid-cols-[64px_minmax(0,1fr)_28px] items-center rounded-lg border border-[#2A2927] bg-[#141413] px-6 py-4 text-[1rem] font-medium text-[#F0EDE6]'
                    : 'rounded-2xl border border-white/8 bg-[#17171c] px-4 py-4 text-sm text-white/88 shadow-[0_10px_30px_rgba(0,0,0,0.18)]'
                }`}
              >
                {isEditorial ? (
                  <>
                    <div
                      className="text-[0.92rem] uppercase tracking-[0.18em] text-[#4A4845]"
                      style={{ fontFamily: 'var(--font-dm-mono)' }}
                    >
                      A{index + 1}
                    </div>
                    <div className="pr-5 leading-[1.3]">{pair.left}</div>
                  </>
                ) : (
                  <>
                    <div
                      className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/35"
                    >
                      A{index + 1}
                    </div>
                    <div className="pr-5">{pair.left}</div>
                  </>
                )}
              </div>
              <button
                ref={(node) => { leftRefs.current[pair.left] = node; }}
                type="button"
                aria-label={`Start connection from ${pair.left}`}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full ${
                  isEditorial
                    ? 'right-6 h-[20px] w-[20px] border border-[#6B6860] bg-[#6B6860]'
                    : 'right-[-10px] h-5 w-5 border-2 border-sky-300 bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.16)]'
                }`}
                onPointerDown={(event) => {
                  const bounds = containerRef.current?.getBoundingClientRect();
                  const start = positions.left[pair.left];
                  if (!bounds || !start) return;
                  event.preventDefault();
                  setDraftLine({
                    left: pair.left,
                    start,
                    current: {
                      x: event.clientX - bounds.left,
                      y: event.clientY - bounds.top,
                    },
                  });
                }}
                onDoubleClick={() => clearConnection(pair.left)}
              />
            </div>
          ))}
        </div>

        <div
          className={`hidden items-center justify-center text-center md:flex ${
            isEditorial
              ? 'font-mono text-[0.85rem] font-medium uppercase tracking-[0.28em] text-[#303030]'
              : 'text-[11px] font-semibold uppercase tracking-[0.28em] text-white/25'
          }`}
          style={isEditorial ? { fontFamily: 'var(--font-dm-mono)' } : undefined}
        >
          {isEditorial ? '' : 'Drag the line'}
        </div>

        <div className={isEditorial ? 'space-y-4 self-center' : 'space-y-3'}>
          {rightOptions.map((right, index) => {
            const pairedLeft = Object.entries(connections).find(([, value]) => value === right)?.[0];
            return (
              <div key={right} className="relative">
                <button
                  ref={(node) => { rightRefs.current[right] = node; }}
                  type="button"
                  className={`absolute top-1/2 -translate-y-1/2 rounded-full ${
                    isEditorial
                      ? 'left-6 h-[20px] w-[20px] border border-[#6B6860] bg-[#6B6860]'
                      : `left-[-10px] h-5 w-5 border-2 ${
                          draftLine ? 'border-emerald-300 bg-emerald-500' : 'border-white/25 bg-[#111114]'
                        }`
                  }`}
                  onPointerUp={() => {
                    if (!draftLine) return;
                    connect(draftLine.left, right);
                  }}
                  aria-label={`Connect to ${right}`}
                />
                <div
                  className={`${
                    isEditorial
                      ? 'rounded-lg border border-[#2A2927] bg-[#141413] px-6 py-4 text-[1rem] font-normal text-[#A8A49C]'
                      : 'rounded-2xl border border-white/8 bg-[#121218] px-4 py-4 text-sm text-white/88 shadow-[0_10px_30px_rgba(0,0,0,0.18)]'
                  }`}
                >
                  <div
                    className={`${
                      isEditorial
                        ? 'mb-1 pl-9 font-mono text-[0.92rem] font-medium uppercase tracking-[0.18em] text-[#4A4845]'
                        : 'mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/35'
                    }`}
                    style={isEditorial ? { fontFamily: 'var(--font-dm-mono)' } : undefined}
                  >
                    B{index + 1}
                  </div>
                  <div className={isEditorial ? 'pl-14 pr-4 text-[1rem] leading-[1.42]' : 'pl-5'}>{right}</div>
                  {pairedLeft && (
                    <div
                      className={`${
                        isEditorial
                          ? 'mt-3 pl-14 font-mono text-[0.8rem] font-normal tracking-[0.02em] text-[#5A5855]'
                          : 'mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80'
                      }`}
                      style={isEditorial ? { fontFamily: 'var(--font-dm-mono)' } : undefined}
                    >
                      {isEditorial ? `– connected to ${pairedLeft.toLowerCase()}` : `Connected to ${pairedLeft}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

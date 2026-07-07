import { useState, useCallback, useRef } from 'react';
import type { DeviceData, Position, Speed, TableDisplay, PduSpec } from './types';
import { DEVICES, INITIAL_POSITIONS } from './topology';
import { STEPS, LESSONS, LESSON_START_STEPS } from './steps';
import { Canvas } from './components/Canvas';
import { BottomBar } from './components/BottomBar';

const SPEED_MS: Record<Speed, number> = {
  slow:   1800,
  normal: 1100,
  fast:    550,
};

interface ActivePdu {
  key: string;
  spec: PduSpec;
  segmentMs: number;
  onDone: () => void;
}

function freshDevices(): DeviceData[] {
  return JSON.parse(JSON.stringify(DEVICES)) as DeviceData[];
}

export function App() {
  const [devices,        setDevices]        = useState<DeviceData[]>(freshDevices);
  const [positions,      setPositions]      = useState<Record<string, Position>>(INITIAL_POSITIONS);
  const [visibleDevices, setVisibleDevices] = useState<string[]>(['pc1', 'pc2', 'pc3', 'sw1']);
  const [showIp,         setShowIp]         = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [speed,          setSpeed]          = useState<Speed>('normal');
  const [activePdu,      setActivePdu]      = useState<ActivePdu | null>(null);
  const [activeTable,    setActiveTable]    = useState<TableDisplay | null>(null);

  // Refs so async callbacks always see the latest values without stale closures
  const cancelRef        = useRef(false);
  const speedRef         = useRef<Speed>('normal');
  const stepIdxRef       = useRef(-1);
  const pduResolveRef    = useRef<(() => void) | null>(null);
  const pduKeyCounterRef = useRef(0);

  // ── helpers ────────────────────────────────────────────────────────────

  const setStep = useCallback((idx: number) => {
    stepIdxRef.current = idx;
    setCurrentStepIdx(idx);
  }, []);

  const handleSpeedChange = useCallback((s: Speed) => {
    speedRef.current = s;
    setSpeed(s);
  }, []);

  /**
   * Aborts any in-flight PDU animation: resolves its waiting Promise so the
   * step engine can exit cleanly, then removes the PDU from the canvas.
   */
  const cancelActivePdu = useCallback(() => {
    if (pduResolveRef.current) {
      pduResolveRef.current();
      pduResolveRef.current = null;
    }
    setActivePdu(null);
  }, []);

  const cancelAll = useCallback(() => {
    cancelRef.current = true;
    cancelActivePdu();
    setIsPlaying(false);
  }, [cancelActivePdu]);

  /** Plays a single PDU animation and waits for it to finish. */
  const runPdu = useCallback((spec: PduSpec): Promise<void> => {
    return new Promise<void>(resolve => {
      pduKeyCounterRef.current += 1;
      const key = `pdu-${pduKeyCounterRef.current}`;

      pduResolveRef.current = () => {
        pduResolveRef.current = null;
        resolve();
      };

      setActivePdu({
        key,
        spec,
        segmentMs: SPEED_MS[speedRef.current],
        onDone: () => {
          pduResolveRef.current = null;
          setActivePdu(null);
          resolve();
        },
      });
    });
  }, []);

  /** Applies one step's state changes and runs its PDU animations. */
  const executeStep = useCallback(async (idx: number): Promise<void> => {
    if (idx < 0 || idx >= STEPS.length) return;
    const step = STEPS[idx];

    setStep(idx);
    if (step.stateUpdate) setDevices(prev => step.stateUpdate!(prev));
    if (step.visibleDevices !== undefined) setVisibleDevices(step.visibleDevices);
    if (step.showIp !== undefined) setShowIp(step.showIp);
    setActiveTable(step.tableDisplay ?? null);

    for (const pduSpec of step.pdus ?? []) {
      if (cancelRef.current) return;
      await runPdu(pduSpec);
    }
  }, [setStep, runPdu]);

  // ── public handlers ────────────────────────────────────────────────────

  const handlePlay = useCallback(async () => {
    if (isPlaying) return;
    cancelRef.current = false;
    setIsPlaying(true);

    let idx = stepIdxRef.current + 1;

    // Wrap around to beginning when already at the end
    if (idx >= STEPS.length) {
      idx = 0;
      setDevices(freshDevices());
      setVisibleDevices(['pc1', 'pc2', 'pc3', 'sw1']);
      setShowIp(false);
      setActiveTable(null);
      setStep(-1);
    }

    while (idx < STEPS.length && !cancelRef.current) {
      await executeStep(idx);
      if (cancelRef.current) break;
      await new Promise<void>(r => setTimeout(r, 500)); // brief pause between steps
      idx++;
    }

    if (!cancelRef.current) setIsPlaying(false);
  }, [isPlaying, executeStep, setStep]);

  const handlePause = useCallback(() => {
    cancelAll();
  }, [cancelAll]);

  const handleStepForward = useCallback(async () => {
    if (isPlaying) return;
    const next = stepIdxRef.current + 1;
    if (next >= STEPS.length) return;
    cancelRef.current = false;
    await executeStep(next);
  }, [isPlaying, executeStep]);

  /** Re-plays all step state changes up to targetIdx without animations. */
  const replayStateTo = useCallback((targetIdx: number) => {
    let devs     = freshDevices();
    let visibles = ['pc1', 'pc2', 'pc3', 'sw1'];
    let showIpV  = false;
    let tableV: TableDisplay | null = null;

    for (let i = 0; i <= targetIdx && i < STEPS.length; i++) {
      const s = STEPS[i];
      if (s.stateUpdate)       devs     = s.stateUpdate(devs);
      if (s.visibleDevices)    visibles = s.visibleDevices;
      if (s.showIp !== undefined) showIpV = s.showIp;
      tableV = s.tableDisplay ?? null;
    }

    setDevices(devs);
    setVisibleDevices(visibles);
    setShowIp(showIpV);
    setActiveTable(tableV);
    setActivePdu(null);
    setStep(targetIdx);
  }, [setStep]);

  const handleStepBack = useCallback(() => {
    if (isPlaying) return;
    cancelAll();
    const target = Math.max(0, stepIdxRef.current - 1);
    replayStateTo(target);
  }, [isPlaying, cancelAll, replayStateTo]);

  const handleReset = useCallback(() => {
    cancelAll();
    setDevices(freshDevices());
    setVisibleDevices(['pc1', 'pc2', 'pc3', 'sw1']);
    setShowIp(false);
    setActiveTable(null);
    setActivePdu(null);
    setStep(-1);
  }, [cancelAll, setStep]);

  const handleJumpLesson = useCallback((lessonIdx: number) => {
    if (lessonIdx < 0 || lessonIdx >= LESSONS.length) return;
    cancelAll();
    const targetStart = LESSON_START_STEPS[lessonIdx] ?? 0;
    // Jump to just before the first step of that lesson so the user steps in
    const before = targetStart - 1;
    if (before < 0) {
      handleReset();
    } else {
      replayStateTo(before);
    }
  }, [cancelAll, handleReset, replayStateTo]);

  const handlePositionChange = useCallback((id: string, pos: Position) => {
    setPositions(prev => ({ ...prev, [id]: pos }));
  }, []);

  // ── derived ────────────────────────────────────────────────────────────

  const currentStep      = currentStepIdx >= 0 ? STEPS[currentStepIdx] : null;
  const currentLessonIdx = currentStep?.lessonIndex ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="canvas-wrap">
        <Canvas
          devices={devices}
          positions={positions}
          visibleDevices={visibleDevices}
          showIp={showIp}
          activePdu={activePdu}
          activeTable={activeTable}
          onPositionChange={handlePositionChange}
        />
      </div>

      <BottomBar
        lessonTitle={LESSONS[currentLessonIdx]}
        stepTitle={currentStep?.title ?? ''}
        explanation={currentStep?.explanation ?? ''}
        note={currentStep?.note}
        isPlaying={isPlaying}
        speed={speed}
        currentStepIdx={currentStepIdx}
        totalSteps={STEPS.length}
        currentLessonIdx={currentLessonIdx}
        totalLessons={LESSONS.length}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        onJumpLesson={handleJumpLesson}
      />
    </div>
  );
}

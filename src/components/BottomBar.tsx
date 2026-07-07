import type { Speed } from '../types';

interface Props {
  lessonTitle: string;
  stepTitle: string;
  explanation: string;
  note?: string;
  isPlaying: boolean;
  speed: Speed;
  currentStepIdx: number;
  totalSteps: number;
  currentLessonIdx: number;
  totalLessons: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (s: Speed) => void;
  onJumpLesson: (idx: number) => void;
}

export function BottomBar({
  lessonTitle, stepTitle, explanation, note,
  isPlaying, speed,
  currentStepIdx, totalSteps,
  currentLessonIdx, totalLessons,
  onPlay, onPause, onStepForward, onStepBack,
  onReset, onSpeedChange, onJumpLesson,
}: Props) {
  return (
    <div className="bottom-bar">
      {/* Left: lesson/step info */}
      <div className="bottom-bar__info">
        <div className="bottom-bar__lesson">{lessonTitle || 'Ready'}</div>
        <div className="bottom-bar__step">{stepTitle || '—'}</div>
        <div className="bottom-bar__explanation">
          {explanation || 'Press ▶ to begin, or use › to step through.'}
        </div>
        {note && <div className="bottom-bar__note">⚡ {note}</div>}
      </div>

      {/* Centre: playback controls */}
      <div className="bottom-bar__controls">
        <Btn onClick={onStepBack}    disabled={currentStepIdx <= 0}             title="Previous step">‹</Btn>
        <Btn onClick={onReset}                                                   title="Reset">↺</Btn>
        {isPlaying
          ? <Btn onClick={onPause}   primary                                     title="Pause">⏸</Btn>
          : <Btn onClick={onPlay}    primary disabled={currentStepIdx >= totalSteps - 1} title="Play">▶</Btn>
        }
        <Btn onClick={onStepForward} disabled={currentStepIdx >= totalSteps - 1} title="Next step">›</Btn>
      </div>

      {/* Right: speed + lesson nav */}
      <div className="bottom-bar__right">
        <div className="speed-row">
          {(['slow', 'normal', 'fast'] as Speed[]).map(s => (
            <button
              key={s}
              className={`btn btn--speed${speed === s ? ' btn--speed-active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s === 'slow' ? '🐢' : s === 'fast' ? '⚡' : '▷'} {s}
            </button>
          ))}
        </div>
        <div className="lesson-row">
          <Btn small onClick={() => onJumpLesson(currentLessonIdx - 1)} disabled={currentLessonIdx <= 0}>
            ← Lesson
          </Btn>
          <span className="lesson-count">{currentLessonIdx + 1} / {totalLessons}</span>
          <Btn small onClick={() => onJumpLesson(currentLessonIdx + 1)} disabled={currentLessonIdx >= totalLessons - 1}>
            Lesson →
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Btn({
  onClick, children, title, disabled, primary, small,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <button
      className={`btn${primary ? ' btn--primary' : ''}${small ? ' btn--sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

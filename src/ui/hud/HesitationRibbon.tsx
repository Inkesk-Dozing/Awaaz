import React, { useEffect, useRef } from 'react';

export interface TimelineSegment {
  timeMs: number;
  state: 'speech' | 'pause' | 'hesitation' | 'flinch';
}

export interface HesitationRibbonProps {
  currentSegmentState: 'speech' | 'pause' | 'hesitation' | 'flinch';
  totalDurationSeconds?: number;
  width?: number;
  height?: number;
}

export const HesitationRibbon: React.FC<HesitationRibbonProps> = ({
  currentSegmentState,
  totalDurationSeconds = 30,
  width = 540,
  height = 34,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentsRef = useRef<TimelineSegment[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const maxSamples = totalDurationSeconds * 20; // 20 updates per second

  useEffect(() => {
    segmentsRef.current.push({
      timeMs: Date.now(),
      state: currentSegmentState,
    });
    if (segmentsRef.current.length > maxSamples) {
      segmentsRef.current.shift();
    }
  }, [currentSegmentState, maxSamples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Ribbon background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Track border
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);

      const segments = segmentsRef.current;
      const stepWidth = width / Math.max(1, maxSamples);
      const startX = width - segments.length * stepWidth;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const x = startX + i * stepWidth;

        switch (seg.state) {
          case 'flinch':
            ctx.fillStyle = '#ef4444'; // Bright flashing red
            break;
          case 'hesitation':
            ctx.fillStyle = '#dc2626'; // Deep red
            break;
          case 'pause':
            ctx.fillStyle = '#eab308'; // Amber pause
            break;
          case 'speech':
          default:
            ctx.fillStyle = '#06b6d4'; // Paced speech cyan
            break;
        }

        ctx.fillRect(x, 2, Math.ceil(stepWidth) + 1, height - 4);
      }

      // Legend overlay
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('HESITATION RIBBON (CYAN: SPEECH | AMBER: PAUSE | RED: HESITATION/FLINCH)', 8, height - 10);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height, maxSamples]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #1e293b',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          height: `${height}px`,
          display: 'block',
        }}
      />
    </div>
  );
};

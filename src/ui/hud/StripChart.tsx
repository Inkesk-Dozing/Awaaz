import React, { useEffect, useRef } from 'react';

export interface StripChartProps {
  currentValue: number; // current 8-12 Hz tremor amplitude or normalized stress value (0 - 1)
  windowSeconds?: number;
  width?: number;
  height?: number;
  label?: string;
}

export const StripChart: React.FC<StripChartProps> = ({
  currentValue,
  windowSeconds = 10,
  width = 460,
  height = 100,
  label = '8-12 Hz ACOUSTIC TREMOR (10s ROLLING WINDOW)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const sampleCapacity = windowSeconds * 30; // 30 FPS history sampling

  useEffect(() => {
    // Append latest value to rolling history
    historyRef.current.push(Math.max(0, Math.min(1, currentValue)));
    if (historyRef.current.length > sampleCapacity) {
      historyRef.current.shift();
    }
  }, [currentValue, sampleCapacity]);

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

      // CRT / Oscilloscope phosphor dark background
      ctx.fillStyle = '#03080e';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope retro grid lines
      ctx.strokeStyle = '#0e2424';
      ctx.lineWidth = 1;

      // Vertical grid
      const gridSpacingX = 40;
      for (let x = 0; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid
      const gridSpacingY = 20;
      for (let y = 0; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const history = historyRef.current;
      if (history.length > 1) {
        // Phosphor glow effect
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#22d3ee'; // Phosphor cyan
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const step = width / (sampleCapacity - 1);
        const startIndex = sampleCapacity - history.length;

        for (let i = 0; i < history.length; i++) {
          const x = (startIndex + i) * step;
          // invert Y: 0 at bottom, 1 at top with 10px margin
          const y = height - 12 - history[i] * (height - 24);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // Top label banner
      ctx.fillStyle = '#64748b';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, 8, 14);

      // Current live value indicator
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'right';
      ctx.fillText(`VAL: ${(currentValue).toFixed(3)}`, width - 8, 14);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [width, height, label, sampleCapacity, currentValue]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#040b14',
        borderRadius: '10px',
        border: '1px solid #164e63',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.1)',
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

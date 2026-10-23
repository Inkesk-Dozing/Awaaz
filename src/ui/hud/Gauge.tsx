import React, { useEffect, useRef } from 'react';

export interface GaugeProps {
  value: number; // e.g. jitter percentage: 0.0 to 3.0%
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  width?: number;
  height?: number;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min = 0,
  max = 3.0,
  label = 'JITTER',
  unit = '%',
  width = 220,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedValRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Spring / damped interpolation: smooth towards incoming value
      const target = Math.max(min, Math.min(max, value));
      smoothedValRef.current += (target - smoothedValRef.current) * 0.12;
      const current = smoothedValRef.current;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height - 20;
      const radius = Math.min(centerX - 20, centerY - 15);

      const startAngle = Math.PI * 0.85;
      const endAngle = Math.PI * 2.15;
      const totalAngle = endAngle - startAngle;

      // Background Track
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      // Colored Arc Zones: Green (0-0.8%), Yellow (0.8-1.5%), Red (>1.5%)
      const range = max - min;
      const angleForVal = (v: number) => startAngle + ((v - min) / range) * totalAngle;

      const greenEnd = angleForVal(Math.min(0.8, max));
      const yellowEnd = angleForVal(Math.min(1.5, max));

      // Green zone
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, greenEnd);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#22c55e'; // Green
      ctx.stroke();

      // Yellow zone
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, greenEnd, yellowEnd);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#eab308'; // Yellow
      ctx.stroke();

      // Red zone
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, yellowEnd, endAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.stroke();

      // Needle calculation
      const needleAngle = startAngle + ((current - min) / range) * totalAngle;
      const needleLen = radius - 8;
      const nx = centerX + Math.cos(needleAngle) * needleLen;
      const ny = centerY + Math.sin(needleAngle) * needleLen;

      // Needle shadow
      ctx.save();
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 8;

      // Draw needle line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f8fafc';
      ctx.stroke();
      ctx.restore();

      // Center pivot hub
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();

      // Text labels inside canvas
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, centerX, height - 32);

      ctx.fillStyle = current > 1.5 ? '#f87171' : current > 0.8 ? '#facc15' : '#4ade80';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(`${current.toFixed(2)}${unit}`, centerX, height - 4);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, min, max, label, unit, width, height]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#090d16',
        borderRadius: '10px',
        border: '1px solid #1e293b',
        padding: '0.75rem',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
        }}
      />
    </div>
  );
};

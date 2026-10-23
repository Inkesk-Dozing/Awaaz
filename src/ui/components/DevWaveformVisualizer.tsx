import React, { useEffect, useRef } from 'react';
import { voiceEngine } from '../../audio/VoiceEngine';

export const DevWaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = voiceEngine.getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const render = () => {
      analyser.getFloatTimeDomainData(dataArray);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i];
        const y = (v * 0.5 + 0.5) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Raw Input Oscilloscope (FFT 2048)
      </h3>
      <canvas
        ref={canvasRef}
        width={640}
        height={160}
        style={{
          width: '100%',
          maxWidth: '640px',
          height: '160px',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b'
        }}
      />
    </div>
  );
};

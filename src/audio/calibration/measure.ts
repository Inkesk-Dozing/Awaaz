/**
 * Analyser-based measurement helpers for output calibration.
 * Samples voiced frames from raw + morphed analysers in parallel.
 */

export interface DualMeasurement {
  inputRmsDb: number;
  outputRmsDb: number;
  outputPeakDb: number;
  voicedFrames: number;
  totalFrames: number;
}

interface FrameLevels {
  rms: number;
  peak: number;
}

function readLevels(analyser: AnalyserNode, buf: Float32Array): FrameLevels {
  analyser.getFloatTimeDomainData(buf);
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  return { rms: Math.sqrt(sumSq / buf.length), peak };
}

function db(linear: number): number {
  return 20 * Math.log10(Math.max(1e-8, linear));
}

/**
 * Measures raw-mic RMS and morphed RMS/peak over a wall-clock window,
 * counting only frames where the mic is actively voiced.
 */
export function measureVoicedLevels(
  inputAnalyser: AnalyserNode,
  outputAnalyser: AnalyserNode,
  durationMs: number = 4000,
  minRmsLinear: number = 0.015
): Promise<DualMeasurement> {
  return new Promise((resolve) => {
    const inBuf = new Float32Array(inputAnalyser.fftSize);
    const outBuf = new Float32Array(outputAnalyser.fftSize);

    let inRmsSumDb = 0;
    let outRmsSumDb = 0;
    let outPeakDbMax = -120;
    let voicedFrames = 0;
    let totalFrames = 0;
    let lastInDb = -120;
    let lastOutDb = -120;
    let lastOutPeakDb = -120;
    const start = performance.now();

    const tick = () => {
      const inLvl = readLevels(inputAnalyser, inBuf);
      const outLvl = readLevels(outputAnalyser, outBuf);

      totalFrames++;
      lastInDb = db(inLvl.rms);
      lastOutDb = db(outLvl.rms);
      lastOutPeakDb = db(outLvl.peak);

      if (inLvl.rms > minRmsLinear) {
        voicedFrames++;
        inRmsSumDb += lastInDb;
        outRmsSumDb += lastOutDb;
        if (lastOutPeakDb > outPeakDbMax) outPeakDbMax = lastOutPeakDb;
      }

      if (performance.now() - start < durationMs) {
        requestAnimationFrame(tick);
        return;
      }

      if (voicedFrames === 0) {
        resolve({
          inputRmsDb: lastInDb,
          outputRmsDb: lastOutDb,
          outputPeakDb: lastOutPeakDb,
          voicedFrames: 0,
          totalFrames,
        });
        return;
      }

      resolve({
        inputRmsDb: inRmsSumDb / voicedFrames,
        outputRmsDb: outRmsSumDb / voicedFrames,
        outputPeakDb: outPeakDbMax,
        voicedFrames,
        totalFrames,
      });
    };

    requestAnimationFrame(tick);
  });
}

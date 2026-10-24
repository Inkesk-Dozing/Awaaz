/**
 * RubberBand C++ WebAssembly AudioWorklet Wrapper
 * Loads public/rubberband-processor.js (Emscripten WebAssembly of Breakfast Quay's C++ Rubber Band library)
 */

export interface RubberBandNode extends AudioWorkletNode {
  setPitch(pitch: number): void;
  setTempo(tempo: number): void;
  setHighQuality(enabled: boolean): void;
  close(): void;
}

export async function createRubberBandNode(
  context: AudioContext,
  processorUrl: string = '/rubberband-processor.js'
): Promise<RubberBandNode> {
  await context.audioWorklet.addModule(processorUrl);

  const node = new AudioWorkletNode(context, 'rubberband-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1]
  }) as RubberBandNode;

  node.setPitch = (pitch: number) => {
    node.port.postMessage(JSON.stringify(['pitch', pitch]));
  };

  node.setTempo = (tempo: number) => {
    node.port.postMessage(JSON.stringify(['tempo', tempo]));
  };

  node.setHighQuality = (enabled: boolean) => {
    node.port.postMessage(JSON.stringify(['quality', enabled]));
  };

  node.close = () => {
    node.port.postMessage(JSON.stringify(['close']));
  };

  return node;
}

/**
 * Morphed Audio Recorder & Exporter.
 * Captures morphed audio stream into playable WebM/WAV blobs.
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;

  public startRecording(stream: MediaStream): void {
    if (this.isRecording) return;
    this.recordedChunks = [];

    // MIME type negotiation across browsers
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    let chosenMime = '';
    for (const mime of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    const options: MediaRecorderOptions = chosenMime ? { mimeType: chosenMime } : {};
    this.mediaRecorder = new MediaRecorder(stream, options);

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // 100ms slice chunks
    this.isRecording = true;
  }

  public stopRecording(): Promise<{ blob: Blob; url: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Recorder is not actively recording.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        this.isRecording = false;
        resolve({ blob, url, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const audioRecorder = new AudioRecorder();

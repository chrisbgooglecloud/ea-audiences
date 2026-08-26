export const AudioUtils = {
  /**
   * Convert Float32Array (Web Audio API) to Int16Array (PCM 16-bit)
   */
  float32ToInt16: (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  },

  /**
   * Convert Int16Array (PCM 16-bit) to Float32Array (Web Audio API)
   */
  int16ToFloat32: (int16Array: Int16Array): Float32Array => {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      const s = int16Array[i];
      float32Array[i] = s < 0 ? s / 0x8000 : s / 0x7FFF;
    }
    return float32Array;
  },

  /**
   * Resample audio buffer to target sample rate
   */
  resample: (buffer: Float32Array, fromRate: number, toRate: number): Float32Array => {
    if (fromRate === toRate) return buffer;
    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const loc = i * ratio;
      const index = Math.floor(loc);
      const weight = loc - index;
      const nextIndex = Math.min(index + 1, buffer.length - 1);
      result[i] = buffer[index] * (1 - weight) + buffer[nextIndex] * weight;
    }
    return result;
  },

  /**
   * Convert Blob to Base64 string
   */
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:application/octet-stream;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64: (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
};

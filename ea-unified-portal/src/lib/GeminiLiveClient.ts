import { AudioUtils } from './audio-utils';

type GeminiConfig = {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  tools?: any[];
  voiceName?: string;
};

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private messageHandler: (message: any) => void;
  private config: GeminiConfig;
  private isConnected = false;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  public onDisconnect: (() => void) | null = null;
  public isMuted: boolean = false;

  constructor(config: GeminiConfig, onMessage: (msg: any) => void) {
    this.config = config;
    this.messageHandler = onMessage;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.audioQueue = [];
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch (e) { /* ignore */ }
      }
      this.isPlaying = false;
    } else {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  }

  async connect() {
    if (this.isConnected) return;

    // Cleanup if stream exists but not connected (edge case)
    if (this.mediaStream) {
      console.log('GeminiLiveClient: Stopping existing stream before reconnect');
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;

    // Use gemini-3.1-flash-live-preview by default
    const model = this.config.model || 'gemini-3.1-flash-live-preview';
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

    console.log(`Connecting to Gemini Live with model: ${model}`);

    this.ws = new WebSocket(url);

    this.ws.onopen = async () => {
      console.log('Connected to Gemini Live');
      this.isConnected = true;
      this.messageHandler({ type: 'connected' });

      // Send setup message
      const setupMessage = {
        setup: {
          model: `models/${model}`,
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: this.config.voiceName || "Zephyr"
                }
              }
            },
          },
          system_instruction: {
            parts: [{ text: this.config.systemInstruction || "You are a helpful assistant." }]
          },
          tools: this.config.tools ? [{ function_declarations: this.config.tools }] : undefined
        }
      };
      
      console.log('Sending Setup Message:', JSON.stringify(setupMessage, null, 2));
      this.ws?.send(JSON.stringify(setupMessage));

      // Start Audio
      try {
        await this.startAudioInput();
      } catch (e: any) {
        console.error('Failed to start audio input during connect:', e);
        this.messageHandler({ type: 'error', error: 'Failed to access microphone' });
        this.disconnect();
      }
    };

    this.ws.onmessage = async (event) => {
      let data;
      try {
        if (event.data instanceof Blob) {
          data = JSON.parse(await event.data.text());
        } else {
          data = JSON.parse(event.data);
        }
      } catch (e) {
        console.error('Error parsing message', e);
        return;
      }

      // Handle server content
      if (data.serverContent) {
        if (data.serverContent.interrupted) {
          this.audioQueue = [];
          if (this.currentSource) {
            try { this.currentSource.stop(); } catch (e) { }
          }
          this.isPlaying = false;
        }

        if (data.serverContent.modelTurn) {
          const parts = data.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
              const base64Audio = part.inlineData.data;
              const audioData = atob(base64Audio);
              const arrayBuffer = new ArrayBuffer(audioData.length);
              const view = new Uint8Array(arrayBuffer);
              for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
              }
              const int16 = new Int16Array(arrayBuffer);
              const float32 = AudioUtils.int16ToFloat32(int16);

              if (!this.isMuted) {
                this.queueAudio(float32);
              }
            }
          }
        }
      }

      // Handle tool calls
      if (data.toolCall) {
        this.messageHandler({ type: 'tool_call', data: data.toolCall });
      }

      this.messageHandler({ type: 'raw', data });
    };

    this.ws.onclose = (event) => {
      console.log(`Gemini Live Connection Closed: ${event.code} ${event.reason}`);
      this.isConnected = false;
      this.cleanup();
      this.messageHandler({ type: 'disconnected', code: event.code, reason: event.reason });
    };

    this.ws.onerror = (err: Event) => {
      console.error('Gemini Live WebSocket Error', err);
      this.messageHandler({ type: 'error', error: 'WebSocket connection error' });
    };
  }

  private async ensureAudioContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private async startAudioInput() {
    try {
      const context = await this.ensureAudioContext();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      if (!this.isConnected) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        return;
      }

      const source = context.createMediaStreamSource(this.mediaStream);
      await context.audioWorklet.addModule('/pcm-processor.js');

      this.audioWorkletNode = new AudioWorkletNode(context, 'pcm-processor');

      this.audioWorkletNode.port.onmessage = (event) => {
        if (!this.isConnected) return;

        const float32Data = event.data;
        const int16Data = AudioUtils.float32ToInt16(float32Data);
        const base64Audio = AudioUtils.arrayBufferToBase64(int16Data.buffer as ArrayBuffer);

        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            realtime_input: {
              audio: {
                mime_type: "audio/pcm;rate=16000",
                data: base64Audio
              }
            }
          }));
        }
      };

      source.connect(this.audioWorkletNode);
    } catch (e) {
      console.error('Audio capture failed', e);
      throw e;
    }
  }

  private queueAudio(float32: Float32Array) {
    this.audioQueue.push(float32);
    if (!this.isPlaying) {
      this.playNextChunk();
    }
  }

  private async playNextChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const chunk = this.audioQueue.shift()!;

    try {
      const context = await this.ensureAudioContext();
      const buffer = context.createBuffer(1, chunk.length, 24000); 
      buffer.getChannelData(0).set(chunk);

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => {
        this.playNextChunk();
      };
      this.currentSource = source;
      source.start();
    } catch (e) {
      console.error('Error playing audio chunk', e);
      this.isPlaying = false;
    }
  }

  sendToolResponse(toolCalls: any[]) {
    const functionResponses = toolCalls.map(call => ({
      name: call.functionCall.name,
      response: { result: call.functionCall.result },
      id: call.functionCall.id
    }));

    const responseMsg = {
      tool_response: {
        function_responses: functionResponses
      }
    };
    this.ws?.send(JSON.stringify(responseMsg));
  }

  disconnect() {
    this.isConnected = false;
    if (this.ws) {
      try { this.ws.close(); } catch (e) { /* ignore */ }
      this.ws.onclose = null;
      this.ws = null;
    }
    this.cleanup();
  }

  private cleanup() {
    console.log('GeminiLiveClient: Performing cleanup');
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => {
        console.log(`GeminiLiveClient: Stopping track ${t.label}`);
        t.stop();
      });
      this.mediaStream = null;
    }
    if (this.currentSource) {
      try { 
        console.log('GeminiLiveClient: Stopping current audio source');
        this.currentSource.stop(); 
      } catch (e) { /* ignore */ }
      this.currentSource = null;
    }
    this.audioWorkletNode?.disconnect();
    this.audioWorkletNode = null;
    if (this.audioContext) {
      console.log('GeminiLiveClient: Closing audio context');
      this.audioContext.close().catch(() => { });
      this.audioContext = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  sendClientContent(text: string) {
    if (!this.isConnected) return;
    const base64Data = btoa(unescape(encodeURIComponent(text)));
    const msg = {
      realtime_input: {
        text: text
      }
    };
    this.ws?.send(JSON.stringify(msg));
  }

  async startScreenShare(): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      return stream;
    } catch (e) {
      console.warn("Screen share cancelled or failed:", e);
      return null;
    }
  }
}


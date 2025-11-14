import { generateSoundEffect } from './geminiService';

// --- Web Audio API Setup ---
// The TTS model outputs audio at a 24000Hz sample rate.
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
const soundCache = new Map<string, AudioBuffer>();
const isGenerating = new Set<string>();

type SoundName = 'click' | 'pageTurn' | 'modalOpen' | 'modalClose' | 'generate' | 'success';

const soundPrompts: Record<SoundName, string> = {
  click: 'A soft, quick button click sound',
  pageTurn: 'The gentle rustle of a single paper page turning',
  modalOpen: 'A light, welcoming swoosh sound',
  modalClose: 'A soft thump sound',
  generate: 'A magical, shimmering chime',
  success: 'A short, positive, sparkling notification sound',
};

// --- Audio Decoding Helpers ---

/** Decodes a base64 string into a byte array. */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Decodes raw PCM audio data into an AudioBuffer for playback. */
async function decodePcmData(data: Uint8Array): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length; // Assuming mono audio (numChannels = 1)
  const buffer = audioContext.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0; // Normalize to [-1.0, 1.0]
  }
  return buffer;
}

/** Plays an AudioBuffer. */
function playBuffer(buffer: AudioBuffer) {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
}

/**
 * Plays a sound effect. If the sound is not in the cache, it generates it
 * using the Gemini API, caches it, and then plays it.
 * @param soundName The name of the sound to play.
 */
export const playSound = async (soundName: SoundName) => {
  // If sound is already in the cache, play it immediately.
  if (soundCache.has(soundName)) {
    const cachedBuffer = soundCache.get(soundName);
    if (cachedBuffer) {
      playBuffer(cachedBuffer);
    }
    return;
  }

  // If we are already generating this sound, don't start another request.
  if (isGenerating.has(soundName)) {
    return;
  }

  try {
    isGenerating.add(soundName);
    
    // Generate the sound effect using the AI model
    const prompt = soundPrompts[soundName];
    const base64Audio = await generateSoundEffect(prompt);

    if (base64Audio) {
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodePcmData(audioBytes);
      
      // Cache the newly generated sound and play it
      soundCache.set(soundName, audioBuffer);
      playBuffer(audioBuffer);
    }
  } catch (error) {
    console.warn(`Could not generate or play sound '${soundName}':`, error);
  } finally {
    isGenerating.delete(soundName);
  }
};
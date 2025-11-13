import { SOUNDS } from '../assets/sounds';

// Create a pool of audio objects for each sound to handle rapid plays without cutting off previous sounds.
const audioPool: { [key: string]: HTMLAudioElement[] } = {};
const POOL_SIZE = 4; // Number of audio instances per sound

// Initialize the audio pool
Object.keys(SOUNDS).forEach((key) => {
  const soundName = key as keyof typeof SOUNDS;
  audioPool[soundName] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(SOUNDS[soundName]);
    audio.volume = 0.4; // Keep sound effects subtle
    audioPool[soundName].push(audio);
  }
});

// Keep track of the current index for each sound's pool
const poolIndex: { [key:string]: number } = {};
Object.keys(SOUNDS).forEach((key) => {
  poolIndex[key as keyof typeof SOUNDS] = 0;
});

/**
 * Plays a sound from the pre-defined sound list.
 * @param soundName The name of the sound to play (e.g., 'click', 'pageTurn').
 */
export const playSound = (soundName: keyof typeof SOUNDS) => {
  const soundPool = audioPool[soundName];
  if (!soundPool || soundPool.length === 0) {
    console.warn(`Sound pool for '${soundName}' is not available.`);
    return;
  }
  
  // Get the next audio object from the pool using the current index
  const currentIndex = poolIndex[soundName];
  const audio = soundPool[currentIndex];
  
  // Update the index for the next play, cycling through the pool
  poolIndex[soundName] = (currentIndex + 1) % POOL_SIZE;

  // Play the sound
  // Rewind to the start in case it's already playing.
  audio.currentTime = 0;
  audio.play().catch(error => {
    // Autoplay can be prevented by the browser before the first user interaction.
    // This is expected behavior, so we can log a warning instead of an error.
    console.warn(`Could not play sound '${soundName}': ${error.message}`);
  });
};

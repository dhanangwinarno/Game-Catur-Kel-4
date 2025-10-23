// Singleton AudioContext
let audioContext: AudioContext | null = null;
let isAudioContextInitialized = false;

const getAudioContext = (): AudioContext | null => {
  if (isAudioContextInitialized) {
    return audioContext;
  }
  isAudioContextInitialized = true;
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser", e);
      audioContext = null;
    }
  }
  return audioContext;
};


// Sound generation functions
const playNote = (
    ctx: AudioContext, 
    frequency: number, 
    startTime: number, 
    duration: number, 
    type: OscillatorType = 'sine', 
    volume: number = 0.5
) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
};

const playSoundEffect = (soundGenerator: (ctx: AudioContext) => void) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // The AudioContext may be in a suspended state and needs to be resumed by a user gesture.
  // We'll try to resume it every time a sound is played.
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  try {
    soundGenerator(ctx);
  } catch (error) {
    console.error(`Could not play sound`, error);
  }
};


// Sound implementations
const soundImplementations: { [key: string]: (ctx: AudioContext) => void } = {
  click: (ctx) => playNote(ctx, 880, ctx.currentTime, 0.1, 'triangle', 0.3),
  place: (ctx) => playNote(ctx, 523, ctx.currentTime, 0.15, 'sine', 0.4),
  capture: (ctx) => {
    playNote(ctx, 220, ctx.currentTime, 0.2, 'square', 0.4);
    playNote(ctx, 440, ctx.currentTime + 0.05, 0.15, 'sawtooth', 0.3);
  },
  win: (ctx) => {
    // A new, more fantastic and triumphant victory fanfare.
    const t = ctx.currentTime;
    const vol = 0.35;
    
    // Part 1: Quick ascending intro
    playNote(ctx, 523.25, t, 0.1, 'triangle', vol); // C5
    playNote(ctx, 659.25, t + 0.1, 0.1, 'triangle', vol); // E5
    playNote(ctx, 783.99, t + 0.2, 0.1, 'triangle', vol); // G5
    
    // Part 2: Main theme
    playNote(ctx, 1046.50, t + 0.4, 0.4, 'sine', vol * 1.2); // C6
    playNote(ctx, 987.77, t + 0.8, 0.3, 'sine', vol); // B5
    playNote(ctx, 1046.50, t + 1.1, 0.6, 'sine', vol * 1.4); // C6
    
    // Harmony for the final note
    playNote(ctx, 783.99, t + 1.1, 0.6, 'sine', vol * 0.9); // G5
  },
  lose: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 311.13, t, 0.2, 'sawtooth'); // D#4
    playNote(ctx, 207.65, t + 0.2, 0.3, 'sawtooth'); // G#3
  },
  start: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 261.63, t, 0.1, 'sine'); // C4
    playNote(ctx, 392.00, t + 0.1, 0.1, 'sine'); // G4
    playNote(ctx, 523.25, t + 0.2, 0.2, 'sine'); // C5
  },
  gameStartStinger: (ctx) => {
      const t = ctx.currentTime;
      playNote(ctx, 130.81, t, 0.5, 'sawtooth', 0.3); // C3
      playNote(ctx, 196.00, t + 0.5, 0.5, 'sawtooth', 0.3); // G3
      playNote(ctx, 261.63, t + 1.0, 1.0, 'sawtooth', 0.4); // C4
  },
  confetti: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 783.99, t, 0.1, 'sine', 0.3); // G5
    playNote(ctx, 1046.50, t + 0.1, 0.15, 'sine', 0.3); // C6
  },
  draw: (ctx) => playNote(ctx, 659.25, ctx.currentTime, 0.08, 'sine', 0.3),
  move: (ctx) => playNote(ctx, 440, ctx.currentTime, 0.1, 'sine', 0.4),
  undo: (ctx) => playNote(ctx, 880, ctx.currentTime, 0.1, 'triangle', 0.3),
  redo: (ctx) => playNote(ctx, 880, ctx.currentTime, 0.1, 'triangle', 0.3),
  invalid: (ctx) => {
    playNote(ctx, 155.56, ctx.currentTime, 0.3, 'square', 0.4); // D#3
    playNote(ctx, 164.81, ctx.currentTime, 0.3, 'square', 0.4); // E3
  },
  pause: (ctx) => playNote(ctx, 220, ctx.currentTime, 0.1, 'square', 0.3),
  resume: (ctx) => playNote(ctx, 440, ctx.currentTime, 0.1, 'square', 0.3),
};

export const playSound = (soundName: keyof typeof soundImplementations) => {
  const soundGenerator = soundImplementations[soundName];
  if (soundGenerator) {
    playSoundEffect(soundGenerator);
  }
};

// --- Background Music ---
let musicNodes: { oscillator: OscillatorNode, gain: GainNode, timeoutId?: number } | null = null;
let endGameMusicNodes: { oscillator: OscillatorNode, gain: GainNode, timeoutId?: number } | null = null;

export const startMusic = () => {
  const ctx = getAudioContext();
  if (!ctx || musicNodes) return; // Don't start if already playing or no context

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1); // Fade in to a low volume

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();

  const notes = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4 arpeggio
  let noteIndex = 0;

  const playNextNote = () => {
    if (!musicNodes) return; // Stop if music has been turned off
    const t = ctx.currentTime;
    musicNodes.oscillator.frequency.setValueAtTime(notes[noteIndex % notes.length], t);
    noteIndex++;
    const timeoutId = window.setTimeout(playNextNote, 1500); // Play a note every 1.5 seconds
    musicNodes.timeoutId = timeoutId;
  };
  
  playNextNote();
  musicNodes = { oscillator, gain: gainNode };
};

export const stopMusic = () => {
  if (!musicNodes || !getAudioContext()) return;

  const ctx = getAudioContext()!;
  const { oscillator, gain, timeoutId } = musicNodes;
  
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const fadeOutTime = ctx.currentTime + 0.5;
  gain.gain.linearRampToValueAtTime(0, fadeOutTime);

  oscillator.stop(fadeOutTime);
  musicNodes = null;
};

const playEndGameMusicLoop = (notes: number[], volume: number) => {
    const ctx = getAudioContext();
    if (!ctx || endGameMusicNodes) return;

    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    
    let noteIndex = 0;
    const playNextNote = () => {
        if (!endGameMusicNodes) return;
        const t = ctx.currentTime;
        endGameMusicNodes.oscillator.frequency.setValueAtTime(notes[noteIndex % notes.length], t);
        noteIndex++;
        const timeoutId = window.setTimeout(playNextNote, 800);
        endGameMusicNodes.timeoutId = timeoutId;
    };
    playNextNote();
    endGameMusicNodes = { oscillator, gain: gainNode };
};

export const playWinMusic = () => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    playEndGameMusicLoop(notes, 0.15);
};

export const playLossMusic = () => {
    const notes = [174.61, 155.56, 130.81, 110.00]; // F3, D#3, C3, A2
    playEndGameMusicLoop(notes, 0.15);
};

export const stopEndGameMusic = () => {
    if (!endGameMusicNodes || !getAudioContext()) return;
    const ctx = getAudioContext()!;
    const { oscillator, gain, timeoutId } = endGameMusicNodes;
    if (timeoutId) clearTimeout(timeoutId);

    const fadeOutTime = ctx.currentTime + 0.5;
    gain.gain.linearRampToValueAtTime(0, fadeOutTime);
    oscillator.stop(fadeOutTime);
    endGameMusicNodes = null;
};
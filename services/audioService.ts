// --- Volume Controls ---
let sfxVolume = 1.0;
let musicVolume = 0.5;
const SFX_VOLUME_KEY = 'tacticalCardConquest_sfxVolume';
const MUSIC_VOLUME_KEY = 'tacticalCardConquest_musicVolume';

// Singleton AudioContext
let audioContext: AudioContext | null = null;
let isAudioContextInitialized = false;

const initializeAudioSettings = () => {
    try {
        const savedSfx = localStorage.getItem(SFX_VOLUME_KEY);
        const savedMusic = localStorage.getItem(MUSIC_VOLUME_KEY);
        sfxVolume = savedSfx !== null ? parseFloat(savedSfx) : 1.0;
        musicVolume = savedMusic !== null ? parseFloat(savedMusic) : 0.5;
    } catch (e) {
        console.error("Failed to load audio settings", e);
    }
};
initializeAudioSettings();

export const setSfxVolume = (level: number) => {
    sfxVolume = Math.max(0, Math.min(1, level));
    try {
      localStorage.setItem(SFX_VOLUME_KEY, String(sfxVolume));
    } catch (e) {
        console.error("Failed to save SFX volume", e);
    }
};

export const setMusicVolume = (level: number) => {
    musicVolume = Math.max(0, Math.min(1, level));
    try {
        localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
    } catch (e) {
        console.error("Failed to save music volume", e);
    }
    
    if (musicNodes && musicNodes.gain && getAudioContext()) {
        let baseVolume = 0.08; // default for 'normal'
        if (currentMusicType === 'tense') baseVolume = 0.12;
        if (currentMusicType === 'win') baseVolume = 0.1;
        musicNodes.gain.gain.setValueAtTime(musicVolume * baseVolume, getAudioContext()!.currentTime);
    }
};


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
    gainNode.gain.linearRampToValueAtTime(volume * sfxVolume, startTime + 0.01);
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
  place: (ctx) => playNote(ctx, 440, ctx.currentTime, 0.1, 'triangle', 0.4),
  capture: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 164.81, t, 0.2, 'square', 0.5);
    playNote(ctx, 110.00, t + 0.05, 0.15, 'sawtooth', 0.4);
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
  invalid: (ctx) => playNote(ctx, 110.00, ctx.currentTime, 0.25, 'sawtooth', 0.4),
  pause: (ctx) => playNote(ctx, 220, ctx.currentTime, 0.1, 'square', 0.3),
  resume: (ctx) => playNote(ctx, 440, ctx.currentTime, 0.1, 'square', 0.3),
  passTurn: (ctx) => playNote(ctx, 783.99, ctx.currentTime, 0.15, 'sine', 0.25),
  applause: (ctx) => {
    const duration = 1.5;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    // Fade in and out
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.3 * sfxVolume, t + 0.1); // Quick fade in
    gainNode.gain.linearRampToValueAtTime(0, t + duration); // Slow fade out

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(t);
    source.stop(t + duration);
  },
};

export const playSound = (soundName: keyof typeof soundImplementations) => {
  const soundGenerator = soundImplementations[soundName];
  if (soundGenerator) {
    playSoundEffect(soundGenerator);
  }
};

// --- Background Music ---
let musicNodes: { oscillator: OscillatorNode, gain: GainNode, timeoutId?: number } | null = null;
let currentMusicType: 'none' | 'normal' | 'tense' | 'win' = 'none';

const stopMusicInternal = (fadeDuration = 0.5) => {
  if (!musicNodes || !getAudioContext()) return;

  const ctx = getAudioContext()!;
  const { oscillator, gain, timeoutId } = musicNodes;
  
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const fadeOutTime = ctx.currentTime + fadeDuration;
  gain.gain.linearRampToValueAtTime(0, fadeOutTime);

  oscillator.stop(fadeOutTime);
  musicNodes = null;
  currentMusicType = 'none';
};

const startMusicInternal = (notes: number[], interval: number, baseVolume: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(baseVolume * musicVolume, ctx.currentTime + 1);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();

  let noteIndex = 0;

  const playNextNote = () => {
    if (!musicNodes) return;
    const t = ctx.currentTime;
    musicNodes.oscillator.frequency.setValueAtTime(notes[noteIndex % notes.length], t);
    noteIndex++;
    const timeoutId = window.setTimeout(playNextNote, interval);
    musicNodes.timeoutId = timeoutId;
  };
  
  playNextNote();
  musicNodes = { oscillator, gain: gainNode };
}

export const startMusic = () => {
  if (currentMusicType === 'normal') return;
  stopMusicInternal(0.2); // Quick fade if switching
  const notes = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4 arpeggio
  startMusicInternal(notes, 1500, 0.08);
  currentMusicType = 'normal';
};

export const startTenseMusic = () => {
    if (currentMusicType === 'tense') return;
    stopMusicInternal(0.2); // Quick fade if switching
    const notes = [146.83, 155.56, 146.83, 311.13]; // Minor, tense feel: D3, D#3, D3, D#4
    startMusicInternal(notes, 800, 0.12); // Faster tempo, slightly louder
    currentMusicType = 'tense';
};

export const playWinMusic = () => {
  if (currentMusicType === 'win') return;
  stopMusicInternal(0.2);
  // A triumphant, looping arpeggio for Hall of Fame
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C4, E4, G4, C5, G4, E4
  startMusicInternal(notes, 400, 0.1);
  currentMusicType = 'win';
}

export const stopMusic = () => {
  stopMusicInternal();
};

export const stopEndGameMusic = () => {
    // This function will now stop any music, including the new win music.
    stopMusicInternal();
};
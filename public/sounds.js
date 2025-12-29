/**
 * Sound Configuration
 * Easy to extend - just add new entries to the SOUNDS object
 */
const SOUNDS = {
  1: {
    name: 'Clap',
    emoji: '👏',
    // Using Web Audio API to generate sounds (no external files needed)
    frequency: 200,
    type: 'noise'
  },
  2: {
    name: 'Drum',
    emoji: '🥁',
    frequency: 100,
    type: 'drum'
  },
  3: {
    name: 'Bell',
    emoji: '🔔',
    frequency: 800,
    type: 'bell'
  },
  4: {
    name: 'Whoosh',
    emoji: '💨',
    frequency: 400,
    type: 'whoosh'
  },
  5: {
    name: 'Pop',
    emoji: '🎈',
    frequency: 600,
    type: 'pop'
  },
  6: {
    name: 'Horn',
    emoji: '📯',
    frequency: 300,
    type: 'horn'
  }
};

// Audio context for generating sounds
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a sound by type
 * @param {number} type - Sound type from SOUNDS object
 */
function playSound(type) {
  const sound = SOUNDS[type];
  if (!sound) {
    console.warn(`Unknown sound type: ${type}`);
    return;
  }

  const ctx = getAudioContext();
  
  // Resume audio context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  switch (sound.type) {
    case 'noise':
      playClap(ctx);
      break;
    case 'drum':
      playDrum(ctx);
      break;
    case 'bell':
      playBell(ctx, sound.frequency);
      break;
    case 'whoosh':
      playWhoosh(ctx);
      break;
    case 'pop':
      playPop(ctx);
      break;
    case 'horn':
      playHorn(ctx);
      break;
    default:
      playTone(ctx, sound.frequency);
  }
}

// Clap sound - white noise burst
function playClap(ctx) {
  const duration = 0.15;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const env = Math.exp(-i / (bufferSize * 0.1));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  
  const gain = ctx.createGain();
  gain.gain.value = 0.5;
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

// Drum sound - low frequency with decay
function playDrum(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// Bell sound - high frequency with harmonics
function playBell(ctx, freq) {
  const harmonics = [1, 2, 3, 4.2, 5.4];
  const gains = [1, 0.6, 0.4, 0.3, 0.2];
  
  harmonics.forEach((harmonic, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.value = freq * harmonic;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(gains[i] * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1);
  });
}

// Whoosh sound - filtered noise sweep
function playWhoosh(ctx) {
  const duration = 0.4;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const env = Math.sin(t * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env * 0.5;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + duration * 0.5);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
  filter.Q.value = 2;
  
  source.connect(filter);
  filter.connect(ctx.destination);
  source.start();
}

// Pop sound - quick frequency drop
function playPop(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// Horn sound - sawtooth with filter
function playHorn(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.1);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.4);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

// Simple tone fallback
function playTone(ctx, freq) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

/**
 * Get all available sounds
 * @returns {Object} SOUNDS object
 */
function getAllSounds() {
  return SOUNDS;
}

/**
 * Get sound info by type
 * @param {number} type - Sound type
 * @returns {Object|null} Sound info or null
 */
function getSoundInfo(type) {
  return SOUNDS[type] || null;
}

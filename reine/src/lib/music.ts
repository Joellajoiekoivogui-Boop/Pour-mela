// Musique originale composée en direct par le navigateur (Web Audio) :
// nappe de cordes, boîte à musique, cloches et un battement de cœur dans
// la basse. Rien à télécharger, aucun droit d'auteur. Chaque accent envoie
// une impulsion à la scène WebGL : la lumière respire avec la musique.
//
// Les navigateurs n'autorisent le son qu'après un geste : tout démarre au
// clic sur « Entrer dans son royaume ».

import { director } from "./director";

type Listener = () => void;

interface Chord {
  bass: number;
  notes: [number, number, number];
}

// La bémol majeur, 66 battements par minute : I – V – vi – iii – IV – I – ii – V.
const CHORDS: Chord[] = [
  { bass: 44, notes: [56, 60, 63] },
  { bass: 43, notes: [55, 58, 63] },
  { bass: 41, notes: [53, 56, 60] },
  { bass: 39, notes: [55, 60, 63] },
  { bass: 37, notes: [53, 56, 61] },
  { bass: 36, notes: [51, 56, 60] },
  { bass: 34, notes: [53, 56, 61] },
  { bass: 39, notes: [55, 58, 63] },
];
const PENTATONIC = [68, 70, 72, 75, 77, 80, 82, 84, 87, 89, 92];
const TEMPO = 66;
const EIGHTH = 60 / TEMPO / 2;
const ARPEGGIOS = [
  [0, 1, 2, 3, 2, 1, 2, 1],
  [0, 2, 1, 3, 1, 2, 3, 2],
  [0, 1, 2, 1, 3, 2, 1, 2],
  [2, 1, 0, 1, 2, 3, 2, 1],
];

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

type AudioContextClass = typeof AudioContext;

class Music {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private analyser!: AnalyserNode;
  private noise!: AudioBuffer;
  private wave = new Uint8Array(256);
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private melody = 4;
  private arpeggio = ARPEGGIOS[0];
  private intensity = 0;
  private lastTwinkle = 0;
  private level = 0;
  private average = 0;
  private element: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();

  started = false;
  enabled = true;
  volume = 0.8;
  file = "";

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  /** À appeler pendant un geste (clic, toucher). */
  start() {
    if (this.started) return;
    const Ctor: AudioContextClass | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.build();
    this.unlock();
    this.started = true;
    this.fade(this.enabled ? this.volume : 0, 2.5);

    if (this.file) this.playFile();
    else {
      this.nextTime = this.ctx.currentTime + 0.15;
      this.timer = window.setInterval(() => this.schedule(), 50);
    }
    document.addEventListener("visibilitychange", this.onVisibility);
    this.notify();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.started) {
      this.notify();
      return;
    }
    if (this.enabled) this.ctx?.resume().catch(() => {});
    this.fade(this.enabled ? this.volume : 0, this.enabled ? 1.2 : 0.4);
    if (this.element) {
      if (this.enabled) this.element.play().catch(() => {});
      else window.setTimeout(() => !this.enabled && this.element?.pause(), 450);
    }
    this.notify();
  }

  /** 0 : nappe seule · 1 : boîte à musique · 2 : grand final. */
  setIntensity(level: number) {
    this.intensity = level;
  }

  /** Niveau sonore lissé (0..1), lu à chaque image par la scène. */
  readLevel(): number {
    if (!this.ctx || !this.enabled) {
      this.level *= 0.9;
      return this.level;
    }
    this.analyser.getByteTimeDomainData(this.wave);
    let sum = 0;
    for (let i = 0; i < this.wave.length; i++) {
      const v = (this.wave[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.min(1, Math.sqrt(sum / this.wave.length) * 4);
    this.level += (rms - this.level) * 0.2;
    // Avec un fichier audio, on devine les accents à partir de l'énergie.
    if (this.element) {
      if (rms > this.average * 1.45 && rms > 0.12) director.pulse(Math.min(1, rms * 1.4));
      this.average += (rms - this.average) * 0.05;
    }
    return this.level;
  }

  /* ---------------------------------------------------------------- */
  /* Effets sonores                                                    */
  /* ---------------------------------------------------------------- */

  /** Souffle ascendant : le saut vers le royaume. */
  whoosh() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(220, t);
    filter.frequency.exponentialRampToValueAtTime(4200, t + 1.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.34, t + 1.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    source.connect(filter).connect(gain).connect(this.sfxBus);
    source.start(t);
    source.stop(t + 2.5);

    const glide = ctx.createOscillator();
    const glideGain = ctx.createGain();
    glide.type = "sine";
    glide.frequency.setValueAtTime(180, t);
    glide.frequency.exponentialRampToValueAtTime(880, t + 1.4);
    glideGain.gain.setValueAtTime(0.0001, t);
    glideGain.gain.exponentialRampToValueAtTime(0.05, t + 1.0);
    glideGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    glide.connect(glideGain).connect(this.sfxBus);
    glide.start(t);
    glide.stop(t + 1.7);

    window.setTimeout(() => this.bloom(), 1250);
  }

  /** Accord qui s'épanouit sur plusieurs octaves. */
  bloom(strength = 1) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime + 0.02;
    const chord = CHORDS[Math.floor(this.step / 8) % CHORDS.length];
    chord.notes.forEach((note, i) => {
      this.bell(freq(note + 12), t + i * 0.06, 0.07 * strength, 4, this.sfxBus);
      this.bell(freq(note + 24), t + 0.2 + i * 0.08, 0.05 * strength, 3.4, this.sfxBus);
    });
    this.bass(freq(chord.bass), t, 0.22 * strength, 3.5, this.sfxBus);
    director.pulse(1);
  }

  /** Petite note cristalline (toucher, étincelles). */
  twinkle(strength = 1) {
    if (!this.ready()) return;
    const now = this.ctx!.currentTime;
    if (now - this.lastTwinkle < 0.07) return;
    this.lastTwinkle = now;
    const note = PENTATONIC[4 + Math.floor(Math.random() * 6)];
    this.bell(freq(note), now + 0.01, 0.045 * strength, 1.6, this.sfxBus);
  }

  /** Note de la gamme, de plus en plus aiguë (les étoiles du jeu). */
  note(index: number) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime + 0.01;
    const note = PENTATONIC[Math.min(index, PENTATONIC.length - 1)];
    this.bell(freq(note), t, 0.11, 2.6, this.sfxBus);
    this.bell(freq(note + 12), t, 0.025, 1.2, this.sfxBus);
  }

  /** Arpège triomphal et grand accord : la révélation finale. */
  fanfare() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    PENTATONIC.forEach((note, i) => this.bell(freq(note), t + i * 0.07, 0.07, 2.4, this.sfxBus));
    [44, 56, 60, 63, 68, 72, 75].forEach((note) => this.pad(freq(note), t + 0.6, 5, 0.035, this.sfxBus));
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(110, t + 0.6);
    boom.frequency.exponentialRampToValueAtTime(42, t + 2.2);
    boomGain.gain.setValueAtTime(0.0001, t + 0.6);
    boomGain.gain.exponentialRampToValueAtTime(0.32, t + 0.65);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    boom.connect(boomGain).connect(this.sfxBus);
    boom.start(t + 0.6);
    boom.stop(t + 2.7);
  }

  /* ---------------------------------------------------------------- */
  /* Mécanique                                                         */
  /* ---------------------------------------------------------------- */

  // Un contexte encore « suspendu » (iOS, juste après le geste) accepte
  // déjà les notes : elles sonnent dès qu'il démarre.
  private ready() {
    return Boolean(this.ctx && this.enabled && this.ctx.state !== "closed");
  }

  private build() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.3;

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(director.quality.tier === "low" ? 1.8 : 3.2, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    const dry = ctx.createGain();
    dry.gain.value = 0.75;

    this.musicBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    for (const bus of [this.musicBus, this.sfxBus]) {
      bus.connect(dry);
      bus.connect(reverb);
    }
    reverb.connect(wet);
    dry.connect(compressor);
    wet.connect(compressor);
    compressor.connect(this.master);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.master.connect(this.analyser);
    this.master.connect(ctx.destination);

    const length = Math.floor(ctx.sampleRate * 1);
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return buffer;
  }

  // iOS : jouer un échantillon silencieux pendant le geste déverrouille le son.
  private unlock() {
    const ctx = this.ctx!;
    try {
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, 22050);
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      /* rien */
    }
    ctx.resume().catch(() => {});
  }

  private fade(target: number, seconds: number) {
    if (!this.ctx) return;
    const gain = this.master.gain;
    const t = this.ctx.currentTime;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(Math.max(gain.value, 0.0001), t);
    gain.exponentialRampToValueAtTime(Math.max(target * 0.75, 0.0001), t + seconds);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend().catch(() => {});
    else if (this.enabled) this.ctx.resume().catch(() => {});
  };

  private playFile() {
    const element = new Audio(this.file);
    element.loop = true;
    element.preload = "auto";
    this.element = element;
    try {
      this.ctx!.createMediaElementSource(element).connect(this.musicBus);
    } catch {
      /* le son passe quand même, sans analyse */
    }
    element.play().catch(() => {});
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    // Après une longue pause, on ne rattrape pas les notes perdues.
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.3) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += EIGHTH;
      this.step++;
    }
  }

  private at(time: number, action: () => void) {
    const delay = Math.max(0, (time - this.ctx!.currentTime) * 1000);
    window.setTimeout(action, delay);
  }

  private playStep(step: number, t: number) {
    const inBar = step % 8;
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    const bus = this.musicBus;

    if (inBar === 0) {
      chord.notes.forEach((note) => this.pad(freq(note), t, EIGHTH * 8 + 0.4, 0.016, bus));
      this.pad(freq(chord.bass + 12), t, EIGHTH * 8 + 0.4, 0.012, bus);
      // Le battement de cœur : « poum… poum ».
      this.bass(freq(chord.bass), t, 0.2, 2.6, bus);
      this.bass(freq(chord.bass), t + 0.34, 0.11, 1.8, bus);
      this.at(t, () => director.pulse(1));
      this.at(t + 0.34, () => director.pulse(0.65));
      if (Math.random() < 0.5) this.arpeggio = ARPEGGIOS[Math.floor(Math.random() * ARPEGGIOS.length)];
    }

    if (this.intensity >= 1) {
      const tones = [chord.notes[0] + 12, chord.notes[1] + 12, chord.notes[2] + 12, chord.notes[0] + 24];
      const note = tones[this.arpeggio[inBar]];
      const accent = inBar === 0 ? 1 : inBar % 2 === 0 ? 0.8 : 0.62;
      this.bell(freq(note), t, 0.055 * accent, 2.2, bus);
      if (this.intensity >= 2) this.bell(freq(note + 12), t, 0.018 * accent, 1.2, bus);
      this.at(t, () => director.pulse(0.22 * accent));
    }

    // Mélodie de cloches : une marche au hasard sur la gamme, qui préfère
    // les notes de l'accord sur les temps forts.
    const melodyChance = this.intensity === 0 ? 0.28 : 0.42;
    if ((inBar === 0 || inBar === 3 || inBar === 4 || inBar === 6) && Math.random() < melodyChance) {
      this.melody = Math.max(0, Math.min(PENTATONIC.length - 2, this.melody + Math.round((Math.random() - 0.5) * 3.2)));
      let note = PENTATONIC[this.melody];
      if (inBar === 0) {
        const pitch = note % 12;
        const target = chord.notes.map((n) => n % 12).reduce((best, n) => (Math.abs(n - pitch) < Math.abs(best - pitch) ? n : best));
        note += target - pitch;
      }
      this.bell(freq(note), t, 0.06, 3.2, bus);
    }
  }

  private bell(f: number, t: number, force: number, duration: number, out: AudioNode) {
    this.partial(f, t, force, duration, out);
    this.partial(f * 2, t, force * 0.22, duration * 0.4, out);
    if (director.quality.tier !== "low") this.partial(f * 5.95, t, force * 0.05, 0.08, out);
  }

  private partial(f: number, t: number, force: number, duration: number, out: AudioNode) {
    if (f > 14000) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(force * (0.88 + Math.random() * 0.24), t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private bass(f: number, t: number, force: number, duration: number, out: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(force, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private pad(f: number, t: number, duration: number, force: number, out: AudioNode) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(force, t + 1.1);
    gain.gain.setValueAtTime(force, t + duration - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 1.4);
    filter.connect(gain).connect(out);
    for (const detune of [-7, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 1.5);
    }
  }
}

export const music = new Music();

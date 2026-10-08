// Musique douce et cinématique composée en direct par le navigateur
// (Web Audio) : nappes, cloches, basse lente. 0 Ko à télécharger, aucun
// droit d'auteur. Les navigateurs n'autorisent le son qu'après un geste :
// rien ne démarre sans un clic sur « Activer l'expérience ».

type Listener = () => void;

// Ré majeur, couleur lydienne : I – vi – IV – V – I – iii – IV(add9) – V.
const CHORDS = [
  [50, [62, 66, 69, 73]],
  [47, [59, 62, 66, 69]],
  [43, [59, 62, 67, 71]],
  [45, [61, 64, 69, 71]],
  [50, [62, 66, 69, 76]],
  [42, [61, 66, 69, 73]],
  [43, [62, 67, 71, 76]],
  [45, [61, 64, 68, 71]],
] as const;
const SCALE = [74, 76, 78, 81, 83, 85, 86, 88, 90, 93];
const BAR = 4.2; // secondes par accord

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class Audio_ {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private noise!: AudioBuffer;
  private timer = 0;
  private next = 0;
  private bar = 0;
  private element: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();

  started = false;
  enabled = false;
  file = "";

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /** À appeler pendant un geste. Lance la musique, ou la coupe/relance. */
  toggle() {
    if (!this.started) {
      this.start();
      return;
    }
    this.enabled = !this.enabled;
    if (this.enabled) this.ctx?.resume().catch(() => {});
    this.fade(this.enabled ? 0.9 : 0, this.enabled ? 1.5 : 0.4);
    if (this.element) {
      if (this.enabled) this.element.play().catch(() => {});
      else window.setTimeout(() => !this.enabled && this.element?.pause(), 450);
    }
    this.notify();
  }

  start() {
    if (this.started) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.build();
    // iOS : un échantillon muet pendant le geste déverrouille le son.
    const silent = this.ctx.createBufferSource();
    silent.buffer = this.ctx.createBuffer(1, 1, 22050);
    silent.connect(this.ctx.destination);
    silent.start(0);
    this.ctx.resume().catch(() => {});
    this.started = true;
    this.enabled = true;
    this.fade(0.9, 3);
    if (this.file) {
      const element = new Audio(this.file);
      element.loop = true;
      this.element = element;
      try {
        this.ctx.createMediaElementSource(element).connect(this.music);
      } catch {
        /* le son passe quand même */
      }
      element.play().catch(() => {});
    } else {
      this.next = this.ctx.currentTime + 0.1;
      this.timer = window.setInterval(() => this.schedule(), 200);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.ctx?.suspend().catch(() => {});
      else if (this.enabled) this.ctx?.resume().catch(() => {});
    });
    this.notify();
  }

  /* ------------------------------ effets ------------------------------ */

  /** Petite note cristalline. */
  chime(index = Math.floor(Math.random() * SCALE.length), strength = 1) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime + 0.01;
    this.bell(freq(SCALE[index % SCALE.length]), t, 0.08 * strength, 2.4, this.sfx);
  }

  /** Souffle qui monte : transitions, ouverture du menu. */
  whoosh(duration = 1.2) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(260, t);
    filter.frequency.exponentialRampToValueAtTime(3800, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 1.4);
    source.connect(filter).connect(gain).connect(this.sfx);
    source.start(t);
    source.stop(t + duration * 1.5);
  }

  /** Arpège montant et grand accord : la fête. */
  fanfare() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    SCALE.forEach((note, i) => this.bell(freq(note), t + i * 0.06, 0.07, 2.2, this.sfx));
    [38, 50, 62, 66, 69, 74, 78].forEach((note) => this.pad(freq(note), t + 0.5, 5, 0.03, this.sfx));
    const boom = ctx.createOscillator();
    const g = ctx.createGain();
    boom.frequency.setValueAtTime(120, t + 0.5);
    boom.frequency.exponentialRampToValueAtTime(40, t + 2);
    g.gain.setValueAtTime(0.0001, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    boom.connect(g).connect(this.sfx);
    boom.start(t + 0.5);
    boom.stop(t + 2.5);
  }

  /* ----------------------------- mécanique ---------------------------- */

  private ready() {
    return Boolean(this.ctx && this.enabled);
  }

  private build() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    this.music = ctx.createGain();
    this.sfx = ctx.createGain();
    for (const bus of [this.music, this.sfx]) {
      bus.connect(dry);
      bus.connect(reverb);
    }
    reverb.connect(wet);
    dry.connect(comp);
    wet.connect(comp);
    comp.connect(this.master);
    this.master.connect(ctx.destination);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }

  private fade(target: number, seconds: number) {
    if (!this.ctx) return;
    const g = this.master.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(g.value, 0.0001), t);
    g.exponentialRampToValueAtTime(Math.max(target * 0.7, 0.0001), t + seconds);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (this.next < ctx.currentTime - 1) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.6) {
      this.playBar(this.bar, this.next);
      this.next += BAR;
      this.bar++;
    }
  }

  private playBar(bar: number, t: number) {
    const [bass, notes] = CHORDS[bar % CHORDS.length];
    notes.forEach((note) => this.pad(freq(note), t, BAR + 1.2, 0.014, this.music));
    this.pad(freq(bass), t, BAR + 0.8, 0.028, this.music);
    this.pad(freq(bass - 12), t, BAR + 0.8, 0.02, this.music);
    // Quelques cloches, jamais les mêmes.
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const at = t + (Math.floor(Math.random() * 8) * BAR) / 8;
      const note = SCALE[Math.floor(Math.random() * SCALE.length)];
      this.bell(freq(note), at, 0.035 + Math.random() * 0.025, 3.4, this.music);
    }
  }

  private pad(f: number, t: number, duration: number, force: number, out: AudioNode) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(force, t + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0.0001, t + duration);
    filter.connect(gain).connect(out);
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }
  }

  private bell(f: number, t: number, force: number, duration: number, out: AudioNode) {
    const ctx = this.ctx!;
    for (const [ratio, part, length] of [
      [1, 1, 1],
      [2, 0.25, 0.5],
      [3.01, 0.08, 0.25],
    ]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f * ratio;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(force * part, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration * length);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + duration * length + 0.05);
    }
  }
}

export const audio = new Audio_();

/* ============================================================= *
 *  Sadhana - background ambience, played from real recordings
 *  (static/audio/tracks/*.mp3 - nature sounds + instruments)
 * ============================================================= */
const Ambience = {
  el: null,
  current: null,
  _pv: null,

  _audio(){
    if (!this.el){
      this.el = new Audio();
      this.el.loop = true;
      this.el.volume = 0;
      this.el.preload = 'auto';
    }
    return this.el;
  },

  /* fade the <audio> element's volume smoothly */
  _fade(to, ms){
    const a = this.el; if (!a) return;
    clearInterval(this._fadeT);
    const from = a.volume, steps = 20, dt = ms/steps;
    let i = 0;
    this._fadeT = setInterval(()=>{
      i++; a.volume = Math.max(0, Math.min(1, from + (to-from)*(i/steps)));
      if (i >= steps){ clearInterval(this._fadeT); if (to === 0) a.pause(); }
    }, dt);
  },

  play(id, { vol=0.55 } = {}){
    this.stop(true);
    this.current = id;
    const track = DATA.findTrack(id);
    if (!track || track.id === 'silence') return;
    const a = this._audio();
    a.src = AUD + 'tracks/' + track.file;
    a.currentTime = 0;
    a.volume = 0;
    a.play().catch(()=>{});
    this._fade(vol, 1200);
  },

  stop(quiet){
    this.current = null;
    if (!this.el) return;
    if (quiet){ try{ this.el.pause(); }catch(e){} this.el.volume = 0; return; }
    this._fade(0, 500);
  },

  /* short preview for the sound-picker screens */
  preview(id){
    this.play(id);
    clearTimeout(this._pv);
    this._pv = setTimeout(()=> this.stop(), 4000);
  },
};

/* ============================================================= *
 *  ChantVoice - a warm vowel-formant drone that chants AUM / OM as
 *  ONE continuous sound (never letter-by-letter). A flows into U
 *  flows into a closed humming M, with a gentle fade at the end.
 *   AUM ≈ A 40% · U 30% · M 30%      OM ≈ O 55% · M 45%
 * ============================================================= */
const ChantVoice = {
  ctx: null,
  _nodes: null,

  _ac(){
    if (!this.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
    return this.ctx;
  },

  /* formant targets (Hz) for each mouth shape at a low chant fundamental */
  _shape:{
    A:{ f:[720,1180,2600], g:[1,0.7,0.28], lp:3600, base:1.00 },
    O:{ f:[480, 860,2500], g:[1,0.55,0.20], lp:2600, base:0.98 },
    U:{ f:[330, 720,2300], g:[1,0.45,0.14], lp:1700, base:0.96 },
    M:{ f:[250, 900,2100], g:[1,0.22,0.06], lp:820,  base:0.93 },
  },

  stop(fade=0.5){
    const n = this._nodes; if (!n) return;
    this._nodes = null;
    try {
      const now = this.ctx.currentTime;
      n.master.gain.cancelScheduledValues(now);
      n.master.gain.setValueAtTime(n.master.gain.value, now);
      n.master.gain.linearRampToValueAtTime(0.0001, now + fade);
      n.osc.forEach(o=> o.stop(now + fade + 0.05));
      n.lfo.stop(now + fade + 0.05);
    } catch(e){}
  },

  /* kind: 'AUM' | 'OM' | 'A' | 'U' | 'M'  ·  dur in seconds  */
  play(kind='AUM', dur=8, { volume=0.5 } = {}){
    if (!Voice.on) return;
    const ac = this._ac(); if (!ac) return;
    this.stop(0.15);
    const t0 = ac.currentTime + 0.05;
    const F0 = 118;                                   // fundamental - low, calm

    // two detuned saws → a fuller "vocal cord" tone
    const osc = [ac.createOscillator(), ac.createOscillator()];
    osc[0].type = 'sawtooth'; osc[1].type = 'sawtooth';
    osc[0].frequency.value = F0; osc[1].frequency.value = F0;
    osc[1].detune.value = 6;

    // gentle vibrato
    const lfo = ac.createOscillator(); lfo.frequency.value = 4.7;
    const lfoGain = ac.createGain();   lfoGain.gain.value = 2.2;
    lfo.connect(lfoGain); lfoGain.connect(osc[0].frequency); lfoGain.connect(osc[1].frequency);

    const src = ac.createGain(); src.gain.value = 0.5;
    osc.forEach(o=> o.connect(src));

    // 3 parallel band-pass "formants" + a mouth low-pass that closes for M
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    const bp = [0,1,2].map(()=>{ const f = ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=7; return f; });
    const bg = [0,1,2].map(()=>{ const g = ac.createGain(); return g; });
    const master = ac.createGain(); master.gain.value = 0.0001;
    bp.forEach((f,i)=>{ src.connect(f); f.connect(bg[i]); bg[i].connect(lp); });
    lp.connect(master); master.connect(ac.destination);

    // ---- schedule the mouth-shape morph -----------------------------------
    const seq = kind === 'OM'  ? [['O',0.55],['M',0.45]]
              : kind === 'A'   ? [['A',1]]
              : kind === 'U'   ? [['U',1]]
              : kind === 'M'   ? [['M',1]]
              :                  [['A',0.40],['U',0.30],['M',0.30]];   // AUM

    const setShape = (name, tAt, ramp)=>{
      const s = this._shape[name];
      bp.forEach((f,i)=> f.frequency.linearRampToValueAtTime(s.f[i], tAt + ramp));
      bg.forEach((g,i)=> g.gain.linearRampToValueAtTime(s.g[i]*0.9, tAt + ramp));
      lp.frequency.linearRampToValueAtTime(s.lp, tAt + ramp);
      osc.forEach(o=> o.frequency.linearRampToValueAtTime(F0*s.base, tAt + ramp));
    };
    // start on the first shape
    (function initShape(self){
      const s = self._shape[seq[0][0]];
      bp.forEach((f,i)=> f.frequency.setValueAtTime(s.f[i], t0));
      bg.forEach((g,i)=> g.gain.setValueAtTime(s.g[i]*0.9, t0));
      lp.frequency.setValueAtTime(s.lp, t0);
    })(this);

    let acc = 0;
    seq.forEach(([name, frac], i)=>{
      const segStart = t0 + acc*dur;
      if (i > 0) setShape(name, segStart, Math.min(0.9, frac*dur*0.5));
      acc += frac;
    });

    // ---- amplitude envelope: slow swell, hold, natural fade ---------------
    const g = master.gain;
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(volume, t0 + Math.min(0.9, dur*0.14));   // breath-in swell
    g.setValueAtTime(volume, t0 + dur*0.68);
    g.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);            // let the M hum fade

    osc.forEach(o=> o.start(t0));
    lfo.start(t0);
    const stopAt = t0 + dur + 0.6;
    osc.forEach(o=> o.stop(stopAt)); lfo.stop(stopAt);

    this._nodes = { osc, lfo, master };
  },
};

/* the recorded AUM / OM chant (static/audio/chanting/*.mp3) - played as the
   guide during the chanting meditation. */
const ChantAudio = {
  el: null,
  _audio(){
    if (!this.el){ this.el = new Audio(); this.el.preload = 'auto'; }
    return this.el;
  },
  /* kind: 'AUM' | 'OM'  →  returns the clip length in seconds (best-effort) */
  play(kind='AUM', { volume=1 } = {}){
    if (!Voice.on) return 0;
    const a = this._audio();
    a.src = AUD + 'chanting/' + (kind === 'OM' ? 'om.mp3' : 'aum.mp3');
    a.volume = Math.max(0, Math.min(1, volume));
    a.currentTime = 0;
    a.play().catch(()=>{});
    return kind === 'OM' ? 7.9 : 6.7;
  },
  stop(){ if (this.el){ try { this.el.pause(); this.el.currentTime = 0; } catch(e){} } },
};

/* a single soft bell/chime - used as a gentle transition cue before spoken
   instructions (session start, warm-up step change, pose complete) */
const Chime = {
  el: null,
  ring(vol=0.6){
    try{
      if (!this.el){ this.el = new Audio(AUD + 'chime.mp3'); }
      this.el.currentTime = 0; this.el.volume = vol; this.el.play().catch(()=>{});
    }catch(e){}
  },
};

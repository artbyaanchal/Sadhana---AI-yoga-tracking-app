/* ============================================================= *
 *  Sadhana - Voice guidance + client-side Tree-Pose tracker
 * ============================================================= */

/* ---- Voice - soft, calm guidance ------------------------------ */
const Voice = {
  on: true,
  _last: {},
  _ok: false,
  _voice: null,
  init(){
    if (!('speechSynthesis' in window)) { this.on = false; return; }
    const pick = ()=>{
      const list = speechSynthesis.getVoices() || [];
      if (!list.length) return;
      // prefer the softest, most natural English voice the device offers.
      // (on a phone this lands on Samantha / Karen / Google … - the SAPI
      //  "David/Mark/George" voices are the robotic ones we push to the bottom)
      const rank = v => {
        const n = v.name.toLowerCase();
        let r = 0;
        if (/samantha|karen|moira|tessa|fiona|serena|allison|ava|nicky|kate|libby|sonia|aria|jenny|nova|shimmer/.test(n)) r += 12;
        if (/google (uk|us) english/.test(n)) r += 9;
        if (/siri|natural|neural|enhanced|premium|online/.test(n)) r += 6;
        if (/female|woman|zira|hazel|susan|heera/.test(n)) r += 4;
        if (/david|mark|george|ravi|guy|christopher|eric|james|male|man/.test(n)) r -= 8;
        if (v.lang && /^en([-_]|$)/i.test(v.lang)) r += 3;
        if (v.lang && /^en[-_](gb|au|ie)/i.test(v.lang)) r += 1;   // gentler cadence
        if (!v.localService) r += 2;                                 // cloud voices are smoother
        return r;
      };
      this._voice = list.slice().sort((a,b)=> rank(b)-rank(a))[0] || null;
    };
    pick();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pick);
    const warm = ()=>{
      this._ok = true;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch(e){}
      window.removeEventListener('pointerdown', warm);
    };
    window.addEventListener('pointerdown', warm);
  },
  vol: 1,
  duck(on){ this.vol = on ? 0.45 : 1; },          // lower TTS while background sound plays
  toggle(){ this.on = !this.on; if (!this.on) speechSynthesis.cancel(); return this.on; },
  _speak(text, rate, pitch, vol){
    const u = new SpeechSynthesisUtterance(text);
    if (this._voice) u.voice = this._voice;
    u.rate = rate; u.pitch = pitch;
    u.volume = Math.max(0, Math.min(1, (vol == null ? 1 : vol) * this.vol));
    u.lang = (this._voice && this._voice.lang) || 'en-US';
    try { speechSynthesis.speak(u); } catch(e){}
  },
  /* time-critical: cancel anything pending and speak immediately (countdowns, breath phases) -
     kept unhurried and soft rather than brisk */
  cue(text){
    if (!this.on || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); } catch(e){}
    this._speak(text, 0.9, 0.94, 0.9);
  },
  /* meditation / chant narration - the softest, slowest voice in the app.
     Sentences are spoken one at a time with a gentle breath-like pause
     between them so it never feels rushed. */
  zen(text, {gap=0, force=false} = {}){
    if (!this.on || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!force && this._last[text] && now - this._last[text] < (gap||3500)) return;
    this._last[text] = now;
    if (speechSynthesis.pending) { try { speechSynthesis.cancel(); } catch(e){} }
    const parts = String(text).replace(/([.!?…])\s+/g, '$1\n').split(/\n|\s*…\s*/)
      .map(s=>s.trim()).filter(Boolean);
    parts.forEach((line, i)=>{
      const u = new SpeechSynthesisUtterance(line + ' , ');   // trailing pause
      if (this._voice) u.voice = this._voice;
      u.rate = 0.68; u.pitch = 0.82;                          // slow, calm
      u.volume = Math.min(1, this.vol);                       // full volume - was too quiet
      u.lang = (this._voice && this._voice.lang) || 'en-US';
      try { speechSynthesis.speak(u); } catch(e){}
    });
  },
  /* guidance: rate-limited, but never let the queue pile up */
  say(text, {gap=0, force=false} = {}){
    if (!this.on || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!force && this._last[text] && now - this._last[text] < (gap||3500)) return;
    this._last[text] = now;
    if (speechSynthesis.pending) { try { speechSynthesis.cancel(); } catch(e){} }
    this._speak(text, 0.88, 0.92, 0.92);
  },
  stop(){ if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch(e){} },
};
Voice.init();

/* ---- breathing-cycle narrator: "breathe in" -> "hold" -> "breathe out",
   looped for the length of a tracking session; the very last "breathe out"
   becomes "Breathe out, and relax." ------------------------------------ */
class BreathCycle {
  constructor({ totalSec, onPhase, phases, lastPhaseKey, lastLabel } = {}){
    this.totalSec = totalSec;
    this.onPhase = onPhase || (()=>{});
    this.phases = phases || [ ['in', 4, 'Breathe in'], ['hold', 3, 'Hold'], ['out', 4, 'Breathe out'] ];
    this.lastPhaseKey = lastPhaseKey || 'out';
    this.lastLabel = lastLabel || 'Breathe out, and relax.';
    this.cycleLen = this.phases.reduce((a,p)=>a+p[1], 0);
    this._idx = -1;
    this._raf = null;
  }
  start(t0){
    this.t0 = t0 || performance.now();
    this._tick();
  }
  _tick(){
    const el = (performance.now() - this.t0) / 1000;
    if (el >= this.totalSec){ return; }
    const inCycle = el % this.cycleLen;
    let acc = 0, idx = 0;
    for (let i=0;i<this.phases.length;i++){ acc += this.phases[i][1]; if (inCycle < acc){ idx = i; break; } }
    if (idx !== this._idx){
      this._idx = idx;
      const [key,,label] = this.phases[idx];
      const isLast = key === this.lastPhaseKey && (this.totalSec - el) < this.cycleLen;
      this.onPhase(key, isLast ? this.lastLabel : label, isLast);
    }
    this._raf = setTimeout(()=> this._tick(), 250);
  }
  stop(){ clearTimeout(this._raf); }
}

/* ---- geometry helpers (ported from app.py) ------------------ */
const dist = (a,b)=> Math.hypot(a[0]-b[0], a[1]-b[1]);
function angle(a,b,c){
  let r = Math.atan2(c[1]-b[1], c[0]-b[0]) - Math.atan2(a[1]-b[1], a[0]-b[0]);
  let d = Math.abs(r*180/Math.PI);
  return d > 180 ? 360 - d : d;
}

function treePoseScore(L){
  const need = [0,11,12,13,14,15,16,23,24,25,26,27,28];
  if (!L || need.some(i => !L[i])) return { total:0, parts:{} };
  const nose=L[0], lw=L[15], rw=L[16], ls=L[11], rs=L[12],
        le=L[13], re=L[14], lh=L[23], rh=L[24],
        lk=L[25], rk=L[26], la=L[27], ra=L[28];

  const shoulderW = dist(ls,rs) || 1;
  const torso = dist([(ls[0]+rs[0])/2,(ls[1]+rs[1])/2],[(lh[0]+rh[0])/2,(lh[1]+rh[1])/2]) || 1;
  const legLen = dist(lh,la) || 1;
  const p = {};

  const nwd = dist(lw,rw)/shoulderW;
  p.hands_joined = nwd < 0.3 ? 25 : nwd < 0.8 ? 25*(1-(nwd-0.3)/0.5) : 0;

  const wcy = (lw[1]+rw[1])/2;
  const nh = (nose[1]-wcy)/torso;
  p.hands_above_head = nh > 0.3 ? 20 : nh > 0.1 ? 20*((nh-0.1)/0.2) : 0;

  const ea = (angle(ls,le,lw) + angle(rs,re,rw))/2;
  p.arms_straight = ea > 160 ? 20 : ea > 130 ? 20*((ea-130)/30) : 0;

  const d = Math.min(dist(la,rk), dist(ra,lk)) / legLen;
  p.foot_on_knee = (d>0.15 && d<0.6) ? 20 : (d>0.1 && d<0.7) ? 20*(1-Math.abs(d-0.35)/0.35) : 0;

  const lla = angle(lh,lk,la), rla = angle(rh,rk,ra);
  const mla = Math.max(lla,rla);
  p.standing_leg_straight = mla > 160 ? 15 : mla > 140 ? 15*((mla-140)/20) : 0;

  const lb = lla < 140, rb = rla < 140;
  p.leg_configuration = (lb !== rb) ? (p.foot_on_knee > 15 ? 10 : 5) : 0;

  const total = Math.min(Object.values(p).reduce((a,b)=>a+b,0), 100);
  return { total, parts:p };
}

/* skeleton connections */
const CONNS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],
  [23,25],[24,26],[25,27],[26,28],[27,31],[28,32],[15,19],[16,20]];

/* the camera <video> is shown with object-fit:cover, so its native frame is
   cropped to fill the box - landmark coords (0..1 of the RAW camera frame)
   must be mapped through that same crop, or the skeleton drifts off the
   body as soon as the camera's aspect ratio differs from the on-screen box */
function coverMap(video, W, H){
  const vw = video.videoWidth || W, vh = video.videoHeight || H;
  const scale = Math.max(W / vw, H / vh);
  const dw = vw * scale, dh = vh * scale;
  return { ox: (W - dw) / 2, oy: (H - dh) / 2, sx: dw, sy: dh };
}

/* ---- shared camera + MediaPipe setup ---------------------- */
async function setupPoseCam(host){
  const video = h('video',{playsinline:'', muted:'', autoplay:''});
  const canvas = h('canvas',{});
  host.prepend(canvas); host.prepend(video);
  const msg = h('div',{class:'msg'}, h('div',{}, 'Starting camera…'));
  host.append(msg);
  const out = { video, canvas, ctx: canvas.getContext('2d'), msg, ok:false };

  try {
    out.stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:720} }, audio:false });
    video.srcObject = out.stream; await video.play();
  } catch(e){
    msg.firstChild.textContent = 'Camera access is needed for AI tracking. Allow the camera and reload. ('+(e.message||e.name)+')';
    return out;
  }
  msg.firstChild.textContent = 'Loading pose model…';
  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    const opts = (delegate)=>({ baseOptions:{ modelAssetPath: window.SADHANA_MODEL, delegate },
      runningMode:'VIDEO', numPoses:1,
      minPoseDetectionConfidence:0.6, minPosePresenceConfidence:0.6, minTrackingConfidence:0.6 });
    out.landmarker = await vision.PoseLandmarker.createFromOptions(fileset, opts('GPU'))
      .catch(async ()=> vision.PoseLandmarker.createFromOptions(fileset, opts('CPU')));
  } catch(e){
    msg.firstChild.textContent = 'Could not load the pose model (needs internet for the MediaPipe runtime). '+(e.message||'');
    return out;
  }
  msg.remove(); out.ok = true;
  return out;
}
function rawLM(res){
  if (!res || !res.landmarks || !res.landmarks[0]) return { L:{}, V:{} };
  const L={}, V={};
  res.landmarks[0].forEach((pt,i)=>{ L[i]=[pt.x,pt.y]; V[i]=pt.visibility ?? 1; });
  return { L, V };
}

/* ---- Tracker ----------------------------------------------- */
class TreeTracker {
  constructor(host, { onScore, onEnd } = {}){
    this.host = host;
    this.onScore = onScore || (()=>{});
    this.onEnd = onEnd || (()=>{});
    this.buf = [];
    this.running = false;
    this.holdT = 0;
    this.bestHold = 0;
    this.finished = false;
    this._timers = [];
  }
  _seq(lines){                                    // speak a setup script, line by line
    let at = 0;
    lines.forEach(([delay, text])=>{
      at += delay;
      this._timers.push(setTimeout(()=>{ if (this.running) Voice.say(text, {force:true}); }, at));
    });
  }
  _clearTimers(){ this._timers.forEach(clearTimeout); this._timers = []; }

  async start(){
    const cam = await setupPoseCam(this.host);
    this.video = cam.video; this.canvas = cam.canvas; this.ctx = cam.ctx;
    this.stream = cam.stream; this.landmarker = cam.landmarker;
    if (!cam.ok) return;

    this.running = true;
    this.phase = 'calibrating';
    this.floorScore = 0;
    this.floorY = null;
    this._feetHist = [];
    this.sessionSec = DATA.pose.sec || 45;   // Tree-Pose session length - split across both legs
    this.sideSec = this.sessionSec / 2;
    this.side = 'left';                       // lift the LEFT foot first, then the right - balance on both
    this.bestSide = { left:0, right:0 };
    this.elapsed = 0;
    this.best = 0;

    this.calib = h('div',{class:'calib'},
      h('div',{class:'t'}, 'Point the camera so your whole body and the floor are visible'),
      h('div',{class:'p'}, h('i',{style:{width:'0%'}})));
    this.host.append(this.calib);
    this.floorEl = h('div',{class:'floorline', style:{top:'85%', opacity:0}});
    this.host.append(this.floorEl);

    Voice.say('Set your phone down and step back so I can see your whole body and the floor.', {force:true});
    this._t0 = performance.now();
    this._loop();
  }

  _sideLabel(){ return this.side === 'left' ? 'left' : 'right'; }

  /* is the lifted foot resting ON the standing-leg knee joint? (unsafe) */
  _kneeCheck(L){
    const onLeft = this.side === 'left';          // standing on the left leg
    const knee = onLeft ? L[25] : L[26];
    const foot = onLeft ? L[28] : L[27];          // the LIFTED foot's ankle
    const hip  = onLeft ? L[23] : L[24];
    const ank  = onLeft ? L[27] : L[28];          // the standing ankle
    if (!knee || !foot || !hip || !ank) return { onKnee:false };
    const legLen = Math.hypot(hip[0]-ank[0], hip[1]-ank[1]) || 1;
    const d = Math.hypot(foot[0]-knee[0], foot[1]-knee[1]) / legLen;
    return { onKnee: d < 0.17 };                  // ankle sitting right at the knee
  }

  _resize(){
    const r = this.host.getBoundingClientRect();
    this.canvas.width = r.width; this.canvas.height = r.height;
  }

  _loop(){
    if (!this.running) return;
    const vid = this.video;
    if (vid.readyState >= 2 && this.landmarker && vid.currentTime !== this._lastVT){
      this._lastVT = vid.currentTime;
      this._resize();
      let res;
      try { res = this.landmarker.detectForVideo(vid, performance.now()); } catch(e){}
      const { L, V } = rawLM(res);
      const has = Object.keys(L).length > 0;

      if (this.phase === 'calibrating'){
        this._calibrate(L, V, has);
        this._draw(L, has, 0, false);
      } else {
        const { total, parts } = treePoseScore(L);
        const knee = this._kneeCheck(L);
        this.buf.push(knee.onKnee ? Math.min(total, 10) : total);
        if (this.buf.length > 8) this.buf.shift();
        let s = Math.round(this.buf.reduce((a,b)=>a+b,0)/this.buf.length);
        if (knee.onKnee) s = Math.min(s, 12);          // foot on the knee → red, always
        this.best = Math.max(this.best, s);
        this.bestSide[this.side] = Math.max(this.bestSide[this.side], s);
        this._draw(L, has, s, true);
        this._guide(s, parts, has, knee.onKnee);

        // sessionSec total, split evenly: stand on the left leg, then the right
        this.elapsed = (performance.now() - this._trackT0) / 1000;
        if (this.side === 'left' && this.elapsed >= this.sideSec){
          this.side = 'right'; this.buf = []; this.holdT = 0; this._praised = false;
          Voice.say('Halfway. Switch - stand on your right leg, and lift your left foot.', {force:true});
          this.onSide && this.onSide('right');
        }
        const left = Math.max(0, this.sessionSec - this.elapsed);
        this.onScore(s, parts, left, this.side, knee.onKnee);
        if (left <= 0 && !this.finished){
          this.finished = true;
          Voice.say('And release. Lower your foot, and stand tall. Well done.', {force:true});
          const combined = Math.round((this.bestSide.left + this.bestSide.right) / 2) || this.best;
          setTimeout(()=> this.onEnd(combined, this.bestSide), 1700);
        }
      }
    }
    this._raf = requestAnimationFrame(()=> this._loop());
  }

  _calibrate(L, V, has){
    const CAL_TARGET = 48;                 // ~1.6s of good frames
    const feetIdx = [27,28,29,30,31,32];
    const feetPts = feetIdx.filter(i => L[i] && (V[i] ?? 0) > 0.45).map(i => L[i][1]);
    const nose = L[0];

    // whole body visible: head near top, feet near bottom, feet confidently seen
    const feetY = feetPts.length ? feetPts.reduce((a,b)=>a+b,0)/feetPts.length : null;
    const fullBody = has && nose && feetPts.length >= 2 && nose[1] < 0.42 && feetY > 0.68;

    // stability: feet Y not jumping around
    this._feetHist.push(feetY ?? -1); if (this._feetHist.length > 12) this._feetHist.shift();
    const valid = this._feetHist.filter(v => v > 0);
    const stable = valid.length >= 6 &&
      (Math.max(...valid) - Math.min(...valid)) < 0.06;

    if (fullBody && stable){
      this.floorScore = Math.min(CAL_TARGET, this.floorScore + 1);
      this.floorY = this.floorY == null ? feetY : this.floorY * 0.8 + feetY * 0.2;
    } else {
      this.floorScore = Math.max(0, this.floorScore - 1.5);
    }

    // update the calib banner
    const pct = Math.round(this.floorScore / CAL_TARGET * 100);
    this.calib.querySelector('i').style.width = pct + '%';
    const t = this.calib.querySelector('.t');
    t.textContent = !has ? 'Step into the frame - I can’t see you yet'
      : !fullBody ? 'Move back until your head and feet are both in view'
      : !stable ? 'Hold still…'
      : 'Detecting the floor…';

    if (this.floorY != null){
      this.floorEl.style.top = (this.floorY * 100) + '%';
      this.floorEl.style.opacity = 0.35 + 0.65 * (this.floorScore / CAL_TARGET);
    }

    if (this.floorScore >= CAL_TARGET){
      this.phase = 'tracking';
      this._trackT0 = performance.now();
      this.calib.classList.add('ok');
      this.calib.querySelector('.t').textContent = 'Detected ✓  Build the pose - I’ll follow along';
      setTimeout(()=>{ this.calib && this.calib.remove(); }, 1800);

      // one-time guided set-up only - after this the tracker just reads the pose
      this._seq([
        [ 200,  'You’re detected. Stand tall, feet together.' ],
        [ 4200, 'Shift your weight onto your left leg.' ],
        [ 4600, 'Place your right foot on your inner calf or thigh - not on the knee.' ],
        [ 5000, 'Hands together at your chest, or overhead.' ],
        [ 4200, 'Settle, and find your balance.' ],
        [ 4200, 'Keep your gaze on one fixed point.' ],
      ]);
    }
  }

  _draw(L, has, s, skeleton){
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0,0,W,H);
    if (!has) return;
    const m = coverMap(this.video, W, H);
    const px = i => m.ox + L[i][0]*m.sx, py = i => m.oy + L[i][1]*m.sy;

    if (!skeleton){
      // calibration: just mark the feet / floor contact points softly
      c.fillStyle = 'rgba(127,208,160,.9)';
      for (const i of [27,28,29,30,31,32]){ if (!L[i]) continue;
        c.beginPath(); c.arc(px(i), py(i), 5, 0, 7); c.fill(); }
      return;
    }
    const col = s>=80 ? '#3FA65B' : s>=60 ? '#E7C13C' : s>=40 ? '#E7A13C' : '#D6584B';
    c.lineWidth = 4; c.strokeStyle = col; c.fillStyle = '#fff';
    for (const [a,b] of CONNS){
      if (!L[a] || !L[b]) continue;
      c.beginPath(); c.moveTo(px(a), py(a)); c.lineTo(px(b), py(b)); c.stroke();
    }
    for (const k in L){ c.beginPath(); c.arc(px(k), py(k), 4, 0, 7); c.fill(); }
  }

  _guide(s, parts, has, kneeDanger){
    if (!has){ this._setCues([]); return; }

    // ---- SAFETY: foot on the knee joint -----------------------------------
    if (kneeDanger){
      this.holdT = 0; this._praised = false;
      this._setCues([['⚠ Foot is on the knee - move it above or below the joint', 0]]);
      Voice.say('Take your foot off the knee. Resting it on the knee can strain the joint. Move it onto your calf, or your inner thigh.', {gap:8000});
      return;
    }

    const cues = [];
    const bad = k => (parts[k]||0) < (k==='hands_joined'?14 : k==='hands_above_head'?11 : 8);
    if (bad('hands_above_head')) cues.push(['Raise your arms overhead', 0]);
    else if (bad('hands_joined')) cues.push(['Bring your palms together', 0]);
    else if (bad('arms_straight')) cues.push(['Straighten your arms', 0]);
    if (bad('foot_on_knee')) cues.push(['Press your foot into your inner calf or thigh', 0]);
    else if (bad('standing_leg_straight')) cues.push(['Straighten your standing leg', 0]);

    // on-screen text cues update every frame; a spoken nudge only if the pose
    // has been off for a while (no breath narrator competing now)
    if (s >= 78){
      cues.length = 0; cues.push(['Beautiful - steady now', 1]);
      this.holdT += 1/30;
      if (this.holdT > 5 && !this._praised){ Voice.say('Beautiful. Stay with it.', {gap:16000}); this._praised = true; }
    } else {
      this.holdT = 0; this._praised = false;
      if (cues[0]) Voice.say(cues[0][0], {gap:9000});
    }
    this._setCues(cues);
  }

  _setCues(list){
    if (!this._cuesEl) return;
    this._cuesEl.replaceChildren(...list.map(([t,ok])=>
      h('div',{class:'cue'+(ok?' ok':'')}, (ok?'✓ ':'• ')+t)));
  }
  bindCues(el){ this._cuesEl = el; }

  stop(){
    this.running = false;
    cancelAnimationFrame(this._raf);
    this._clearTimers();
    Voice.stop();
    try { this.calib && this.calib.remove(); } catch(e){}
    try { this.floorEl && this.floorEl.remove(); } catch(e){}
    if (this.stream) this.stream.getTracks().forEach(t=> t.stop());
    try { this.landmarker && this.landmarker.close(); } catch(e){}
  }
}


/* ============================================================= *
 *  MeditationTracker - sit on the floor, back straight, be still
 * ============================================================= */
class MeditationTracker {
  constructor(host, { durationSec=600, onTick, onCues, onEnd } = {}){
    this.host = host;
    this.durationSec = durationSec;
    this.onTick = onTick || (()=>{});
    this.onCues = onCues || (()=>{});
    this.onEnd  = onEnd  || (()=>{});
    this.running = false;
  }

  async start(){
    const cam = await setupPoseCam(this.host);
    this.video = cam.video; this.canvas = cam.canvas; this.ctx = cam.ctx;
    this.stream = cam.stream; this.landmarker = cam.landmarker;
    if (!cam.ok) return;

    this.running = true;
    this.phase = 'calibrating';
    this.calScore = 0;
    this.seatY = null;
    this._hist = [];
    this.prev = null;
    this.motionEMA = 0;
    this.handMotionEMA = 0;
    this.stillSum = 0; this.stillN = 0;
    this.finished = false;
    this._smooth = {};       // per-landmark smoothed draw position (kills stick-figure jitter)
    this._score = 100;       // combined body+hand correctness, drives the skeleton colour

    this.calib = h('div',{class:'calib'},
      h('div',{class:'t'}, 'Sit on the floor, cross-legged, facing the camera'),
      h('div',{class:'p'}, h('i',{style:{width:'0%'}})));
    this.host.append(this.calib);
    this.seatEl = h('div',{class:'floorline', style:{top:'80%', opacity:0}});
    this.host.append(this.seatEl);

    Voice.zen('Sit down on the floor, cross-legged, facing the camera. Rest your hands on your knees.', {force:true});
    this._loop();
  }

  _resize(){ const r = this.host.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; }

  _loop(){
    if (!this.running) return;
    const vid = this.video;
    if (vid.readyState >= 2 && this.landmarker && vid.currentTime !== this._lastVT){
      this._lastVT = vid.currentTime;
      this._resize();
      let res;
      try { res = this.landmarker.detectForVideo(vid, performance.now()); } catch(e){}
      const { L, V } = rawLM(res);
      const has = Object.keys(L).length > 0;

      if (this.phase === 'calibrating'){ this._calibrate(L, V, has); this._draw(L, has, false); }
      else { this._track(L, V, has); this._draw(L, has, true); }
    }
    this._raf = requestAnimationFrame(()=> this._loop());
  }

  _seated(L, V){
    const ls=L[11], rs=L[12], lh=L[23], rh=L[24], lk=L[25], rk=L[26], nose=L[0];
    const vis = i => (V && V[i] != null) ? V[i] : 0;
    const shouldersSeen = ls && rs && vis(11) > 0.65 && vis(12) > 0.65;
    const hipsSeen      = lh && rh && vis(23) > 0.5  && vis(24) > 0.5;
    if (!nose || !shouldersSeen || !hipsSeen) return { ok:false, need: !shouldersSeen ? 'shoulders' : 'hips' };
    const shoulderY = (ls[1]+rs[1])/2, hipY = (lh[1]+rh[1])/2;
    const kneeY = (lk&&rk) ? (lk[1]+rk[1])/2 : hipY+0.05;
    // seated: shoulders clearly above hips, knees roughly level with / above hips (folded legs),
    // whole upper body in frame, hips in the lower-middle of the view
    const upright = (hipY - shoulderY) > 0.14;
    const folded  = kneeY < hipY + 0.12;
    const inView  = nose[1] > 0.05 && nose[1] < 0.5 && hipY > 0.55 && hipY < 0.97;
    return { ok: upright && folded && inView, hipY, shoulderY };
  }

  _calibrate(L, V, has){
    const CAL = 45;
    const s = this._seated(L, V);
    this._hist.push(s.ok ? s.hipY : -1); if (this._hist.length > 12) this._hist.shift();
    const valid = this._hist.filter(v=>v>0);
    const stable = valid.length >= 6 && (Math.max(...valid)-Math.min(...valid)) < 0.05;

    if (has && s.ok && stable){
      this.calScore = Math.min(CAL, this.calScore + 1);
      this.seatY = this.seatY==null ? s.hipY : this.seatY*0.8 + s.hipY*0.2;
    } else {
      this.calScore = Math.max(0, this.calScore - 1.5);
    }
    this.calib.querySelector('i').style.width = Math.round(this.calScore/CAL*100)+'%';
    this.calib.querySelector('.t').textContent =
      !has ? 'Come into the frame' :
      s.need === 'shoulders' ? 'Move back so your head and shoulders are in view' :
      s.need === 'hips' ? 'Sit down and move back - I need to see you seated' :
      !s.ok ? 'Sit down, cross-legged, facing the camera' :
      !stable ? 'Settle and be still…' : 'Detecting your seat…';
    if (this.seatY != null){ this.seatEl.style.top = (this.seatY*100)+'%';
      this.seatEl.style.opacity = 0.3 + 0.7*(this.calScore/CAL); }

    if (this.calScore >= CAL){
      this.phase = 'meditating';
      this._t0 = performance.now();
      this.calib.classList.add('ok');
      this.calib.querySelector('.t').textContent = 'Seated ✓  Close your eyes and be still';
      Voice.zen('You are seated. Lengthen your spine, soften your eyes, and begin.', {force:true});
      setTimeout(()=>{ this.calib && this.calib.remove(); }, 2000);

      // calm, looping narration for the whole sitting - very slow, very soft
      this.breath = new BreathCycle({
        totalSec: this.durationSec,
        phases: [ ['relax', 3, 'Relax yourself.'], ['release', 3, 'Release the stress.'],
                  ['in', 5, 'Take a deep breath… and hold.'], ['out', 4, 'Breathe out.'] ],
        lastPhaseKey: 'out', lastLabel: 'Breathe out… and relax completely.',
        onPhase: (key, label)=>{ Voice.zen(label, {force:true}); },
      });
      this.breath.start(this._t0);
    }
  }

  _track(L, V, has){
    const now = performance.now();
    const left = Math.max(0, this.durationSec - (now - this._t0)/1000);

    // body stillness = mean landmark shift for head/shoulders/hips
    const keys = [0,11,12,23,24];
    let motion = 0, n = 0;
    if (has && this.prev){
      for (const k of keys){ if (L[k] && this.prev[k]){
        motion += Math.hypot(L[k][0]-this.prev[k][0], L[k][1]-this.prev[k][1]); n++;
      }}
      if (n) motion = motion / n;
    }
    // hand stillness, tracked separately - fidgeting hands shouldn't hide behind a calm torso
    const handKeys = [15,16,19,20,21,22];
    let handMotion = 0, hn = 0;
    if (has && this.prev){
      for (const k of handKeys){ if (L[k] && this.prev[k]){
        handMotion += Math.hypot(L[k][0]-this.prev[k][0], L[k][1]-this.prev[k][1]); hn++;
      }}
      if (hn) handMotion = handMotion / hn;
    }
    this.prev = has ? {...L} : this.prev;
    // slow EMA - meditation is forgiving; a brief shift shouldn't tank the score
    this.motionEMA = this.motionEMA*0.96 + motion*0.04;
    this.handMotionEMA = this.handMotionEMA*0.9 + handMotion*0.1;

    // mudra check: thumb resting near index (a gentle pinch), hand resting near the knee
    const lw=L[15], rw=L[16], li=L[19], ri=L[20], lt=L[21], rt=L[22], lk=L[25], rk=L[26];
    const ls=L[11], rs=L[12], lh=L[23], rh=L[24];
    const shoulderW = (ls&&rs) ? Math.hypot(ls[0]-rs[0], ls[1]-rs[1]) || 1 : 1;
    let mudra = 100, resting = 100, handsSeen = false;
    if (li && lt){ handsSeen = true; const d = Math.hypot(li[0]-lt[0], li[1]-lt[1])/shoulderW;
      mudra = Math.min(mudra, d < 0.10 ? 100 : d < 0.30 ? 100*(1-(d-0.10)/0.20) : 0); }
    if (ri && rt){ handsSeen = true; const d = Math.hypot(ri[0]-rt[0], ri[1]-rt[1])/shoulderW;
      mudra = Math.min(mudra, d < 0.10 ? 100 : d < 0.30 ? 100*(1-(d-0.10)/0.20) : 0); }
    if (lw && lk){ const d = Math.hypot(lw[0]-lk[0], lw[1]-lk[1])/shoulderW;
      resting = Math.min(resting, d < 0.55 ? 100 : d < 0.9 ? 100*(1-(d-0.55)/0.35) : 0); }
    if (rw && rk){ const d = Math.hypot(rw[0]-rk[0], rw[1]-rk[1])/shoulderW;
      resting = Math.min(resting, d < 0.55 ? 100 : d < 0.9 ? 100*(1-(d-0.55)/0.35) : 0); }
    const handStillness = Math.max(0, Math.min(100, 100 - this.handMotionEMA*2200));
    const handScore = has && handsSeen ? Math.round(handStillness*0.4 + mudra*0.35 + resting*0.25) : 100;

    // instantaneous stillness (gentle scale) then a cumulative running average
    const bodyInst = Math.max(0, Math.min(100, 100 - this.motionEMA*2600));
    // weighted toward the hands - that's the part the user actually watches for
    // correctness (mudra + resting position), a calm torso alone shouldn't hide bad hands
    const inst = Math.round(bodyInst*0.35 + handScore*0.65);
    if (has){ this.stillSum += inst; this.stillN++; }
    const avg = this.stillN ? this.stillSum/this.stillN : inst;   // "over-all" score
    this._score = inst;       // drives the live skeleton colour (red/orange/green)

    const cues = [];
    if (has && ls && rs && lh && rh){
      const lean = Math.abs(((ls[0]+rs[0])/2) - ((lh[0]+rh[0])/2));
      if (lean > 0.11) cues.push(['Lengthen your spine - sit tall', 0]);
    }
    if (handsSeen && mudra < 40) cues.push(['Touch your thumb and finger gently', 0]);
    else if (handsSeen && resting < 40) cues.push(['Rest your hands on your knees', 0]);
    if (this.motionEMA > 0.02) cues.push(['Gently settle - soften the body', 0]);
    if (!has) cues.push(['Move back into the frame', 0]);
    if (!cues.length) cues.push(['Beautifully still - stay with the breath', 1]);
    this.onCues(cues);

    // the calm BreathCycle narrator owns the voice track; nudges stay rare and gentle
    if (avg < 40) Voice.zen('Soften and be still.', {gap:20000});
    else if (handsSeen && mudra < 30) Voice.zen('Let your fingertips touch, gently.', {gap:20000});

    this.onTick(left, Math.round(avg));      // show the running average, not the twitchy instant value

    if (left <= 0 && !this.finished){
      this.finished = true;
      const focus = Math.round(avg);
      this.breath && this.breath.stop();
      setTimeout(()=> this.onEnd(focus, Math.max(1, Math.round(this.durationSec/60))), 1700);
    }
  }

  _draw(L, has, active){
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0,0,W,H);
    if (!has) return;
    const m = coverMap(this.video, W, H);

    // smooth every landmark toward its new position instead of snapping straight to
    // it - raw per-frame detector noise is what made the stick-figure legs/limbs
    // look like they never stopped moving even when the person was holding still
    const sm = this._smooth;
    for (const k in L){
      const prev = sm[k];
      sm[k] = prev ? [prev[0]+(L[k][0]-prev[0])*0.25, prev[1]+(L[k][1]-prev[1])*0.25] : L[k];
    }
    const px = i => m.ox + sm[i][0]*m.sx, py = i => m.oy + sm[i][1]*m.sy;

    const col = !active ? 'rgba(255,255,255,.7)'
      : this._score>=70 ? 'rgba(63,166,91,.95)'   // green - calm & correct
      : this._score>=40 ? '#E7A13C'               // orange - getting there
      : '#D6584B';                                 // red - settle down / fix hands
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4;
    for (const [a,b] of CONNS){ if (!sm[a]||!sm[b]) continue;
      c.beginPath(); c.moveTo(px(a),py(a)); c.lineTo(px(b),py(b)); c.stroke(); }
    for (const k in sm){ c.beginPath(); c.arc(px(k),py(k),3.5,0,7); c.fill(); }
  }

  finish(){ if (!this.finished){ this.finished = true;
    const focus = this.stillN ? Math.round(this.stillSum/this.stillN) : 60;
    const doneMin = this._t0 ? Math.max(1, Math.round((performance.now()-this._t0)/60000)) : 1;
    this.onEnd(focus, doneMin); } }

  stop(){
    this.running = false;
    cancelAnimationFrame(this._raf);
    this.breath && this.breath.stop();
    Voice.stop();
    try { this.calib && this.calib.remove(); } catch(e){}
    try { this.seatEl && this.seatEl.remove(); } catch(e){}
    if (this.stream) this.stream.getTracks().forEach(t=> t.stop());
    try { this.landmarker && this.landmarker.close(); } catch(e){}
  }
}


/* ============================================================= *
 *  WarmupTracker - camera + skeleton for the guided warm-up.
 *  Runs through the moves in order; for each move it watches the
 *  body part that should be moving and rates the movement:
 *   - too little  -> "move a little more"   (orange/red skeleton)
 *   - in the band -> "great, keep going"    (green skeleton)
 *   - too much    -> "slower, smaller"      (orange skeleton)
 *  The standing/breath move rewards being still & centred instead.
 * ============================================================= */
/* `breath` = phases for the TV breath ring ONLY (never voiced - no repeated
   "breathe in / breathe out"). `intro` = the single spoken instruction per move. */
const WARMUP_MOVE_CFG = {
  breathing: { still:true, intro:'Stand tall, feet relaxed. Slow breaths - in through the nose, out through the mouth.',
    breath:[['in',4,'Breathe in'],['out',5,'Breathe out']] },
  neck:      { lo:0.05, hi:0.55, intro:'Roll your shoulders, then turn your head slowly.',
               breath:[['in',3,'Breathe in'],['out',3,'Breathe out']],
               turns:[['right',8,'Turn your head to the right'],
                      ['left',8,'And to the left']],
               signal:(L,sw)=>{ const n=L[0], ls=L[11], rs=L[12]; if(!n||!ls||!rs) return null;
                 const cx=(ls[0]+rs[0])/2, cy=(ls[1]+rs[1])/2;
                 return Math.hypot(n[0]-cx, n[1]-cy)/sw; } },
  hip:       { lo:0.06, hi:0.7,  intro:'Hands on your hips. Circle slowly.',
               breath:[['in',3,'Breathe in'],['out',3,'Breathe out']],
               half:'Now the other way.',
               signal:(L,sw)=>{ const lh=L[23], rh=L[24], ls=L[11], rs=L[12]; if(!lh||!rh||!ls||!rs) return null;
                 return ((lh[0]+rh[0])/2 - (ls[0]+rs[0])/2)/sw; } },
  leg:       { lo:0.12, hi:1.6,  intro:'Swing one leg forward and back, torso still.',
               breath:[['in',2.5,'Breathe in'],['out',2.5,'Breathe out']],
               half:'Now the other leg.',
               signal:(L,sw)=>{ const lh=L[23],rh=L[24],la=L[27],ra=L[28]; if(!lh||!rh) return null;
                 const hx=(lh[0]+rh[0])/2, hy=(lh[1]+rh[1])/2;
                 const d=a=> a? Math.hypot(a[0]-hx, a[1]-hy) : 0;
                 return Math.max(d(la), d(ra))/sw; } },
};

class WarmupTracker {
  constructor(host, { items, onDetected, onMove, onBreath, onGuide, onTick, onCues, onEnd } = {}){
    this.host = host;
    this.items = items || [];
    this.onDetected = onDetected || (()=>{});
    this.onMove   = onMove   || (()=>{});
    this.onBreath = onBreath || (()=>{});   // (key, label) - drives the TV breath ring
    this.onGuide  = onGuide  || (()=>{});   // (text) - "turn right", "switch legs", "pose change"
    this.onTick   = onTick   || (()=>{});
    this.onCues   = onCues   || (()=>{});
    this.onEnd    = onEnd    || (()=>{});
    this.running = false;
    this._timers = [];
  }
  _after(ms, fn){ const t = setTimeout(()=>{ if (this.running) fn(); }, ms); this._timers.push(t); return t; }
  _clearTimers(){ this._timers.forEach(clearTimeout); this._timers = []; }

  async start(){
    const cam = await setupPoseCam(this.host);
    this.video = cam.video; this.canvas = cam.canvas; this.ctx = cam.ctx;
    this.stream = cam.stream; this.landmarker = cam.landmarker;
    if (!cam.ok) return;

    this.running = true;
    this.phase = 'calibrating';
    this.calScore = 0;
    this._feetHist = [];
    this._smooth = {};
    this._score = 0;
    this.idx = 0;
    this.sig = [];
    this.prev = null;
    this.motionEMA = 0;

    this.calib = h('div',{class:'calib'},
      h('div',{class:'t'}, 'Step back so your whole body is in view'),
      h('div',{class:'p'}, h('i',{style:{width:'0%'}})));
    this.host.append(this.calib);
    Voice.say('Set your phone down and step back so I can see your whole body.', {force:true});
    this._loop();
  }

  _resize(){ const r = this.host.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; }

  _loop(){
    if (!this.running) return;
    const vid = this.video;
    if (vid.readyState >= 2 && this.landmarker && vid.currentTime !== this._lastVT){
      this._lastVT = vid.currentTime;
      this._resize();
      let res; try { res = this.landmarker.detectForVideo(vid, performance.now()); } catch(e){}
      const { L, V } = rawLM(res);
      const has = Object.keys(L).length > 0;
      if (this.phase === 'calibrating'){ this._calibrate(L, V, has); this._draw(L, has, false); }
      else if (this.phase === 'detected'){ this._draw(L, has, true); }
      else if (this.phase === 'tracking'){ this._track(L, V, has); this._draw(L, has, true); }
    }
    this._raf = requestAnimationFrame(()=> this._loop());
  }

  _calibrate(L, V, has){
    if (this.phase !== 'calibrating') return;
    const CAL = 40;
    const nose = L[0];
    const feet = [27,28].filter(i => L[i] && (V[i] ?? 0) > 0.4).map(i => L[i][1]);
    const feetY = feet.length ? feet.reduce((a,b)=>a+b,0)/feet.length : null;
    const full = has && nose && feet.length >= 1 && nose[1] < 0.45 && feetY > 0.6;
    this._feetHist.push(feetY ?? -1); if (this._feetHist.length > 10) this._feetHist.shift();
    const valid = this._feetHist.filter(v=>v>0);
    const stable = valid.length >= 5 && (Math.max(...valid)-Math.min(...valid)) < 0.08;

    this.calScore = (full && stable) ? Math.min(CAL, this.calScore+1) : Math.max(0, this.calScore-1.5);
    this.calib.querySelector('i').style.width = Math.round(this.calScore/CAL*100)+'%';
    this.calib.querySelector('.t').textContent =
      !has ? 'Step into the frame - I can’t see you yet' :
      !full ? 'Move back until your head and feet are both in view' :
      !stable ? 'Stay still…' : 'Almost ready…';

    if (this.calScore >= CAL){
      this.phase = 'detected';
      this.calib.classList.add('ok');
      this.calib.querySelector('.t').textContent = 'Detected ✓';
      try { Chime && Chime.ring && Chime.ring(0.55); } catch(e){}
      Voice.say('Got you. Let’s begin.', {force:true});
      this.onDetected();                     // → screen shows "Detected", TV starts the video
      this._after(1600, ()=>{ this.calib && this.calib.remove(); this.phase = 'tracking'; this._beginMove(); });
    }
  }

  _beginMove(){
    this._clearTimers();
    const it = this.items[this.idx];
    this._moveT0 = performance.now();
    this._moveSec = it.sec;
    this._moveEnded = false;
    this.sig = [];
    this._praised = false;
    this._cfg = WARMUP_MOVE_CFG[it.video] || WARMUP_MOVE_CFG.breathing;
    // ONE spoken instruction per move - nothing else repeats
    this._after(350, ()=> Voice.say(it.label + '. ' + (this._cfg.intro || ''), {force:true}));
    this.onMove(this.idx, it);

    // breath ring on the TV - visual only, NEVER voiced
    this.breath && this.breath.stop();
    const bp = this._cfg.breath || [['in',4,'Breathe in'],['out',4,'Breathe out']];
    this._after(2600, ()=>{
      this.breath = new BreathCycle({
        totalSec: it.sec - 3,
        phases: bp, lastPhaseKey: bp[bp.length-1][0], lastLabel: bp[bp.length-1][2],
        onPhase: (key, label)=> this.onBreath(key, label),
      });
      this.breath.start();
    });

    // side / direction guidance - spoken once each, no chime (chime is only
    // between moves), and only for moves that actually alternate
    if (this._cfg.turns){
      let ti = 0;
      const step = ()=>{
        const [, dur, say] = this._cfg.turns[ti % this._cfg.turns.length];
        Voice.say(say, {force:true}); this.onGuide(say);
        ti++; this._after(dur*1000, step);
      };
      this._after(4500, step);
    } else if (this._cfg.half){
      this._after((it.sec/2)*1000, ()=>{ Voice.say(this._cfg.half, {force:true}); this.onGuide(this._cfg.half); });
    }
  }

  _track(L, V, has){
    const it = this.items[this.idx];
    const now = performance.now();
    const left = Math.max(0, this._moveSec - (now - this._moveT0)/1000);
    const ls=L[11], rs=L[12];
    const sw = (ls&&rs) ? (Math.hypot(ls[0]-rs[0], ls[1]-rs[1]) || 0.25) : 0.25;

    let motion = 0, n = 0;
    if (has && this.prev){
      for (const k of [0,11,12,23,24]){ if (L[k] && this.prev[k]){
        motion += Math.hypot(L[k][0]-this.prev[k][0], L[k][1]-this.prev[k][1]); n++; } }
      if (n) motion /= n;
    }
    this.prev = has ? {...L} : this.prev;
    this.motionEMA = this.motionEMA*0.9 + motion*0.1;

    let score = 0, cue = null;
    if (!has){
      score = 0; cue = ['Move back into the frame', 0];
    } else if (this._cfg.still){
      const calm = Math.max(0, Math.min(100, 100 - this.motionEMA*2600));
      let tall = 100;
      if (ls && rs && L[23] && L[24]){
        const lean = Math.abs(((ls[0]+rs[0])/2) - ((L[23][0]+L[24][0])/2))/sw;
        tall = Math.max(0, 100 - lean*180);
      }
      score = Math.round(calm*0.6 + tall*0.4);
      if (this.motionEMA > 0.02) cue = ['Soften and stand still - just breathe', 0];
      else if (tall < 55) cue = ['Stack your shoulders over your hips', 0];
      else cue = ['Slow, deep breaths - beautiful', 1];
    } else {
      const v = this._cfg.signal ? this._cfg.signal(L, sw) : null;
      if (v != null){ this.sig.push(v); if (this.sig.length > 42) this.sig.shift(); }
      const amp = this.sig.length >= 10 ? (Math.max(...this.sig) - Math.min(...this.sig)) : 0;
      const { lo, hi } = this._cfg;
      if (amp < lo){ score = Math.round(40 * (amp/lo)); cue = ['A little more movement - '+(it.sub||'keep going').toLowerCase(), 0]; }
      else if (amp > hi){ score = 70; cue = ['Slower and smaller - stay controlled', 0]; }
      else { score = Math.round(80 + 20*Math.min(1,(amp-lo)/((hi-lo)*0.5))); cue = ['Great rhythm - keep going', 1]; }
      if (score > 100) score = 100;
    }

    this._score = score;
    this.onCues([cue].filter(Boolean));
    this.onTick(this.idx, Math.round(left), score);

    // a single, rare spoken nudge only if the movement stays clearly off
    if (score < 30 && has) Voice.say(this._cfg.intro || 'Follow the movement on the screen', {gap:14000});

    if (left <= 0 && !this._moveEnded){
      this._moveEnded = true;
      this.breath && this.breath.stop();
      this._clearTimers();
      this.idx++;
      if (this.idx >= this.items.length){
        this.running = false;
        try { Chime && Chime.ring && Chime.ring(0.6); } catch(e){}
        Voice.say('Warm up complete. Well done. Let’s begin your pose.', {force:true});
        setTimeout(()=> this.onEnd(), 900);
        return;
      }
      const next = this.items[this.idx];
      try { Chime && Chime.ring && Chime.ring(0.55); } catch(e){}   // the "ting" - between moves only
      this.onGuide('Next move');
      Voice.say('Next, ' + next.label + '.', {force:true});
      setTimeout(()=>{ if (this.running){ this._moveEnded = false; this._beginMove(); } }, 1800);
    }
  }

  _draw(L, has, active){
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0,0,W,H);
    if (!has) return;
    const m = coverMap(this.video, W, H);
    const sm = this._smooth;
    for (const k in L){ const p = sm[k];
      sm[k] = p ? [p[0]+(L[k][0]-p[0])*0.3, p[1]+(L[k][1]-p[1])*0.3] : L[k]; }
    const px = i => m.ox + sm[i][0]*m.sx, py = i => m.oy + sm[i][1]*m.sy;
    const col = !active ? 'rgba(255,255,255,.7)'
      : this._score>=75 ? 'rgba(63,166,91,.95)'
      : this._score>=45 ? '#E7A13C' : '#D6584B';
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4;
    for (const [a,b] of CONNS){ if (!sm[a]||!sm[b]) continue;
      c.beginPath(); c.moveTo(px(a),py(a)); c.lineTo(px(b),py(b)); c.stroke(); }
    for (const k in sm){ c.beginPath(); c.arc(px(k),py(k),3.5,0,7); c.fill(); }
  }

  stop(){
    this.running = false;
    cancelAnimationFrame(this._raf);
    this._clearTimers();
    this.breath && this.breath.stop();
    Voice.stop();
    try { this.calib && this.calib.remove(); } catch(e){}
    if (this.stream) this.stream.getTracks().forEach(t=> t.stop());
    try { this.landmarker && this.landmarker.close(); } catch(e){}
  }
}


/* ============================================================= *
 *  Pitch - autocorrelation pitch/loudness of a mic AnalyserNode
 * ============================================================= */
function detectPitch(analyser, buf, sampleRate){
  analyser.getFloatTimeDomainData(buf);
  const N = buf.length;
  let rms = 0;
  for (let i=0;i<N;i++) rms += buf[i]*buf[i];
  rms = Math.sqrt(rms/N);
  if (rms < 0.006) return { freq:0, clarity:0, rms };        // basically silence

  // trim leading/trailing near-silence
  let s=0, e=N-1;
  const thr = 0.2 * rms;
  while (s < N/2 && Math.abs(buf[s]) < thr) s++;
  while (e > N/2 && Math.abs(buf[e]) < thr) e--;
  const b = buf.subarray(s, e); const M = b.length;
  if (M < 384) return { freq:0, clarity:0, rms };

  // only autocorrelate the lag range for a human voice (65-450 Hz) - far
  // cheaper than the full O(M²) and keeps the tracker frame-rate up
  const minLag = Math.max(2, Math.floor(sampleRate / 450));
  const maxLag = Math.min(M - 2, Math.ceil(sampleRate / 65));
  let c0 = 0; for (let i=0;i<M;i++) c0 += b[i]*b[i];      // zero-lag energy → clarity ref
  const c = new Float32Array(maxLag + 2);
  for (let lag=minLag; lag<=maxLag; lag++){
    let sum = 0;
    for (let i=0;i<M-lag;i++) sum += b[i]*b[i+lag];
    c[lag] = sum;
  }
  let maxv = -1, maxi = -1;
  for (let i=minLag;i<=maxLag;i++){ if (c[i] > maxv){ maxv = c[i]; maxi = i; } }
  if (maxi <= 0 || maxv <= 0) return { freq:0, clarity:0, rms };

  // prefer the FUNDAMENTAL, not a stronger harmonic: take the shortest-lag peak
  // that's still ≥90% of the global max → resists octave-up and nasal-M harmonics
  const floor = 0.90 * maxv;
  for (let i=minLag+1; i<maxi; i++){
    if (c[i] > c[i-1] && c[i] >= c[i+1] && c[i] >= floor){ maxi = i; maxv = c[i]; break; }
  }
  // parabolic interpolation around the chosen peak
  const x1=c[maxi-1]||maxv, x2=maxv, x3=c[maxi+1]||maxv;
  const a=(x1+x3-2*x2)/2, bb=(x3-x1)/2;
  const shift = a ? -bb/(2*a) : 0;
  const period = maxi + shift;
  const freq = sampleRate / period;
  const clarity = c0 ? Math.max(0, Math.min(1, maxv / c0)) : 0;
  if (freq < 65 || freq > 450) return { freq:0, clarity, rms };
  return { freq, clarity, rms };
}

/* median + median-absolute-deviation of a numeric array */
function medianMAD(arr){
  if (!arr.length) return { median:0, mad:0 };
  const s = arr.slice().sort((a,b)=>a-b);
  const median = s[s.length>>1];
  const dev = s.map(x=>Math.abs(x-median)).sort((a,b)=>a-b);
  return { median, mad: dev[dev.length>>1] };
}
/* cents between two frequencies */
const cents = (f, ref)=> (f>0 && ref>0) ? 1200 * Math.log2(f/ref) : 9999;


/* ============================================================= *
 *  ChantTracker - camera + mic for a guided chanting meditation.
 *  Checks: seated & upright posture, hand-mudra (thumb+finger,
 *  hands resting), and the CHANT itself - is the user producing a
 *  steady sustained tone during each chant window (mic pitch +
 *  loudness + pitch-stability). Skeleton colour tracks the score.
 *  Flow:  guided setup  ->  [ breathe in -> chant AUM/OM -> rest ]  x N
 * ============================================================= */
class ChantTracker {
  constructor(host, { chant, durationSec=600, onDetected, onTick, onCues, onPhase, onPitch, onEnd } = {}){
    this.host = host;
    this.chant = chant || { id:'aum', kind:'AUM' };
    this.durationSec = durationSec;
    this.onDetected = onDetected || (()=>{});
    this.onTick = onTick || (()=>{});
    this.onCues = onCues || (()=>{});
    this.onPhase = onPhase || (()=>{});
    this.onPitch = onPitch || (()=>{});
    this.onEnd = onEnd || (()=>{});
    this.running = false;
  }

  _kind(){ return this.chant.id === 'om' ? 'OM' : 'AUM'; }

  async start(){
    const cam = await setupPoseCam(this.host);
    this.video = cam.video; this.canvas = cam.canvas; this.ctx = cam.ctx;
    this.stream = cam.stream; this.landmarker = cam.landmarker;
    if (!cam.ok) return;

    // ---- mic + analyser for pitch/loudness -------------------------------
    this.micOk = false;
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ac = new AC();
      if (this.ac.state === 'suspended') this.ac.resume().catch(()=>{});
      const srcNode = this.ac.createMediaStreamSource(this.micStream);
      this.analyser = this.ac.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0;
      this._buf = new Float32Array(this.analyser.fftSize);
      // some browsers only pump an AnalyserNode that has a path to the destination
      const sink = this.ac.createGain(); sink.gain.value = 0;
      srcNode.connect(this.analyser); this.analyser.connect(sink); sink.connect(this.ac.destination);
      this.micOk = true;
    } catch(e){ this.micOk = false; }                     // no mic → chant meter shows "mic off"

    this.running = true;
    this.phase = 'calibrating';
    this.calScore = 0;
    this._hist = [];
    this.prev = null;
    this.motionEMA = 0;
    this._smooth = {};
    this._score = 100;
    this.finished = false;
    this.chantScore = 60;          // last known chant-quality (drives the skeleton colour)
    this._scoreSum = 0; this._scoreN = 0;
    this._chants = [];             // one entry per completed chant → final score
    this._targetHz = null;         // the chanter's own pitch, learned from the first rounds

    this.calib = h('div',{class:'calib'},
      h('div',{class:'t'}, 'Set your phone so the camera sees your whole seated posture'),
      h('div',{class:'p'}, h('i',{style:{width:'0%'}})));
    this.host.append(this.calib);

    // suggestion spoken while the camera is finding your seat
    Voice.zen('Set the phone down so the camera can see your whole posture. Settle into the lotus position. Fold your legs comfortably on the floor. Keep your hands on your knees, and sit up straight.', {force:true});
    this._loop();
  }

  _resize(){ const r = this.host.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; }

  _loop(){
    if (!this.running) return;
    const vid = this.video;
    if (vid.readyState >= 2 && this.landmarker && vid.currentTime !== this._lastVT){
      this._lastVT = vid.currentTime;
      this._resize();
      let res; try { res = this.landmarker.detectForVideo(vid, performance.now()); } catch(e){}
      const { L, V } = rawLM(res);
      const has = Object.keys(L).length > 0;
      if (this.phase === 'calibrating'){ this._calibrate(L, V, has); this._draw(L, has, false); }
      else { this._track(L, V, has); this._draw(L, has, true); }
    }
    this._raf = requestAnimationFrame(()=> this._loop());
  }

  _upright(L, V){
    const ls=L[11], rs=L[12], lh=L[23], rh=L[24], nose=L[0];
    const vis = i => (V && V[i] != null) ? V[i] : 0;
    // shoulders AND hips must actually be seen (a face-only frame gives low-
    // confidence hip guesses) - but keep the bar low so detection is quick
    const shouldersSeen = ls && rs && vis(11) > 0.5 && vis(12) > 0.5;
    const hipsSeen      = lh && rh && vis(23) > 0.35 && vis(24) > 0.35;
    if (!nose || !shouldersSeen || !hipsSeen) return { ok:false, tall:0, sw:0.25, need: !shouldersSeen ? 'shoulders' : 'hips' };
    const shoulderY=(ls[1]+rs[1])/2, hipY=(lh[1]+rh[1])/2;
    const sw = Math.hypot(ls[0]-rs[0], ls[1]-rs[1]) || 0.25;
    const lean = Math.abs(((ls[0]+rs[0])/2) - ((lh[0]+rh[0])/2)) / sw;
    const torso = hipY - shoulderY;
    const framed = nose[1] > 0.02 && nose[1] < 0.55 && torso > 0.12 && hipY > 0.48 && hipY < 1.0;
    return { ok: framed, tall: Math.max(0, 100 - lean*170), sw, torso, hipY };
  }

  _calibrate(L, V, has){
    const CAL = 22;                                   // ~1s of good frames - quick
    const u = this._upright(L, V);
    this._hist.push(u.ok ? 1 : 0); if (this._hist.length > 10) this._hist.shift();
    const steady = this._hist.filter(Boolean).length >= 5;
    this.calScore = (has && u.ok && steady) ? Math.min(CAL, this.calScore+1.5) : Math.max(0, this.calScore-1.4);
    this.calib.querySelector('i').style.width = Math.round(this.calScore/CAL*100)+'%';
    this.calib.querySelector('.t').textContent =
      !has ? 'Step into the frame' :
      u.need === 'shoulders' ? 'Move back so your head and shoulders show' :
      u.need === 'hips' ? 'Sit down and move back a little' :
      !u.ok ? 'Sit tall, facing the camera' : 'Detecting…';

    if (this.calScore >= CAL){
      this.phase = 'intro';
      this._t0 = performance.now();
      this.calib.classList.add('ok');
      this.calib.querySelector('.t').textContent = 'Detected ✓';
      try { Chime && Chime.ring && Chime.ring(0.5); } catch(e){}
      Voice.zen('Detected. Sit tall, and follow along.', {force:true});
      this.onDetected();
      setTimeout(()=>{ this.calib && this.calib.remove(); }, 1800);
      setTimeout(()=>{ if (this.running) this._runIntro(); }, 1600);
    }
  }

  /* short spoken get-ready, then straight into the breathe-in / chant loop */
  _runIntro(){
    this.onPhase('Breathe in', null);
    Voice.zen('Relax your shoulders. Close your eyes, and follow along.', {force:true});
    setTimeout(()=>{ if (this.running){ this.phase = 'chanting'; this._loopT0 = performance.now(); this._cycleIdx = 0; this._beginCycle(); } }, 7000);
  }

  _beginCycle(){
    // one cycle = breathe in (5s) -> the recorded AUM/OM plays, fades out -> pause (4.5s)
    const clip = this._kind() === 'OM' ? 7.9 : 6.7;
    this._cyc = { t0: performance.now(), inSec:5, chantSec: clip + 1.5, restSec:4.5 };
    this.onPhase('Breathe in', null);
    Voice.zen('Breathe in.', { force:true });
  }

  _track(L, V, has){
    const now = performance.now();
    const left = Math.max(0, this.durationSec - (now - this._t0)/1000);

    // ---- posture + mudra ------------------------------------------------
    const u = this._upright(L, V);
    const sw = u.sw || 0.25;
    const li=L[19], ri=L[20], lt=L[21], rt=L[22], lw=L[15], rw=L[16], lk=L[25], rk=L[26];
    let mudra = 100, resting = 100, seen = false;
    const near = (a,b,lo,hi)=> { const d = Math.hypot(a[0]-b[0], a[1]-b[1])/sw;
      return d < lo ? 100 : d < hi ? 100*(1-(d-lo)/(hi-lo)) : 0; };
    if (li && lt){ seen = true; mudra = Math.min(mudra, near(li,lt,0.10,0.30)); }
    if (ri && rt){ seen = true; mudra = Math.min(mudra, near(ri,rt,0.10,0.30)); }
    if (lw && lk) resting = Math.min(resting, near(lw,lk,0.55,0.95));
    if (rw && rk) resting = Math.min(resting, near(rw,rk,0.55,0.95));
    const handScore = has && seen ? Math.round(mudra*0.6 + resting*0.4) : 70;
    const postureScore = has ? Math.round(u.tall) : 40;

    // ---- chant window: is the user producing a steady sustained tone? ---
    let phaseLabel = 'Chant', chanting = false;
    if (this._cyc){
      const el = (now - this._cyc.t0) / 1000;
      if (el < this._cyc.inSec){ phaseLabel = 'Breathe in'; }
      else if (el < this._cyc.inSec + this._cyc.chantSec){
        phaseLabel = 'Chant'; chanting = true;
        if (!this._cyc.played){ this._cyc.played = true;
          // the recorded AUM / OM chant from static/audio/chanting/
          try { ChantAudio.play(this._kind(), { volume:1 }); } catch(e){}
          this.onPhase('Chant', this.chant.guide && this.chant.guide[0]); }
        if (this.micOk){
          this._cyc.frames = (this._cyc.frames || 0) + 1;
          if (this._cyc.frames % 2 === 0){
            const p = detectPitch(this.analyser, this._buf, this.ac.sampleRate);
            const tgt = this._targetHz ? Math.round(this._targetHz) : null;
            if (p.freq && p.rms > 0.008){
              // octave-lock to the running estimate so a stray harmonic doesn't jump
              let f = p.freq;
              const ref = this._cyc.samples && this._cyc.samples.length
                ? this._cyc.samples[this._cyc.samples.length-1] : (this._targetHz || 0);
              if (ref){ if (f > ref*1.6) f /= 2; else if (f < ref*0.62) f *= 2; }
              this.onPitch(Math.round(f), tgt);                       // the meter moves on ANY pitch lock
              if (p.clarity > 0.2 && p.rms > 0.011){                  // only count clean-ish frames for the score
                this._cyc.samples = this._cyc.samples || [];
                this._cyc.samples.push(f);
                this._cyc.voicedLast = now;
              }
            } else {
              this.onPitch(null, tgt);                                // listening…
            }
          }
        } else {
          this.onPitch('nomic', null);
        }
      } else {
        phaseLabel = 'Rest';
        if (!this._cyc.scored){ this._cyc.scored = true; this._scoreChant(); }
        if (el > this._cyc.inSec + this._cyc.chantSec + this._cyc.restSec){
          this._cycleIdx++; this._beginCycle();
        }
      }
    }

    // outside a mic → chant component leans on "did they hold still & breathe"
    const chantQ = this.micOk ? this.chantScore
      : Math.max(0, Math.min(100, 100 - this.motionEMA*2400));

    // motion EMA (for the no-mic fallback + a gentle "be settled" nudge)
    let motion = 0, n = 0;
    if (has && this.prev){ for (const k of [0,11,12]){ if (L[k] && this.prev[k]){
      motion += Math.hypot(L[k][0]-this.prev[k][0], L[k][1]-this.prev[k][1]); n++; } } if (n) motion/=n; }
    this.prev = has ? {...L} : this.prev;
    this.motionEMA = this.motionEMA*0.9 + motion*0.1;

    const inst = Math.round(handScore*0.32 + postureScore*0.20 + chantQ*0.48);
    this._score = inst;
    if (has){ this._scoreSum += inst; this._scoreN++; }
    const avg = this._scoreN ? this._scoreSum/this._scoreN : inst;

    // ---- cues ----------------------------------------------------------
    const cues = [];
    if (!this.micOk) cues.push(['Allow the microphone to track your chant', 0]);
    if (!has) cues.push(['Move back into the frame', 0]);
    else {
      if (u.tall < 55) cues.push(['Lengthen your spine - sit tall', 0]);
      if (seen && mudra < 45) cues.push(['Touch your thumb and finger, gently', 0]);
      else if (seen && resting < 45) cues.push(['Rest your hands on your knees', 0]);
      if (chanting && this.micOk){
        const n = (this._cyc.samples || []).length;
        if (n < 3) cues.push(['Chant out loud, along with the sound', 0]);
        else if (n < 8) cues.push(['I hear you - keep the sound going', 1]);
        else cues.push(['Beautiful - steady tone', 1]);
      } else if (phaseLabel === 'Breathe in') cues.push(['Slow breath in through the nose', 1]);
      else if (phaseLabel === 'Rest') cues.push(['Rest… notice the silence', 1]);
    }
    if (!cues.length) cues.push(['Stay with the sound and the breath', 1]);
    this.onCues(cues);

    this.onTick(left, Math.round(avg), phaseLabel);

    if (left <= 0 && !this.finished){
      this.finished = true;
      const sum = this._summary();
      const score = this._finalScore(sum);
      Voice.zen('Let the last sound fade. Sit quietly for a moment. And gently open your eyes.', {force:true});
      setTimeout(()=> this.onEnd(score, Math.max(1, Math.round(this.durationSec/60)), sum), 2600);
    }
  }

  /* score the chant that just finished: overall F0, pitch stability, and how
     long the complete AUM/OM lasted - measured across the whole continuous
     sound, not as separate A/U/M targets */
  _scoreChant(){
    if (!this.micOk) return;
    const s = this._cyc.samples || [];
    const frameSec = this._cyc.frames ? (this._cyc.chantSec / this._cyc.frames) : 0.06;
    const voicedSec = s.length * frameSec;                       // how long they held a tone

    if (s.length < 4 || voicedSec < 1.5){
      this._chants.push({ hz:0, stability:0, durSec:voicedSec, accuracy:0, detected:false });
      this.chantScore = Math.round(this.chantScore*0.55 + 20*0.45);
      Voice.zen('Chant out loud, along with the sound.', { gap:14000 });
      return;
    }

    const { median, mad } = medianMAD(s);
    // pitch stability: small median-absolute-deviation relative to the pitch
    const stability = Math.max(0, Math.min(100, 100 - (mad / (median||1)) * 900));
    // duration: a full chant is ~one long breath (target ~7s), give credit up to there
    const durScore = Math.max(0, Math.min(100, voicedSec / 7 * 100));

    // learn the chanter's own pitch from the first two solid chants, then score
    // later chants on how close they stay to it (in cents - pitch-relative)
    let accuracy = 100;
    if (this._targetHz == null){
      this._solid = (this._solid || []).concat(stability > 45 ? [median] : []);
      if (this._solid.length >= 2){ const t = medianMAD(this._solid); this._targetHz = t.median; }
    } else {
      const off = Math.abs(cents(median, this._targetHz));       // 100 cents = a semitone
      accuracy = Math.max(0, Math.min(100, 100 - Math.max(0, off - 40) / 3));
    }

    this._chants.push({ hz: Math.round(median), stability: Math.round(stability),
      durSec: +voicedSec.toFixed(1), accuracy: Math.round(accuracy), detected:true });

    const q = Math.round(stability*0.45 + durScore*0.30 + accuracy*0.25);
    this.chantScore = Math.round(this.chantScore*0.4 + q*0.6);
    if (q >= 78) Voice.zen('Lovely - steady and long.', { gap:15000 });
    else if (stability < 45) Voice.zen('Let your pitch stay level.', { gap:15000 });
    else if (durScore < 45) Voice.zen('Draw the sound out longer, all the way to the end of the breath.', { gap:15000 });
  }

  /* aggregate the whole session into a pitch report + overall score */
  _summary(){
    const done = this._chants.filter(c=>c.detected);
    if (!done.length) return { kind:this._kind(), count:0, pitchHz:0, stability:0, duration:0, accuracy:0 };
    const md = medianMAD(done.map(c=>c.hz));
    const avg = a => Math.round(a.reduce((x,y)=>x+y,0)/a.length);
    return {
      kind: this._kind(),                       // 'AUM' | 'OM'
      count: done.length,
      pitchHz: Math.round(md.median),
      stability: avg(done.map(c=>c.stability)),
      duration: +(done.reduce((x,c)=>x+c.durSec,0)/done.length).toFixed(1),
      accuracy: avg(done.map(c=>c.accuracy)),
      targetHz: this._targetHz ? Math.round(this._targetHz) : null,
    };
  }
  _finalScore(sum){
    const postureMudra = this._scoreN ? this._scoreSum/this._scoreN : 60;
    if (!sum.count) return Math.round(postureMudra);
    const chant = sum.stability*0.42 + Math.min(100, sum.duration/7*100)*0.28 + sum.accuracy*0.30;
    return Math.round(chant*0.7 + postureMudra*0.3);
  }

  _draw(L, has, active){
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0,0,W,H);
    if (!has) return;
    const m = coverMap(this.video, W, H);
    const sm = this._smooth;
    for (const k in L){ const p = sm[k];
      sm[k] = p ? [p[0]+(L[k][0]-p[0])*0.25, p[1]+(L[k][1]-p[1])*0.25] : L[k]; }
    const px = i => m.ox + sm[i][0]*m.sx, py = i => m.oy + sm[i][1]*m.sy;
    const col = !active ? 'rgba(255,255,255,.7)'
      : this._score>=70 ? 'rgba(63,166,91,.95)'
      : this._score>=42 ? '#E7A13C' : '#D6584B';
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4;
    for (const [a,b] of CONNS){ if (!sm[a]||!sm[b]) continue;
      c.beginPath(); c.moveTo(px(a),py(a)); c.lineTo(px(b),py(b)); c.stroke(); }
    for (const k in sm){ c.beginPath(); c.arc(px(k),py(k),3.5,0,7); c.fill(); }
  }

  finish(){ if (!this.finished){ this.finished = true;
    const sum = this._summary();
    this.onEnd(this._finalScore(sum), Math.max(1, Math.round(this.durationSec/60)), sum); } }

  stop(){
    this.running = false;
    cancelAnimationFrame(this._raf);
    Voice.stop();
    try { ChantAudio.stop(); } catch(e){}
    try { ChantVoice.stop(0.2); } catch(e){}
    try { this.calib && this.calib.remove(); } catch(e){}
    if (this.stream) this.stream.getTracks().forEach(t=> t.stop());
    if (this.micStream) this.micStream.getTracks().forEach(t=> t.stop());
    try { this.ac && this.ac.close(); } catch(e){}
    try { this.landmarker && this.landmarker.close(); } catch(e){}
  }
}

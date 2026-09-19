/* ============================================================= *
 *  Sadhana - reusable UI components & working widgets
 * ============================================================= */

/* tiny hyperscript */
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const [k,v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()){
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

/* ---- toast ------------------------------------------------- */
let toastT;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(()=> t.hidden = true, 2200);
}

/* ---- status bar ------------------------------------------- */
function statusBar(){
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}).replace(/\s?[AP]M/i,'');
  return h('div',{class:'statusbar'},
    h('span',{class:'sb-time'}, time),
    h('span',{class:'sb-island'}),
    h('div',{class:'sb-icons', html:`
      <svg width="18" height="12" viewBox="0 0 18 12" fill="#1B2A38"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="#1B2A38"><path d="M8.5 2.5c2.4 0 4.6.9 6.3 2.4l1.2-1.3A11 11 0 0 0 8.5 .8 11 11 0 0 0 1 3.6l1.2 1.3A9 9 0 0 1 8.5 2.5Z"/><path d="M8.5 6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.4 7.4 0 0 0 8.5 4.3 7.4 7.4 0 0 0 3.6 6.1l1.2 1.3A5.6 5.6 0 0 1 8.5 6Z"/><circle cx="8.5" cy="10" r="1.7"/></svg>
      <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="1" y="1" width="22" height="11" rx="3" stroke="#1B2A38" stroke-opacity=".5"/><rect x="3" y="3" width="16" height="7" rx="1.5" fill="#1B2A38"/><rect x="24" y="4" width="2" height="5" rx="1" fill="#1B2A38" fill-opacity=".5"/></svg>`})
  );
}

/* ---- top bar (back / title / actions) -------------------- */
const ICONS = {
  back:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  music:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  cast:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><line x1="2" y1="20" x2="2.01" y2="20"/></svg>',
  help:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  chevron:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};
/* ---- sound picker icons (nature + instruments) ------------ */
const SOUND_ICONS = {
  rain:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 14a4 4 0 1 1 1.3-7.8A5 5 0 0 1 17 8a3.5 3.5 0 0 1-.5 6.9H6Z"/><path d="M8 18v2M12 18v2M16 18v2"/></svg>',
  sea:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0"/><path d="M2 17c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0"/></svg>',
  forest:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2 6 11h3l-4 6h5v5h4v-5h5l-4-6h3Z"/></svg>',
  thunder:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-13h-6l1-7Z"/></svg>',
  wind:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h11a2.5 2.5 0 1 0-2.4-3.2M3 12h15a2.5 2.5 0 1 1-2.4 3.2M3 16h8"/></svg>',
  white:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="18" cy="6" r="1.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/><circle cx="6" cy="18" r="1.4"/><circle cx="12" cy="18" r="1.4"/><circle cx="18" cy="18" r="1.4"/></svg>',
  bowl:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 13a8 3 0 0 0 16 0"/><path d="M2 13h20"/><path d="M12 13V5"/></svg>',
  flute:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20 20 4"/><circle cx="8" cy="16" r=".6" fill="currentColor"/><circle cx="11" cy="13" r=".6" fill="currentColor"/><circle cx="14" cy="10" r=".6" fill="currentColor"/></svg>',
  chimes:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16"/><path d="M7 4v10M12 4v14M17 4v8"/></svg>',
  tanpura:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="18" r="3"/><path d="M9 16 19 4"/><path d="M17 4h3v3"/></svg>',
  piano:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M7 6v7M11 6v7M15 6v7M19 6v7"/></svg>',
  sitar:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.6"/><path d="M8 17 18 3"/><path d="M16 3h3v3"/></svg>',
};

/* Sound / Chanting -> Nature / Instruments picker, shared by the
   "Select Music" screen and the Meditation setup screen */
function soundPicker({ get, set, onPreview, showChanting=true } = {}){
  let cat = 'nature';
  const grid = h('div',{class:'sound-grid'});
  const subtabs = h('div',{class:'seg-tabs'});
  const chantList = h('div',{class:'chant-list'});
  let mode = showChanting ? Store.get('medMode', 'sound') : 'sound';

  // Sound / Chanting - a full-width sliding toggle (Figma "Sliding Toggle")
  const toggle = h('div',{class:'slide-toggle'},
    h('span',{class:'thumb'}),
    h('button',{class:'lbl', onclick:()=>setMode('sound')}, 'Sound'),
    h('button',{class:'lbl', onclick:()=>setMode('chant')}, 'Chanting'));
  function drawToggle(){
    toggle.classList.toggle('right', mode==='chant');
    $$('.lbl',toggle).forEach((b,i)=> b.classList.toggle('on', (i===0)===(mode==='sound')));
  }

  function drawGrid(){
    const list = (DATA.soundCategories.find(c=>c.id===cat)||{}).tracks || [];
    grid.replaceChildren(...list.map(t=>
      h('button',{class:'sound-card'+(get()===t.id?' sel':''), onclick:()=>{
        set(t.id); onPreview && onPreview(t.id);
        $$('.sound-card',grid).forEach((c,i)=> c.classList.toggle('sel', list[i].id===get()));
      }},
        h('div',{class:'ic'+(t.id==='sitar'?' bare':t.id==='flute'?' lg':'')}, h('img',{src:IMG+'snd/'+t.id+'.svg', alt:''})),
        h('b',{}, t.name))));
  }
  function drawSubtabs(){
    subtabs.replaceChildren(...DATA.soundCategories.map(c=>
      h('button',{class:cat===c.id?'on':'', onclick:()=>{ cat=c.id; drawSubtabs(); drawGrid(); }}, c.label)));
  }
  function drawChants(){
    const sel = Store.get('medChant', 'aum');
    chantList.replaceChildren(...DATA.chants.map(c=>
      h('button',{class:'chant-row'+(sel===c.id?' sel':''), onclick:()=>{
        Store.set('medChant', c.id);
        $$('.chant-row',chantList).forEach((r,i)=> r.classList.toggle('sel', DATA.chants[i].id===c.id));
      }},
        h('div',{class:'cbadge'}, c.badge),
        h('div',{class:'ct'}, h('b',{}, c.name), h('span',{}, c.sub)))));
  }
  function drawBody(){
    wrap.querySelector('.sound-body') && wrap.querySelector('.sound-body').remove();
    wrap.append(h('div',{class:'sound-body'}, mode==='sound' ? [subtabs, grid] : chantList));
  }
  function setMode(m){ mode = m; Store.set('medMode', m); drawToggle(); drawBody(); }

  drawSubtabs(); drawGrid(); drawChants();
  const wrap = h('div',{class:'sound-picker'}, showChanting ? toggle : null);
  drawToggle(); drawBody();
  return wrap;
}

/* ---- score ring: dark-navy stroke ring, proportional to pct (0-100) ---- */
function scoreRing(pct, size=150, thick=12){
  // NOTE: SVG elements must come in through innerHTML (`html:`), not h() -
  // h() uses document.createElement, which builds inert HTML-namespace
  // nodes for tags like <svg>/<circle> and silently fails to render them.
  pct = Math.max(0, Math.min(100, pct||0));
  const r = (size - thick)/2, c = 2*Math.PI*r, off = c*(1-pct/100);
  return h('div',{class:'score-ring', style:{width:size+'px',height:size+'px'}, html:`
    <svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="#DCE9EE" stroke-width="${thick}" fill="none"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="#144B70" stroke-width="${thick}" fill="none"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <b>${pct}%</b>`});
}

function iconBtn(name, onClick){
  return h('button',{class:'icon-btn', 'aria-label':name, onclick:onClick, html:ICONS[name]||''});
}
function topBar({back, title, center, right, sub} = {}){
  const h2 = title ? h('h2',{class: title.length > 20 ? 'long' : ''}, title) : null;
  // `sub` = a sub-heading that belongs to the header: it stays put (never scrolls) and the back
  // arrow is centred on the title + sub-heading block
  return h('div',{class:'topnav'+(center?' center':'')+(sub?' has-sub':'')},
    back ? iconBtn('back', back) : null,
    title ? (sub ? h('div',{class:'tn-text'}, h2, h('p',{class:'tn-sub'}, sub)) : h2) : h('div',{style:{flex:1}}),
    right ? h('div',{class:'right'}, right) : null
  );
}

/* ---- step progress bar ---------------------------------- */
function stepBar(pct, back){
  return h('div',{class:'stepbar'},
    back ? iconBtn('back', back) : null,
    h('div',{class:'track'}, h('div',{class:'fill', style:{width:Math.max(4,pct)+'%'}}))
  );
}

/* ---- bottom tab bar (Figma nav icons) ----------------- */
const TAB_ICON = {
  Home:      { on:'nav/home_on.svg', off:'nav/home_off.svg' },
  Meditation:{ on:'nav/med_on.svg',  off:'nav/med_off.svg'  },
  Progress:  { on:'nav/prog_on.svg', off:'nav/prog_off.svg' },
  Settings:  { on:'nav/set_on.svg',  off:'nav/set_off.svg'  },
};
function tabBar(active){
  const tabs = ['Home','Meditation','Progress','Settings'];
  const route = { Home:'home', Meditation:'med-setup', Progress:'progress', Settings:'settings' };
  return h('div',{class:'tabbar'},
    ...tabs.map(t => {
      const on = t === active;
      return h('button',{class:'tab'+(on?' on':''), onclick:()=>go(route[t])},
        h('span',{class:'tab-ic'}, h('img',{src:IMG + TAB_ICON[t][on?'on':'off'], alt:t})),
        h('span',{}, t));
    })
  );
}

/* ---- Today / Weekly tab switcher ---------------------- */
function tabSwitch(labels, active, onChange){
  const wrap = h('div',{class:'tabswitch'});
  labels.forEach(l=>{
    const b = h('button',{class:l===active?'on':'', onclick:()=>{
      [...wrap.children].forEach(c=>c.classList.remove('on')); b.classList.add('on'); onChange(l);
    }}, l);
    wrap.append(b);
  });
  return wrap;
}

/* ---- breathe in / hold / breathe out ------------------ */
function breathe({ big=true, silent=false } = {}){
  const label = h('div',{class:'label'}, 'BREATHE IN');
  const node = h('div',{class:'breathe'+(big?'':' compact')},
    h('div',{class:'orb-wrap'}, h('div',{class:'orb'})),
    label);
  // 14s cycle: IN 0-4s, HOLD 4-7s, OUT 7-14s  (matches @keyframes breathe-cycle)
  const phases = [[0,'BREATHE IN'],[4000,'HOLD'],[7000,'BREATHE OUT']];
  let t0 = Date.now(), iv;
  function tick(){
    const e = (Date.now() - t0) % 14000;
    let cur = phases[0][1];
    for (const [at,txt] of phases) if (e >= at) cur = txt;
    if (label.textContent !== cur){
      label.textContent = cur;
      if (!silent) Voice.cue(cur==='HOLD' ? 'hold' : cur==='BREATHE IN' ? 'breathe in' : 'breathe out');
    }
  }
  return {
    node,
    start(){ t0 = Date.now(); node.classList.remove('paused');
      const orb = node.querySelector('.orb');
      if (orb){ orb.style.animation='none'; orb.offsetHeight; orb.style.animation=''; }
      label.textContent = 'BREATHE IN';
      if (!silent) Voice.cue('breathe in');          // speak the first cue immediately
      clearInterval(iv); iv = setInterval(tick, 250); },
    stop(){ clearInterval(iv); node.classList.add('paused'); },
  };
}

/* ============================================================= *
 *  HORIZONTAL RULER  (weight)
 * ============================================================= */
function HRuler({min, max, step=1, value, unit='kg', onChange}){
  const PX = 40;                       // px per unit
  const state = { unit, value };
  const scale = h('div',{class:'scale'});
  const knob  = h('div',{class:'knob'});
  const pin   = h('div',{class:'pin'});
  const viewport = h('div',{class:'ruler-h'}, scale, pin);
  const wrap = h('div',{class:'ruler-h-wrap'}, viewport, knob);

  const readVal = h('span',{class:'val'});
  const readU   = h('span',{class:'u'});
  const readout = h('div',{class:'ruler-readout'}, readVal, readU);
  let cells = [];

  function build(){
    scale.innerHTML = '';
    cells = [];
    for (let v = min; v <= max; v += step){
      const c = h('div',{class:'num', dataset:{v}}, h('b',{}, String(Math.round(v))), h('i',{}));
      cells.push(c); scale.append(c);
    }
  }
  function clamp(v){ return Math.min(max, Math.max(min, v)); }
  function render(){
    const mid = (viewport.clientWidth || 340) / 2;
    const idx = Math.round((state.value - min) / step);
    const offset = mid - idx * PX - PX/2;
    scale.style.transform = `translateX(${offset}px)`;
    cells.forEach((c,i)=> c.classList.toggle('cur', i === idx));
    readVal.textContent = String(Math.round(state.value));
    readU.textContent = state.unit;
    onChange && onChange(state.value, state.unit);
  }

  /* drag / swipe */
  let dragging=false, startX=0, startVal=0;
  const down = x =>{ dragging=true; startX=x; startVal=state.value; viewport.style.cursor='grabbing'; };
  const move = x =>{ if(!dragging) return;
    const d = (startX - x) / PX * step;
    state.value = clamp(Math.round((startVal + d)/step)*step);
    render();
  };
  const up = ()=>{ dragging=false; viewport.style.cursor='grab'; };
  viewport.addEventListener('mousedown', e=>down(e.clientX));
  window.addEventListener('mousemove', e=>move(e.clientX));
  window.addEventListener('mouseup', up);
  viewport.addEventListener('touchstart', e=>down(e.touches[0].clientX), {passive:true});
  viewport.addEventListener('touchmove', e=>move(e.touches[0].clientX), {passive:true});
  viewport.addEventListener('touchend', up);
  viewport.addEventListener('wheel', e=>{ e.preventDefault();
    state.value = clamp(Math.round((state.value + Math.sign(e.deltaY)*step)/step)*step); render();
  }, {passive:false});

  build();
  render();
  requestAnimationFrame(render);
  setTimeout(render, 80);
  window.addEventListener('resize', render);
  if (window.ResizeObserver){ new ResizeObserver(render).observe(viewport); }

  return {
    node: h('div',{}, wrap, readout),
    getValue: ()=> ({value: state.value, unit: state.unit}),
    convert(newUnit){
      if (newUnit === state.unit) return;
      if (newUnit === 'lb'){ state.value = Math.round(state.value * 2.20462); }
      else { state.value = Math.round(state.value / 2.20462); }
      state.unit = newUnit; render();
    },
    setRange(a,b){ min=a; max=b; build(); render(); },
  };
}

/* ============================================================= *
 *  VERTICAL RULER  (height)
 * ============================================================= */
function VRuler({initialCm=170, onChange}){
  const PX = 40;                    // px per unit-tick - same step as the weight ruler (HRuler PX = 40)
  const state = { unit:'ft', cm:initialCm };
  const scale = h('div',{class:'scale'});
  const knob  = h('div',{class:'knob'});
  const col = h('div',{class:'col'}, scale, knob);
  const readV = h('div',{class:'val'});
  const readout = h('div',{class:'readout'}, readV);
  const wrap = h('div',{class:'ruler-v'}, col, readout);
  let cells = [];

  // model in "ticks": cm mode -> 1 tick = 1 cm ; ft mode -> 1 tick = 1 inch
  function ticks(){ return state.unit==='cm' ? Math.round(state.cm) : Math.round(state.cm/2.54); }
  function range(){ return state.unit==='cm' ? [120,220] : [Math.round(120/2.54), Math.round(220/2.54)]; }

  function labelFor(t){
    if (state.unit==='cm') return String(t);
    return `${Math.floor(t/12)}′${t%12}″`;
  }
  function build(){
    scale.innerHTML=''; cells=[];
    const [lo,hi] = range();
    for (let t = hi; t >= lo; t--){          // top = tall
      const major = true;                    // every cm / inch is labelled, like every kg on the weight ruler
      const c = h('div',{class:'tick'+(major?' major':''), dataset:{t}},
        h('b',{}, major ? labelFor(t) : ''), h('i',{}));
      cells.push(c); scale.append(c);
    }
  }
  function fmt(){
    if (state.unit==='cm') return [String(Math.round(state.cm)), 'cm'];
    const inch = Math.round(state.cm/2.54);
    return [`${Math.floor(inch/12)}′${inch%12}″`, ''];
  }
  function render(){
    const [lo,hi] = range();
    const cur = ticks();
    const mid = (col.clientHeight || 430)/2;
    const offset = mid - (hi - cur) * PX - PX/2;
    scale.style.transform = `translateY(${offset}px)`;
    cells.forEach(c => c.classList.toggle('cur', Number(c.dataset.t) === cur));
    const [txt] = fmt(); readV.textContent = txt;
    onChange && onChange(Math.round(state.cm), state.unit);
  }
  function setTicks(t){
    const [lo,hi] = range();
    t = Math.min(hi, Math.max(lo, t));
    state.cm = state.unit==='cm' ? t : t*2.54;
    render();
  }

  let dragging=false, startY=0, startT=0;
  const down = y=>{ dragging=true; startY=y; startT=ticks(); };
  const move = y=>{ if(!dragging) return; setTicks(Math.round(startT + (y-startY)/PX)); };
  const up = ()=> dragging=false;
  col.addEventListener('mousedown', e=>down(e.clientY));
  window.addEventListener('mousemove', e=>move(e.clientY));
  window.addEventListener('mouseup', up);
  col.addEventListener('touchstart', e=>down(e.touches[0].clientY), {passive:true});
  col.addEventListener('touchmove', e=>{ move(e.touches[0].clientY); }, {passive:true});
  col.addEventListener('touchend', up);
  col.addEventListener('wheel', e=>{ e.preventDefault(); setTicks(ticks() - Math.sign(e.deltaY)); }, {passive:false});

  build(); render(); requestAnimationFrame(render); setTimeout(render, 80);
  window.addEventListener('resize', render);
  if (window.ResizeObserver){ new ResizeObserver(render).observe(col); }

  return {
    node: wrap,
    getValue: ()=> ({cm: Math.round(state.cm), unit: state.unit,
                     label: fmt()[0]}),
    setUnit(u){ if(u===state.unit) return; state.unit=u; build(); render(); },
  };
}

/* ============================================================= *
 *  TIME WHEEL PICKER  (hrs / mins / am-pm)
 * ============================================================= */
function timeWheel(initial){
  const IT = 40;                       // item height (matches .wheel .it)
  const cur = Object.assign({h:7, m:0, ap:'AM'}, initial||{});
  const hours = Array.from({length:12}, (_,i)=> i+1);
  const mins  = Array.from({length:60}, (_,i)=> i);
  const aps   = ['AM','PM'];

  function wheel(items, val, fmt, onSet){
    const w = h('div',{class:'wheel'});
    const sp = ()=> h('div',{class:'sp'});
    w.append(sp());
    const nodes = items.map((it,idx) => h('div',{class:'it', dataset:{v:it},
      onclick:()=>{ w.scrollTo({ top: idx*IT, behavior:'smooth' });
        w.scrollTop = idx*IT; mark(); onSet(items[idx]); } }, fmt(it)));
    nodes.forEach(n=> w.append(n));
    w.append(sp());
    function mark(){
      const i = Math.max(0, Math.min(items.length-1, Math.round(w.scrollTop / IT)));
      nodes.forEach((n,idx)=> n.classList.toggle('on', i===idx));
    }
    let t;
    w.addEventListener('scroll', ()=>{
      mark(); clearTimeout(t);
      t = setTimeout(()=>{
        const idx = Math.max(0, Math.min(items.length-1, Math.round(w.scrollTop/IT)));
        if (Math.abs(w.scrollTop - idx*IT) > 1) w.scrollTo({ top: idx*IT, behavior:'smooth' });
        onSet(items[idx]);
      }, 110);
    }, {passive:true});
    const initPos = ()=>{ w.scrollTop = Math.max(0, items.indexOf(val)) * IT; mark(); };
    requestAnimationFrame(initPos); setTimeout(initPos, 60); setTimeout(initPos, 200);
    return w;
  }

  const node = h('div',{class:'timepick-wrap'},
    h('div',{class:'wheel-heads'},
      h('span',{}, 'HOUR'), h('span',{}, 'MIN'), h('span',{}, 'AM/PM')),
    h('div',{class:'timepick'},
      h('div',{class:'wheel-band'}),
      wheel(hours, cur.h, v=>String(v), v=> cur.h=v),
      wheel(mins, cur.m, v=> String(v).padStart(2,'0'), v=> cur.m=v),
      wheel(aps, cur.ap, v=>v, v=> cur.ap=v),
    )
  );
  return { node, getValue: ()=> ({...cur,
    label:`${cur.h}:${String(cur.m).padStart(2,'0')} ${cur.ap}`}) };
}

/* ---- full-screen countdown --------------------------------- */
function runCountdown(host, from, onDone){
  const layer = h('div',{class:'countdown-full'}, h('div',{class:'n'}, String(from)));
  host.append(layer);
  let n = from;
  Voice.cue(String(n));
  const t = setInterval(()=>{
    n--;
    if (n <= 0){ clearInterval(t); layer.remove(); onDone(); return; }
    layer.replaceChildren(h('div',{class:'n'}, String(n)));
    Voice.cue(String(n));       // cancels the previous number so it never lags behind
  }, 1000);
  return ()=>{ clearInterval(t); layer.remove(); };
}

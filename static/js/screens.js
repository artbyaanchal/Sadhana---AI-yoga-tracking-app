/* ============================================================= *
 *  Sadhana - screens
 * ============================================================= */
const SCREENS = {};
const G = () => Store.gender();                       // 'female' | 'male'
const pimg = (k) => DATA.poseImg(G(), k);
// muted, looping, cropped demo clip of the pose (girl / boy versions)
function poseVideo(){
  const v = h('video',{ class:'pose-vid',
    src: VID + (G() === 'male' ? 'tree_m.mp4' : 'tree_f.mp4'),
    autoplay:true, playsinline:true, 'webkit-playsinline':true, preload:'auto' });
  v.muted = true; v.defaultMuted = true; v.volume = 0;
  // play once, then hold on the final pose frame
  v.addEventListener('ended', ()=>{ try{ v.pause(); v.currentTime = Math.max(0, v.duration - 0.05); }catch(e){} });
  setTimeout(()=>{ v.play && v.play().catch(()=>{}); }, 40);
  return v;
}

/* shell helper */
function frame({ status=true, top=null, step=null, scroll, footer=null, tab=null, cls='' }){
  const kids = [];
  if (status) kids.push(statusBar());
  if (top) kids.push(top);
  if (step != null) kids.push(step);
  const body = h('div',{class:'scroll '+cls}, ...[].concat(scroll));
  kids.push(body);
  if (footer) kids.push(h('div',{class:'sticky-footer'}, ...[].concat(footer)));
  // while casting to the TV the phone is a locked companion - no bottom nav
  if (tab && !(typeof TVSync !== 'undefined' && TVSync.connected)) kids.push(tabBar(tab));
  const root = h('div',{class:'screen-inner', style:{display:'flex',flexDirection:'column',flex:'1',minHeight:'0'}}, ...kids);
  return root;
}

/* social sign-in row (Facebook / Google / Apple brand marks) */
const BRAND = {
  facebook:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3H15.9c-1.5 0-2 .93-2 1.9v2.2h3.4l-.54 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>',
  google:'<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>',
  apple:'<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#111" d="M17.05 12.5c.03 3.2 2.8 4.26 2.83 4.28-.02.07-.44 1.53-1.46 3.03-.88 1.3-1.8 2.6-3.24 2.62-1.42.03-1.87-.84-3.5-.84-1.62 0-2.13.82-3.47.87-1.4.05-2.46-1.4-3.35-2.7-1.82-2.64-3.2-7.45-1.34-10.7A5.2 5.2 0 0 1 8.42 4.6c1.36-.03 2.65.92 3.48.92.83 0 2.4-1.13 4.04-.97.69.03 2.62.28 3.86 2.1-.1.06-2.3 1.35-2.28 4.02zM14.5 3.3c.73-.9 1.23-2.14 1.1-3.38-1.06.04-2.34.7-3.1 1.6-.68.78-1.28 2.05-1.12 3.25 1.18.1 2.39-.6 3.12-1.47z"/></svg>',
};
function socialRow(){
  const tap = ()=> toast('Social sign-in is a demo - use the form above');
  return h('div',{class:'social'},
    h('button',{'aria-label':'Continue with Facebook', onclick:tap, html:BRAND.facebook}),
    h('button',{'aria-label':'Continue with Google',   onclick:tap, html:BRAND.google}),
    h('button',{'aria-label':'Continue with Apple',    onclick:tap, html:BRAND.apple}));
}

/* bottom sheet */
function openSheet(node, { title } = {}){
  const sheet = h('div',{style:{
    position:'absolute',left:0,right:0,bottom:0,background:'#fff',borderRadius:'26px 26px 0 0',
    padding:'10px 20px calc(20px + var(--safe-bottom))',zIndex:60,boxShadow:'0 -12px 40px rgba(0,0,0,.18)',
    transform:'translateY(100%)',transition:'transform .28s ease'}},
    h('div',{style:{width:'40px',height:'4px',borderRadius:'99px',background:'#D8DEE1',margin:'6px auto 14px'}}),
    title ? h('h3',{style:{fontSize:'18px',marginBottom:'12px'}}, title) : null,
    node
  );
  const scrim = h('div',{style:{position:'absolute',inset:0,background:'rgba(15,30,40,.35)',zIndex:59,opacity:0,transition:'opacity .28s'},
    onclick:close});
  $('#app').append(scrim, sheet);
  requestAnimationFrame(()=>{ sheet.style.transform='translateY(0)'; scrim.style.opacity=1; });
  function close(){ sheet.style.transform='translateY(100%)'; scrim.style.opacity=0;
    setTimeout(()=>{ sheet.remove(); scrim.remove(); }, 280); }
  return close;
}

/* ============================================================= *
 *  AUTH
 * ============================================================= */
SCREENS.signup = () => {
  const name=h('input',{class:'input',placeholder:'Enter your name',value:Store.get('name','')});
  const email=h('input',{class:'input',type:'email',placeholder:'Enter Email',value:Store.get('email','')});
  const pass=h('input',{class:'input',type:'password',placeholder:'Enter Password'});
  return frame({ scroll:[
    h('h1',{class:'h-title',style:{marginTop:'18px',fontSize:'30px',color:'var(--navy)'}}, 'Get Started'),
    h('div',{class:'field-label'}, 'Full Name'), name,
    h('div',{class:'field-label'}, 'Email'), email,
    h('div',{class:'field-label'}, 'Password'), pass,
    h('div',{style:{height:'22px'}}),
    h('button',{class:'btn', onclick:()=>{
      if(!name.value||!email.value||!pass.value) return toast('Fill in all fields');
      Store.set('name',name.value); Store.set('email',email.value); go('ob-name');
    }}, 'Register'),
    h('div',{class:'divider'}, 'Sign up with'),
    socialRow(),
    h('div',{class:'btn-text', onclick:()=>go('login')}, 'Already have an account?  Log In'),
  ]});
};

SCREENS.login = () => {
  const email=h('input',{class:'input',type:'email',placeholder:'Enter Email',value:Store.get('email','')});
  const pass=h('input',{class:'input',type:'password',placeholder:'Enter Password'});
  let remember=false;
  const sw=h('span',{class:'switch',onclick:e=>{remember=!remember;e.target.classList.toggle('on',remember);}});
  return frame({ scroll:[
    h('h1',{class:'h-title',style:{marginTop:'18px',fontSize:'30px',color:'var(--navy)'}}, 'Welcome back'),
    h('div',{class:'field-label'}, 'Email'), email,
    h('div',{class:'field-label'}, 'Password'), pass,
    h('div',{class:'checkrow'},
      h('label',{}, sw, 'Remember me'),
      h('span',{class:'link', onclick:()=>toast('Password reset is a demo')}, 'Forgot password?')),
    h('div',{style:{height:'22px'}}),
    h('button',{class:'btn', onclick:()=>{
      if(!email.value||!pass.value) return toast('Enter your email and password');
      Store.set('email',email.value);
      go(Store.get('onboarded') ? 'home' : 'ob-name');
    }}, 'Log in'),
    h('div',{class:'divider'}, 'Sign up with'),
    socialRow(),
    h('div',{class:'btn-text', onclick:()=>go('signup')}, "Don't have an account?  Sign Up"),
  ]});
};

/* ============================================================= *
 *  ONBOARDING
 * ============================================================= */
SCREENS['ob-name'] = () => {
  const name=h('input',{class:'input',placeholder:'Enter full name',value:Store.get('name','')});
  const age=h('input',{class:'input',type:'number',inputmode:'numeric',placeholder:'Enter age',value:Store.get('age','')});
  return frame({
    step: stepBar(8, ()=>go('signup')),
    scroll:[
      h('h1',{class:'h-title'}, "Let's get to know you"),
      h('div',{class:'field-label'}, 'Your name'), name,
      h('div',{class:'field-label'}, 'Age'), age,
    ],
    footer: h('button',{class:'btn', onclick:()=>{
      if(!name.value) return toast('Enter your name');
      Store.set('name',name.value); Store.set('age',age.value); go('ob-gender');
    }}, 'Continue'),
  });
};

SCREENS['ob-gender'] = (p = {}) => {
  const fromSet = p.from === 'settings';
  let sel = Store.get('gender', null);
  if (sel === 'girl') sel = 'female'; if (sel === 'boy') sel = 'male';
  const cardF=h('button',{class:'gender'+(sel==='female'?' sel':''), onclick:()=>pick('female')},
    h('div',{class:'pic'}, h('img',{src:IMG+'f_gender.png'})), h('b',{}, 'Female'));
  const cardM=h('button',{class:'gender'+(sel==='male'?' sel':''), onclick:()=>pick('male')},
    h('div',{class:'pic'}, h('img',{src:IMG+'m_gender.png'})), h('b',{}, 'Male'));
  const pn=h('div',{class:'btn-text', style:{fontWeight:sel==='none'?'700':'600'},
    onclick:()=>pick('none')}, 'Prefer not to say');
  function pick(v){ sel=v; cardF.classList.toggle('sel',v==='female'); cardM.classList.toggle('sel',v==='male'); }
  return frame({
    top:  fromSet ? topBar({ back:()=>go('settings'), title:'Gender' }) : null,
    step: fromSet ? null : stepBar(16, ()=>go('ob-name')),
    scroll:[
      h('h1',{class:'h-title'}, "What's your gender?"),
      h('p',{class:'h-sub'}, 'This helps us tailor your practice.'),
      h('div',{class:'gender-grid'}, cardF, cardM),
      pn,
    ],
    footer: h('button',{class:'btn', onclick:()=>{
      if(!sel) return toast('Choose an option');
      Store.set('gender', sel); go(fromSet ? 'settings' : 'ob-weight');
    }}, fromSet ? 'Save' : 'Continue'),
  });
};

/* "Drag the scale to choose your value" - arrows above the text (Figma 296:3989 / 357:11123) */
function rulerHint(axis){
  const A = (d)=> `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#4A5A66" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const pair = axis === 'v'
    ? A('M9 15V3M4 8l5-5 5 5') + A('M9 3v12M4 10l5 5 5-5')      // up, down
    : A('M15 9H3M8 4L3 9l5 5') + A('M3 9h12M10 4l5 5-5 5');    // left, right
  return h('div',{class:'ruler-hint'},
    h('div',{class:'rh-arrows', html:pair}),
    h('span',{}, 'Drag the scale to choose your value'));
}

SCREENS['ob-weight'] = (p = {}) => {
  const fromSet = p.from === 'settings';
  const saved = Store.get('weight', {value:70, unit:'kg'});
  const ruler = HRuler({ min:30, max:200, step:1, value:saved.value, unit:saved.unit,
    onChange:(v,u)=> Store.set('weight',{value:v,unit:u}) });
  const unit = h('div',{class:'unit'},
    h('button',{class:saved.unit==='kg'?'on':'', onclick:e=>setU('kg',e)}, 'KG'),
    h('button',{class:saved.unit==='lb'?'on':'', onclick:e=>setU('lb',e)}, 'LB'));
  function setU(u,e){ ruler.convert(u);
    [...unit.children].forEach(b=>b.classList.toggle('on', b.textContent.toLowerCase()===u)); }
  return frame({
    top:  fromSet ? topBar({ back:()=>go('settings'), title:'Weight' }) : null,
    step: fromSet ? null : stepBar(25, ()=>go('ob-gender')),
    scroll:[
      h('h1',{class:'h-title'}, 'What is your weight?'),
      h('p',{class:'h-sub'}, 'This helps us calibrate pose guidance.'),
      ruler.node,
      h('div',{style:{display:'grid',placeItems:'center',marginTop:'6px'}}, unit),
      rulerHint('h'),
    ],
    footer: h('button',{class:'btn', onclick:()=>go(fromSet ? 'settings' : 'ob-height')}, fromSet ? 'Save' : 'Continue'),
  });
};

SCREENS['ob-height'] = (p = {}) => {
  const fromSet = p.from === 'settings';
  const saved = Store.get('height', {cm:170, unit:'ft'});
  const bigVal = h('div',{class:'val'});
  const ruler = VRuler({ initialCm:saved.cm, onChange:(cm,u)=>{
    Store.set('height',{cm,unit:u});
    bigVal.textContent = u==='cm' ? Math.round(cm)+' cm' : ftin(cm);
  }});
  const unit = h('div',{class:'unit'},
    h('button',{class:saved.unit==='ft'?'on':'', onclick:()=>setU('ft')}, 'FT/IN'),
    h('button',{class:saved.unit==='cm'?'on':'', onclick:()=>setU('cm')}, 'CM'));
  function setU(u){ ruler.setUnit(u);
    [...unit.children].forEach(b=>b.classList.toggle('on', b.textContent.replace('/','').toLowerCase().startsWith(u))); }
  return frame({
    top:  fromSet ? topBar({ back:()=>go('settings'), title:'Height' }) : null,
    step: fromSet ? null : stepBar(33, ()=>go('ob-weight')),
    scroll:[
      h('h1',{class:'h-title'}, 'What is your height?'),
      h('p',{class:'h-sub'}, 'This helps us calibrate pose guidance.'),
      h('div',{style:{display:'flex',gap:'8px',alignItems:'stretch',margin:'6px 0'}},
        ruler.node,
        h('div',{class:'height-side'}, bigVal, unit)),
      rulerHint('v'),
    ],
    footer: h('button',{class:'btn', onclick:()=>go(fromSet ? 'settings' : 'ob-level')}, fromSet ? 'Save' : 'Continue'),
  });
};

function selectList({ items, multi=0, saved=[], render }){
  const chosen = new Set(saved);
  const wrap = h('div',{class:'opt-list'});
  items.forEach(it=>{
    const node = render(it, chosen.has(it.id));
    node.addEventListener('click', ()=>{
      if (chosen.has(it.id)) chosen.delete(it.id);
      else {
        if (multi && chosen.size >= multi){
          if (multi === 1){ chosen.clear(); }
          else { toast(`Pick ${multi}`); return; }
        }
        chosen.add(it.id);
      }
      [...wrap.children].forEach((c,i)=> c.classList.toggle('sel', chosen.has(items[i].id)));
    });
    wrap.append(node);
  });
  return { wrap, get:()=> [...chosen] };
}

SCREENS['ob-level'] = (p = {}) => {
  const fromSet = p.from === 'settings';
  const s = selectList({ items:DATA.levels, multi:1, saved:[Store.get('level')].filter(Boolean),
    render:(it,on)=> h('div',{class:'opt'+(on?' sel':'')},
      h('img',{class:'opt-img',src:DATA.poseImg(G(),it.img)}),
      h('div',{class:'opt-body'}, h('div',{class:'opt-title'},it.title), h('div',{class:'opt-desc'},it.desc))) });
  // from = 'customize' (home > Customize Plan): level -> body-part focus -> back to home
  const custom = p.from === 'customize';
  return frame({
    top:  fromSet ? topBar({ back:()=>go('settings'), title:'Yoga Level' })
        : custom  ? topBar({ back:()=>go('home'), title:'Customize Plan' }) : null,
    step: (fromSet || custom) ? null : stepBar(42, ()=>go('ob-height')),
    scroll:[ h('h1',{class:'h-title'}, 'Choose your current yoga level'),
      h('p',{class:'h-sub'}, 'Select one.'), s.wrap ],
    footer: h('button',{class:'btn', onclick:()=>{
      if(!s.get().length) return toast('Select your level');
      Store.set('level', s.get()[0]);
      if (custom) return go('ob-focus', { from:'customize' });
      go(fromSet ? 'settings' : 'ob-goal');
    }}, fromSet ? 'Save' : 'Continue'),
  });
};

SCREENS['ob-goal'] = (p = {}) => {
  const fromSet = p.from === 'settings';
  const chosen = new Set(Store.get('goals',[]));
  const grid = h('div',{class:'goal-grid'},
    ...DATA.goals.map(g=> h('button',{class:'goal'+(chosen.has(g.id)?' sel':''), onclick:e=>{
      const el=e.currentTarget;
      if(chosen.has(g.id)) chosen.delete(g.id);
      else { if(chosen.size>=2) return toast('Pick one or two'); chosen.add(g.id); }
      $$('.goal',grid).forEach((c,i)=> c.classList.toggle('sel', chosen.has(DATA.goals[i].id)));
    }}, h('img',{src:DATA.poseImg(G(),g.img)}), h('span',{}, g.label))));
  return frame({
    top:  fromSet ? topBar({ back:()=>go('settings'), title:'Main Goals' }) : null,
    step: fromSet ? null : stepBar(50, ()=>go('ob-level')),
    scroll:[ h('h1',{class:'h-title'}, "What's your main goal?"),
      h('p',{class:'h-sub'}, 'Select one or two.'), grid ],
    footer: h('button',{class:'btn', onclick:()=>{
      if(!chosen.size) return toast('Pick at least one goal');
      Store.set('goals',[...chosen]); go(fromSet ? 'settings' : 'ob-focus');
    }}, fromSet ? 'Save' : 'Continue'),
  });
};

SCREENS['ob-focus'] = (p0 = {}) => {
  const custom = p0.from === 'customize';        // home > Customize Plan flow
  const chosen = new Set(Store.get('focus',[]));
  // chip position around the Tree-Pose figure (Figma 296:4405) + the body-highlight
  // blob it lights up on hover / when selected (cx/cy/rx/ry are % of the figure box)
  // hi = highlight-blob geometry as % of the figure box, calibrated to the girl
  // Tree-Pose art; the boy art sits ~12% left and ~2% lower so shift for 'male'.
  // hi.f / hi.m = highlight ellipse centre + radii as % of the girl / boy Tree-Pose
  // picture itself (the .fig box has the picture's aspect ratio, see app.css).
  const AREAS = [
    { id:'neck',   label:'Neck',             pos:{left:'4%',   top:'13%'},
      hi:{ f:{cx:55,  cy:31.5,rx:5,  ry:3.5}, m:{cx:43,cy:28.5,rx:5,  ry:3.2} } },
    { id:'arms',   label:'Arms & Shoulders', pos:{right:'1%',  top:'9%'},
      hi:{ f:{cx:55,  cy:27,  rx:16, ry:14 }, m:{cx:43,cy:25,  rx:16, ry:14 } } },
    { id:'chest',  label:'Chest',            pos:{left:'3%',   top:'31%'},
      hi:{ f:{cx:56.5,cy:36.5,rx:10, ry:5.5}, m:{cx:43,cy:38,  rx:12, ry:6  } } },
    { id:'belly',  label:'Belly',            pos:{right:'7%',  top:'39%'},
      hi:{ f:{cx:56.5,cy:45.5,rx:8,  ry:3.6}, m:{cx:43,cy:47.5,rx:10, ry:4  } } },
    { id:'glutes', label:'Glutes',           pos:{left:'3%',   top:'52%'},
      hi:{ f:{cx:56,  cy:52,  rx:11.5,ry:5 }, m:{cx:45,cy:59,  rx:12, ry:5.5} } },
    { id:'legs',   label:'Legs',             pos:{right:'9%',  top:'64%'},
      hi:{ f:{cx:54,  cy:73,  rx:10, ry:19 }, m:{cx:43,cy:79,  rx:9,  ry:16 } } },
    { id:'body',   label:'Body',             pos:{left:'50%', bottom:'0', transform:'translateX(-50%)'},
      hi:{ f:{cx:58,  cy:50,  rx:27, ry:46 }, m:{cx:46,cy:50,  rx:28, ry:46 } } },
  ];
  const male = G() === 'male';

  const fig = h('div',{class:'fig', style:{ aspectRatio: male ? '750/1006' : '743/1008' }},
    h('img',{src:pimg('tree')}));
  const blob = {};
  AREAS.forEach(a=>{
    const p = male ? a.hi.m : a.hi.f;
    const b = h('div',{class:'hl', style:{
      left:p.cx+'%', top:p.cy+'%', width:(p.rx*2)+'%', height:(p.ry*2)+'%' }});
    blob[a.id] = b; fig.append(b);
  });
  const repaint = ()=> AREAS.forEach(a=> blob[a.id].classList.toggle('on', chosen.has(a.id)));

  const chips = AREAS.map(a=>{
    const c = h('button',{class:'chip'+(chosen.has(a.id)?' sel':''), style:a.pos,
      onmouseenter:()=> blob[a.id].classList.add('on'),
      onmouseleave:()=> blob[a.id].classList.toggle('on', chosen.has(a.id)),
      onclick:()=>{
        if (chosen.has(a.id)){ chosen.delete(a.id); c.classList.remove('sel'); }
        else {
          if (chosen.size >= 2) return toast('Pick two areas - tap a selected one to swap');
          chosen.add(a.id); c.classList.add('sel');
        }
        repaint();
      }}, a.label);
    return c;
  });
  repaint();

  return frame({
    top:  custom ? topBar({ back:()=>go('ob-level',{from:'customize'}), title:'Customize Plan' }) : null,
    step: custom ? null : stepBar(58, ()=>go('ob-goal')),
    scroll:[
      h('h1',{class:'h-title'}, 'Which areas do you want to focus on?'),
      h('p',{class:'h-sub'}, 'Tap or hover a card to preview, then pick two.'),
      h('div',{class:'focus-wrap '+G()}, fig, ...chips),
    ],
    footer: h('button',{class:'btn', onclick:()=>{
      if (chosen.size !== 2) return toast('Pick exactly two areas');
      Store.set('focus',[...chosen]);
      if (custom){ toast('Plan updated'); return go('home'); }
      go('ob-activity');
    }}, custom ? 'Save' : 'Continue'),
  });
};

SCREENS['ob-activity'] = () => {
  const s = selectList({ items:DATA.activity, multi:1, saved:[Store.get('activity')].filter(Boolean),
    render:(it,on)=> h('div',{class:'opt'+(on?' sel':'')},
      h('img',{class:'opt-img',src:DATA.poseImg(G(),it.img)}),
      h('div',{class:'opt-body'}, h('div',{class:'opt-title'},it.title), h('div',{class:'opt-desc'},it.desc))) });
  return frame({
    step: stepBar(66, ()=>go('ob-focus')),
    scroll:[ h('h1',{class:'h-title'}, 'How active are you during the day?'),
      h('p',{class:'h-sub'}, 'Select one.'), s.wrap ],
    footer: h('button',{class:'btn', onclick:()=>{
      if(!s.get().length) return toast('Select one');
      Store.set('activity', s.get()[0]); go('ob-limits');
    }}, 'Continue'),
  });
};

SCREENS['ob-limits'] = () => {
  const tags = new Set(Store.get('limits',[]));
  const ta = h('textarea',{class:'input', placeholder:'Ex: Back Pain, Pregnancy'});
  const tagWrap = h('div',{class:'tags'});
  const sugg = h('div',{class:'hint-add', hidden:true});
  function drawTags(){
    tagWrap.replaceChildren(...[...tags].map(t=> h('span',{class:'tag'}, t,
      h('button',{onclick:()=>{ tags.delete(t); drawTags(); }}, '×'))));
  }
  function addTag(t){ t=t.trim(); if(!t) return; tags.add(t); ta.value=''; sugg.hidden=true; drawTags(); }
  ta.addEventListener('input', ()=>{
    const v = ta.value.toLowerCase();
    const match = v.includes('back') ? 'Back Pain'
      : v.includes('preg') ? 'Pregnancy'
      : v.includes('knee') ? 'Knee Injury'
      : v.includes('wrist') ? 'Wrist Pain' : null;
    if (match && !tags.has(match)){
      sugg.hidden=false;
      sugg.replaceChildren(h('button',{onclick:()=>addTag(match)}, '+ Add “'+match+'”'));
    } else sugg.hidden=true;
  });
  ta.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(ta.value); }});
  drawTags();
  return frame({
    step: stepBar(75, ()=>go('ob-activity')),
    scroll:[
      h('h1',{class:'h-title'}, 'Any physical limitations?'),
      h('p',{class:'h-sub'}, 'So we can keep your practice safe.'),
      h('div',{class:'field-label'}, 'Describe'), ta, sugg, tagWrap,
    ],
    footer: [
      h('button',{class:'btn', onclick:()=>{ if(ta.value.trim()) addTag(ta.value);
        Store.set('limits',[...tags]); go('ob-plan'); }}, 'Continue'),
      h('button',{class:'btn-skip', onclick:()=>{ Store.set('limits',[]); go('ob-plan'); }}, 'Skip'),
    ],
  });
};

/* ---- PLAN YOUR PRACTICE (gender aware) --------------------- */
function planScreen({ standalone=false, from=null } = {}){
  const fromSet = from === 'settings';
  const days = ['M','T','W','T','F','S','S'];
  const onDays = new Set(Store.get('days',[]));
  const daysRow = h('div',{class:'days'},
    ...days.map((d,i)=> h('button',{class:'day'+(onDays.has(i)?' on':''), onclick:e=>{
      onDays.has(i)?onDays.delete(i):onDays.add(i);
      e.currentTarget.classList.toggle('on', onDays.has(i));
    }}, d)));

  let reminder = Store.get('reminder', null);   // {h,m,ap,label}
  const remCard = h('div',{class:'card tap', style:{marginTop:'12px', display:'none'}});
  function drawRem(){
    remCard.replaceChildren(
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
        h('div',{}, h('b',{style:{fontFamily:'Quicksand',color:'var(--ink)'}}, 'Reminder Time'),
          h('div',{style:{color:'var(--muted)',fontSize:'13px',marginTop:'4px'}},
            reminder ? reminder.label : '--:-- --')),
        h('span',{class:'icon-btn', html:ICONS.chevron})));
  }
  remCard.addEventListener('click', ()=>{
    const tw = timeWheel(reminder || {h:7,m:0,ap:'AM'});
    const close = openSheet(h('div',{},
      tw.node,
      h('button',{class:'btn', style:{marginTop:'16px'}, onclick:()=>{
        reminder = tw.getValue(); Store.set('reminder',reminder); drawRem(); close(); toast('Reminder set for '+reminder.label);
      }}, 'Set reminder time')
    ), { title:'Reminder time' });
  });
  drawRem();

  let remindOn = Store.get('remindOn', false);
  const sw = h('span',{class:'switch'+(remindOn?' on':''), onclick:e=>{
    remindOn=!remindOn; e.currentTarget.classList.toggle('on',remindOn);
    remCard.style.display = remindOn ? 'block' : 'none';
    Store.set('remindOn',remindOn);
  }});
  remCard.style.display = remindOn ? 'block' : 'none';

  const kids = [
    standalone ? null : h('h1',{class:'h-title'}, 'Plan Your Practice'),
    standalone ? null : h('p',{class:'h-sub'}, 'Build a routine that fits you.'),
    h('h3',{style:{fontSize:'17px',margin:'8px 0 2px'}}, 'Which days would you like to practice yoga?'),
    daysRow,
    h('div',{class:'section-title'}, 'Practice reminder'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('span',{style:{fontSize:'13px',color:'var(--muted)',maxWidth:'80%'}},
        'Get a gentle reminder on your selected practice days.'), sw),
    remCard,
  ];

  /* girl-only: period tracker - pick a start date, then tap the last day (editable) */
  if (G() === 'female'){
    const range = { start: Store.get('periodStart', null), end: Store.get('periodEnd', null) };
    const base = new Date(); base.setDate(1);
    const cal = h('div',{class:'cal'});
    const hint = h('div',{class:'h-sub', style:{marginTop:'10px',marginBottom:'0'}});
    const ord = k => k ? (a=>a[0]*372 + a[1]*31 + a[2])(k.split('-').map(Number)) : 0;
    function persist(){
      Store.set('periodStart', range.start); Store.set('periodEnd', range.end);
      const arr = [];
      if (range.start){
        const [sy,sm,sd] = range.start.split('-').map(Number);
        const endK = range.end || range.start;
        const [ey,em,ed] = endK.split('-').map(Number);
        let cur = new Date(sy,sm,sd), stop = new Date(ey,em,ed);
        while (cur <= stop){ arr.push(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`); cur.setDate(cur.getDate()+1); }
      }
      Store.set('period', arr);
      hint.textContent = !range.start ? 'Tap the day your period started.'
        : !range.end ? 'Now tap the last day of your period (you can change it anytime).'
        : `${arr.length} day${arr.length>1?'s':''} selected - tap another day to adjust the last date.`;
    }
    function pick(key){
      if (!range.start){ range.start = key; range.end = null; }
      else if (key === range.start){ range.start = null; range.end = null; }   // tap the start again to clear
      else if (ord(key) < ord(range.start)){
        if (range.end) range.start = key;                 // pull the start earlier, keep the last date
        else { range.end = range.start; range.start = key; }
      }
      else { range.end = key; }                            // set / edit the last date
      persist(); drawCal();
    }
    function drawCal(){
      const y=base.getFullYear(), m=base.getMonth();
      const first = new Date(y,m,1).getDay();
      const dim = new Date(y,m+1,0).getDate();
      const grid = h('div',{class:'cal-grid'},
        ...['S','M','T','W','T','F','S'].map(d=>h('div',{class:'dow'},d)));
      for(let i=0;i<first;i++) grid.append(h('div',{class:'cal-cell mut'}));
      for(let d=1;d<=dim;d++){
        const key = `${y}-${m}-${d}`;
        const o = ord(key), so = ord(range.start), eo = ord(range.end || range.start);
        let cls = 'cal-cell';
        if (range.start && o >= so && o <= eo) cls += ' on';
        if (key === range.start) cls += ' start';
        if (range.end && key === range.end) cls += ' end';
        grid.append(h('button',{class:cls, onclick:()=>pick(key)}, String(d)));
      }
      cal.replaceChildren(
        h('div',{class:'cal-head'},
          h('span',{class:'icon-btn', html:ICONS.back, onclick:()=>{ base.setMonth(m-1); drawCal(); }}),
          h('span',{}, base.toLocaleString([], {month:'long', year:'numeric'})),
          h('span',{class:'icon-btn', style:{transform:'rotate(180deg)'}, html:ICONS.back, onclick:()=>{ base.setMonth(m+1); drawCal(); }})),
        grid);
    }
    persist(); drawCal();
    kids.push(
      h('h3',{style:{fontSize:'17px',margin:'26px 0 4px'}}, 'When was your last period?'),
      h('p',{class:'h-sub',style:{marginBottom:'8px'}}, 'This helps us adapt your practice around your cycle.'),
      cal, hint,
      h('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginTop:'10px',fontSize:'12px',color:'var(--muted)'}},
        h('span',{style:{width:'10px',height:'10px',borderRadius:'50%',background:'var(--bad)'}}),
        'On these dates we suggest gentler, restorative sessions.'),
    );
  }

  const save = h('button',{class:'btn', onclick:()=>{
    Store.set('days',[...onDays]);
    Store.set('onboarded', true);
    go(fromSet ? 'settings' : standalone ? 'home' : 'ob-ready');
  }}, 'Save My Routine');

  return frame({
    step: standalone ? null : stepBar(88, ()=>go('ob-limits')),
    top: standalone ? topBar({ back:()=>go(fromSet ? 'settings' : 'home'), title:'Plan Your Practice' }) : null,
    scroll: kids.filter(Boolean),
    footer: [ save, standalone?null:h('button',{class:'btn-skip', onclick:()=>go('ob-ready')}, 'Skip') ],
    tab: standalone ? null : null,
  });
}
SCREENS['ob-plan'] = () => planScreen({ standalone:false });
SCREENS['plan']    = (p = {}) => planScreen({ standalone:true, from:p.from });

SCREENS['ob-ready'] = () => {
  Store.set('onboarded', true);
  return frame({ status:true, scroll:
    h('div',{class:'center-col'},
      h('div',{class:'big-check', html:'<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}),
      h('h1',{class:'h-title',style:{fontSize:'26px'}}, 'Your plan is ready!'),
      h('p',{class:'h-sub'}, "We've built a personalized practice just for you, based on your goals and level."),
      h('button',{class:'btn', style:{maxWidth:'260px',marginTop:'10px'}, onclick:()=>showSplash(()=>go('home'))}, 'Go to Home'),
    )
  });
};

/* ============================================================= *
 *  HOME
 * ============================================================= */
function statCards(){
  const sc = (icon, val, label) => h('div',{class:'sc'},
    h('div',{class:'icn'}, h('img',{src:IMG+icon})), h('b',{}, val), h('span',{}, label));
  return h('div',{class:'statrow'},
    sc('ic_streak.png',   String(Store.get('streak', 1)),        'Streak'),
    sc('ic_duration.png', Store.get('durationLabel', '1 min'),   'Duration'),
    sc('ic_practice.png', String(Store.get('posesPracticed', 1)),'Pose Practice'));
}
/* Weekly Summary - a separate stat row per discipline (Figma 296:4682) */
function statRow(items){
  const sc = (icon, val, label) => h('div',{class:'sc'},
    h('div',{class:'icn'}, h('img',{src:IMG+icon})), h('b',{}, val), h('span',{}, label));
  return h('div',{class:'statrow'}, ...items.map(it=> sc(it[0], it[1], it[2])));
}
/* Most Practiced Meditation - sound/chant cards with a % bar */
function medCards(list){
  return h('div',{class:'hscroll'},
    ...list.map(m => h('div',{class:'pose-card med'},
      h('div',{class:'med-ic'}, h('img',{src:IMG+'snd/'+(m.icon||'bowl')+'.svg', alt:''})),
      h('b',{}, m.name),
      h('div',{class:'row'},
        h('div',{class:'pbar'}, h('i',{style:{width:m.pct+'%'}})),
        h('span',{class:'pct'}, m.pct+'%')))));
}
/* "Songs" note glyph - Figma Components 364:14363 */
const MUSIC_SVG = '<svg viewBox="0 0 24 24" fill="#144B70" xmlns="http://www.w3.org/2000/svg"><path d="M20.074 0.896C20.707 0.817 21.411 1.225 21.643 1.824c.065.169.097.466.098.65.009.953.001 1.907 0 2.861l-.003 5.692-.005 4.023c.001.74.03 1.531-.013 2.264-.09 1.55-1.293 2.834-2.693 3.358-1.886.705-4.076-.159-4.768-2.083-.351-.966-.299-2.032.146-2.958.977-2.062 3.488-3.037 5.564-2.048.026-.786.008-1.652.007-2.445l-.001-4.009c-.336.113-.57.154-.905.239l-1.893.47-5.358 1.387c-.56.146-1.164.278-1.713.428-.226.073-.482.109-.706.197-.077.023-.102.096-.108.171-.02.249-.011.512-.009.762l.001 1.282.005 4.489c.003.817.056 1.742-.009 2.546-.116 1.425-1.148 2.659-2.411 3.216-3.13 1.383-6.285-1.39-5.06-4.675.385-1.055 1.179-1.91 2.202-2.372.166-.075.63-.268.804-.302.642-.126 1.339-.134 1.978.018.128.031.579.22.727.276-.018-2.04.009-4.132.008-6.179l-.001-2.007c0-.328-.014-.899.027-1.206.053-.415.205-.812.444-1.156.77-1.109 2.272-1.331 3.509-1.635l3.039-.768 3.956-1.01c.449-.113 1.15-.326 1.571-.402ZM9.368 8.153c.213-.061.39-.084.593-.137l2.085-.537 5.355-1.388c.652-.173 1.319-.32 1.968-.501.185-.052.436-.086.609-.15l-.001-1.898c.001-.2.017-.729-.011-.89-.047-.039-.046-.026-.119-.024-1.015.281-1.981.515-2.996.774l-4.401 1.145-1.749.446c-.494.13-.979.171-1.258.659-.074.131-.123.275-.143.425-.034.244-.011.849-.014 1.128-.002.213-.012.734.005.919l.029.043.048-.012ZM5.264 21.092c.765-.1 1.35-.339 1.848-.95.76-.934.796-2.519-.204-3.297-.319-.248-.849-.408-1.251-.384-2.999.241-3.343 4.581-.393 4.631ZM17.715 19.31c.846-.093 1.291-.293 1.862-.964.39-.458.591-1.223.525-1.817-.055-.529-.319-1.014-.733-1.347-.356-.284-.833-.42-1.285-.407-.736.069-1.329.37-1.803.941-.427.506-.631 1.163-.566 1.822.048.517.346 1.035.746 1.364.367.302.785.385 1.253.408Z"/></svg>';

SCREENS.home = () => {
  const greetName = String(Store.get('name','') || '').trim().split(/\s+/)[0];   // first name in the greeting
  const lvl = (DATA.levels.find(l=>l.id===Store.get('level'))||{title:'Beginner'}).title;

  const planCard = h('div',{class:'plan-card'},
    h('div',{class:'top'},
      h('div',{class:'rows'},
        h('div',{class:'plan-row'}, h('img',{src:IMG+'plan_dur.svg'}),
          h('div',{class:'tx'}, h('b',{}, '30 mins'), h('span',{}, 'Duration'))),
        h('div',{class:'plan-row'}, h('img',{src:IMG+'plan_lvl.svg'}),
          h('div',{class:'tx'}, h('b',{}, lvl), h('span',{}, 'Level'))),
        h('div',{class:'plan-row'}, h('img',{src:IMG+'plan_pose.svg'}),
          h('div',{class:'tx'}, h('b',{}, String(1 + DATA.morePoses.length)), h('span',{}, 'Poses')))),
      h('img',{class:'fig', src:pimg('lotus')})),
    h('button',{class:'btn', onclick:()=>go('session-overview')}, 'Session Overview'));

  return frame({
    status:true,
    top: h('div',{class:'home-hi'},
      h('div',{class:'greet'}, h('h1',{}, greetName ? 'Hello, ' + greetName : 'Hello,'), h('p',{}, 'Ready to move, breathe & feel better')),
      h('button',{class:'av', 'aria-label':'Select music', onclick:()=>go('music'), html:MUSIC_SVG})),
    scroll:[
      h('div',{class:'your-plan'}, 'YOUR YOGA PLAN'),
      planCard,
      h('div',{class:'feat-card', onclick:()=>go('ob-level',{from:'customize'})},
        h('div',{class:'txt'}, h('b',{}, 'Customize Plan'), h('p',{}, 'Choose your level, time, Goals')),
        h('img',{src:IMG+'il_customize.png'})),
      h('div',{class:'feat-card', onclick:()=>go('plan')},
        h('div',{class:'txt'}, h('b',{}, 'Set Weekly Goal'), h('p',{}, 'Choose days, set reminder & stay consistent')),
        h('img',{src:IMG+'il_weeklygoal.png'})),
      h('div',{class:'your-plan', style:{marginTop:'22px'}}, 'Weekly Summary'),
      statCards(),
      h('div',{style:{height:'8px'}}),
    ],
    tab:'Home',
  });
};

/* ============================================================= *
 *  SESSION OVERVIEW - warm-up + pose checklist, then Start / Connect
 * ============================================================= */
function ovwRow({ img, title, sec, onClick }){
  return h('div',{class:'ovw-row'+(onClick?' tappable':''), onclick:onClick||null},
    h('div',{class:'ovw-pic'}, h('img',{class:'ovw-img', src:img})),
    h('div',{class:'ovw-tx'}, h('b',{}, title), h('span',{}, sec+' sec')));
}
SCREENS['session-overview'] = () => frame({
  top: topBar({ back:()=>go('home'), title:'Yoga Session' }),
  scroll:[
    h('div',{class:'ovw-head'}, 'WARM UP'),
    ...DATA.warmup.map(w=> ovwRow({ img: IMG+'sov_'+(G()==='male'?'m':'f')+'_'+w.video+'.png',
      title:w.label, sec:w.sec, onClick:()=>go('warmup-why', {id:w.id}) })),
    h('div',{class:'ovw-head', style:{marginTop:'22px'}}, 'YOGA POSES'),
    ovwRow({ img: IMG+'sov_'+(G()==='male'?'m':'f')+'_tree.png', title: DATA.pose.name, sec: DATA.pose.sec, onClick:()=>go('yoga-why') }),
    ...DATA.morePoses.map(p=> ovwRow({ img: IMG+'sov_'+(G()==='male'?'m':'f')+'_'+p.img+'.png',
      title:p.name, sec:p.sec, onClick:()=>go('yoga-why', {id:p.id}) })),
  ],
  footer: h('div',{class:'footer-row'},
    h('button',{class:'btn', onclick:()=>go('warmup')}, 'Start Session'),
    h('button',{class:'btn ghost', onclick:()=>go('connect')}, 'Connect to Screen')),
});

/* the per-move "Why this pose?" card - reached by tapping a warm-up row */
SCREENS['warmup-why'] = (p={}) => {
  const w = DATA.warmupItem(p.id) || DATA.warmup[0];
  const v = h('video',{ src:DATA.warmupVideo(G(), w.video), autoplay:true, loop:true,
    muted:true, playsinline:true, 'webkit-playsinline':true });
  v.muted = true;
  return frame({
    top: topBar({ back:()=>go('session-overview'), title:w.label, center:true }),
    scroll:[
      h('p',{class:'why-sub'}, w.sub),
      h('div',{class:'why-card'},
        h('h3',{}, 'Why this pose?'),
        h('p',{class:'why-txt'}, w.why),
        h('div',{class:'why-media'}, v),
        h('ul',{}, ...w.benefits.map(b=> h('li',{}, b)))),
    ],
    footer: h('button',{class:'btn', onclick:()=>go('warmup', {start:w.id})}, 'Start Warm Up'),
  });
};

/* ============================================================= *
 *  WARM UP - guided run-through of the 4 moves, one at a time
 * ============================================================= */
/* the phone always runs the AI tracker for the warm-up now - when connected the
   TV mirrors the animation (pushed from inside warmupTracked). warmupPlayer is
   kept for reference / fallback but no longer routed to. */
SCREENS.warmup = (p={}) => warmupTracked(p);

/* casting to the TV - phone is just the guided video player + timer */
function warmupPlayer(p={}){
  const items = DATA.warmup;
  let i = Math.max(0, items.findIndex(w=>w.id===p.start));
  if (i < 0) i = 0;
  const label = h('div',{class:'h-title', style:{fontSize:'21px',textAlign:'center',marginTop:'10px'}}, items[i].label);
  const subEl = h('div',{class:'why-sub', style:{marginTop:'2px'}}, items[i].sub || '');
  const stepTx = h('div',{class:'wu-step'}, 'Step '+(i+1)+' of '+items.length);
  // SVG must be built via innerHTML (`html:`) - h()'s createElement() can't
  // make real namespaced <svg>/<circle> nodes, so they'd never paint.
  const ring = h('div',{class:'wu-ring', html:
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" class="trk"/><circle cx="32" cy="32" r="28" class="val"/></svg>'},
    h('b',{}, items[0].sec));
  const valCircle = ring.querySelector('.val');
  const CIRC = 2*Math.PI*28;
  valCircle.style.strokeDasharray = CIRC;
  const videoHost = h('div',{class:'wu-vid'});

  let vid = null, t = null, left = items[0].sec, paused = false;
  function pushTV(){
    const it = items[i];
    TVSync.push({ mode:'warmup', name:it.label, sub:it.sub || '',
      video:'warmup/'+(G()==='male'?'boy':'girl')+'_'+it.video+'.mp4',
      count: Math.max(0,left), paused,
      progress: Math.round(((i + (it.sec-left)/it.sec) / items.length) * 100),
      steps:{ total:items.length, cur:i } });
  }
  function mount(){
    const it = items[i];
    label.textContent = it.label;
    subEl.textContent = it.sub || '';
    stepTx.textContent = 'Step '+(i+1)+' of '+items.length;
    left = it.sec; ring.querySelector('b').textContent = left;
    valCircle.style.strokeDashoffset = 0;
    if (vid) vid.remove();
    vid = h('video',{ src: DATA.warmupVideo(G(), it.video),
      autoplay:true, loop:true, muted:true, playsinline:true, 'webkit-playsinline':true });
    vid.muted = true;
    videoHost.replaceChildren(vid);
    Chime.ring(0.5);
    setTimeout(()=> Voice.say("Let's do "+it.label+'.', {force:true}), 350);
    clearInterval(t);
    t = setInterval(tick, 1000);
    pushTV();
  }
  function tick(){
    if (paused) return;
    left--; ring.querySelector('b').textContent = Math.max(0,left);
    const it = items[i];
    valCircle.style.strokeDashoffset = CIRC * (1 - Math.max(0,left)/it.sec);
    pushTV();
    if (left <= 0){
      clearInterval(t);
      i++;
      if (i >= items.length){ Chime.ring(0.6); Voice.say('Warm up complete. Let’s begin your pose.', {force:true});
        setTimeout(()=> go('yoga'), 900); return; }
      mount();
    }
  }
  mount();

  const pauseBtn = h('button',{class:'btn ghost', style:{flex:'1'}, onclick:()=>{
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (vid){ paused ? vid.pause() : vid.play().catch(()=>{}); }
    pushTV();
  }}, 'Pause');

  const root = frame({
    top: topBar({ back:()=>go('session-overview'), title:'Warm Up' }),
    scroll:[
      stepTx,
      h('div',{class:'wu-card'}, videoHost, ring),
      label,
      subEl,
    ],
    footer: h('div',{class:'footer-row'},
      pauseBtn,
      h('button',{class:'btn', style:{flex:'1.3'}, onclick:()=>{ paused=false; left=0; tick(); }}, 'Next')),
  });
  root._cleanup = ()=>{ clearInterval(t); Voice.stop(); };
  return root;
}

/* not casting - real camera + AI skeleton for each warm-up move */
function warmupTracked(p={}){
  const all = DATA.warmup;
  const s = Math.max(0, all.findIndex(w=>w.id===p.start));
  const items = s > 0 ? all.slice(s) : all;

  const scoreB = h('b',{}, '0');
  const stepChip = h('div',{class:'side-chip'}, 'MOVE 1 / '+items.length);
  const timeChip = h('div',{class:'time-chip'}, '0:'+String(items[0].sec).padStart(2,'0'));
  const statusEl = h('div',{class:'status'}, items[0].label);
  const breathEl = h('div',{class:'wu-breath', hidden:true});
  const bar = h('i',{style:{width:'0%'}});
  const cues = h('div',{class:'cues'});
  const detectFlash = h('div',{class:'detect-flash', hidden:true}, '✓ Detected');
  let voiceOn = Voice.on;
  const vBtn = h('button',{class:'voice-toggle', onclick:()=>{
    voiceOn = Voice.toggle(); vBtn.firstChild.textContent = voiceOn?'🔊':'🔇';
    vBtn.lastChild.textContent = voiceOn?'Voice on':'Voice off';
  }}, h('span',{},'🔊'), h('span',{}, 'Voice on'));

  const host = h('div',{class:'tracker'},
    h('div',{class:'hud'},
      h('div',{class:'hud-top'},
        h('div',{class:'score'}, scoreB, h('span',{}, 'Warm Up')),
        h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
          h('button',{class:'voice-toggle', onclick:()=>{ tracker.stop(); go('session-overview'); }}, '✕ Exit'),
          timeChip, vBtn)),
      stepChip,
      statusEl,
      breathEl,
      h('div',{class:'spacer'}),
      cues,
      h('div',{class:'bar'}, bar),
      h('div',{class:'controls'},
        h('button',{class:'btn ghost', onclick:()=>{ tracker.stop(); go('session-overview'); }}, 'Stop'),
        h('button',{class:'btn', onclick:()=> tracker && tracker.onEnd()}, 'Skip to pose')),
      detectFlash
    )
  );

  const wuVid = idx => 'warmup/'+(G()==='male'?'boy':'girl')+'_'+items[idx].video+'.mp4';
  let castVideo = false, curPhase = 'Get ready';
  function pushTV(idx, { count=null, timer=null, progress=0 } = {}){
    const it = items[idx];
    TVSync.push({ mode:'warmup', name:it.label, sub:it.sub || '', phase: curPhase,
      video: castVideo ? wuVid(idx) : null,
      count, timer, progress, steps:{ total:items.length, cur:idx } });
  }

  const tracker = new WarmupTracker(host, {
    items,
    onDetected:()=>{
      detectFlash.hidden = false;
      setTimeout(()=>{ detectFlash.hidden = true; }, 1800);
      castVideo = true; curPhase = 'Breathe in';
      pushTV(0, { timer:'0:'+String(items[0].sec).padStart(2,'0'), progress:0 });
    },
    onMove:(idx, it)=>{
      stepChip.textContent = 'MOVE '+(idx+1)+' / '+items.length;
      statusEl.textContent = it.label;
      curPhase = 'Breathe in';
      pushTV(idx, { timer:'0:'+String(it.sec).padStart(2,'0'), progress:Math.round((idx/items.length)*100) });
    },
    onBreath:(key, label)=>{
      curPhase = label;
      breathEl.hidden = false;
      breathEl.textContent = label.toUpperCase();
      breathEl.className = 'wu-breath ' + key;
      pushTV(tracker.idx || 0, { timer: timeChip.textContent, progress: parseFloat(bar.style.width)||0 });
    },
    onGuide:(text)=>{
      statusEl.textContent = text;
      cues.replaceChildren(h('div',{class:'cue ok'}, '➜ ' + text));
    },
    onTick:(idx, leftSec, sc)=>{
      scoreB.textContent = String(sc);
      bar.style.width = sc+'%';
      timeChip.textContent = '0:'+String(Math.max(0,leftSec)).padStart(2,'0');
      const it = items[idx];
      pushTV(idx, { timer:'0:'+String(Math.max(0,leftSec)).padStart(2,'0'),
        progress: Math.round(((idx + (it.sec-leftSec)/it.sec) / items.length) * 100) });
    },
    onCues:(list)=> cues.replaceChildren(...list.map(([t,ok])=>
      h('div',{class:'cue'+(ok?' ok':'')}, (ok?'✓ ':'• ')+t))),
    onEnd:()=>{ tracker.stop(); TVSync.push({ mode:'idle' }); Store.set('warmupDone', 1); go('yoga'); },
  });

  // ---- 10-second get-ready countdown before the first move ----
  // (same layout as the Yoga "Casting to the big screen" pre-roll)
  const onTV = TVSync.connected;
  const cd = h('div',{class:'cd'}, '10');
  const bannerTxt = h('div',{class:'t'}, onTV ? 'Follow the moves on the big screen.' : 'AI tracking starts in a moment…');
  const preroll = frame({
    top: topBar({ back:()=>go('session-overview'), title:'Warm Up', center:true,
      right:[ iconBtn('cast', ()=>go('connect')) ] }),
    scroll: [ h('div',{class:'center-col', style:{gap:'18px'}},
      h('div',{class:'connect-hero', html:'<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>'}),
      h('h1',{class:'h-title', style:{fontSize:'20px'}}, onTV ? 'Casting to the big screen' : 'Get ready to warm up'),
      h('p',{class:'h-sub'}, onTV
        ? 'Step back so the camera sees your whole body. Watch the moves on the TV - this screen tracks you.'
        : 'Step back so the camera sees your whole body. Follow each move - this screen tracks you.')) ],
    footer: h('div',{class:'ai-banner'},
      h('img',{src:IMG+'ic_body.png'}), bannerTxt, cd),
  });

  const root = h('div',{class:'screen-inner', style:{flex:1,position:'relative',display:'flex',flexDirection:'column'}}, preroll);
  let n = 10, ct = null;
  Voice.say("Let's warm up. Get into frame and I'll detect you.", {force:true});
  curPhase = 'Get into frame';
  pushTV(0, { count:10 });
  ct = setInterval(()=>{
    n--; cd.textContent = String(Math.max(0,n));
    pushTV(0, { count:n });
    if (n <= 0){
      clearInterval(ct); ct = null;
      root.replaceChildren(host);
      curPhase = 'Detecting…';
      pushTV(0, {});
      tracker.start();
    }
  }, 1000);

  root._cleanup = ()=>{ if (ct) clearInterval(ct); tracker.stop(); Voice.stop(); TVSync.push({ mode:'idle' }); };
  return root;
}

/* ============================================================= *
 *  YOGA screen + Why
 * ============================================================= */
SCREENS.yoga = () => {
  const onTV = TVSync.connected;   // animation is on the big screen - phone only preps the camera
  const cd = h('div',{class:'cd'}, '10');
  const br = breathe({ silent:true });   // no "breathe in / out" narration - the tracker reads the pose
  const bannerTxt = h('div',{class:'t'}, onTV ? 'Follow the pose on the big screen.' : 'AI tracking starts after you settle in…');
  const root = frame({
    top: topBar({ back:()=>go('home'), title:'Yoga', center:true,
      right:[ iconBtn('cast', ()=>go('connect')) ] }),
    scroll: onTV
      ? [ h('div',{class:'center-col', style:{gap:'18px'}},
            h('div',{class:'connect-hero', html:'<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>'}),
            h('h1',{class:'h-title', style:{fontSize:'20px'}}, 'Casting to the big screen'),
            h('p',{class:'h-sub'}, 'Step back so the camera sees your whole body. Watch the pose on the TV - this screen tracks you.')) ]
      : [ h('div',{class:'pose-name-row'},
            h('b',{}, DATA.pose.name),
            h('button',{class:'help-btn', html:ICONS.help, 'aria-label':'Why this pose', onclick:()=>go('yoga-why')})),
          br.node,
          h('div',{class:'pose-hero'}, poseVideo()) ],
    footer: h('div',{class:'ai-banner'},
      h('img',{src:IMG+'ic_body.png'}),
      bannerTxt, cd),
  });
  let n = 10, t = null;
  TVSync.push({ mode:'yoga', name:DATA.pose.name, sub:'Get ready…',
    video:'tree_'+(G()==='male'?'m':'f')+'.mp4', phase:'Get ready', progress:0 });
  // give the user ~2s to read, then start the breath + countdown
  const startT = setTimeout(()=>{
    if (!onTV) br.start();
    bannerTxt.replaceChildren(document.createTextNode(onTV ? 'AI tracking starts in ' : 'AI tracking is about to start. Starting in '),
      h('b',{}, '10'), document.createTextNode(' sec'));
    t = setInterval(()=>{
      n--; cd.textContent = String(n);
      TVSync.push({ mode:'yoga', name:DATA.pose.name, sub:'AI tracking starts soon',
        video:'tree_'+(G()==='male'?'m':'f')+'.mp4', count:n, phase:'Get ready', progress:0 });
      root.querySelectorAll('.ai-banner b').forEach(b=> b.textContent = String(n));
      if (n <= 0){ clearInterval(t); if (document.body.contains(root)) go('tracker'); }
    }, 1000);
  }, 2000);
  root._cleanup = ()=>{ clearTimeout(startT); clearInterval(t); br.stop(); };
  return root;
};

SCREENS['yoga-why'] = (p={}) => {
  const extra = DATA.morePoseById(p.id);          // undefined -> the tracked Tree Pose
  const pose  = extra || DATA.pose;
  return frame({
    top: topBar({ back:()=> extra ? go('session-overview') : go('yoga'), title:pose.name, center:true }),
    scroll:[
      h('p',{style:{color:'var(--muted)',marginTop:'2px'}}, pose.sanskrit),
      h('div',{class:'card',style:{marginTop:'14px'}},
        h('h3',{style:{fontSize:'17px',marginBottom:'8px'}}, 'Why this pose?'),
        h('p',{style:{fontSize:'14px',lineHeight:'1.6'}}, pose.why)),
      h('div',{class:'pose-hero',style:{minHeight:'220px'}}, h('img',{src:pimg(extra ? extra.img : 'tree')})),
      h('ul',{style:{margin:'8px 0 0 18px',display:'flex',flexDirection:'column',gap:'8px',fontSize:'14px'}},
        ...pose.benefits.map(b=> h('li',{}, b))),
    ],
    footer: extra
      ? h('button',{class:'btn', onclick:()=>go('session-overview')}, 'Back to session')
      : h('button',{class:'btn', onclick:()=>go('tracker')}, 'Start pose tracking'),
  });
};

/* ============================================================= *
 *  POSE TRACKER
 * ============================================================= */
SCREENS.tracker = () => {
  const scoreB = h('b',{}, '0');
  const sec0 = DATA.pose.sec || 45;
  const timeChip = h('div',{class:'time-chip'}, Math.floor(sec0/60)+':'+String(sec0%60).padStart(2,'0'));
  const sideChip = h('div',{class:'side-chip'}, 'STANDING ON LEFT');
  const statusEl = h('div',{class:'status'}, 'Get into frame');
  const bar = h('i',{style:{width:'0%'}});
  const cues = h('div',{class:'cues'});
  let voiceOn = Voice.on;
  const vBtn = h('button',{class:'voice-toggle', onclick:()=>{
    voiceOn = Voice.toggle(); vBtn.firstChild.textContent = voiceOn?'🔊':'🔇';
    vBtn.lastChild.textContent = voiceOn?'Voice on':'Voice off';
  }}, h('span',{},'🔊'), h('span',{}, 'Voice on'));

  const host = h('div',{class:'tracker'},
    h('div',{class:'hud'},
      h('div',{class:'hud-top'},
        h('div',{class:'score'}, scoreB, h('span',{}, 'Tree Pose')),
        h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
          h('button',{class:'voice-toggle', onclick:()=>{ tracker.stop(); go('yoga'); }}, '✕ Exit'),
          timeChip, vBtn)),
      sideChip,
      statusEl,
      h('div',{class:'spacer'}),
      cues,
      h('div',{class:'bar'}, bar),
      h('div',{class:'controls'},
        h('button',{class:'btn ghost', onclick:()=>{ tracker.stop(); go('yoga'); }}, 'Stop'),
        h('button',{class:'btn', onclick:()=> tracker && tracker.onEnd(tracker.best || parseInt(scoreB.textContent)||60)}, 'Finish now'))
    )
  );

  let curSide = 'left';
  const tracker = new TreeTracker(host, {
    onScore:(s, parts, leftSec, side, kneeDanger)=>{
      scoreB.textContent = String(s);
      bar.style.width = s+'%';
      scoreB.parentElement.classList.toggle('danger', !!kneeDanger);
      let l = null;
      if (leftSec != null){ l=Math.max(0,Math.round(leftSec));
        timeChip.textContent = Math.floor(l/60)+':'+String(l%60).padStart(2,'0'); }
      if (side){ curSide = side; sideChip.textContent = 'STANDING ON ' + side.toUpperCase(); }
      statusEl.textContent = kneeDanger ? '⚠ Move your foot off the knee'
        : s>=80?'Excellent tree pose!':s>=60?'Good - steady now':s>=40?'Getting there':s>=15?'Adjust your pose':'Get into frame';
      statusEl.classList.toggle('danger', !!kneeDanger);
      // mirror to the TV - animation + pose name + which leg + timer + progress ONLY
      // (no camera, no AI accuracy/feedback - that stays on the phone)
      TVSync.push({ mode:'yoga', name:DATA.pose.name,
        phase: curSide==='left' ? 'Standing on the left leg' : 'Standing on the right leg',
        video:'tree_'+(G()==='male'?'m':'f')+'.mp4',
        timer: l!=null ? (Math.floor(l/60)+':'+String(l%60).padStart(2,'0')) : null,
        progress: l!=null ? Math.round((1 - l/sec0)*100) : 0,
        steps:{ total:2, cur: curSide==='right' ? 1 : 0 } });
    },
    onEnd:(finalScore, bestSide)=>{
      tracker.stop();
      TVSync.push({ mode:'idle' });
      Store.set('lastScore', finalScore);
      Store.set('sessions', Store.get('sessions', 0) + 1);
      Store.set('treePct', finalScore);          // ring matches the % exactly
      Store.set('treeLeft', bestSide ? bestSide.left : finalScore);
      Store.set('treeRight', bestSide ? bestSide.right : finalScore);
      Store.set('yogaMinsDone', 1);
      Store.set('posesPracticed', 1);
      Store.set('durationLabel', Math.max(1, Math.round((DATA.pose.sec||45)/60))+' min');
      Store.set('streak', Math.max(1, Store.get('streak', 1)));
      go('session-done', { kind:'yoga', score: finalScore });
    }
  });
  tracker.bindCues(cues);

  const root = h('div',{class:'screen-inner', style:{flex:1,position:'relative'}}, host);
  const track = Store.get('medTrack', 'rain');
  root._cleanup = ()=>{ tracker.stop(); Ambience.stop(); Voice.duck(false); TVSync.push({ mode:'idle' }); };
  setTimeout(()=>{
    tracker.start();
    if (track !== 'silence'){ Ambience.play(track, { vol:0.3 }); Voice.duck(true); }   // soft background + quieter voice
  }, 60);
  return root;
};

SCREENS['session-done'] = (p={}) => {
  const med = p.kind === 'meditation';
  const val = med ? (p.focus ?? Store.get('medFocus',0)) : (p.score ?? Store.get('lastScore', 0));
  const chant = p.chant || Store.get('chantReport', null);
  const chantCard = (chant && chant.count) ? h('div',{class:'chant-report'},
    h('div',{class:'cr-head'}, (chant.kind||'AUM') + ' · ' + chant.count + (chant.count===1?' chant':' chants') + ' · pitch report'),
    h('div',{class:'cr-grid'},
      h('div',{}, h('b',{}, chant.pitchHz + ' Hz'), h('span',{}, 'Fundamental pitch')),
      h('div',{}, h('b',{}, chant.stability + '%'),  h('span',{}, 'Pitch stability')),
      h('div',{}, h('b',{}, chant.duration + 's'),   h('span',{}, 'Avg chant length')),
      h('div',{}, h('b',{}, chant.accuracy + '%'),   h('span',{}, 'On your target'))))
    : null;
  return frame({ scroll:
    h('div',{class:'center-col'},
      h('div',{class:'big-check', html:'<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}),
      h('h1',{class:'h-title',style:{fontSize:'24px'}}, 'Session complete'),
      h('p',{class:'h-sub'}, med ? `${p.mins||Store.get('medMinsDone',1)} min ${chantCard?'chanting':'meditation'} · ${chantCard?(chant.kind||'AUM'):'stillness'}` : 'Tree Pose - balance on both sides'),
      scoreRing(val, 150, 12),
      chantCard,
      med ? null : h('div',{style:{display:'flex',gap:'26px',justifyContent:'center',marginTop:'4px'}},
        h('div',{style:{textAlign:'center'}}, h('b',{style:{display:'block',fontFamily:'Quicksand',fontWeight:700,color:'var(--navy)',fontSize:'17px'}}, (Store.get('treeLeft',val))+'%'), h('span',{style:{fontSize:'11px',color:'var(--muted)'}}, 'Left leg')),
        h('div',{style:{textAlign:'center'}}, h('b',{style:{display:'block',fontFamily:'Quicksand',fontWeight:700,color:'var(--navy)',fontSize:'17px'}}, (Store.get('treeRight',val))+'%'), h('span',{style:{fontSize:'11px',color:'var(--muted)'}}, 'Right leg'))),
      TVSync.connected
        ? h('button',{class:'btn', style:{maxWidth:'260px',marginTop:'18px'},
            onclick:()=>{ TVSync.disconnect(); go('progress'); }}, 'Disconnect & see progress')
        : h('button',{class:'btn', style:{maxWidth:'260px',marginTop:'18px'}, onclick:()=>go('progress')}, 'See progress'),
      TVSync.connected
        ? h('button',{class:'btn ghost', style:{maxWidth:'260px',marginTop:'10px'}, onclick:()=>go('connect')}, 'Keep casting')
        : h('div',{class:'btn-text', onclick:()=>go('home')}, 'Back to home'),
    )
  });
};

/* ============================================================= *
 *  MEDITATION
 * ============================================================= */
/* Select Music - the background-sound picker (from the home music icon) */
SCREENS.music = () => {
  const picker = soundPicker({
    get:()=> Store.get('medTrack','rain'),
    set:(id)=> Store.set('medTrack', id),
    onPreview:(id)=> Ambience.preview(id),
    showChanting:false,
  });
  const root = frame({
    top: topBar({ back:()=>{ Ambience.stop(); go('home'); }, title:'Select Music', sub:'Pick a track for practice and meditation' }),
    scroll:[
      picker,
    ],
    footer: h('button',{class:'btn', onclick:()=>{ Ambience.stop(); go('home'); }}, 'Save'),
  });
  root._cleanup = ()=> Ambience.stop();
  return root;
};

SCREENS['med-setup'] = () => {
  let mins = Store.get('medMins', 10);
  const tt = h('div',{class:'tt'});
  function fmt(){ tt.textContent = String(mins).padStart(2,'0')+':00'; Store.set('medMins',mins); }
  fmt();
  const picker = soundPicker({
    get:()=> Store.get('medTrack','rain'),
    set:(id)=> Store.set('medTrack', id),
    onPreview:(id)=> Ambience.preview(id),
  });

  const root = frame({
    top: topBar({ back:()=>{ Ambience.stop(); go('home'); }, title:'Meditation', sub:'Choose your time and background track' }),
    scroll:[
      h('div',{class:'stopwatch'}, h('img',{src:IMG+'ic_stopwatch.svg'}), tt),
      h('div',{class:'med-adjust'},
        h('button',{class:'round-btn', onclick:()=>{ mins=Math.max(1,mins-1); fmt(); }}, '−'),
        h('button',{class:'round-btn', onclick:()=>{ mins=Math.min(60,mins+1); fmt(); }}, '+')),
      picker,
    ],
    footer: h('button',{class:'btn', onclick:()=>{
      Ambience.stop();
      if (Store.get('medMode','sound') === 'chant') go('chant-why', {id:Store.get('medChant','aum')});
      else go('med-intro');
    }}, 'Start Meditation'),
    tab:'Meditation',
  });
  root._cleanup = ()=> Ambience.stop();
  return root;
};

/* meditation intro - seated figure + breathe + AI-tracking countdown */
SCREENS['med-intro'] = () => {
  const cd = h('div',{class:'cd'}, '10');
  const br = breathe();
  const bannerTxt = h('div',{class:'t'}, 'Find a comfortable seat and settle in…');
  const root = frame({
    top: topBar({ back:()=>go('med-setup'), title:'Meditation' }),
    scroll:[
      br.node,
      h('div',{class:'med-fig'}, h('img',{src:pimg('lotus')})),
    ],
    footer: h('div',{class:'ai-banner'},
      h('img',{src:IMG+'ic_body.png'}), bannerTxt, cd),
  });
  let n = 10, t = null;
  const startT = setTimeout(()=>{
    br.start();
    bannerTxt.replaceChildren(document.createTextNode('AI tracking is about to start. Starting in '),
      h('b',{}, '10'), document.createTextNode(' sec'));
    t = setInterval(()=>{
      n--; cd.textContent = String(n);
      root.querySelectorAll('.ai-banner b').forEach(b=> b.textContent = String(n));
      if (n <= 0){ clearInterval(t); if (document.body.contains(root)) go('med-session'); }
    }, 1000);
  }, 2000);
  root._cleanup = ()=>{ clearTimeout(startT); clearInterval(t); br.stop(); };
  return root;
};

/* meditation session - camera tracker: sit still, back straight, for the set time */
SCREENS['med-session'] = () => {
  const mins = Store.get('medMins', 10);
  const trackId = Store.get('medTrack', 'rain');

  const timeEl = h('b',{}, '00:00');
  const bigTime = h('div',{class:'med-clock'}, mmss(mins*60));
  const stillEl = h('div',{class:'status'}, 'Find a comfortable seat');
  const bar = h('i',{style:{width:'0%'}});
  const cues = h('div',{class:'cues'});

  let voiceOn = Voice.on;
  const vBtn = h('button',{class:'voice-toggle', onclick:()=>{
    voiceOn = Voice.toggle(); vBtn.firstChild.textContent = voiceOn?'🔊':'🔇';
    vBtn.lastChild.textContent = voiceOn?'Voice on':'Voice off';
  }}, h('span',{},'🔊'), h('span',{}, 'Voice on'));

  const host = h('div',{class:'tracker'},
    h('div',{class:'hud'},
      h('div',{class:'hud-top'},
        h('div',{class:'score'}, h('b',{style:{fontSize:'15px'}}, 'Meditation'), h('span',{}, 'stay still')),
        h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
          h('button',{class:'voice-toggle', onclick:()=>{ tk && tk.stop(); Ambience.stop(); go('med-setup'); }}, '✕ Exit'),
          vBtn)),
      stillEl,
      h('div',{class:'med-clock-wrap'}, bigTime),
      cues,
      h('div',{class:'bar'}, bar),
      h('div',{class:'controls'},
        h('button',{class:'btn ghost', onclick:()=>{ tk && tk.stop(); Ambience.stop(); go('med-setup'); }}, 'Stop'),
        h('button',{class:'btn', onclick:()=> tk && tk.finish()}, 'End'))));

  const tk = new MeditationTracker(host, {
    durationSec: mins*60,
    onTick:(leftSec, still)=>{
      timeEl.textContent = mmss(leftSec);
      bigTime.textContent = mmss(leftSec);
      bar.style.width = (100 - leftSec/(mins*60)*100) + '%';
      stillEl.textContent = still>=85 ? 'Perfectly still - stay here'
        : still>=60 ? 'Settling in nicely' : 'Soften and be still';
    },
    onCues:(list)=> cues.replaceChildren(...list.map(([t,ok])=> h('div',{class:'cue'+(ok?' ok':'')}, (ok?'✓ ':'• ')+t))),
    onEnd:(focusPct, doneMin)=>{
      tk.stop(); Ambience.stop();
      Store.set('medFocus', focusPct);
      Store.set('medMinsDone', doneMin);
      Store.set('medSessions', Store.get('medSessions',0)+1);
      go('session-done', { kind:'meditation', focus:focusPct, mins:doneMin });
    },
  });

  function mmss(s){ s=Math.max(0,Math.round(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

  const root = h('div',{class:'screen-inner', style:{position:'relative'}}, host);
  root._cleanup = ()=>{ tk.stop(); Ambience.stop(); Voice.duck(false); };
  setTimeout(()=>{ tk.start();
    if (trackId !== 'silence'){ Ambience.play(trackId); Voice.duck(true); } }, 60);
  return root;
};

/* ============================================================= *
 *  CHANTING - "Why this sound?" card, then a guided chant session
 * ============================================================= */
SCREENS['chant-why'] = (p={}) => {
  const c = DATA.chantItem(p.id) || DATA.chants[0];
  return frame({
    top: topBar({ back:()=>go('med-setup'), title:c.name, center:true }),
    scroll:[
      h('p',{class:'why-sub'}, c.sub),
      h('div',{class:'why-card'},
        h('h3',{}, 'Why this sound?'),
        h('p',{class:'why-txt'}, c.why),
        h('div',{class:'why-media'}, h('img',{src:pimg('lotus')})),
        h('ul',{}, ...c.benefits.map(b=> h('li',{}, b)))),
    ],
    footer: h('button',{class:'btn', onclick:()=>go('chant-session', {id:c.id})}, 'Begin Chanting'),
  });
};

/* chanting session - camera + mic AI tracker: posture, hand-mudra and the
   chant tone itself (steady sustained pitch). Guided: breathe in -> chant. */
SCREENS['chant-session'] = (p={}) => {
  const c = DATA.chantItem(p.id) || DATA.chants[0];
  const mins = Store.get('medMins', 10);
  function mmss(s){ s=Math.max(0,Math.round(s)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

  const bigTime = h('div',{class:'med-clock'}, mmss(mins*60));
  const phaseEl = h('div',{class:'side-chip'}, 'GET READY');
  const statusEl = h('div',{class:'status'}, 'Sit tall and settle in');
  const bar = h('i',{style:{width:'0%'}});
  const cues = h('div',{class:'cues'});
  let voiceOn = Voice.on;
  const vBtn = h('button',{class:'voice-toggle', onclick:()=>{
    voiceOn = Voice.toggle(); vBtn.firstChild.textContent = voiceOn?'🔊':'🔇';
    vBtn.lastChild.textContent = voiceOn?'Voice on':'Voice off';
  }}, h('span',{},'🔊'), h('span',{}, 'Voice on'));

  // ---- live pitch meter -------------------------------------------------
  const pmHz     = h('b',{}, '-');
  const pmUnit   = h('span',{}, 'Hz');
  const pmMarker = h('div',{class:'pm-marker'});
  const pmTarget = h('div',{class:'pm-target', hidden:true});
  const pitchMeter = h('div',{class:'pitch-meter', hidden:true},
    h('div',{class:'pm-read'}, pmHz, pmUnit),
    h('div',{class:'pm-track'}, pmTarget, pmMarker),
    h('div',{class:'pm-scale'}, h('span',{}, 'low'), h('span',{}, 'your pitch'), h('span',{}, 'high')));

  const cents = (f, ref)=> (f>0 && ref>0) ? 1200*Math.log2(f/ref) : 0;
  let pitchT = null;
  function showPitch(hz, target){
    pitchMeter.hidden = false;
    if (hz === 'nomic'){ pmHz.textContent = 'mic off'; pmUnit.hidden = true; pmMarker.classList.add('fade'); pmTarget.hidden = true; return; }
    if (target){ pmTarget.hidden = false;
      const lo0 = target*Math.pow(2,-7/12), hi0 = target*Math.pow(2,7/12);
      pmTarget.style.left = (cents(target, lo0) / cents(hi0, lo0) * 100) + '%'; }
    if (hz == null){                                   // sound but no clean tone yet
      pmHz.textContent = '···'; pmUnit.hidden = true;
      // don't drop the marker instantly - a brief detection gap shouldn't kill it
      clearTimeout(pitchT); pitchT = setTimeout(()=>{ pmMarker.classList.add('fade'); }, 900);
      return;
    }
    pmUnit.hidden = false;
    pmHz.textContent = hz;
    const lo = target ? target * Math.pow(2, -7/12) : 95;
    const hi = target ? target * Math.pow(2,  7/12) : 320;
    const pct = Math.max(2, Math.min(98, (cents(hz, lo) / cents(hi, lo)) * 100));
    pmMarker.style.left = pct + '%';
    const cls = target
      ? (Math.abs(cents(hz, target)) < 60 ? 'good' : Math.abs(cents(hz, target)) < 220 ? 'near' : 'off')
      : 'near';
    pmMarker.className = 'pm-marker ' + cls;
    clearTimeout(pitchT);
    pitchT = setTimeout(()=>{ pmMarker.classList.add('fade'); }, 900);
  }

  const detectFlash = h('div',{class:'detect-flash', hidden:true}, '✓ Detected');

  const host = h('div',{class:'tracker'},
    h('div',{class:'hud'},
      h('div',{class:'hud-top'},
        h('div',{class:'score'}, h('b',{style:{fontSize:'15px'}}, c.badge || 'AUM'), h('span',{}, 'chant along')),
        h('div',{style:{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}},
          h('button',{class:'voice-toggle', onclick:()=>{ tk.stop(); Ambience.stop(); go('med-setup'); }}, '✕ Exit'),
          vBtn)),
      phaseEl,
      statusEl,
      h('div',{class:'med-clock-wrap'}, bigTime, pitchMeter),
      cues,
      h('div',{class:'bar'}, bar),
      h('div',{class:'controls'},
        h('button',{class:'btn ghost', onclick:()=>{ tk.stop(); Ambience.stop(); go('med-setup'); }}, 'Stop'),
        h('button',{class:'btn', onclick:()=> tk.finish()}, 'End')),
      detectFlash));

  const tk = new ChantTracker(host, {
    chant: c,
    durationSec: mins*60,
    onDetected:()=>{
      detectFlash.hidden = false;
      setTimeout(()=>{ detectFlash.hidden = true; }, 1800);
      phaseEl.textContent = 'DETECTED';
      statusEl.textContent = 'Sit tall - we’ll begin';
    },
    onPhase:(label, guide)=>{
      phaseEl.textContent = (label||'').toUpperCase();
      if (guide) statusEl.textContent = guide;
    },
    onPitch:(hz, target)=>{
      showPitch(hz, target);
    },
    onTick:(leftSec, score, phaseLabel)=>{
      bigTime.textContent = mmss(leftSec);
      bar.style.width = (100 - leftSec/(mins*60)*100) + '%';
      if (phaseLabel === 'Chant') statusEl.textContent = 'Chant ' + (c.badge || 'AUM');
      else if (phaseLabel === 'Breathe in') statusEl.textContent = 'Slow breath in…';
      else if (phaseLabel === 'Rest') statusEl.textContent = 'Rest in the silence';
      if (phaseLabel !== 'Chant') pmMarker.classList.add('fade');
    },
    onCues:(list)=> cues.replaceChildren(...list.map(([t,ok])=> h('div',{class:'cue'+(ok?' ok':'')}, (ok?'✓ ':'• ')+t))),
    onEnd:(focusPct, doneMin, sum)=>{
      tk.stop(); Ambience.stop();
      Store.set('medFocus', focusPct);
      Store.set('medMinsDone', doneMin);
      Store.set('medSessions', Store.get('medSessions',0)+1);
      Store.set('chantReport', sum || null);
      go('session-done', { kind:'meditation', focus:focusPct, mins:doneMin, chant:sum||null });
    },
  });

  const root = h('div',{class:'screen-inner', style:{position:'relative'}}, host);
  root._cleanup = ()=>{ tk.stop(); Ambience.stop(); Voice.duck(false); };
  setTimeout(()=> tk.start(), 60);
  return root;
};

/* ============================================================= *
 *  PROGRESS
 * ============================================================= */
function poseCards(list, activeName){
  return h('div',{class:'hscroll'},
    ...list.map(p => h('div',{class:'pose-card'+(activeName && p.name!==activeName ? ' inactive' : '')},
      h('img',{src:pimg(p.img)}),
      h('b',{}, p.name),
      h('div',{class:'row'},
        h('div',{class:'pbar'}, h('i',{style:{width:p.pct+'%'}})),
        h('span',{class:'pct'}, p.pct+'%')))));
}
const POSE_PROGRESS = [
  { name:'Tree Pose',   img:'tree',    pct: 55 },
  { name:'Warrior I',   img:'warrior', pct: 64 },
  { name:'Chair Pose',  img:'lunge',   pct: 52 },
  { name:'Forward Fold',img:'forward', pct: 71 },
];

SCREENS.progress = () => {
  const yogaPct = Store.get('treePct', Store.get('lastScore', 55));
  const medF = Store.get('medFocus', 90);
  const medMin = Store.get('medMinsDone', Store.get('medMins', 1));
  const yogaMin = Store.get('yogaMinsDone', 1);
  const body = h('div',{});

  function today(){
    const poses = POSE_PROGRESS.map(p => p.name==='Tree Pose' ? {...p, pct: yogaPct} : p);
    body.replaceChildren(
      h('div',{class:'your-plan'}, 'Yoga'),
      h('div',{class:'ring-stat'},
        scoreRing(yogaPct, 92, 9),
        h('div',{class:'rs'}, h('b',{}, 'Total Practice: '+yogaMin+' min'),
          h('div',{class:'ok'}, 'Tree Pose Completed'),
          h('p',{}, 'Keep practicing to improve your pose accuracy'))),
      h('div',{class:'your-plan'}, 'Meditation'),
      h('div',{class:'ring-stat'},
        scoreRing(medF, 92, 9),
        h('div',{class:'rs'}, h('b',{}, 'Focus: '+medMin+' min'),
          h('div',{class:'ok'}, 'Meditation Completed'),
          h('p',{}, 'Session duration '+medMin+' min'+(medMin>1?'s':'')))),
      h('div',{class:'your-plan'}, 'Pose Wise Improvement'),
      poseCards(poses, 'Tree Pose'),
    );
  }
  function weekly(){
    const medSessions = Store.get('medSessions', 1);
    body.replaceChildren(
      h('div',{class:'your-plan'}, 'Weekly Summary'),
      h('div',{class:'sub-label'}, 'Yoga'),
      statRow([
        ['ic_streak.png',   String(Store.get('streak', 1)),                       'Streak'],
        ['ic_duration.png', Store.get('durationLabel', '1 min'),                  'Duration'],
        ['ic_practice.png', String(Store.get('posesPracticed', 1)),              'Pose practice'],
      ]),
      h('div',{class:'sub-label'}, 'Meditation'),
      statRow([
        ['ic_streak.png',   String(Store.get('medStreak', 1)),                    'Streak'],
        ['ic_duration.png', (medSessions*Store.get('medMins',10))+' min',         'Duration'],
        ['ic_practice.png', String(medSessions),                                  'Sessions'],
      ]),
      h('div',{class:'your-plan'}, 'This Week'),
      h('div',{class:'leg'},
        h('span',{}, h('i',{style:{background:'#9E2A2B'}}), 'Skip'),
        h('span',{}, h('i',{style:{background:'var(--navy)'}}), 'Practiced'),
        h('span',{}, h('i',{style:{background:'#B7C0C6'}}), 'Rest Day')),
      lineChart([20,32,0,40,26,0,24], ['p','p','s','p','p','r','p']),   // Figma week: Wed = skipped (red), Sat = rest (grey)
      h('div',{class:'your-plan'}, 'Most Improved Pose'),
      poseCards(POSE_PROGRESS.slice().sort((a,b)=>b.pct-a.pct)),
      h('div',{class:'your-plan'}, 'Most Practiced Meditation'),
      medCards([
        { name:'Om Chant',    icon:'bowl',   pct: 90 },
        { name:'Rain Sounds', icon:'rain',   pct: 75 },
        { name:'Flute',       icon:'flute',  pct: 60 },
      ]),
    );
  }
  today();
  return frame({
    top: topBar({ back:()=>go('home'), title:'Your Progress' }),
    scroll:[ tabSwitch(['Today','Weekly'], 'Today', l => l==='Today'?today():weekly()), body ],
    tab:'Progress',
  });
};
function lineChart(vals, status){
  status = status || vals.map(()=> 'p');
  const W=330, H=170, AX=34, PADR=8, TOP=10, BOT=26;   // AX = left axis gutter
  const max=40, plotW=W-AX-PADR, plotH=H-TOP-BOT;
  const X = i => AX + i*plotW/(vals.length-1);
  const Y = v => TOP + plotH - Math.max(0,Math.min(max,v))/max*plotH;
  const pts = vals.map((v,i)=> [X(i), Y(v)]);
  // smooth curve
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i=0;i<pts.length-1;i++){
    const [x0,y0]=pts[i], [x1,y1]=pts[i+1], mx=(x0+x1)/2;
    d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const area = `${d} L${pts[pts.length-1][0].toFixed(1)} ${(TOP+plotH).toFixed(1)} L${pts[0][0].toFixed(1)} ${(TOP+plotH).toFixed(1)} Z`;
  const dot = s => s==='s' ? '#9E2A2B' : s==='r' ? '#B7C0C6' : '#144B70';
  const days = ['M','T','W','T','F','S','S'];
  return h('div',{class:'card',style:{marginTop:'4px',padding:'16px 14px'},html:`
    <svg class="linechart" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="lcfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#144B70" stop-opacity=".16"/>
        <stop offset="1" stop-color="#144B70" stop-opacity="0"/></linearGradient></defs>
      ${[10,20,30,40].map(g=>{const y=Y(g).toFixed(1);
        return `<line x1="${AX}" y1="${y}" x2="${W-PADR}" y2="${y}" stroke="#EDF2F4"/>
        <circle cx="${AX-4}" cy="${y}" r="2.4" fill="#B7C0C6"/>
        <text x="${AX-10}" y="${(+y+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9BA7AE">${g}</text>
        <text x="${AX-10}" y="${(+y+12).toFixed(1)}" text-anchor="end" font-size="7" fill="#B7C0C6">mins</text>`;}).join('')}
      <line x1="${AX}" y1="${TOP}" x2="${AX}" y2="${TOP+plotH}" stroke="#C9D3D8" stroke-width="1.2"/>
      <path d="${area}" fill="url(#lcfill)"/>
      <path d="${d}" fill="none" stroke="#144B70" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${dot(status[i])}"/>`).join('')}
      ${days.map((dn,i)=>`<text x="${X(i).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#8A94A0">${dn}</text>`).join('')}
    </svg>`});
}

/* ============================================================= *
 *  SETTINGS
 * ============================================================= */
SCREENS.settings = () => {
  const name = Store.get('name','XYZ');
  const w = Store.get('weight',{value:70,unit:'kg'});
  const ht = Store.get('height',{cm:170,unit:'ft'});
  const lvl = (DATA.levels.find(l=>l.id===Store.get('level'))||{title:'-'}).title;
  const goals = (Store.get('goals',[])||[]).map(id=> (DATA.goals.find(g=>g.id===id)||{}).label).filter(Boolean).join(', ')||'-';
  const row = (label, val, route)=> h('div',{class:'srow', onclick:route?()=>go(route,{from:'settings'}):null},
    h('b',{}, label), h('span',{class:'v'}, val||''), h('span',{class:'icon-btn',style:{width:'26px',height:'26px'},html:ICONS.chevron}));
  return frame({
    top: topBar({ back:()=>go('home'), title:'Settings' }),
    scroll:[
      h('div',{class:'acct'},
        h('div',{class:'av'}, (name[0]||'S').toUpperCase()),
        h('div',{class:'ai'}, h('b',{}, name),
          h('span',{}, (Store.get('age','')?Store.get('age')+' years · ':'')+Store.get('email','you@email.com')))),
      h('div',{class:'section-title'}, 'Personal details'),
      row('Weight', w.value+' '+w.unit, 'ob-weight'),
      row('Height', (ht.unit==='cm'? ht.cm+' cm' : ftin(ht.cm)), 'ob-height'),
      row('Gender', Store.genderLabel(), 'ob-gender'),
      h('div',{class:'section-title'}, 'Practice'),
      row('Yoga Level', lvl, 'ob-level'),
      row('Main Goals', goals, 'ob-goal'),
      row('Calendar', (Store.get('days',[])||[]).length+' days / week', 'plan'),
      h('div',{class:'section-title'}, 'App'),
      row('Connect to Big Screen', '', 'connect'),
      row('Notifications', Store.get('remindOn')?'On':'Off'),
      row('About Sadhana', 'v1.0', 'about'),
      h('button',{class:'btn ghost', style:{marginTop:'18px'}, onclick:()=>{ Store.reset(); go('signup'); }}, 'Reset demo'),
    ],
    tab:'Settings',
  });
};
/* About Sadhana - what the app is + future scope */
SCREENS.about = () => frame({
  top: topBar({ back:()=>go('settings'), title:'About Sadhana' }),
  scroll:[
    h('div',{class:'about-logo'}, h('img',{src:IMG+'logo.svg', alt:''}), h('span',{}, 'Sadhana')),
    h('p',{class:'about-p'}, 'Sadhana is a personalized yoga and wellness app designed to help people practice yoga, track their poses, and build a consistent routine at home.'),
    h('p',{class:'about-p'}, 'Instead of following a one-size-fits-all routine, Sadhana adapts the practice to individual needs while using real-time pose tracking to guide posture and movement.'),
    h('p',{class:'about-p'}, 'Users can also connect Sadhana to a bigger screen for a more immersive practice experience, while the app provides personalized feedback and tracks their progress.'),
    h('p',{class:'about-p'}, 'Along with yoga, Sadhana integrates meditation and mindfulness to support overall well-being.'),
    h('p',{class:'about-p'}, 'The project focuses on making home yoga more personalized, guided, accessible, and engaging.'),
    h('div',{class:'section-title'}, 'Future scope'),
    h('ul',{class:'about-list'},
      h('li',{}, 'More yoga poses with AI pose tracking'),
      h('li',{}, 'More specific information about each pose in the progress cards'),
      h('li',{}, 'Breathing tracking')),
    h('p',{class:'about-ver'}, 'Sadhana v1.0'),
  ],
  tab:'Settings',
});
function ftin(cm){ const i=Math.round(cm/2.54); return `${Math.floor(i/12)}′${i%12}″`; }

/* ============================================================= *
 *  CONNECT TO BIG SCREEN
 * ============================================================= */
const TV_SVG = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#144B70" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>';

SCREENS.connect = () => {
  const inFrame = new URLSearchParams(location.search).get('tv') === '1';
  const CHECK = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const SEARCH = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>';

  const hero   = h('div',{class:'connect-hero', html:SEARCH});
  const status = h('p',{class:'connect-status'}, 'Searching for nearby devices…');
  const body   = h('div',{class:'connect-body'});
  const wrap   = h('div',{class:'connect-wrap'}, hero, status, body);
  let connected = TVSync.connected;

  function showConnected(deviceName){
    connected = true;
    hero.innerHTML = CHECK; hero.classList.add('done');
    status.replaceChildren(
      h('b',{}, 'Connected to ' + deviceName),
      h('span',{}, 'Casting your session now. Follow along on the big screen.'));
    wrap.classList.add('is-connected');
    body.replaceChildren(...[
      h('button',{class:'btn', onclick:()=>go('warmup')}, 'Start Session'),
      h('button',{class:'btn ghost', onclick:()=>{ TVSync.disconnect(); go('connect'); }}, 'Disconnect'),
    ].filter(Boolean));
  }
  function showDevices(){
    wrap.classList.remove('is-connected');
    body.replaceChildren(
      h('div',{class:'your-plan', style:{marginTop:'18px',alignSelf:'flex-start'}}, 'Available Devices'),
      ...DATA.devices.map(d=>
        h('div',{class:'dev-row'},
          h('div',{class:'di', html:TV_SVG}),
          h('div',{class:'db'}, h('b',{}, d.name), h('span',{}, d.kind)),
          h('button',{class:'cbtn', onclick:()=>{
            TVSync.connect(); toast('Casting to '+d.name); showConnected(d.name);
          }}, 'Connect'))));
  }

  if (connected){ try { TVSync.connect(); } catch(e){}  // re-announce to the /present parent
    showConnected('Living Room TV'); }
  else setTimeout(showDevices, 1400);

  return frame({
    top: topBar({ back:()=>{ if (history.length>1) history.back(); else go('session-overview'); }, title:'Connect to Big Screen' }),
    scroll:[ wrap ],
  });
};

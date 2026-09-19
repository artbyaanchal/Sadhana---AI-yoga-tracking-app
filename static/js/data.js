/* ============================================================= *
 *  Sadhana - static content / config
 * ============================================================= */
const IMG = window.SADHANA_IMG;
const AUD = window.SADHANA_AUDIO;
const VID = window.SADHANA_VIDEO;

const DATA = {

  levels: [
    { id:'beginner',     title:'Beginner',     img:'table',  desc:"I'm just starting out. I've never done yoga before." },
    { id:'intermediate', title:'Intermediate', img:'updog',  desc:'I do it occasionally. I know the basic poses.' },
    { id:'advanced',     title:'Advanced',     img:'crow',   desc:'I do it regularly. I am proficient in difficult poses.' },
  ],

  goals: [
    { id:'lose',    label:'Lose Weight',        img:'lunge'     },
    { id:'stress',  label:'Relieve Stress',     img:'lotus'     },
    { id:'fit',     label:'Stay Fit',           img:'run'       },
    { id:'flex',    label:'Improve Flexibility',img:'forward'   },
    { id:'toned',   label:'Get Toned',          img:'warrior'   },
    { id:'recover', label:'Recovery',           img:'pranayama' },
  ],

  // chip positions (% of the focus-wrap) around the standing Tree-Pose figure - from Figma
  focusAreas: [
    { id:'neck',  label:'Neck',              x:'10%', y:'20%' },
    { id:'arms',  label:'Arms & Shoulders',  x:'60%', y:'26%' },
    { id:'chest', label:'Chest',             x:'6%',  y:'34%' },
    { id:'belly', label:'Belly',             x:'64%', y:'44%' },
    { id:'glutes',label:'Glutes',            x:'6%',  y:'50%' },
    { id:'legs',  label:'Legs',              x:'58%', y:'70%' },
    { id:'body',  label:'Body',              x:'50%', y:'98%', center:true },
  ],

  activity: [
    { id:'low',      title:'Low',      img:'desk',
      desc:'I spend most of my day sitting or resting, with very little physical movement.' },
    { id:'moderate', title:'Moderate', img:'walk',
      desc:'I move around occasionally during the day, such as walking, standing, or doing light activities.' },
    { id:'high',     title:'High',     img:'run',
      desc:'I do it regularly. I am proficient in difficult poses and stay active.' },
  ],

  // real recorded ambience, grouped like the Figma "Meditation Setup - Sound" screens
  soundCategories: [
    { id:'nature', label:'Nature', tracks:[
      { id:'rain',   name:'Rain',        desc:'Long steady rainfall',   file:'rain.mp3' },
      { id:'forest', name:'Forest',      desc:'Birds & rustling leaves',file:'forest.mp3' },
      { id:'sea',    name:'Ocean Waves', desc:'Waves on the shore',     file:'sea.mp3' },
      { id:'wind',   name:'Wind',        desc:'Gentle open-air breeze', file:'wind.mp3' },
      { id:'thunder',name:'Thunderstorm',desc:'Distant rolling thunder',file:'thunder.mp3' },
      { id:'white',  name:'White Noise', desc:'Flat, even background',  file:'whitenoise.mp3' },
    ]},
    { id:'instruments', label:'Instruments', tracks:[
      { id:'bowl',    name:'Singing Bowl', desc:'Slow resonant tone',    file:'bowl.mp3' },
      { id:'chimes',  name:'Chimes',       desc:'Soft wind chimes',      file:'chimes.mp3' },
      { id:'flute',   name:'Flute',        desc:'Breathy bansuri flute', file:'flute.mp3' },
      { id:'piano',   name:'Piano',        desc:'Gentle ambient piano',  file:'piano.mp3' },
      { id:'sitar',   name:'Sitar',        desc:'Warm plucked strings',  file:'sitar.mp3' },
      { id:'tanpura', name:'Tanpura',      desc:'Continuous drone',      file:'tanpura.mp3' },
    ]},
  ],
  // silence is always offered outside the two categories
  silenceTrack: { id:'silence', name:'Silence', desc:'No background sound' },

  findTrack(id){
    if (!id || id === 'silence') return this.silenceTrack;
    for (const cat of this.soundCategories) { const t = cat.tracks.find(t=>t.id===id); if (t) return t; }
    return this.silenceTrack;
  },

  // warm-up sequence shown on the Session Overview screen, before the yoga pose(s).
  // each move has its own "Why this pose?" card (Figma: Why Card - … Girl/Boy)
  warmup: [
    { id:'standing', label:'Easy Standing + Deep Breath', sub:'Grounding Breath', sec:30, video:'breathing',
      why:'Easy Standing with deep breathing settles your nervous system and aligns posture before you begin. It relaxes the shoulders and prepares the breath for the poses ahead.',
      benefits:['Calms the mind and centers your focus.','Improves posture and body awareness.','Increases oxygen flow to the muscles.','Prepares the breath for deeper poses.'] },
    { id:'neck', label:'Neck & Shoulder Movements', sub:'Upper Body Release', sec:30, video:'neck',
      why:'Gentle neck and shoulder rolls release tension from sitting and screen time. They loosen the upper spine and shoulder joints so your body moves freely once the yoga poses begin.',
      benefits:['Releases tension in neck and shoulders.','Improves flexibility of the upper spine.','Increases blood flow to head and neck.','Reduces stiffness from long sitting.'] },
    { id:'hip', label:'Hip Circle', sub:'Hip Mobility', sec:20, video:'hip',
      why:'Rotating the hips in slow circles warms up the hip joints and lower back. It lubricates the joints and activates the core, making standing poses feel more stable and comfortable.',
      benefits:['Loosens tight hip joints and muscles.','Improves balance and core stability.','Warms up the lower back and hips.','Increases range of motion for poses.'] },
    { id:'legswing', label:'Standing Leg Swing', sub:'Dynamic Leg Warm-Up', sec:20, video:'leg',
      why:'Swinging the leg forward and back loosens the hamstrings, hip flexors, and calves. This dynamic movement raises circulation and preps your balance before standing poses.',
      benefits:['Loosens hamstrings and hip flexors.','Boosts circulation to the legs.','Improves single-leg balance.','Reduces strain in standing poses.'] },
  ],
  warmupVideo(gender, key){
    const g = (gender === 'male' || gender === 'boy') ? 'boy' : 'girl';
    return `${VID}warmup/${g}_${key}.mp4`;
  },
  warmupItem(id){ return this.warmup.find(w=>w.id===id); },

  // OM chanting - the "Chanting" tab on the Meditation setup screen (Figma 530:1965)
  chants: [
    { id:'aum', badge:'AUM', name:'AUM', sub:'The Complete Cycle',
      why:'AUM moves through grounding, centering and calming - chanted along with the guide, once each breath.',
      benefits:['Chant along with the guide each breath.','Builds a complete mind-body cycle.','Great for a full guided session.','Deepens focus over repeated rounds.'],
      guide:['Chant AUM'] },
    { id:'om', badge:'OM', name:'Om', sub:'The Classic Single Chant',
      why:'Om is the single sustained sound most associated with meditation - chanted along with the guide, once each breath.',
      benefits:['Chant along with the guide each breath.','Simple to follow for beginners.','Calms the nervous system.','Anchors attention on the breath.'],
      guide:['Chant OM'] },
  ],
  chantItem(id){ return this.chants.find(c=>c.id===id); },

  devices: [
    { id:'tv',  name:'Living Room TV', kind:'Chromecast · Nearby' },
    { id:'lap', name:'Laptop 21',      kind:'Nearby' },
  ],

  // the single pose the tracker supports today
  pose: {
    id:'tree', name:'Tree Pose', sanskrit:'Vrikshasana', sec:45,
    why:"Tree Pose builds focus and balance while grounding the mind. It gently strengthens the ankles, calves and thighs, and opens the hips - a calming way to start your practice.",
    benefits:[
      'Improves balance and posture',
      'Strengthens legs, ankles and core',
      'Calms the mind and reduces stress',
      'Opens the hips and stretches the inner thighs',
    ],
  },

  // extra poses listed on the session overview next to Tree Pose. Info card only -
  // the AI tracker (TreeTracker) still supports Tree Pose alone.
  morePoses: [
    { id:'warrior', img:'warrior', name:'Warrior I', sanskrit:'Virabhadrasana I', sec:30,
      why:'Warrior I builds strength and stability in the legs while opening the chest and hips. It teaches you to stay grounded and steady while reaching upward.',
      benefits:[ 'Strengthens thighs, calves and ankles', 'Opens the hips, chest and shoulders', 'Builds stamina and focus', 'Improves balance' ] },
    { id:'updog', img:'updog', name:'Cobra Pose', sanskrit:'Bhujangasana', sec:30,
      why:'Cobra Pose gently lifts and opens the chest, strengthening the back body. It is a soft backbend that wakes up the spine and eases stiffness from sitting.',
      benefits:[ 'Strengthens the spine and back', 'Opens the chest and shoulders', 'Relieves lower-back stiffness', 'Lifts the mood and energy' ] },
    { id:'forward', img:'forward', name:'Seated Forward Fold', sanskrit:'Paschimottanasana', sec:30,
      why:'Seated Forward Fold is a calming stretch for the whole back of the body. Folding forward slows the breath and settles the mind at the end of a practice.',
      benefits:[ 'Stretches hamstrings, calves and spine', 'Calms the mind and reduces stress', 'Relaxes the shoulders and neck', 'Supports digestion' ] },
  ],
  morePoseById(id){ return this.morePoses.find(p => p.id === id); },

  poseImg(gender, key){
    const g = (gender === 'male' || gender === 'boy') ? 'm' : 'f';
    return `${IMG}${g}_${key}.png`;
  },
};

/* ---- persistent profile ------------------------------------- */
const Store = {
  key:'sadhana.profile.v1',
  data:{},
  load(){ try{ this.data = JSON.parse(localStorage.getItem(this.key)) || {}; }catch(e){ this.data={}; } return this.data; },
  save(){ localStorage.setItem(this.key, JSON.stringify(this.data)); },
  set(k,v){ this.data[k]=v; this.save(); },
  get(k,d){ return this.data[k] ?? d; },
  reset(){ this.data={}; localStorage.removeItem(this.key); },
  // internal visual key: 'male' | 'female'  ('prefer not' -> female visuals)
  gender(){ return (this.data.gender === 'male' || this.data.gender === 'boy') ? 'male' : 'female'; },
  genderLabel(){ const g = this.data.gender;
    return g === 'male' || g === 'boy' ? 'Male'
      : g === 'female' || g === 'girl' ? 'Female'
      : g === 'none' ? 'Prefer not to say' : '-'; },
};
Store.load();

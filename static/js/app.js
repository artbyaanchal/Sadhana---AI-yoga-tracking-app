/* ============================================================= *
 *  Sadhana - router
 * ============================================================= */
const screenHost = () => document.getElementById('screen');
let current = null;

/* while the session is casting to the TV the phone is a locked companion -
   only these routes are reachable; anything else bounces back to `connect`
   (the "Connected to <TV>" phone screen). The lock lifts on Disconnect. */
const CASTING_ROUTES = new Set([
  'connect', 'session-overview', 'warmup-why', 'warmup',
  'yoga', 'yoga-why', 'tracker', 'session-done',
]);
function castLock(route){
  return (typeof TVSync !== 'undefined' && TVSync.connected && !CASTING_ROUTES.has(route))
    ? 'connect' : route;
}

function go(route, params = {}){
  const locked = castLock(route);
  if (locked !== route){ route = locked; params = {}; }
  if (!SCREENS[route]){ console.warn('no screen', route); return; }
  // let the outgoing screen clean up timers / camera
  if (current && current._cleanup){ try { current._cleanup(); } catch(e){} }
  Voice.stop();

  const host = screenHost();
  const node = SCREENS[route](params);
  current = node;
  try { node.dataset.route = route; } catch(e){}
  host.replaceChildren(node);
  host.scrollTop = 0;

  const url = '#' + route + (params && Object.keys(params).length ? '?' + new URLSearchParams(params) : '');
  if (location.hash !== url) history.pushState({ route, params }, '', url);
  document.title = 'Sadhana';
}

window.addEventListener('popstate', (e)=>{
  const st = e.state;
  if (st && st.route && SCREENS[st.route]){
    if (castLock(st.route) !== st.route){ go('connect'); return; }
    if (current && current._cleanup){ try { current._cleanup(); } catch(err){} }
    Voice.stop();
    const node = SCREENS[st.route](st.params || {});
    current = node;
    screenHost().replaceChildren(node);
  } else {
    boot(true);
  }
});

window.addEventListener('hashchange', ()=>{
  const [route] = location.hash.replace(/^#/, '').split('?');
  if (route && SCREENS[route] && (!current || current.dataset?.route !== route)) go(route);
});

function boot(fromPop){
  const hash = location.hash.replace(/^#/, '');
  const [route] = hash.split('?');
  if (route && SCREENS[route]){ go(route); return; }
  // first launch decision
  if (Store.get('onboarded')) go('home');
  else if (Store.get('email')) go('ob-name');
  else go('signup');
}

// running inside the /present page's iframe - flag it. ?cast=1 also auto-connects the
// TV up-front (the dev "see both side by side" view); plain ?tv=1 waits for the user
// to tap "Connect to Screen".
const _q = new URLSearchParams(location.search);
if (_q.get('tv') === '1'){
  try { document.documentElement.classList.add('embedded'); } catch(e){}
  if (_q.get('cast') === '1'){ try { TVSync.connect(); } catch(e){} }
  // tell the /present parent our current connection state on load - covers a page
  // refresh or a persisted `tvConnected` where TVSync.connect() is never re-called
  try {
    if (TVSync.connected) TVSync._tell(true);
    // and re-announce a moment later in case the parent listener isn't ready yet
    setTimeout(()=>{ if (TVSync.connected) TVSync._tell(true); }, 400);
  } catch(e){}
}
// ?demo=<route> - jump straight into a screen with a filled-in demo profile
const _demo = _q.get('demo');
if (_demo){
  if (!Store.get('onboarded')){
    Store.set('onboarded', true);
    Store.set('name', Store.get('name','Demo'));
    if (!Store.get('gender')) Store.set('gender', 'female');
    Store.set('level', Store.get('level','beginner'));
  }
  if (SCREENS[_demo]){ go(_demo); }
  else boot();
} else {
  boot();
}

// ---- brand splash ----
// keep a copy of the splash markup so we can replay it later (e.g. after onboarding)
const _splashHTML = (() => {
  const sp = document.getElementById('splash');
  return sp ? sp.outerHTML : null;
})();

// show the logo splash, then run `after()` once it has faded out
function showSplash(after, holdMs){
  const done = typeof after === 'function' ? after : () => {};
  if (!_splashHTML){ done(); return; }
  document.getElementById('splash')?.remove();
  const wrap = document.createElement('div');
  wrap.innerHTML = _splashHTML;
  const sp = wrap.firstElementChild;
  sp.classList.remove('hide');
  document.body.appendChild(sp);
  const hold = holdMs == null ? 1400 : holdMs;
  setTimeout(() => {
    sp.classList.add('hide');
    setTimeout(() => { sp.remove(); done(); }, 550);
  }, hold);
}
window.showSplash = showSplash;

// on first paint: hold briefly, then fade away
(function(){
  const sp = document.getElementById('splash');
  if (!sp) return;
  const MIN_MS = 1100;
  const start = performance.now();
  const dismiss = () => {
    const wait = Math.max(0, MIN_MS - (performance.now() - start));
    setTimeout(() => {
      sp.classList.add('hide');
      setTimeout(() => sp.remove(), 600);
    }, wait);
  };
  if (document.readyState === 'complete') dismiss();
  else window.addEventListener('load', dismiss, { once:true });
})();

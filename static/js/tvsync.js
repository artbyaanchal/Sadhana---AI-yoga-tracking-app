/* ============================================================= *
 *  TVSync - phone pushes session state; the /tv screen mirrors it.
 *  Additive: screens call TVSync.push({...}) on every state change.
 *  If the TV is not connected (or the POST fails) nothing breaks -
 *  the session just continues on the phone.
 * ============================================================= */
const TVSync = {
  get connected(){ return !!Store.get('tvConnected', false); },
  _last: 0,
  _pending: null,

  _tell(connected){
    try { if (window.parent && window.parent !== window)
      window.parent.postMessage({ sadhana:'tv', connected }, '*'); } catch(e){}
  },
  connect(){ Store.set('tvConnected', true); this._tell(true); },
  disconnect(){ Store.set('tvConnected', false); this.push({ mode:'idle' }); this._tell(false); },

  /* open the big-screen view in a new window/tab (local demo) */
  openScreen(){
    this.connect();
    try { window.open('/tv', 'sadhana_tv', 'noopener'); } catch(e){}
  },

  push(state){
    if (!this.connected && state.mode !== 'idle') return;
    // throttle to ~5/s, but always send the latest
    const now = Date.now();
    this._pending = state;
    if (now - this._last < 180){
      clearTimeout(this._t);
      this._t = setTimeout(()=> this._flush(), 180);
      return;
    }
    this._flush();
  },

  _flush(){
    const s = this._pending; if (!s) return;
    this._pending = null; this._last = Date.now();
    try {
      fetch('/session/state', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(s), keepalive:true,
      }).catch(()=>{});
    } catch(e){}
  },
};

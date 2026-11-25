const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('src/scripts/hero-parallax.js', 'utf8');
function setup({ reduced = false, mobile = false, observer = true } = {}) {
  const window = Object.assign(new EventTarget(), { innerHeight: 800 });
  const document = new EventTarget();
  const jobs = new Map(), observed = new Set();
  let next = 0, notify;
  const make = (top = 0, height = 400, natural = false) => {
    const values = new Map();
    return { top, height, values, classList: { contains: () => natural },
      getBoundingClientRect() { return { top: this.top, height: this.height }; },
      style: { setProperty: (k,v) => values.set(k,v), removeProperty: k => values.delete(k) } };
  };
  const hero = make();
  let elements = [hero];
  document.querySelectorAll = () => elements;
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const small = Object.assign(new EventTarget(), { matches: mobile });
  class Observer {
    constructor(callback) { notify = callback; }
    observe(e) { observed.add(e); notify([{target: e, isIntersecting: true}]); }
    unobserve(e) { observed.delete(e); }
    disconnect() { observed.clear(); }
  }
  if (observer) window.IntersectionObserver = Observer;
  vm.runInNewContext(source, { window, document, AbortController,
    matchMedia: q => q.includes('reduced') ? motion : small, IntersectionObserver: Observer,
    getComputedStyle: () => ({ getPropertyValue: () => '24' }),
    requestAnimationFrame: cb => { jobs.set(++next, cb); return next; },
    cancelAnimationFrame: id => jobs.delete(id),
  });
  const flush = () => { const pending = [...jobs.values()]; jobs.clear(); pending.forEach(cb => cb()); };
  return {window, document, hero, make, observed, jobs, motion, small, flush,
    offset: e => parseFloat(e.values.get('--parallax-offset')),
    scroll(top) { hero.top = top; window.dispatchEvent(new Event('scroll')); flush(); },
    visible(value) { notify([{target: hero, isIntersecting: value}]); flush(); },
    replace(list) { elements = list; document.dispatchEvent(new Event('parallax:refresh')); flush(); },
  };
}
test('viewport progress moves lower-page images continuously and stays within overscan', () => {
  const e = setup();
  for (const [top, offset] of [[1200,-24],[800,-24],[500,-12],[200,0],[-100,12],[-400,24],[-1000,24],[200,0]]) {
    e.scroll(top); assert.equal(e.offset(e.hero),offset);
  }
});
test('mobile/reduced motion reset offsets and reactivate on preference changes', () => {
  assert.equal(setup({mobile:true}).hero.values.size, 1);
  for (const options of [{mobile:true,reduced:true},{reduced:true}]) {
    const e=setup(options); e.scroll(-400); assert.equal(e.hero.values.size,0);
    e.small.matches=false; e.motion.matches=false; e.motion.dispatchEvent(new Event('change'));
    assert.equal(e.offset(e.hero),24);
    e.motion.matches=true; e.motion.dispatchEvent(new Event('change')); assert.equal(e.hero.values.size,0);
  }
});
test('offscreen pause and one frame per burst of scroll events', () => {
  const e=setup(); e.visible(false); const old=e.offset(e.hero); e.scroll(-400); assert.equal(e.offset(e.hero),old);
  e.visible(true); assert.equal(e.offset(e.hero),24);
  for(let i=0;i<10;i++)e.window.dispatchEvent(new Event('scroll'));
  assert.equal(e.jobs.size,1);
});
test('gallery replacement observes new items and releases removed items', () => {
  const e=setup(); const image=e.make(200); e.replace([image]);
  assert.equal(e.observed.has(e.hero),false); assert.equal(e.hero.values.size,0);
  assert.equal(e.observed.has(image),true); assert.equal(e.offset(image),0);
  e.replace([]); assert.equal(e.observed.size,0);
});
test('pagehide cleans up and pageshow reinitializes once', () => {
  const e=setup(); e.window.dispatchEvent(new Event('pagehide'));
  assert.equal(e.observed.size,0); e.scroll(-400); assert.equal(e.hero.values.size,0);
  e.window.dispatchEvent(new Event('pageshow')); assert.equal(e.offset(e.hero),24);
  e.window.dispatchEvent(new Event('pageshow')); assert.equal(e.observed.size,1);
});
test('works without IntersectionObserver, including galleries loaded after startup', () => {
  const e=setup({observer:false});e.replace([]);const image=e.make(-400);e.replace([image]);assert.equal(e.offset(image),24);
});
test('natural-ratio overscan is bounded by image height', () => {
  const e=setup();const image=e.make(-400,100,true);e.replace([image]);assert.equal(e.offset(image),5);
});

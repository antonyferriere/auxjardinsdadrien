const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('src/scripts/hero-parallax.js', 'utf8');

function setup({ reduced = false, mobile = false } = {}) {
  const window = new EventTarget();
  let top = 0, next = 0, disconnected = false;
  const frames = new Map(), properties = new Map();
  const hero = { getBoundingClientRect: () => ({ top }), style: {
    setProperty: (key, value) => properties.set(key, value),
    removeProperty: key => properties.delete(key),
  } };
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const small = Object.assign(new EventTarget(), { matches: mobile });
  let notify;
  class Observer {
    constructor(callback) { notify = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  window.IntersectionObserver = Observer;
  vm.runInNewContext(source, {
    window, document: { querySelectorAll: () => [hero] }, AbortController,
    matchMedia: query => query.includes('reduced') ? motion : small,
    IntersectionObserver: Observer,
    getComputedStyle: () => ({ getPropertyValue: () => '64' }),
    requestAnimationFrame: callback => { frames.set(++next, callback); return next; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const flush = () => { const jobs = [...frames.values()]; frames.clear(); jobs.forEach(fn => fn()); };
  return { window, motion, small, frames, properties,
    scroll(y) { top = -y; window.dispatchEvent(new Event('scroll')); flush(); },
    visible(value) { notify([{ target: hero, isIntersecting: value }]); flush(); },
    get disconnected() { return disconnected; },
  };
}

test('bounded forward and reverse scroll never exceeds image overscan', () => {
  const env = setup();
  for (const [scroll, offset] of [[0, 0], [200, 24], [2000, 64], [100, 12], [0, 0], [-2000, -64]]) {
    env.scroll(scroll);
    assert.equal(parseFloat(env.properties.get('--hero-offset')), offset);
  }
});
test('mobile and reduced motion remain static and react to preference changes', () => {
  for (const option of [{ mobile: true }, { reduced: true }]) {
    const env = setup(option); env.scroll(500);
    assert.equal(env.properties.size, 0);
    env.motion.matches = false; env.small.matches = false;
    env.motion.dispatchEvent(new Event('change'));
    assert.equal(env.properties.get('--hero-offset'), '60px');
    env.motion.matches = true; env.motion.dispatchEvent(new Event('change'));
    assert.equal(env.properties.size, 0);
  }
});
test('offscreen work pauses and resumes at current scroll position', () => {
  const env = setup(); env.visible(false); env.scroll(400);
  assert.equal(env.properties.get('--hero-offset'), '0px');
  env.visible(true);
  assert.equal(env.properties.get('--hero-offset'), '48px');
});
test('navigation cleans listeners and bfcache return reinitializes', () => {
  const env = setup(); env.scroll(100);
  env.window.dispatchEvent(new Event('pagehide'));
  assert.equal(env.disconnected, true);
  env.scroll(300); assert.equal(env.properties.size, 0);
  env.window.dispatchEvent(new Event('pageshow'));
  assert.equal(env.properties.get('--hero-offset'), '36px');
});

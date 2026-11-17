/* Only the decorative photograph moves. No continuous animation loop. */
(() => {
  let dispose;
  const start = () => {
    if (dispose) return;
    const heroes = [...document.querySelectorAll('.hero-illustrated')];
    if (!heroes.length) return;
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 600px)');
    const visible = new Set(heroes);
    let frame = 0;
    let enabled = false;
    const render = () => {
      frame = 0;
      if (!enabled) return;
      const updates = [...visible].map(hero => {
        const rect = hero.getBoundingClientRect();
        const amplitude = parseFloat(getComputedStyle(hero).getPropertyValue('--hero-travel')) || 0;
        // Clamp within the permanent overscan: never expose an empty edge.
        const offset = Math.max(-amplitude, Math.min(amplitude, -rect.top * 0.12));
        return [hero, offset];
      });
      updates.forEach(([hero, offset]) => hero.style.setProperty('--hero-offset', `${offset}px`));
    };
    const schedule = () => {
      if (enabled && visible.size && !frame) frame = requestAnimationFrame(render);
    };
    const configure = () => {
      enabled = !reduced.matches && !mobile.matches;
      cancelAnimationFrame(frame);
      frame = 0;
      heroes.forEach(hero => hero.style.removeProperty('--hero-offset'));
      if (enabled) render();
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      schedule();
    }, { rootMargin: '100px 0px' }) : null;
    heroes.forEach(hero => observer?.observe(hero));
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', configure, { passive: true, signal });
    reduced.addEventListener('change', configure, { signal });
    mobile.addEventListener('change', configure, { signal });
    configure();
    dispose = () => {
      controller.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      heroes.forEach(hero => hero.style.removeProperty('--hero-offset'));
      dispose = undefined;
    };
  };
  window.addEventListener('pagehide', () => dispose?.());
  window.addEventListener('pageshow', start);
  start();
})();

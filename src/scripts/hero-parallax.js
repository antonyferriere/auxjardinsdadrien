/* Shared by all illustration frames. Captions and controls never move. */
(() => {
  let dispose;
  const start = () => {
    if (dispose) return;
    const controller = new AbortController();
    const { signal } = controller;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const travelCache = new WeakMap();
    const frames = new Set();
    const visible = new Set();
    let frame = 0;
    let enabled = false;
    const render = () => {
      frame = 0;
      if (!enabled) return;
      // Read all geometry before writing styles. Progress spans the viewport,
      // including illustrations far below the first screen.
      const updates = [...visible].map(element => {
        const rect = element.getBoundingClientRect();
        if (!travelCache.has(element)) {
          travelCache.set(element, parseFloat(getComputedStyle(element).getPropertyValue('--parallax-travel')) || 0);
        }
        const configuredTravel = travelCache.get(element);
        const travel = element.classList.contains('section-media-img-container')
          ? Math.min(configuredTravel, rect.height * 0.05) : configuredTravel;
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const offset = Math.max(-travel, Math.min(travel, (progress * 2 - 1) * travel));
        return [element, offset];
      });
      updates.forEach(([element, offset]) => element.style.setProperty('--parallax-offset', `${offset}px`));
    };
    const schedule = () => {
      if (enabled && visible.size && !frame) frame = requestAnimationFrame(render);
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!frames.has(entry.target)) return;
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      schedule();
    }, { rootMargin: '100px 0px' }) : null;
    const refresh = () => {
      const current = new Set(document.querySelectorAll('[data-parallax]'));
      frames.forEach(element => {
        if (current.has(element)) return;
        observer?.unobserve(element);
        frames.delete(element);
        visible.delete(element);
        element.style.removeProperty('--parallax-offset');
      });
      current.forEach(element => {
        if (frames.has(element)) return;
        frames.add(element);
        if (observer) observer.observe(element);
        else visible.add(element);
      });
      schedule();
    };
    const configure = () => {
      frames.forEach(element => travelCache.delete(element));
      enabled = !reduced.matches;
      cancelAnimationFrame(frame);
      frame = 0;
      frames.forEach(element => element.style.removeProperty('--parallax-offset'));
      if (enabled) render();
    };
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', configure, { passive: true, signal });
    document.addEventListener('parallax:refresh', refresh, { signal });
    // Lazy images may change the geometry of natural-ratio media.
    document.addEventListener('load', schedule, { capture: true, signal });
    reduced.addEventListener('change', configure, { signal });
    refresh();
    configure();
    dispose = () => {
      controller.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      frames.forEach(element => element.style.removeProperty('--parallax-offset'));
      dispose = undefined;
    };
  };
  window.addEventListener('pagehide', () => dispose?.());
  window.addEventListener('pageshow', start);
  start();
})();

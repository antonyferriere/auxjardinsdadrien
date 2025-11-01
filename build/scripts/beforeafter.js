(function () {
  const initBeforeAfter = (root) => {
    const sliders = root.querySelectorAll('[data-before-after]');
    sliders.forEach((slider) => {
      const range = slider.querySelector('.before-after-range');
      if (!range) {
        return;
      }

      const applyValue = (value) => {
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
          ? Math.min(100, Math.max(0, numericValue))
          : 50;

        slider.style.setProperty('--before-after-pos', `${safeValue}%`);
        if (range.value !== String(safeValue)) {
          range.value = String(safeValue);
        }
      };

      applyValue(range.value || 50);

      const handleInput = (event) => {
        applyValue(event.target.value);
      };

      range.addEventListener('input', handleInput);
      range.addEventListener('change', handleInput);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initBeforeAfter(document));
  } else {
    initBeforeAfter(document);
  }
})();

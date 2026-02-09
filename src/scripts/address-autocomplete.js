(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const ADDRESS_API_ENDPOINT = 'https://api-adresse.data.gouv.fr/search/';
  const MIN_QUERY_LENGTH = 3;
  const RESULT_LIMIT = 8;
  const DEBOUNCE_DELAY_MS = 250;
  const NO_SELECTION_MESSAGE = "Veuillez selectionner une adresse dans la liste.";

  function debounce(callback, delay) {
    let timeoutId = null;

    return (...args) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => callback(...args), delay);
    };
  }

  function normalizeValue(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function createMenuElement() {
    const menu = document.createElement('div');
    menu.className = 'address-autocomplete-menu';
    menu.hidden = true;

    const list = document.createElement('ul');
    list.className = 'address-autocomplete-list';
    list.setAttribute('role', 'listbox');

    menu.appendChild(list);
    return { menu, list };
  }

  function mapApiResults(payload) {
    if (!payload || !Array.isArray(payload.features)) return [];

    const unique = new Set();

    return payload.features
      .filter((feature) => {
        const label = feature?.properties?.label || '';
        if (!label) {
          return false;
        }
        const normalized = label.toLowerCase();
        if (unique.has(normalized)) {
          return false;
        }
        unique.add(normalized);
        return true;
      });
  }

  function setSelection(input, feature) {
    const label = feature?.properties?.label || '';
    if (!label) {
      return;
    }

    const normalized = normalizeValue(label);
    input.value = label;
    input.dataset.addressSelected = '1';
    input.dataset.addressSelection = normalized;
    input.setCustomValidity('');

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function clearSelection(input) {
    input.dataset.addressSelected = '0';
    input.dataset.addressSelection = '';
    input.setCustomValidity('');
  }

  function isAddressConfirmed(input) {
    if (!input) {
      return false;
    }

    const value = input.value.trim();
    if (value.length === 0) {
      input.setCustomValidity('');
      return false;
    }

    const isSelected =
      input.dataset.addressSelected === '1' &&
      normalizeValue(input.dataset.addressSelection) === normalizeValue(value);

    input.setCustomValidity(isSelected ? '' : NO_SELECTION_MESSAGE);
    return isSelected;
  }

  function initAutocomplete(input, index) {
    const field = input.closest('.form-field');
    if (!field) {
      return;
    }

    const { menu, list } = createMenuElement();
    const listId = `${input.id || 'address'}-autocomplete-list-${index + 1}`;
    list.id = listId;
    input.setAttribute('autocomplete', 'street-address');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    field.appendChild(menu);

    let activeController = null;
    let requestSequence = 0;
    let highlightedIndex = -1;
    let suggestions = [];
    const queryCache = new Map();

    const closeMenu = () => {
      menu.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      highlightedIndex = -1;
    };

    const openMenu = () => {
      if (suggestions.length === 0) {
        closeMenu();
        return;
      }
      menu.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    const highlight = (index) => {
      const options = Array.from(list.querySelectorAll('.address-autocomplete-option'));
      options.forEach((option, optionIndex) => {
        const isActive = optionIndex === index;
        option.classList.toggle('is-active', isActive);
        option.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    };

    const selectSuggestion = (feature) => {
      setSelection(input, feature);
      closeMenu();
    };

    const renderSuggestions = () => {
      list.textContent = '';
      highlightedIndex = -1;

      if (suggestions.length === 0) {
        closeMenu();
        return;
      }

      const fragment = document.createDocumentFragment();

      suggestions.forEach((feature, index) => {
        const label = feature?.properties?.label || '';
        if (!label) return;

        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'address-autocomplete-option';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');
        button.textContent = label;

        button.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });

        button.addEventListener('click', () => {
          selectSuggestion(feature);
        });

        button.addEventListener('mousemove', () => {
          if (highlightedIndex === index) return;
          highlightedIndex = index;
          highlight(highlightedIndex);
        });

        item.appendChild(button);
        fragment.appendChild(item);
      });

      list.appendChild(fragment);
      openMenu();
    };

    const fetchSuggestions = async () => {
      const query = input.value.trim();

      if (query.length < MIN_QUERY_LENGTH) {
        suggestions = [];
        renderSuggestions();
        return;
      }

      const normalizedQuery = normalizeValue(query);
      if (queryCache.has(normalizedQuery)) {
        suggestions = queryCache.get(normalizedQuery);
        renderSuggestions();
        return;
      }

      if (activeController) {
        activeController.abort();
      }

      activeController = new AbortController();
      const currentRequest = ++requestSequence;

      const url = new URL(ADDRESS_API_ENDPOINT);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', String(RESULT_LIMIT));
      url.searchParams.set('autocomplete', '1');

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: activeController.signal,
        });

        if (!response.ok || currentRequest !== requestSequence) {
          return;
        }

        const payload = await response.json();
        const mapped = mapApiResults(payload);
        queryCache.set(normalizedQuery, mapped);
        suggestions = mapped;
        renderSuggestions();
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    };

    const debouncedFetch = debounce(fetchSuggestions, DEBOUNCE_DELAY_MS);

    input.addEventListener('input', () => {
      const currentValue = normalizeValue(input.value);
      const selectedValue = normalizeValue(input.dataset.addressSelection);
      const keepsConfirmedSelection =
        input.dataset.addressSelected === '1' &&
        currentValue.length > 0 &&
        currentValue === selectedValue;

      if (keepsConfirmedSelection) {
        input.setCustomValidity('');
        return;
      }

      clearSelection(input);
      debouncedFetch();
    });

    input.addEventListener('focus', () => {
      if (suggestions.length > 0) {
        openMenu();
      }
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        closeMenu();
        if (input.value.trim().length > 0) {
          isAddressConfirmed(input);
        }
      }, 120);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key === 'ArrowDown') {
        if (suggestions.length === 0) return;
        event.preventDefault();
        openMenu();
        highlightedIndex = (highlightedIndex + 1) % suggestions.length;
        highlight(highlightedIndex);
        return;
      }

      if (event.key === 'ArrowUp') {
        if (suggestions.length === 0) return;
        event.preventDefault();
        openMenu();
        highlightedIndex =
          highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1;
        highlight(highlightedIndex);
        return;
      }

      if (event.key === 'Enter' && !menu.hidden && highlightedIndex >= 0) {
        event.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    });

    document.addEventListener('click', (event) => {
      if (!field.contains(event.target)) {
        closeMenu();
      }
    });
  }

  window.AJDAddressAutocomplete = {
    isAddressConfirmed,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const addressInputs = Array.from(document.querySelectorAll('input[data-address-autocomplete]'));
    if (addressInputs.length === 0) return;

    addressInputs.forEach((input, index) => {
      initAutocomplete(input, index);
    });
  });
})();

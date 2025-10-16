(function () {
  if (typeof window === 'undefined') return;

  const DEFAULT_PENDING_TEXT = 'Envoi en cours...';
  const HONEYPOT_FIELD = 'contact_check';
  const TOKEN_FIELD = 'hp_js_token';

  function createPopupController({ popup, message, closeButton } = {}) {
    if (!popup) {
      return {
        open: () => {},
        hide: () => {},
        popup: null,
        messageElement: message || null,
        defaultMessage: message?.innerHTML || '',
      };
    }

    const defaultMessage = message?.innerHTML || '';

    const hide = () => {
      popup.setAttribute('hidden', '');
      popup.classList.remove('is-error');
      if (message) {
        message.innerHTML = defaultMessage;
      }
    };

    const open = (content, isError = false) => {
      if (message) {
        message.innerHTML = content || defaultMessage;
      }
      popup.classList.toggle('is-error', Boolean(isError));
      popup.removeAttribute('hidden');
    };

    if (closeButton) {
      closeButton.addEventListener('click', hide);
    }

    return {
      open,
      hide,
      popup,
      messageElement: message || null,
      defaultMessage,
    };
  }

  function toggleSubmitting(form, isSubmitting, options = {}) {
    if (!form) return;

    const { submitButton = form.querySelector('button[type="submit"]'), pendingText, defaultText } = options;
    const pendingLabel = pendingText || DEFAULT_PENDING_TEXT;

    form.classList.toggle('is-submitting', isSubmitting);
    if (isSubmitting) {
      form.setAttribute('aria-busy', 'true');
    } else {
      form.removeAttribute('aria-busy');
    }

    const interactiveElements = form.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, button'
    );

    interactiveElements.forEach((element) => {
      element.disabled = isSubmitting;
    });

    if (submitButton) {
      const storedDefault = submitButton.dataset.defaultLabel || submitButton.textContent || '';
      if (!submitButton.dataset.defaultLabel) {
        submitButton.dataset.defaultLabel = storedDefault;
      }
      submitButton.textContent = isSubmitting
        ? pendingLabel
        : defaultText || submitButton.dataset.defaultLabel || storedDefault;
    }
  }

  function prepareFormData(form, options = {}) {
    const { honeypotField = HONEYPOT_FIELD, tokenField = TOKEN_FIELD } = options;
    const formData = new FormData(form);

    const honeypotInput = form.querySelector(`[name="${honeypotField}"]`);
    if (honeypotInput) {
      honeypotInput.value = '';
      formData.set(honeypotField, '');
      formData.set(tokenField, '1');
    }

    return formData;
  }

  async function submitFormData(form, formData, options = {}) {
    const { headers = { Accept: 'application/json' } } = options;

    const response = await fetch(form.action, {
      method: 'POST',
      headers,
      body: formData,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    const success = Boolean(response.ok && data && typeof data === 'object' && data.success);

    return { success, data, response };
  }

  window.AJDFormUtils = {
    createPopupController,
    toggleSubmitting,
    prepareFormData,
    submitFormData,
    DEFAULT_PENDING_TEXT,
    HONEYPOT_FIELD,
    TOKEN_FIELD,
  };
})();


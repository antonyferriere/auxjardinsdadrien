document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const popup = document.getElementById('contact-popup');
  const popupMessage = document.getElementById('contact-popup-message');
  const closeBtn = document.getElementById('close-popup');
  const submitButton = form?.querySelector('button[type="submit"]');
  const honeypotField = form?.querySelector('input[name="contact_check"]');

  if (!form) return;

  const defaultPopupText = popupMessage?.innerHTML ?? '';
  const defaultSubmitText = submitButton?.textContent ?? 'Envoyer';

  const fields = {
    name: form.querySelector('#name'),
    email: form.querySelector('#email'),
    phone: form.querySelector('#phone'),
    message: form.querySelector('#message'),
  };

  const validators = {
    name: (input) => input.value.trim().length > 0,
    email: (input) => {
      const value = input.value.trim();
      return value.length > 0 && input.checkValidity();
    },
    phone: (input) => {
      const value = input.value.trim();
      return value.length === 0 || input.checkValidity();
    },
    message: (input) => input.value.trim().length > 0,
  };

  const clearFieldError = (input) => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  };

  const markFieldInvalid = (input) => {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
  };

  const setSubmittingState = (isSubmitting) => {
    form.classList.toggle('is-submitting', isSubmitting);
    if (isSubmitting) {
      form.setAttribute('aria-busy', 'true');
    } else {
      form.removeAttribute('aria-busy');
    }

    const interactiveElements = form.querySelectorAll(
      'input:not([type="hidden"]):not([name="contact_check"]), textarea, select, button'
    );
    interactiveElements.forEach((element) => {
      element.disabled = isSubmitting;
    });

    if (submitButton) {
      submitButton.textContent = isSubmitting ? 'Envoi en cours...' : defaultSubmitText;
    }
  };

  const hidePopup = () => {
    if (!popup) return;
    popup.setAttribute('hidden', '');
    popup.classList.remove('is-error');
    if (popupMessage) {
      popupMessage.innerHTML = defaultPopupText;
    }
  };

  const openPopup = (message, isError = false) => {
    if (!popup) return;
    if (popupMessage) {
      popupMessage.innerHTML = message || defaultPopupText;
    }
    popup.classList.toggle('is-error', isError);
    popup.removeAttribute('hidden');
  };

  const validateForm = () => {
    let firstInvalid = null;

    Object.entries(validators).forEach(([fieldKey, validator]) => {
      const input = fields[fieldKey];
      if (!input) return;

      if (validator(input)) {
        clearFieldError(input);
        return;
      }

      markFieldInvalid(input);
      if (!firstInvalid) {
        firstInvalid = input;
      }
    });

    return {
      isValid: firstInvalid === null,
      firstInvalid,
    };
  };

  Object.entries(validators).forEach(([fieldKey, validator]) => {
    const input = fields[fieldKey];
    if (!input) return;

    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid') && validator(input)) {
        clearFieldError(input);
      }
    });

    input.addEventListener('blur', () => {
      if (validator(input)) {
        clearFieldError(input);
        return;
      }
      markFieldInvalid(input);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    if (honeypotField) {
      honeypotField.value = '';
      formData.set('contact_check', '');
      formData.set('hp_js_token', '1');
    }

    const validation = validateForm();
    if (!validation.isValid) {
      hidePopup();
      validation.firstInvalid?.focus({ preventScroll: true });
      return;
    }

    setSubmittingState(true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      const isSuccess = response.ok && data?.success;

      if (isSuccess) {
        form.reset();
        Object.values(fields).forEach((input) => {
          if (input) {
            clearFieldError(input);
          }
        });
        openPopup(data.message || defaultPopupText);
        return;
      }

      const errorMessage =
        data?.message ||
        "L'envoi a echoue. Vous pouvez egalement nous contacter par telephone ou directement a l'adresse <a href=\"mailto:auxjardinsdadrien@gmail.com\">auxjardinsdadrien@gmail.com</a>.";
      openPopup(errorMessage, true);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire', error);
      openPopup(
        'Une erreur technique est survenue. Merci de reessayer dans quelques instants ou de nous contacter directement a l\'adresse <a href="mailto:auxjardinsdadrien@gmail.com">auxjardinsdadrien@gmail.com</a>.',
        true
      );
    } finally {
      setSubmittingState(false);
    }
  });

  closeBtn?.addEventListener('click', hidePopup);
});

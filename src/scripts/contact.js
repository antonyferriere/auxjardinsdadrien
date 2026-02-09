document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  if (!window.AJDFormUtils) {
    console.error('AJDFormUtils is required for the contact form.');
    return;
  }

  const {
    createPopupController,
    toggleSubmitting,
    prepareFormData,
    submitFormData,
    DEFAULT_PENDING_TEXT,
  } = window.AJDFormUtils;

  const popupElement = document.getElementById('contact-popup');
  const popupMessageElement = document.getElementById('contact-popup-message');
  const popupCloseButton = document.getElementById('close-popup');
  const submitButton = form.querySelector('button[type="submit"]');

  const popupController = createPopupController({
    popup: popupElement,
    message: popupMessageElement,
    closeButton: popupCloseButton,
  });

  const defaultPopupText = popupController.defaultMessage || '';
  const defaultSubmitText = submitButton?.textContent ?? 'Envoyer';

  const hidePopup = () => popupController.hide();
  const openPopup = (message, isError = false) => popupController.open(message, isError);

  const setSubmittingState = (isSubmitting) =>
    toggleSubmitting(form, isSubmitting, {
      submitButton,
      pendingText: DEFAULT_PENDING_TEXT,
      defaultText: defaultSubmitText,
    });

  const prepareFormDataForSubmit = () => prepareFormData(form);
  const submitForm = (formData) => submitFormData(form, formData);

  const fields = {
    name: form.querySelector('#name'),
    email: form.querySelector('#email'),
    phone: form.querySelector('#phone'),
    address: form.querySelector('#address'),
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
      return value.length > 0 && input.checkValidity();
    },
    address: (input) => {
      const value = input.value.trim();
      if (value.length === 0) return false;
      const isConfirmed = window.AJDAddressAutocomplete?.isAddressConfirmed
        ? window.AJDAddressAutocomplete.isAddressConfirmed(input)
        : true;
      return isConfirmed && input.checkValidity();
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
    const formData = prepareFormDataForSubmit();

    const validation = validateForm();
    if (!validation.isValid) {
      hidePopup();
      validation.firstInvalid?.focus({ preventScroll: true });
      return;
    }

    setSubmittingState(true);

    try {
      const { success, data } = await submitForm(formData);

      if (success) {
        form.reset();
        Object.values(fields).forEach((input) => {
          if (input) {
            clearFieldError(input);
          }
        });
        openPopup(data?.message || defaultPopupText);
        return;
      }

      const errorMessage =
        data?.message ||
        'L\'envoi a echoue. Vous pouvez egalement nous contacter au <a href="tel:+33609564511">06 09 56 45 11</a> ou <a href="mailto:auxjardinsdadrien@gmail.com">auxjardinsdadrien@gmail.com</a>.';
      openPopup(errorMessage, true);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire', error);
      openPopup(
        'Une erreur technique est survenue. Merci de reessayer dans quelques instants ou de nous contacter au <a href="tel:+33609564511">06 09 56 45 11</a> ou <a href="mailto:auxjardinsdadrien@gmail.com">auxjardinsdadrien@gmail.com</a>.',
        true
      );
    } finally {
      setSubmittingState(false);
    }
  });
});

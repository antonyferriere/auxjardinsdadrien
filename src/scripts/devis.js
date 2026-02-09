document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('estimation-form');
  const popup = document.getElementById('estimation-popup');
  const popupMessage = document.getElementById('estimation-popup-message');
  const closeBtn = document.getElementById('close-popup');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form) return;

  if (!window.AJDFormUtils) {
    console.error('AJDFormUtils est requis pour le formulaire d’estimation.');
    return;
  }

  const {
    createPopupController,
    toggleSubmitting,
    prepareFormData,
    submitFormData,
    DEFAULT_PENDING_TEXT,
  } = window.AJDFormUtils;

  const popupController = createPopupController({
    popup,
    message: popupMessage,
    closeButton: closeBtn,
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

  const prepareFormDataForSubmit = () =>
    prepareFormData(form, { honeypotField: 'estimation_check' });
  const submitForm = (formData) => submitFormData(form, formData);

  const steps = Array.from(form.querySelectorAll('.form-step'));
  if (steps.length === 0) return;

  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const stepContainer = form.querySelector('[data-step-container]');
  let currentStepIndex = steps.findIndex((step) => !step.hasAttribute('hidden'));
  if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  steps.forEach((step, index) => {
    if (index === currentStepIndex) {
      step.removeAttribute('hidden');
    } else {
      step.setAttribute('hidden', '');
    }
  });

  const validators = {
    address: (input) => {
      const value = input.value.trim();
      if (value.length === 0) return false;
      const isConfirmed = window.AJDAddressAutocomplete?.isAddressConfirmed
        ? window.AJDAddressAutocomplete.isAddressConfirmed(input)
        : true;
      return isConfirmed && input.checkValidity();
    },
    project: (select) => select.value.trim().length > 0,
    description: (textarea) => textarea.value.trim().length > 0,
    name: (input) => input.value.trim().length > 0,
    email: (input) => {
      const value = input.value.trim();
      return value.length > 0 && input.checkValidity();
    },
    phone: (input) => {
      const value = input.value.trim();
      return value.length > 0 && input.checkValidity();
    },
  };

  const clearInvalid = (field) => {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  };

  const markInvalid = (field) => {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
  };

  const getFieldValidator = (field) => {
    const key = field.id || field.name;
    return validators[key] || ((input) => input.checkValidity());
  };

  const getStepFields = (step) =>
    Array.from(step.querySelectorAll('input:not([type="hidden"]), textarea, select')).filter(
      (field) => !field.disabled && !field.closest('.honeypot')
    );

  const validateStep = (step, { focusOnError = true } = {}) => {
    const stepFields = getStepFields(step);
    let firstInvalid = null;

    stepFields.forEach((field) => {
      const validator = getFieldValidator(field);
      if (validator(field)) {
        clearInvalid(field);
        return;
      }

      markInvalid(field);
      if (!firstInvalid) {
        firstInvalid = field;
      }
    });

    if (firstInvalid && focusOnError) {
      firstInvalid.focus({ preventScroll: true });
      if (typeof firstInvalid.reportValidity === 'function') {
        firstInvalid.reportValidity();
      }
      return false;
    }

    return !firstInvalid;
  };

  const attachFieldListeners = () => {
    const fields = Array.from(form.querySelectorAll('input, textarea, select')).filter(
      (field) => !field.closest('.honeypot')
    );

    fields.forEach((field) => {
      const validator = getFieldValidator(field);

      const handleValueChange = () => {
        if (field.classList.contains('is-invalid') && validator(field)) {
          clearInvalid(field);
        }
      };

      field.addEventListener('input', handleValueChange);
      field.addEventListener('change', handleValueChange);
      field.addEventListener('blur', () => {
        if (!validator(field)) {
          markInvalid(field);
          return;
        }
        clearInvalid(field);
      });
    });
  };

  attachFieldListeners();

  const setContainerHeight = (step) => {
    if (!stepContainer || !step) return;
    const height = step.offsetHeight || step.scrollHeight;
    if (height > 0) {
      stepContainer.style.height = `${height}px`;
    }
  };

  const updateActiveStep = () => {
    steps.forEach((step, index) => {
      step.classList.toggle('is-active', index === currentStepIndex);
    });
    form.dataset.currentStep = String(currentStepIndex + 1);
    setContainerHeight(steps[currentStepIndex]);
  };

  updateActiveStep();
  window.addEventListener('resize', () => {
    setContainerHeight(steps[currentStepIndex]);
  });

  const playAnimation = (element, keyframes, options) => {
    if (!element || typeof element.animate !== 'function' || prefersReducedMotion) {
      return Promise.resolve();
    }

    const animation = element.animate(keyframes, options);

    return new Promise((resolve) => {
      animation.addEventListener('finish', resolve, { once: true });
      animation.addEventListener('cancel', resolve, { once: true });
    });
  };

  const animationOptions = {
    duration: 360,
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
    fill: 'none',
  };
  const stepAnimations = {
    forward: {
      out: [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(-100%)', opacity: 0.25 },
      ],
      in: [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
    },
    backward: {
      out: [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0.25 },
      ],
      in: [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
    },
  };

  let isTransitioning = false;

  const goToStep = async (targetIndex) => {
    if (
      targetIndex === currentStepIndex ||
      targetIndex < 0 ||
      targetIndex >= steps.length ||
      isTransitioning
    ) {
      return;
    }

    const direction = targetIndex > currentStepIndex ? 'forward' : 'backward';
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[targetIndex];

    nextStep.hidden = false;
    currentStep.style.zIndex = '1';
    nextStep.style.zIndex = '2';
    setContainerHeight(nextStep);
    isTransitioning = true;

    await Promise.all([
      playAnimation(currentStep, stepAnimations[direction].out, animationOptions),
      playAnimation(nextStep, stepAnimations[direction].in, animationOptions),
    ]);

    currentStep.hidden = true;
    currentStep.style.removeProperty('z-index');
    nextStep.style.removeProperty('z-index');
    currentStepIndex = targetIndex;
    updateActiveStep();
    isTransitioning = false;

    const firstField = nextStep.querySelector('input:not([type="hidden"]), textarea, select');
    if (firstField) {
      firstField.focus({ preventScroll: true });
    }
  };

  const nextButtons = form.querySelectorAll('[data-form-action="next"]');
  nextButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const currentStep = steps[currentStepIndex];
      const isValid = validateStep(currentStep);
      if (!isValid) return;

      await goToStep(Math.min(currentStepIndex + 1, steps.length - 1));
    });
  });

  const previousButtons = form.querySelectorAll('[data-form-action="previous"]');
  previousButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      await goToStep(Math.max(currentStepIndex - 1, 0));
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentStep = steps[currentStepIndex];
    const isValid = validateStep(currentStep);
    if (!isValid) {
      hidePopup();
      return;
    }

    const formData = prepareFormDataForSubmit();

    setSubmittingState(true);

    try {
      const { success, data } = await submitForm(formData);

      if (success) {
        form.reset();

        const fields = Array.from(form.querySelectorAll('input, textarea, select')).filter(
          (field) => !field.closest('.honeypot')
        );
        fields.forEach((field) => {
          clearInvalid(field);
        });

        await goToStep(0);
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

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  if (!window.AJDFormUtils) {
    console.error('AJDFormUtils est requis pour le formulaire de contact.');
    return;
  }

  const { openEmailDraft } = window.AJDFormUtils;

  const fields = {
    name: form.querySelector('#name'),
    email: form.querySelector('#email'),
    phone: form.querySelector('#phone'),
    address: form.querySelector('#address'),
    message: form.querySelector('#message'),
  };

  const validators = {
    name: (input) => input.value.trim().length > 0,
    email: (input) => input.value.trim().length > 0 && input.checkValidity(),
    phone: (input) => input.value.trim().length > 0 && input.checkValidity(),
    address: (input) => {
      if (input.value.trim().length === 0) return false;
      const confirmed = window.AJDAddressAutocomplete?.isAddressConfirmed
        ? window.AJDAddressAutocomplete.isAddressConfirmed(input)
        : true;
      return confirmed && input.checkValidity();
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
    Object.entries(validators).forEach(([key, validator]) => {
      const input = fields[key];
      if (!input) return;
      if (validator(input)) {
        clearFieldError(input);
      } else {
        markFieldInvalid(input);
        if (!firstInvalid) firstInvalid = input;
      }
    });
    return firstInvalid;
  };

  Object.entries(validators).forEach(([key, validator]) => {
    const input = fields[key];
    if (!input) return;
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid') && validator(input)) clearFieldError(input);
    });
    input.addEventListener('blur', () => {
      if (validator(input)) clearFieldError(input);
      else markFieldInvalid(input);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstInvalid = validateForm();
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.reportValidity?.();
      return;
    }

    openEmailDraft(form, {
      subject: 'Demande de contact – Aux Jardins d’Adrien',
      fields: [
        ['Nom', 'name'],
        ['E-mail', 'email'],
        ['Téléphone', 'phone'],
        ['Adresse', 'address'],
        ['Message', 'message'],
      ],
    });
  });
});

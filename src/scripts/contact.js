document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const popup = document.getElementById('contact-popup');
  const closeBtn = document.getElementById('close-popup');

  if (!form) return;

  // Initialisation avec ta Public Key
  emailjs.init('m0yC1lW5Kk3KkKSHC');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name') || '';
    const email = formData.get('email') || '';
    const mobile = formData.get('mobile') || '';
    const message = formData.get('message') || '';

    emailjs.sendForm('service_9b4zeh5', 'template_jagcad9', '#contact-form').then(
      (response) => {
        popup.removeAttribute('hidden');
        form.reset();
      },
      (error) => {
        console.log('FAILED...', error);
      }
    );
  });

  closeBtn.addEventListener('click', () => {
    popup.setAttribute('hidden', '');
  });
});

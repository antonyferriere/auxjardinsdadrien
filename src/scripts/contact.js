 document.addEventListener('DOMContentLoaded', () => {
   const form = document.querySelector('.contact-form');
   const popup = document.getElementById('contact-popup');
   const closeBtn = document.getElementById('close-popup');
 
   if (!form) return;
 
   form.addEventListener('submit', (e) => {
     e.preventDefault();
     const formData = new FormData(form);
     const name = formData.get('name') || '';
     const email = formData.get('email') || '';
     const mobile = formData.get('mobile') || '';
     const message = formData.get('message') || '';
     const body = encodeURIComponent(`Nom: ${name}\nEmail: ${email}\nMobile: ${mobile}\n\n${message}`);
     window.location.href = `mailto:auxjardinsdadrien@gmail.com?subject=Contact%20depuis%20le%20site&body=${body}`;
     popup.removeAttribute('hidden');
     form.reset();
   });
 
   closeBtn.addEventListener('click', () => {
     popup.setAttribute('hidden', '');
   });
 });

// The sign-up form isn't connected to a mailing service yet, so it says so rather than pretending.
document.querySelectorAll('form[data-signup]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.querySelector('[data-status]').textContent = 'Sign-ups open soon. Thank you for your patience.';
  });
});

document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});

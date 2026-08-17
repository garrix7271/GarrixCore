// ui.js — interface-only interactions (not form submission).
// Handles the show/hide password eye toggle.

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-visibility').forEach((btn) => {
    const input = document.getElementById(btn.dataset.target);
    const eyeIcon = btn.querySelector('.icon-eye');
    const eyeOffIcon = btn.querySelector('.icon-eye-off');
    if (!input || !eyeIcon || !eyeOffIcon) return;

    btn.addEventListener('click', () => {
      const isCurrentlyHidden = input.type === 'password';
      input.type = isCurrentlyHidden ? 'text' : 'password';
      eyeIcon.classList.toggle('hidden', isCurrentlyHidden);
      eyeOffIcon.classList.toggle('hidden', !isCurrentlyHidden);
      btn.setAttribute('aria-label', isCurrentlyHidden ? 'Hide password' : 'Show password');
    });
  });
});
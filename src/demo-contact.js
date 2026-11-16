// Demo site: every contact point (WhatsApp, booking, ebook sign-up) is a demo link.
// Clicking one goes nowhere and shows a short note instead.
import './demo-contact.css';

const MESSAGE = 'This is a demo site, so contact is switched off.';
let note = null;
let timer = 0;

function show() {
  if (!note) {
    note = document.createElement('p');
    note.className = 'demo-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    document.body.append(note);
  }
  note.textContent = MESSAGE;
  note.classList.add('is-on');
  clearTimeout(timer);
  timer = setTimeout(() => note.classList.remove('is-on'), 3200);
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('[data-demo-contact]')) return;
  event.preventDefault();
  show();
});

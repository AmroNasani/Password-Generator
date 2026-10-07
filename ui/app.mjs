import { DEFAULTS, generatePassword, estimateEntropy } from './generator.mjs';

if (location.protocol === 'chrome-extension:') document.documentElement.classList.add('extension');
const $ = id => document.getElementById(id);
const keys = ['upper', 'lower', 'digits', 'symbols', 'excludeSimilar'];
let currentPassword = '', hidden = false, revision = 0;
const settingsKey = 'password-generator.settings.v1';

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function options() {
  return { length: Number($('length-number').value), ...Object.fromEntries(keys.map(key => [key, $(key).checked])) };
}
function displayPassword() {
  $('password').value = hidden ? '•'.repeat(currentPassword.length) : currentPassword;
  const visibilityLabel = hidden ? 'Passwort anzeigen' : 'Passwort verbergen';
  $('visibility').setAttribute('aria-label', visibilityLabel);
  $('visibility').title = visibilityLabel;
  $('visibility').setAttribute('aria-pressed', String(hidden));
  resizePassword();
}
function resizePassword() {
  const field = $('password');
  field.style.height = '0px';
  field.style.height = `${field.scrollHeight}px`;
}
let outputWidth = 0;
new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === outputWidth) return;
  outputWidth = entry.contentRect.width;
  resizePassword();
}).observe(document.querySelector('.output-panel'));
function generate() {
  revision++;
  try {
    const selected = options();
    currentPassword = generatePassword(selected);
    const entropy = Math.floor(estimateEntropy(selected));
    $('strength').value = Math.min(128, entropy);
    $('entropy').textContent = `≈ ${entropy} Bit`;
    $('strength-label').textContent = entropy >= 100 ? 'Sehr stark' : entropy >= 80 ? 'Stark' : entropy >= 50 ? 'Mittel' : 'Schwach';
    $('strength').title = `${$('strength-label').textContent} · ≈ ${entropy} Bit`;
    $('strength').setAttribute('aria-valuetext', $('strength').title);
    $('copy').disabled = false;
    status('');
    try { localStorage.setItem(settingsKey, JSON.stringify(selected)); } catch { /* Settings storage is optional. */ }
  } catch (error) {
    currentPassword = '';
    $('copy').disabled = true;
    $('strength').value = 0;
    $('strength').title = 'Auswahl prüfen';
    $('strength').setAttribute('aria-valuetext', 'Auswahl prüfen');
    $('strength-label').textContent = 'Auswahl prüfen';
    $('entropy').textContent = '— Bit';
    status(error.message, true);
  }
  displayPassword();
}

let saved = {};
try { saved = JSON.parse(localStorage.getItem(settingsKey)) || {}; } catch { /* Restore defaults on invalid storage. */ }
const initialLength = Number.isInteger(saved.length) && saved.length >= 8 && saved.length <= 128 ? saved.length : DEFAULTS.length;
$('length').value = $('length-number').value = initialLength;
for (const key of keys) {
  $(key).checked = typeof saved[key] === 'boolean' ? saved[key] : DEFAULTS[key];
  $(key).addEventListener('change', generate);
}
$('length').addEventListener('input', () => { $('length-number').value = $('length').value; generate(); });
$('length-number').addEventListener('input', () => {
  if ($('length-number').validity.valid) $('length').value = $('length-number').value;
  generate();
});
$('generate').addEventListener('click', generate);
$('visibility').addEventListener('click', () => { hidden = !hidden; displayPassword(); });
$('copy').addEventListener('click', async () => {
  if (!currentPassword) return;
  const copiedRevision = revision;
  try {
    await navigator.clipboard.writeText(currentPassword);
    if (revision === copiedRevision) status('Kopiert.');
  } catch {
    status('Kopieren fehlgeschlagen. Passwort anzeigen, markieren und mit Strg+C kopieren.', true);
  }
});
generate();

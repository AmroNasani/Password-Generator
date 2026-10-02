export const GROUPS = Object.freeze({
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/'
});
export const DEFAULTS = Object.freeze({ length: 20, upper: true, lower: true, digits: true, symbols: true, excludeSimilar: false });

export function characterGroups(options) {
  return Object.entries(GROUPS)
    .filter(([name]) => options[name])
    .map(([, chars]) => options.excludeSimilar ? chars.replace(/[Il1O0o|]/g, '') : chars);
}

// Rejection sampling avoids modulo bias. Web Crypto is available in both targets.
export function randomIndex(size, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(size) || size < 1 || size > 256) throw new RangeError('Ungültige Zeichenauswahl.');
  const limit = 256 - (256 % size);
  const byte = new Uint8Array(1);
  do { cryptoSource.getRandomValues(byte); } while (byte[0] >= limit);
  return byte[0] % size;
}

export function generatePassword(options = DEFAULTS) {
  const { length } = options;
  if (!Number.isInteger(length) || length < 8 || length > 128) throw new RangeError('Bitte eine Länge zwischen 8 und 128 wählen.');
  const groups = characterGroups(options);
  if (!groups.length) throw new RangeError('Bitte mindestens eine Zeichenart auswählen.');
  const alphabet = groups.join('');
  // Sample uniformly from the alphabet and reject candidates missing a selected group.
  // Every accepted password is equally likely and includes every selected group.
  let password;
  do {
    password = Array.from({ length }, () => alphabet[randomIndex(alphabet.length)]).join('');
  } while (!groups.every(group => [...password].some(char => group.includes(char))));
  return password;
}

export function estimateEntropy(options) {
  const groups = characterGroups(options);
  const alphabetSize = groups.join('').length;
  if (!alphabetSize) return 0;
  // Inclusion-exclusion: exact size of the space containing all selected groups.
  let validFraction = 0;
  for (let mask = 0; mask < 1 << groups.length; mask++) {
    let excluded = 0, count = 0;
    for (let i = 0; i < groups.length; i++) {
      if (mask & (1 << i)) { excluded += groups[i].length; count++; }
    }
    validFraction += (-1) ** count * (1 - excluded / alphabetSize) ** options.length;
  }
  return Math.max(0, options.length * Math.log2(alphabetSize) + Math.log2(validFraction));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, GROUPS, generatePassword, estimateEntropy, randomIndex } from '../ui/generator.mjs';

test('all nonempty group combinations, both boundaries and similar-character filtering', () => {
  for (let mask = 1; mask < 16; mask++) {
    for (const length of [8, 20, 128]) {
      for (const excludeSimilar of [false, true]) {
        const options = { length, excludeSimilar };
        Object.keys(GROUPS).forEach((key, index) => { options[key] = Boolean(mask & (1 << index)); });
        for (let attempt = 0; attempt < 10; attempt++) {
          const password = generatePassword(options);
          assert.equal(password.length, length);
          const selected = Object.entries(GROUPS).filter(([key]) => options[key]).map(([, group]) => group);
          assert.ok([...password].every(char => selected.join('').includes(char)));
          assert.ok(selected.every(group => [...password].some(char => group.includes(char))));
          if (excludeSimilar) assert.doesNotMatch(password, /[Il1O0o|]/);
        }
      }
    }
  }
});
test('invalid lengths and empty selection fail clearly', () => {
  for (const length of [0, -1, 7, 129, 8.5, NaN, Infinity, '20']) assert.throws(() => generatePassword({ ...DEFAULTS, length }), RangeError);
  assert.throws(() => generatePassword({ length: 20 }), /mindestens/);
});
test('randomIndex rejects out-of-range bytes instead of using biased modulo', () => {
  const bytes = [255, 250, 249];
  let calls = 0;
  assert.equal(randomIndex(10, { getRandomValues: array => { array[0] = bytes[calls++]; } }), 9);
  assert.equal(calls, 3);
});
test('entropy matches single alphabet and accounts for mandatory groups', () => {
  assert.equal(estimateEntropy({ length: 20, digits: true }), 20 * Math.log2(10));
  assert.equal(estimateEntropy({ length: 20 }), 0);
  const full = Object.values(GROUPS).join('').length;
  assert.ok(estimateEntropy(DEFAULTS) < DEFAULTS.length * Math.log2(full));
  assert.ok(estimateEntropy(DEFAULTS) > 100);
});

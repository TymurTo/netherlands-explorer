import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApiError } from '../src/api/validation.js';
import { api } from '../src/api/client.js';
test('validation messages identify only the failing fields', () => {
  const error = parseApiError([{ loc: ['body', 'password'], type: 'string_too_short', ctx: { min_length: 8 } }]);
  assert.deepEqual(error.fieldErrors, { password: ['Must contain at least 8 characters.'] });
  assert.match(error.message, /Password:/);
  assert.doesNotMatch(error.message, /Username|Comment/);
  const combined = parseApiError([
    { loc: ['body', 'username'], type: 'string_pattern_mismatch' },
    { loc: ['body', 'body'], type: 'value_error', msg: 'Value error, Comment must not be empty.' },
  ]);
  assert.match(combined.fieldErrors.username[0], /Latin letters/);
  assert.equal(combined.fieldErrors.body[0], 'Comment must not be empty.');
});
test('API client exposes status and structured field errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 422, json: async () => ({ detail: [{ loc: ['query', 'before'], msg: 'Input should be greater than 0' }] }) }));
  await assert.rejects(api('/attractions/assen-sight/comments?before=0'), (error) => {
    assert.equal(error.status, 422);
    assert.match(error.message, /Cursor:/);
    assert.ok(error.fieldErrors.before);
    return true;
  });
});
test('plain server errors and malformed responses have usable messages', () => {
  assert.equal(parseApiError('Incorrect username or password.').message, 'Incorrect username or password.');
  assert.equal(typeof parseApiError({ unexpected: true }).message, 'string');
});

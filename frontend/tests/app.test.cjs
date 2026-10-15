const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const esbuild = require('esbuild');

test('shared URL, history, registration, favorites and cursor comments work together', async () => {
  const originalMessageChannel = global.MessageChannel;
  const channels = [];
  global.MessageChannel = class extends originalMessageChannel {
    constructor() { super(); channels.push(this); }
  };
  const directory = fs.mkdtempSync(path.resolve(__dirname, '../.test-build-'));
  const output = path.join(directory, 'app.cjs');
  esbuild.buildSync({
    stdin: { contents: "export {default as App} from './src/App.jsx'; export {act,createElement} from 'react'; export {createRoot} from 'react-dom/client';", resolveDir: path.resolve(__dirname, '..'), loader: 'jsx' },
    bundle: true, platform: 'node', jsx: 'automatic', outfile: output,
  });
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:5173/?province=noord-holland&city=amsterdam&panel=story', pretendToBeVisual: true });
  Object.assign(global, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
  window.matchMedia = () => ({ matches: true });
  global.FormData = window.FormData;
  const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../backend/app/data/catalog.json')));
  let user = null;
  let favorites = [];
  let comments = [2, 1].map(id => ({ id, user_id: 1, username: 'reader', body: `Comment ${id}`, created_at: '2026-10-15T12:00:00Z' }));
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push(url);
    const method = options.method || 'GET';
    let data, status = 200;
    if (url === '/api/catalog') data = catalog;
    else if (url === '/api/auth/me') { status = user ? 200 : 401; data = user || { detail: 'Please sign in.' }; }
    else if (url === '/api/auth/register') { user = { id: 1, username: 'reader' }; data = user; }
    else if (url === '/api/auth/logout') { user = null; status = 204; }
    else if (url === '/api/favorites') data = [...favorites];
    else if (url.startsWith('/api/favorites/')) {
      const id = url.split('/').at(-1);
      favorites = method === 'PUT' ? [...new Set([...favorites, id])] : favorites.filter(value => value !== id);
      status = 204;
    } else if (url.endsWith('/comments') && method === 'POST') {
      comments.unshift({ id: 3, user_id: 1, username: 'reader', body: JSON.parse(options.body).body, created_at: '2026-10-15T12:00:00Z' });
      data = { id: 3 };
    } else if (url.startsWith('/api/comments/') && method === 'DELETE') {
      comments = comments.filter(item => item.id !== Number(url.split('/').at(-1))); status = 204;
    } else if (url.includes('/comments')) {
      const before = new URL(url, window.location.origin).searchParams.get('before');
      const available = comments.filter(item => !before || item.id < Number(before));
      data = { items: available.slice(0, 1), has_more: available.length > 1, next_cursor: available.length > 1 ? available[0].id : null };
    } else throw new Error(`Unexpected API call: ${url}`);
    return { ok: status < 400, status, json: async () => data };
  };
  const { App, act, createElement, createRoot } = require(output);
  const pause = () => new Promise(resolve => setTimeout(resolve, 20));
  const click = async element => {
    assert.ok(element, 'Expected a clickable element');
    assert.equal(element.disabled, false);
    await act(async () => { element.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await pause(); });
  };
  const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text);
  const close = () => click(document.querySelector('[aria-label="Close panel"]'));
  const fill = async (element, value) => {
    assert.ok(element);
    await act(async () => {
      const proto = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
      element.dispatchEvent(new window.Event('input', { bubbles: true }));
      await pause();
    });
  };
  const submit = () => act(async () => { document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); await pause(); });
  let root = createRoot(document.getElementById('root'));
  try {
    await act(async () => { root.render(createElement(App)); await pause(); });
    assert.equal(document.querySelector('#modal-title').textContent, 'Amsterdam');
    assert.ok(document.querySelector('[aria-label="Open province North Holland"].selected'));
    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(async () => { root.render(createElement(App)); await pause(); });
    assert.equal(document.querySelector('#modal-title').textContent, 'Amsterdam');
    await close();
    await click(button('Full map'));
    assert.equal(window.location.search, '');
    await act(async () => { window.history.back(); await pause(); });
    assert.match(window.location.search, /city=amsterdam/);
    await act(async () => { window.history.forward(); await pause(); });
    assert.equal(window.location.search, '');
    await click(button('Attractions'));
    await click(document.querySelector('tbody .star'));
    assert.equal(document.querySelector('#modal-title').textContent, 'Your account');
    await close();
    await click(button('Sign in'));
    await click(button('Register'));
    await fill(document.querySelector('[name="username"]'), 'reader');
    await fill(document.querySelector('[name="password"]'), 'readable-password');
    await submit();
    assert.deepEqual(favorites, [], 'Cancelled favorite must not be saved on a later sign-in');
    await click(button('reader'));
    await click(button('Sign out'));
    await click(button('Attractions'));
    await click(document.querySelector('tbody .star'));
    await click(button('Register'));
    await fill(document.querySelector('[name="username"]'), 'reader');
    await fill(document.querySelector('[name="password"]'), 'readable-password');
    await submit();
    assert.deepEqual(favorites, ['assen-sight']);
    await click(document.querySelector('[aria-label="Open favorites"]'));
    assert.equal(document.querySelectorAll('tbody tr').length, 1);
    await click(document.querySelector('.place-title'));
    assert.match(window.location.search, /attraction=assen-sight/);
    assert.equal(document.querySelectorAll('.comment').length, 1);
    await click(button('More comments'));
    assert.ok(calls.some(url => url.endsWith('comments?before=2')));
    assert.equal(document.querySelectorAll('.comment').length, 2);
    await fill(document.querySelector('textarea'), 'A new review');
    await submit();
    assert.match(document.querySelector('.comment').textContent, /A new review/);
    await click(button('Delete my comment'));
    assert.doesNotMatch(document.querySelector('.comment').textContent, /A new review/);
    await close();
    await click(button('reader'));
    await click(button('Sign out'));
    assert.equal(document.querySelector('[aria-label="Open favorites"]'), null);
    assert.ok(button('Sign in'));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    fs.rmSync(directory, { recursive: true, force: true });
    esbuild.stop();
    for (const channel of channels) { channel.port1.close(); channel.port2.close(); }
    global.MessageChannel = originalMessageChannel;
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveAtlasRoute } from '../src/utils/atlasRoute.js';
const catalog = JSON.parse(readFileSync(new URL('../../backend/app/data/catalog.json', import.meta.url)));
test('shared province, city and attraction URLs resolve from the catalog', () => {
  const province = resolveAtlasRoute(new URLSearchParams('province=noord-holland&panel=story'), catalog);
  assert.equal(province.province.id, 'noord-holland');
  assert.equal(province.panel.type, 'story');
  const city = resolveAtlasRoute(new URLSearchParams('city=amsterdam&panel=story'), catalog);
  assert.equal(city.city.id, 'amsterdam');
  assert.equal(city.province.id, 'noord-holland');
  const attraction = resolveAtlasRoute(new URLSearchParams('attraction=amsterdam-sight'), catalog);
  assert.equal(attraction.city.id, 'amsterdam');
  assert.equal(attraction.panel.type, 'attraction');
});
test('unknown and mismatched URL values do not select unrelated places', () => {
  for (const query of ['province=missing', 'city=missing', 'panel=attraction', 'panel=unknown', 'province=drenthe&city=amsterdam', 'city=assen&attraction=amsterdam-sight']) {
    assert.ok(resolveAtlasRoute(new URLSearchParams(query), catalog).error, query);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeHistory, summarize} from '../public/statistics.mjs';
test('normalization preserves zeroes and excludes bonus numbers', () => {
  const rows = [{psltEpsd:1,wnBndNo:'4',wnRnkVl:'000123',bnsRnkVl:'999999',psltRflYmd:'20200507'}];
  const draws = normalizeHistory(rows);
  const s = summarize(draws);
  assert.equal(draws[0].number, '000123');
  assert.equal(s.counts[0][0], 1);
  assert.equal(s.counts[0][9], 0);
  assert.throws(() => normalizeHistory([...rows,...rows]));
});
test('recent filter sorts by round and computes each position separately', () => {
  const s = summarize([{round:1,group:1,number:'000000'}, {round:3,group:2,number:'123456'}, {round:2,group:2,number:'111111'}],2);
  assert.equal(s.total,2); assert.equal(s.counts[0][1],2); assert.equal(s.counts[5][6],1);
  assert.deepEqual(s.groups,[0,2,0,0,0]);
});
test('official dataset is contiguous and every position accounts for all draws', async () => {
  const {draws} = JSON.parse(await readFile(new URL('../public/history.json',import.meta.url)));
  assert.equal(draws.length,draws[0].round);
  for(let i=0;i<draws.length;i++) assert.equal(draws[i].round,draws.length-i);
  for(const limit of [0,10,50,100]) {
    const s = summarize(draws,limit);
    for(const counts of s.counts) assert.equal(counts.reduce((a,b)=>a+b,0),s.total);
    assert.equal(s.groups.reduce((a,b)=>a+b,0),s.total);
  }
  assert.deepEqual(draws.at(-1),{round:1,group:4,number:'162132',date:'2020-05-07'});
});

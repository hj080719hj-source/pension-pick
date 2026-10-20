import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBatch, generate, keyOf, ExclusionError} from '../public/numbers.mjs';
import {trainModel, recommend} from '../public/model.mjs';
const draws = [{round:1,group:1,number:'000000'}];
const options = {group:'random', fixed:Array(6).fill(''), bundle:false};
test('both generators produce ten distinct results excluding winners', () => {
  const model = trainModel(draws);
  for (const bundle of [false,true]) for (const useModel of [false,true]) {
    const opts = {...options,bundle};
    const batch = generateBatch(draws,opts,()=>useModel ? recommend(model,opts) : {tickets:generate(opts)});
    const tickets = batch.flatMap(r=>r.tickets);
    assert.equal(batch.length,10);
    assert.equal(tickets.length,bundle?50:10);
    assert.equal(new Set(tickets.map(keyOf)).size,tickets.length);
    assert.ok(tickets.every(t=>keyOf(t)!=='1-000000'));
  }
});
test('fails before sampling when fewer than ten choices remain', () => {
  assert.throws(()=>generateBatch(draws,{...options,fixed:[...'123456']},()=>{throw Error('Should not sample');}),ExclusionError);
  assert.throws(()=>generateBatch(draws,{...options,group:'1',fixed:['0','0','0','0','0','']},()=>{throw Error('Should not sample');}),ExclusionError);
});

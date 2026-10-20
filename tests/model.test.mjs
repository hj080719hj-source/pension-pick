import test from 'node:test';
import assert from 'node:assert/strict';
import {trainModel, sampleWeighted, recommend} from '../public/model.mjs';
const draws = [{round:1,group:1,number:'000001'}, {round:2,group:2,number:'000002'}];
test('learns position frequencies with nonzero prior for unseen digits', () => {
  const model = trainModel(draws);
  assert.deepEqual(model.digitWeights[0], [3,1,1,1,1,1,1,1,1,1]);
  assert.equal(model.digitWeights[5][1],2);
  assert.equal(model.digitWeights[5][2],2);
  assert.equal(model.digitWeights[5].reduce((a,b)=>a+b),12);
  assert.throws(()=>trainModel([])); assert.throws(()=>trainModel([...draws,draws[0]]));
});
test('weighted sampler maps exactly the requested integer ranges', () => {
  const counts=[0,0,0];
  for(let i=0;i<6;i++) counts[sampleWeighted([1,3,2],()=>i)]++;
  assert.deepEqual(counts,[1,3,2]);
});
test('model preserves group, fixed zeros, and identical bundle numbers', () => {
  const model=trainModel(draws);
  const options={group:'1',fixed:['0','9','','','','']};
  const result=recommend(model,options,()=>0);
  assert.deepEqual(result.tickets,[{group:1,number:'090000'}]);
  assert.equal(result.explanation[1].fixed,true);
  const bundle=recommend(model,{...options,bundle:true},()=>0);
  assert.deepEqual(bundle.tickets.map(t=>t.group),[1,2,3,4,5]);
  assert.equal(new Set(bundle.tickets.map(t=>t.number)).size,1);
});

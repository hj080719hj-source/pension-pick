import test from 'node:test';
import assert from 'node:assert/strict';
import {excludePrevious, ExclusionError} from '../public/numbers.mjs';
const draws = [{group:1,number:'000123'}];
const options = {group:'1',fixed:Array(6).fill(''),bundle:false};
test('retries exact historical winners but permits another group', () => {
  let calls=0;
  const result=excludePrevious(draws, options, ()=>({tickets:[{group:1,number:++calls===1?'000123':'000124'}]}));
  assert.equal(calls,2); assert.equal(result.tickets[0].number,'000124');
  assert.equal(excludePrevious(draws,{...options,group:'2',fixed:[...'000123']},()=>({tickets:[{group:2,number:'000123'}]})).tickets[0].group,2);
});
test('impossible fixed conditions fail before sampling, including bundles', () => {
  for(const bundle of [false,true]) assert.throws(()=>excludePrevious(draws,{...options,bundle,fixed:[...'000123']},()=>{throw Error('Must not sample');}),ExclusionError);
});
test('one conflicting group rejects the whole bundle', () => {
  let calls=0;
  const result=excludePrevious(draws,{...options,bundle:true},()=>({tickets:[1,2,3,4,5].map(group=>({group,number:calls?'000124':'000123'})), attempt:++calls}));
  assert.equal(result.attempt,2); assert.ok(result.tickets.every(t=>t.number==='000124'));
});
test('missing history blocks recommendation',()=>assert.throws(()=>excludePrevious([],options,()=>({tickets:[]}))));
test('all partial fixed candidates blocked is detected',()=>{
  const blocked=Array.from({length:10},(_,d)=>({group:1,number:`00012${d}`}));
  assert.throws(()=>excludePrevious(blocked,{...options,fixed:['0','0','0','1','2','']},()=>{throw Error('Must not sample');}),ExclusionError);
});

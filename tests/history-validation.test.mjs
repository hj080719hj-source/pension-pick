import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUpdate} from '../scripts/history-validation.mjs';
const one={psltEpsd:1,psltRflYmd:'20200507',wnBndNo:'4',wnRnkVl:'162132'};
const two={psltEpsd:2,psltRflYmd:'20200514',wnBndNo:'1',wnRnkVl:'000001'};
test('new draw accepted; truncation, historical edits, invalid dates rejected',()=>{
  const previous={draws:validateUpdate([one])};
  assert.equal(validateUpdate([one,two],previous).length,2);
  assert.throws(()=>validateUpdate([two]));
  assert.throws(()=>validateUpdate([one],{draws:validateUpdate([one,two])}));
  assert.throws(()=>validateUpdate([{...one,wnRnkVl:'000000'}],previous));
  assert.throws(()=>validateUpdate([{...one,psltRflYmd:'20200508'}]));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readQuota,consumeQuota,grantCredit} from '../public/quota.mjs';
import {runRewardedAd} from '../public/rewarded-ad.mjs';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('one free use, persistent quota, Korea midnight and rewarded credits',()=>{
  const s=storage();const before=new Date('2026-10-20T14:59:59Z');const after=new Date('2026-10-20T15:00:00Z');
  consumeQuota(s,before);assert.equal(readQuota(s,before).free,false);
  assert.throws(()=>consumeQuota(s,before));
  grantCredit(s);consumeQuota(s,before);assert.equal(readQuota(s,before).credits,0);
  assert.equal(readQuota(s,after).free,true);consumeQuota(s,after);assert.equal(readQuota(s,after).free,false);
});
function sdk(events){
  const load=({onEvent})=>{queueMicrotask(()=>onEvent({type:'loaded'}));return ()=>{};};
  const show=({onEvent})=>{queueMicrotask(()=>events.forEach(type=>onEvent({type})));return ()=>{};};
  load.isSupported=show.isSupported=()=>true;
  return {loadFullScreenAd:load,showFullScreenAd:show};
}
test('only reward event grants access; closing/impression/failure do not',async()=>{
  await runRewardedAd(sdk(['userEarnedReward','userEarnedReward','dismissed']),'test');
  await assert.rejects(runRewardedAd(sdk(['impression','dismissed']),'test'));
  await assert.rejects(runRewardedAd(sdk(['failedToShow']),'test'));
  await assert.rejects(runRewardedAd(sdk([]),''));
});

export const quotaKey = 'pension-pick:quota:v1';
export const koreaDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul', year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function readQuota(storage, now = new Date()) {
  const raw = storage.getItem(quotaKey);
  const state = raw ? JSON.parse(raw) : {freeDay:null, credits:0};
  if (!state || !Number.isInteger(state.credits) || state.credits < 0 || (state.freeDay !== null && typeof state.freeDay !== 'string')) throw Error('Invalid quota');
  return {...state, free:state.freeDay !== koreaDay(now)};
}
export function grantCredit(storage) {
  const state = readQuota(storage);
  storage.setItem(quotaKey, JSON.stringify({freeDay:state.freeDay, credits:state.credits+1}));
}
export function consumeQuota(storage, now = new Date()) {
  const state = readQuota(storage, now);
  if (!state.free && state.credits < 1) throw Error('No generation credit');
  storage.setItem(quotaKey, JSON.stringify({
    freeDay: state.free ? koreaDay(now) : state.freeDay,
    credits: state.free ? state.credits : state.credits - 1
  }));
}

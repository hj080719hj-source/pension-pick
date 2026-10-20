export function randomInt(max, source = crypto) {
  const limit = Math.floor(4294967296 / max) * max;
  const value = new Uint32Array(1);
  do { source.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
export function generate({group = 'random', fixed = Array(6).fill(''), bundle = false} = {}) {
  if (group !== 'random' && !/^[1-5]$/.test(String(group))) throw Error('Invalid group');
  if (fixed.length !== 6 || fixed.some(d => !/^\d?$/.test(String(d)))) throw Error('Invalid digits');
  const number = fixed.map(d => d === '' ? randomInt(10) : d).join('');
  return (bundle ? [1, 2, 3, 4, 5] : [group === 'random' ? randomInt(5) + 1 : Number(group)])
    .map(group => ({group, number}));
}
export const keyOf = ticket => `${ticket.group}-${ticket.number}`;
export const validTicket = ticket => ticket && Number.isInteger(ticket.group) && ticket.group >= 1 && ticket.group <= 5 && /^\d{6}$/.test(ticket.number);

export class ExclusionError extends Error {}
export function excludePrevious(draws, options, create, minimum = 1) {
  if (!Array.isArray(draws) || !draws.length || draws.some(d => !validTicket(d))) throw Error('Winning history unavailable');
  const {fixed, group, bundle} = options;
  const blocked = new Set(draws.map(keyOf));
  const matching = draws.filter(d => fixed.every((digit,p) => digit === '' || d.number[p] === digit));
  const candidates = 10 ** fixed.filter(d => d === '').length * (group === 'random' && !bundle ? 5 : 1);
  const blockedCandidates = bundle
    ? new Set(matching.map(d => d.number)).size
    : new Set(matching.filter(d => group === 'random' || d.group === Number(group)).map(keyOf)).size;
  if (blockedCandidates >= candidates) throw new ExclusionError('이 조건은 이전 당첨번호와 겹쳐요. 고정 숫자나 조를 바꿔 주세요.');
  if (candidates - blockedCandidates < minimum) throw new ExclusionError(`이 조건으로는 중복 없이 ${minimum}개를 만들 수 없어요. 고정 숫자나 조를 바꿔 주세요.`);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const result = create();
    if (result.tickets.every(ticket => !blocked.has(keyOf(ticket)))) return result;
  }
  throw new ExclusionError('겹치지 않는 번호를 찾지 못했어요. 고정 조건을 줄이거나 다시 시도해 주세요.');
}

export function generateBatch(draws, options, create, count = 10) {
  const results = [];
  const excluded = [...draws];
  for (let i = 0; i < count; i++) {
    const result = excludePrevious(excluded, options, create, count - i);
    results.push(result);
    excluded.push(...result.tickets);
  }
  return results;
}

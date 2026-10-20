import {randomInt, validTicket} from './numbers.mjs';
import {summarize} from './statistics.mjs';

// Symmetric Dirichlet prior: one pseudo-observation per digit/group.
// These weights describe a sampling preference, not future winning odds.
export function trainModel(draws) {
  if (!Array.isArray(draws) || !draws.length ||
      draws.some(d => !validTicket(d) || !Number.isInteger(d.round) || d.round < 1) ||
      new Set(draws.map(d => d.round)).size !== draws.length) throw Error('Invalid training history');
  const {counts, groups, total, selected} = summarize(draws);
  return {counts, groups, total, first: selected.at(-1).round, last: selected[0].round,
    digitWeights: counts.map(row => row.map(count => count + 1)),
    groupWeights: groups.map(count => count + 1)};
}
export function sampleWeighted(weights, random = randomInt) {
  let ticket = random(weights.reduce((a,b) => a+b, 0));
  for (let i = 0; i < weights.length; i++) {
    if (ticket < weights[i]) return i;
    ticket -= weights[i];
  }
  throw Error('Invalid random draw');
}
export function recommend(model, {group = 'random', fixed = Array(6).fill(''), bundle = false} = {}, random = randomInt) {
  if (group !== 'random' && !/^[1-5]$/.test(String(group))) throw Error('Invalid group');
  if (fixed.length !== 6 || fixed.some(d => typeof d !== 'string' || !/^\d?$/.test(d))) throw Error('Invalid fixed digits');
  const number = fixed.map((digit, p) => digit || String(sampleWeighted(model.digitWeights[p], random))).join('');
  const groups = bundle ? [1,2,3,4,5] : [group === 'random' ? sampleWeighted(model.groupWeights, random) + 1 : Number(group)];
  return {tickets: groups.map(group => ({group, number})),
    explanation: [...number].map((digit,p) => ({
      digit, fixed: fixed[p] !== '', count: model.counts[p][Number(digit)],
      weight: model.digitWeights[p][Number(digit)] / (model.total + 10)
    }))};
}

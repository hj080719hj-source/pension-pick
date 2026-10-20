import {normalizeHistory} from '../public/statistics.mjs';
export function validateUpdate(rows, previous, now = new Date()) {
  const draws = normalizeHistory(rows);
  if(draws.at(-1).round !== 1 || draws.length !== draws[0].round) throw Error('Missing rounds');
  for(const draw of draws) {
    const expected = new Date(Date.UTC(2020,4,7) + (draw.round-1)*7*86400000).toISOString().slice(0,10);
    if(draw.date !== expected || draw.date > now.toISOString().slice(0,10)) throw Error('Invalid draw date');
  }
  if(previous?.draws?.length) {
    if(draws[0].round < previous.draws[0].round) throw Error('Upstream regression');
    const byRound = new Map(draws.map(d=>[d.round,d]));
    for(const old of previous.draws) {
      const next = byRound.get(old.round);
      if(!next || old.number!==next.number || old.group!==next.group || old.date!==next.date) throw Error(`Historical result changed: ${old.round}`);
    }
  }
  return draws;
}

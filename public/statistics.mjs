export const positions = ['십만', '만', '천', '백', '십', '일'];
export function normalizeHistory(rows) {
  if (!Array.isArray(rows) || !rows.length) throw Error('당첨 이력이 비어 있습니다.');
  const seen = new Set();
  return rows.map(row => {
    const round = Number(row.psltEpsd);
    const group = Number(row.wnBndNo);
    const number = row.wnRnkVl;
    const date = row.psltRflYmd;
    if (!Number.isInteger(round) || round < 1 || seen.has(round) ||
        !Number.isInteger(group) || group < 1 || group > 5 ||
        typeof number !== 'string' || !/^\d{6}$/.test(number) ||
        typeof date !== 'string' || !/^\d{8}$/.test(date)) throw Error('잘못되거나 중복된 당첨 이력입니다.');
    seen.add(round);
    return {round, group, number, date: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`};
  }).sort((a,b) => b.round - a.round);
}
export function summarize(draws, limit = 0) {
  const selected = [...draws].sort((a,b) => b.round - a.round).slice(0, limit || draws.length);
  const counts = Array.from({length: 6}, () => Array(10).fill(0));
  const groups = Array(5).fill(0);
  for (const draw of selected) {
    groups[draw.group - 1]++;
    [...draw.number].forEach((digit, index) => counts[index][Number(digit)]++);
  }
  return {selected, counts, groups, total: selected.length};
}

import {positions, summarize} from './statistics.mjs';
import {loadHistory} from './history-client.mjs';
const $ = selector => document.querySelector(selector);
let draws = [], position = 0;
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
positions.forEach((name, index) => {
  const button = element('button', `${name} 자리`);
  button.onclick = () => { position = index; render(); };
  $('#position-tabs').append(button);
});
function bars(target, counts, total, labels) {
  target.replaceChildren();
  const max = Math.max(1, ...counts);
  counts.forEach((count, i) => {
    const row = element('div', undefined, 'chart-row');
    const label = element('strong', labels[i]);
    const track = element('div', undefined, 'chart-track');
    const bar = element('div', undefined, 'chart-bar');
    bar.style.width = `${count / max * 100}%`;
    track.append(bar);
    const value = element('span', `${count}회`);
    const percent = element('span', `${(count / total * 100).toFixed(1)}%`, 'chart-percent');
    row.append(label, track, value, percent); target.append(row);
  });
}
function render() {
  const {selected, counts, groups, total} = summarize(draws, Number($('#stats-period').value));
  $('#stats-range').textContent = `${selected.at(-1).round}~${selected[0].round}회 · ${total}개 회차 · ${selected.at(-1).date} ~ ${selected[0].date}`;
  [...$('#position-tabs').children].forEach((button, i) => { button.classList.toggle('selected', i === position); button.setAttribute('aria-pressed', String(i === position)); });
  $('#position-title').textContent = `${positions[position]} 자리 숫자 분포`;
  const max = Math.max(...counts[position]);
  const leaders = counts[position].flatMap((count,i) => count === max ? [i] : []);
  $('#stats-summary').textContent = `가장 많이 나온 숫자 ${leaders.join(', ')} · 각 ${max}회${leaders.length > 1 ? ' (공동)' : ''}`;
  bars($('#digit-chart'), counts[position], total, Array.from({length:10}, (_,i) => i));
  bars($('#group-chart'), groups, total, ['1조','2조','3조','4조','5조']);
  const table = element('table', undefined, 'frequency-table');
  const caption = element('caption', '숫자별 · 자리별 출현 횟수');
  const head = element('thead'); const header = element('tr');
  header.append(element('th', '숫자'));
  positions.forEach(name => { const th = element('th', name); th.scope = 'col'; header.append(th); });
  head.append(header);
  const body = element('tbody');
  const highest = Math.max(1, ...counts.flat());
  for (let digit = 0; digit < 10; digit++) {
    const row = element('tr'); const label = element('th', digit); label.scope = 'row'; row.append(label);
    for (let p = 0; p < 6; p++) {
      const cell = element('td', counts[p][digit]);
      cell.style.backgroundColor = `rgba(54,120,246,${.04 + .24 * counts[p][digit] / highest})`;
      row.append(cell);
    }
    body.append(row);
  }
  table.append(caption, head, body); $('#stats-matrix').replaceChildren(table);
  $('#history-list').replaceChildren(...selected.map(draw => {
    const row = element('div', undefined, 'history-row');
    row.append(element('span', `${draw.round}회`), element('small', draw.date), element('strong', `${draw.group}조 ${draw.number}`));
    return row;
  }));
}
async function load() {
  $('#stats-retry').hidden = true;
  try {
    const data = await loadHistory();
    if (!data.draws?.length) throw Error();
    draws = data.draws;
    $('#stats-source').textContent = `${draws.at(-1).round}~${draws[0].round}회 수록 · 최근 추첨 ${draws[0].date}\n자료 수집 ${new Date(data.fetchedAt).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'})} (한국시간)`;
    $('#stats-controls').hidden = false;
    render();
  } catch {
    $('#stats-source').textContent = '당첨 이력을 불러오지 못했어요. 다시 시도해 주세요.';
    $('#stats-controls').hidden = true; $('#stats-retry').hidden = false;
  }
}
$('#stats-period').onchange = render;
$('#stats-retry').onclick = load;
document.querySelector('[data-tab="stats"]').addEventListener('click', load);
load();

export const HISTORY_URL = 'https://hj080719hj-source.github.io/pension-pick/api/history.json';
export async function loadHistory() {
  const response = await fetch(HISTORY_URL, {cache:'no-store', signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Error('당첨 이력 서버에 연결하지 못했습니다.');
  const data = await response.json();
  if (!Array.isArray(data.draws) || !data.draws.length) throw Error('당첨 이력이 비어 있습니다.');
  return data;
}

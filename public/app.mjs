import {generate, keyOf, validTicket, generateBatch, ExclusionError} from './numbers.mjs';
import './stats-ui.mjs';
import {trainModel, recommend} from './model.mjs';
import {positions} from './statistics.mjs';
import {readQuota, consumeQuota, grantCredit} from './quota.mjs';
import {earnReward} from './toss-ads.mjs';
import {REWARDED_ADS_ENABLED} from './release-config.mjs';
import {loadHistory} from './history-client.mjs';
const $ = selector => document.querySelector(selector);
const storageKey = 'pension-pick:saved:v1';
let saved = [], current = [], bundle = false, toastTimer;
function updateQuotaUI() {
  const unit = bundle ? '10세트' : '10개';
  try {
    const quota=readQuota(localStorage);
    $('#generate').textContent=quota.free ? `오늘 무료 ${unit} 뽑기` : quota.credits ? `${unit} 뽑기 · 보유 이용권 사용` : REWARDED_ADS_ENABLED ? `광고 보고 ${unit} 더 뽑기` : '오늘 무료 추천을 모두 받았어요';
    $('#quota-status').textContent=quota.free ? '오늘 무료 1회 남음 · 한국시간 자정 초기화' : quota.credits ? `오늘 무료 이용 완료 · 이용권 ${quota.credits}개` : REWARDED_ADS_ENABLED ? '광고 1회당 추천 1회' : '한국시간 자정 이후 다시 무료로 추천받을 수 있어요.';
  } catch {
    $('#quota-status').textContent='이용 횟수를 확인할 수 없어요. 브라우저 저장 공간을 확인해 주세요.';
  }
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(stored)) throw Error();
  saved = stored.filter(validTicket).slice(0, 200);
} catch { toast('보관함을 불러오지 못했어요. 저장 공간을 확인해 주세요.'); }
function persist(next) {
  try { localStorage.setItem(storageKey, JSON.stringify(next)); saved = next; return true; }
  catch { toast('저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); return false; }
}
function numberRow(ticket) {
  const row = document.createElement('div');
  row.className = 'number-row';
  row.setAttribute('aria-label', `${ticket.group}조 ${ticket.number}`);
  const group = document.createElement('span');
  group.textContent = ticket.group;
  const unit = document.createElement('small'); unit.textContent = '조'; group.append(unit); row.append(group);
  for (const digit of ticket.number) { const el = document.createElement('b'); el.textContent = digit; row.append(el); }
  return row;
}
function updateSave() {
  const allSaved = current.length && current.every(ticket => saved.some(item => keyOf(item) === keyOf(ticket)));
  $('#save').disabled = !current.length || allSaved;
  $('#save').textContent = allSaved ? '♥ 보관됨' : '♡ 전체 보관';
}
for (let index = 0; index < 6; index++) {
  const input = document.createElement('input');
  input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 1; input.placeholder = '·';
  input.setAttribute('aria-label', `${index + 1}번째 자리 고정 숫자`);
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 1); });
  $('#fixed').append(input);
}
$('#reset').onclick = () => { document.querySelectorAll('#fixed input').forEach(input => { input.value = ''; }); };
document.querySelectorAll('[data-mode]').forEach(button => {
  button.onclick = () => {
    bundle = button.dataset.mode === 'bundle';
    document.querySelectorAll('[data-mode]').forEach(item => {
      item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button));
    });
    $('#group').disabled = bundle;
    updateQuotaUI();
  };
});
$('#recommendation').onchange = () => {
  $('#model-help').hidden = $('#recommendation').value !== 'model';
};
async function generateWithQuota() {
  const options = {bundle, group: $('#group').value, fixed: [...document.querySelectorAll('#fixed input')].map(input => input.value)};
  const useModel = $('#recommendation').value === 'model';
  $('#generate').disabled = true;
  const controls = [...document.querySelectorAll('.options input, .options select, .options button')];
  const disabledStates = controls.map(control => control.disabled);
  controls.forEach(control => { control.disabled = true; });
  try {
  const initialQuota = readQuota(localStorage);
  if (!initialQuota.free && !initialQuota.credits && !REWARDED_ADS_ENABLED) {
    toast('오늘 무료 추천을 모두 받았어요. 한국시간 자정 이후 다시 이용해 주세요.'); return;
  }
  $('#generate').textContent = '이전 당첨번호를 확인하고 있어요…';
  const data = await loadHistory();
  const model = trainModel(data.draws);
  if (model.first !== 1 || model.last !== model.total) throw Error('Incomplete history');
  const batch = generateBatch(data.draws, options, () => useModel ? recommend(model, options) : {tickets: generate(options)});
  const quota = readQuota(localStorage);
  if (!quota.free && !quota.credits) {
    $('#generate').textContent = '광고를 준비하고 있어요…';
    try { await earnReward(); } catch(error) { toast(error.message); return; }
    grantCredit(localStorage);
  }
  consumeQuota(localStorage);
  current = batch.flatMap(result => result.tickets);
  if (useModel) {
    $('#generate').textContent = '당첨 이력을 학습하고 있어요…';
    $('#model-training').textContent = `${model.first}~${model.last}회 · 실제 1등 번호 ${model.total}개 학습 · 보너스 제외 · 빈도 보정 모델`;
    $('#model-reasons').replaceChildren(...batch.map((recommendation, index) => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${index + 1}번 · ${recommendation.tickets[0].number} 선택 기준`;
      details.append(summary);
      details.append(...recommendation.explanation.map((reason, p) => {
      const row = document.createElement('p'); row.className = 'model-reason';
      row.textContent = `${positions[p]} 자리 ${reason.digit} · ${reason.fixed ? '사용자 고정' : `제외 전 비중 ${(reason.weight * 100).toFixed(1)}%`} · 과거 ${reason.count}회`;
      return row;
      }));
      return details;
    }));
    $('#model-result').hidden = false;
  } else {
    $('#model-result').hidden = true;
  }
  $('#result').classList.add('batch-results');
  $('#result').scrollTop = 0;
  $('#result').replaceChildren(...batch.map((result, index) => {
    const card = document.createElement('div'); card.className = 'batch-item';
    const label = document.createElement('span'); label.className = 'batch-label';
    label.textContent = `${String(index + 1).padStart(2, '0')}${bundle ? ' 세트' : ''}`;
    card.append(label, numberRow(bundle ? {...result.tickets[0], group: '1~5'} : result.tickets[0]));
    return card;
  }));
  $('#ticket-label').textContent = `${useModel ? 'AI 통계 학습' : '랜덤'} · ${bundle ? '10세트' : '10개'}`;
  $('#result-hint').textContent = bundle ? '10세트 · 총 50개 번호를 보관해요' : '중복 없는 10개 번호를 보관해요';
  $('#exclusion-status').textContent = `1~${model.last}회 1등과 동일한 조 + 여섯 자리 제외 완료 · 보너스 제외 대상 아님`;
  $('#generate').textContent = '✦  다시 뽑기';
  updateSave();
  } catch (error) {
    toast(error instanceof ExclusionError ? error.message : '당첨 이력을 확인하지 못해 새 번호를 생성하지 않았어요. 다시 시도해 주세요.');
  } finally {
    $('#generate').disabled = false;
    updateQuotaUI();
    controls.forEach((control, i) => { control.disabled = disabledStates[i]; });
  }
}
$('#generate').onclick = async () => {
  if (!navigator.locks) { toast('이 브라우저에서는 이용 횟수를 안전하게 처리할 수 없어요.'); return; }
  await navigator.locks.request('pension-pick-generation', {ifAvailable:true}, async lock => {
    if (!lock) { toast('다른 화면에서 번호를 생성하고 있어요.'); return; }
    await generateWithQuota();
  });
};
window.addEventListener('storage',()=>{if(!$('#generate').disabled)updateQuotaUI();});
window.addEventListener('focus',()=>{if(!$('#generate').disabled)updateQuotaUI();});
setInterval(()=>{if(!$('#generate').disabled)updateQuotaUI();},30000);
updateQuotaUI();
$('#save').onclick = () => {
  const additions = current.filter(ticket => !saved.some(item => keyOf(item) === keyOf(ticket))).map(ticket => ({...ticket, createdAt: Date.now()}));
  if (saved.length + additions.length > 200) { toast('최대 200개까지 보관해요. 기존 번호를 지워 주세요.'); return; }
  if (persist([...additions, ...saved])) { toast(`${additions.length}개 번호를 보관했어요`); updateSave(); renderSaved(); }
};
function renderSaved() {
  $('#count').textContent = saved.length;
  $('#copy').disabled = !saved.length;
  $('#saved-list').replaceChildren();
  if (!saved.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    empty.innerHTML = '<span>♡</span><strong>아직 보관한 번호가 없어요</strong>번호를 뽑고 마음에 드는 번호를 보관해 보세요.';
    $('#saved-list').append(empty);
  }
  for (const ticket of saved) {
    const card = document.createElement('article'); card.className = 'saved-card'; card.append(numberRow(ticket));
    const meta = document.createElement('div'); meta.className = 'saved-meta';
    const date = document.createElement('span');
    date.textContent = Number.isFinite(ticket.createdAt) ? new Date(ticket.createdAt).toLocaleDateString('ko-KR', {timeZone: 'Asia/Seoul'}) + ' 보관' : '보관한 번호';
    const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = '삭제';
    remove.setAttribute('aria-label', `${ticket.group}조 ${ticket.number} 삭제`);
    remove.onclick = () => { if (persist(saved.filter(item => keyOf(item) !== keyOf(ticket)))) { renderSaved(); updateSave(); toast('번호를 삭제했어요'); } };
    meta.append(date, remove); card.append(meta); $('#saved-list').append(card);
  }
}
$('#copy').onclick = async () => {
  try { await navigator.clipboard.writeText(saved.map(ticket => `${ticket.group}조 ${ticket.number}`).join('\n')); toast('보관한 번호를 복사했어요'); }
  catch { toast('복사 권한이 없어요. 브라우저 설정을 확인해 주세요.'); }
};
document.querySelectorAll('[data-tab]').forEach(button => {
  button.onclick = () => {
    for (const tab of ['pick', 'saved', 'stats', 'info']) $(`#${tab}-panel`).hidden = tab !== button.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(item => {
      item.classList.toggle('active', item === button);
      if (item === button) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
    if (button.dataset.tab === 'saved') renderSaved();
    window.scrollTo({top: 0, behavior: 'instant'});
  };
});
renderSaved();

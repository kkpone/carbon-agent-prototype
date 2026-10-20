/* Seat expansion checkout for the local enterprise administration prototype. */
const MG_SEAT_MONTHLY_PRICE = 88;
let mgExpansionQuantity = 1;
let mgExpansionBaseCapacity = mg.capacity;
if (!Array.isArray(mg.seatExpansionOrders)) mg.seatExpansionOrders = [];

function mgExpansionPeriod() {
  const subscription = typeof pl !== 'undefined' ? pl.workbuddy?.subscription : null;
  return subscription || {plan:'Carbon Agent 企业版',period:'年付',starts:'2026-10-13',ends:'2027-10-12'};
}
function mgExpansionToday() {
  return new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Shanghai'});
}
function mgExpansionQuote(quantity, today = mgExpansionToday()) {
  const period = mgExpansionPeriod();
  const start = Date.parse(period.starts + 'T00:00:00Z') / 86400000;
  const end = Date.parse(period.ends + 'T00:00:00Z') / 86400000;
  const current = Date.parse(today + 'T00:00:00Z') / 86400000;
  const periodDays = end - start + 1;
  const remainingDays = Math.max(0, Math.min(periodDays, end - Math.max(start, current) + 1));
  const maxQuantity = Math.min(10000, 100000 - mg.capacity);
  const monthsPerPeriod = period.period === '月付' ? 1 : 12;
  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= maxQuantity;
  const validPeriod = Number.isFinite(periodDays) && periodDays > 0 && Number.isFinite(current) && remainingDays > 0;
  const perSeat = validPeriod ? Math.round(MG_SEAT_MONTHLY_PRICE * monthsPerPeriod * remainingDays / periodDays * 100) / 100 : 0;
  return {
    valid: validQuantity && validPeriod,
    error: !validPeriod ? '当前订阅周期已结束，请先续订。' : maxQuantity < 1 ? '已达到席位上限，无法继续扩容。' : !validQuantity ? `新增席位须为 1 至 ${maxQuantity} 的整数。` : '',
    quantity, period, periodDays, remainingDays, maxQuantity, monthsPerPeriod,
    effectiveMonths: validPeriod ? monthsPerPeriod * remainingDays / periodDays : 0,
    perSeat, total: Math.round(perSeat * quantity * 100) / 100,
    newCapacity: mg.capacity + quantity
  };
}
function mgExpansionMoney(value) {
  return '¥' + new Intl.NumberFormat('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
}
function mgSeatExpansionView() {
  const quote = mgExpansionQuote(mgExpansionQuantity);
  const period = quote.period;
  return `${head('LICENSE / 席位管理','扩容席位','按当前订阅周期补充席位，确认前核对新增数量与模拟费用。',
    '<button class="btn" onclick="go(\'seat_management\')">← 返回席位管理</button>')}
    <div class="mg-expansion-layout">
      <section class="mg-expansion-main">
        <div class="card mg-expansion-panel">
          <div class="mg-expansion-section"><span>01</span><div><h2>扩容配置</h2><p>新增席位在本期订阅到期时与原有席位一同到期。</p></div></div>
          ${mgCallout('i','购买须知','每位成员最多占用一个席位。扩容席位生效后进入可分配池，可继续为成员或部门配置授权。')}
          <div class="mg-expansion-config-row"><div><b>现有席位</b><small>已占用 ${mgUsedSeats()} 席 · 可分配 ${mg.capacity-mgUsedSeats()} 席</small></div><strong>${mgFmt(mg.capacity)} 席</strong></div>
          <div class="mg-expansion-config-row"><div><b>新增席位数量</b><small>1 席起增，单次最多 10,000 席</small></div><div class="mg-expansion-stepper"><button type="button" aria-label="减少一个新增席位" ${quote.maxQuantity<1?'disabled':''} onclick="mgExpansionStep(-1)">−</button><input id="mg-expansion-count" type="number" min="1" max="${quote.maxQuantity}" step="1" value="${mgExpansionQuantity}" aria-label="新增席位数量" ${quote.maxQuantity<1?'disabled':''} oninput="mgExpansionUpdate()"><button type="button" aria-label="增加一个新增席位" ${quote.maxQuantity<1?'disabled':''} onclick="mgExpansionStep(1)">＋</button></div></div>
          <div class="mg-expansion-after">扩容后总席位 <strong id="mg-expansion-capacity">${mgFmt(quote.newCapacity)} 席</strong></div>
        </div>
        <div class="card mg-expansion-panel">
          <div class="mg-expansion-section"><span>02</span><div><h2>计费说明</h2><p>报价与当前企业版订阅周期保持一致。</p></div></div>
          <div class="mg-expansion-rule"><b>计费基准</b><span>${mgExpansionMoney(MG_SEAT_MONTHLY_PRICE)} / 席 / 月，${mgEsc(period.period)}订阅</span></div>
          <div class="mg-expansion-rule"><b>本期剩余</b><span>${quote.remainingDays} 天（${mgEsc(period.starts)} 至 ${mgEsc(period.ends)}）</span></div>
          <div class="mg-expansion-rule"><b>计费方法</b><span>月单价 × ${quote.monthsPerPeriod} 个月 × 剩余天数 / 周期天数 × 新增席位</span></div>
          ${mgCallout('!','原型边界','此处仅展示模拟报价与扩容生效。真实订单、支付、发票和合同规则需接入正式服务。','warning')}
        </div>
      </section>
      <aside class="card mg-expansion-order" aria-label="席位扩容订单摘要">
        <div class="mg-expansion-order-kicker">ORDER SUMMARY</div><h2>扩容摘要</h2>
        <div class="mg-expansion-order-row"><span>订阅套餐</span><b>${mgEsc(period.plan)}</b></div>
        <div class="mg-expansion-order-row"><span>新增席位</span><b id="mg-expansion-summary-count">${mgExpansionQuantity} 席</b></div>
        <div class="mg-expansion-order-row"><span>每席本期费用</span><b id="mg-expansion-unit-price">${mgExpansionMoney(quote.perSeat)}</b></div>
        <div class="mg-expansion-order-row"><span>折算订阅时长</span><b id="mg-expansion-months">约 ${quote.effectiveMonths.toFixed(2)} 个月</b></div>
        <div class="mg-expansion-order-total"><span>模拟合计</span><strong id="mg-expansion-total">${mgExpansionMoney(quote.total)}</strong></div>
        <p class="mg-expansion-order-note">价格按现有 ¥88/席/月演示，四舍五入至分；不含合同折扣与税费。</p>
        <label class="mg-confirm mg-expansion-ack"><input id="mg-expansion-confirm" type="checkbox"> 已核对席位数量和模拟费用</label>
        <button id="mg-expansion-submit" class="btn primary mg-expansion-submit" type="button" ${quote.valid?'':'disabled'} onclick="mgExpansionSubmit()">模拟确认扩容</button>
        <div id="mg-expansion-error" class="mg-error" role="alert" ${quote.error?'':'hidden'}>${mgEsc(quote.error)}</div>
      </aside>
    </div>`;
}
function mgOpenSeatExpansion() {
  mgExpansionQuantity = 1;
  mgExpansionBaseCapacity = mg.capacity;
  go('seat_expansion');
}
function mgExpansionShowError(message) {
  const el = document.getElementById('mg-expansion-error');
  if (el) {el.textContent = message; el.hidden = !message;}
}
function mgExpansionUpdate() {
  const input = document.getElementById('mg-expansion-count');
  const quote = mgExpansionQuote(Number(input?.value));
  const submit = document.getElementById('mg-expansion-submit');
  if (submit) submit.disabled = !quote.valid;
  mgExpansionShowError(quote.error);
  if (!quote.valid) return;
  mgExpansionQuantity = quote.quantity;
  const values = {
    'mg-expansion-capacity':mgFmt(quote.newCapacity) + ' 席',
    'mg-expansion-summary-count':quote.quantity + ' 席',
    'mg-expansion-unit-price':mgExpansionMoney(quote.perSeat),
    'mg-expansion-months':'约 ' + quote.effectiveMonths.toFixed(2) + ' 个月',
    'mg-expansion-total':mgExpansionMoney(quote.total)
  };
  for (const [id, value] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  const acknowledgement = document.getElementById('mg-expansion-confirm');
  if (acknowledgement) acknowledgement.checked = false;
}
function mgExpansionStep(change) {
  const input = document.getElementById('mg-expansion-count');
  if (!input) return;
  const current = Number.isInteger(Number(input.value)) ? Number(input.value) : mgExpansionQuantity;
  input.value = Math.max(1, Math.min(mgExpansionQuote(1).maxQuantity, current + change));
  mgExpansionUpdate();
}
function mgExpansionSubmit() {
  if (mg.capacity !== mgExpansionBaseCapacity) return mgExpansionShowError('席位总数已变化，请返回后重新获取报价。');
  const quote = mgExpansionQuote(Number(document.getElementById('mg-expansion-count')?.value));
  if (!quote.valid) return mgExpansionShowError(quote.error);
  if (!document.getElementById('mg-expansion-confirm')?.checked) return mgExpansionShowError('请先核对席位数量和模拟费用。');
  const before = mg.capacity;
  mg.capacity = quote.newCapacity;
  mg.seatExpansionOrders.unshift({
    id:'SO-' + Date.now() + '-' + Math.random().toString(16).slice(2,6),
    time:new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),
    quantity:quote.quantity, before, after:mg.capacity,
    periodStart:quote.period.starts, periodEnd:quote.period.ends,
    perSeat:quote.perSeat, total:quote.total, status:'模拟已生效'
  });
  mg.seatExpansionOrders = mg.seatExpansionOrders.slice(0,40);
  mgAudit('扩容席位',`${before} → ${mg.capacity} 席 · 模拟费用 ${mgExpansionMoney(quote.total)}`);
  if (typeof plLog === 'function') plLog('配额管理','扩容席位',`${quote.quantity} 席 · ${mgExpansionMoney(quote.total)}`);
  go('seat_management');
  toast(`已新增 ${quote.quantity} 个席位（本地原型）`);
}

views.seat_expansion = mgSeatExpansionView;
const mgExpansionBaseGo = go;
go = function(id) {
  if (id !== 'seat_expansion') return mgExpansionBaseGo(id);
  page = id;
  document.body.classList.remove('pl-mobile-nav-open');
  if (typeof renderNav === 'function') renderNav();
  const crumb = document.getElementById('crumb');
  const content = document.getElementById('content');
  if (crumb) crumb.textContent = '席位管理 / 扩容席位';
  if (content) content.innerHTML = mgSeatExpansionView();
  window.scrollTo({top:0,behavior:'smooth'});
};

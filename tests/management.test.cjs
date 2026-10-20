const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function harness(initialData) {
  const elements = {};
  const store = initialData ? {'carbon-agent-management-v2': JSON.stringify(initialData)} : {};
  const context = {
    console, Date, Intl, Set, Math, JSON, Number, String, Array, Object,
    localStorage: {getItem: key => store[key], setItem: (key, value) => {store[key] = value}},
    document: {getElementById: id => elements[id] || (elements[id] = {value: '', textContent: '', hidden: false, classList: {add() {}, remove() {}}})},
    window: {scrollY: 0, scrollTo() {}},
    views: {}, page: 'seats', head: (_a, title, _c, actions) => `<h1>${title}</h1>${actions}`,
    toast() {}, closeModal() {}, go() {}
  };
  vm.createContext(context);
  for (const name of ['management.js','seat-expansion.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'), context);
  return {elements, run: source => vm.runInContext(source, context)};
}

{
  const {elements,run}=harness();
  const unassigned=run("mg.people.find(p=>!p.source).id"),assigned=run("mg.people.find(p=>p.source).id");
  run("mgSeatStatus='unassigned'");
  const name=run(`mg.people.find(p=>p.id==='${unassigned}').name`);
  assert.ok(run('mgSeatMembers()').includes(`aria-label="选择 ${name}"`));
  assert.ok(!run('mgSeatMembers()').includes(`aria-label="选择 ${name}" disabled`),'未分配成员也能勾选');
  run(`mgToggleSeat('${unassigned}',true)`);
  assert.equal(run(`mgSelectedSeats.has('${unassigned}')`),true);
  assert.ok(run('mgSeatMembers()').includes('已选 1 人 · 可释放 0 人'));
  run('mgOpenBatchRelease()');
  assert.ok(elements.modal.innerHTML.includes('无可释放席位'));
  run('mgSelectedSeats.clear();mgSeatSelectPage(true)');
  assert.equal(run('mgSelectedSeats.size'),run('mgSeatFiltered().slice(0,8).length'),'全选应包含当前页全部成员');
  run(`mgSelectedSeats.clear();mgSelectedSeats.add('${unassigned}');mgSelectedSeats.add('${assigned}')`);
  run('mgOpenBatchRelease()');
  assert.ok(elements.modal.innerHTML.includes('已跳过未分配成员'));
  assert.ok(elements.modal.innerHTML.includes('释放 1 个席位'));
  elements['mg-release-confirm']={checked:true};
  const before=run('mgUsedSeats()');
  run('mgSubmitBatchRelease()');
  assert.equal(run('mgUsedSeats()'),before-1);
}

{
  const {elements, run} = harness();
  assert.equal(run('mg.people.length'), 48);
  assert.equal(run('mgUsedSeats()'), 38);
  assert.equal(run('mgPoolUsed()'), 642800);
  assert.ok(!run('mgSeatView().includes("部门策略")'));
  assert.ok(!run('mgUsageView().includes("部门预算")'));
  assert.ok(!run('mgUsageView().includes("额度层级")'));
  assert.ok(!run('mgUsageView().includes("治理提醒")'));
  assert.ok(run('mgUsageView().includes("批量调整月额度")'));
  assert.equal(run('mg.policies.length'),0);
  assert.equal(run('Object.keys(mg.budgets).length'),0);
  assert.ok(run('mgUsageView().includes("个人月限额")'));
  run('mg.people.forEach(p=>p.used=0)');
  assert.equal(run('mgLedgerRows().length'),12,'尚无实际消耗时也应展示演示流水');
  assert.ok(run('mgUsageLedger().includes("CA-")'));
  assert.ok(run('mgUsageLedger().includes("不参与上方积分余额")'));

  const member = run("mg.people.find(p => !p.source).id");
  elements['mg-assign-target'] = {value: member};
  run('mgSubmitSeatAssign()');
  assert.equal(run('mgUsedSeats()'), 39);
  run('mgSubmitSeatAssign()');
  assert.equal(run('mgUsedSeats()'), 39, '重复分配不可重复占位');

  assert.ok(!run('mgSeatView().includes("缩容席位")'));
  assert.equal(run('typeof mgSubmitResize'),'undefined');

  elements['mg-quota-mode'] = {value: 'number'};
  elements['mg-quota-value'] = {value: '-1'};
  run(`mgSubmitQuota('${member}')`);
  assert.equal(run(`mg.people.find(p => p.id === '${member}').quota`), 25000);

  elements['mg-release-confirm'] = {checked: true};
  run(`mgSelectedSeats.add('${member}')`);
  run('mgSubmitBatchRelease()');
  assert.equal(run('mgUsedSeats()'), 38);
}

{
  const {elements, run} = harness();
  const product = run("mg.people.find(p => p.department === '产品研发部' && !p.source).id");
  elements['mg-assign-target']={value:product};
  run('mgSubmitSeatAssign()');
  assert.equal(run('mgUsedSeats()'), 39);
  assert.equal(run(`mg.people.find(p => p.id === '${product}').source`), 'direct');
  run("mgUsageChangeTab('departments')");
  assert.ok(!run('mgSeatView()').includes('变更记录'),'席位管理不再展示变更记录页签');
  assert.equal(run('mgUsageTab'),'members','已移除的积分页签不可进入');

  const target = run("mg.people.find(p => p.source === 'direct').id");
  const alreadyUsed = run(`mg.people.find(p => p.id === '${target}').used`);
  run(`mgSelectedUsage.add('${target}')`);
  elements['mg-quota-mode'] = {value: 'number'};
  elements['mg-quota-value'] = {value: String(alreadyUsed - 1)};
  run('mgSubmitQuotaBulk()');
  assert.equal(run(`mg.people.find(p => p.id === '${target}').quota`) >= alreadyUsed, true, '批量额度不能低于已使用量');
}

{
  const seed = JSON.parse(JSON.stringify(harness().run('mg')));
  seed.people[0].source='p-product';
  seed.policies=[{id:'p-product',department:'产品研发部',mode:'auto'}];
  seed.budgets={'产品研发部':400000};
  const {run}=harness(seed);
  assert.equal(run("mg.people[0].source"),'direct','已有部门策略席位迁移为指定成员，避免无意回收');
  assert.equal(run('mgUsedSeats()'),38);
  assert.equal(run('mg.policies.length'),0);
  assert.equal(run('Object.keys(mg.budgets).length'),0);
}

{
  const {elements, run} = harness();
  assert.ok(run('mgSeatView().includes("扩容席位")'));
  assert.ok(run('mgSeatExpansionView().includes("扩容摘要")'));
  const quote = run("mgExpansionQuote(2,'2026-10-15')");
  assert.equal(quote.remainingDays,363);
  assert.equal(quote.total,Math.round(quote.perSeat*2*100)/100);
  assert.equal(run("mgExpansionQuote(0,'2026-10-15').valid"),false);
  assert.equal(run("mgExpansionQuote(1,'2027-10-13').valid"),false,'到期后不可扩容');
  run("mgExpansionToday=()=> '2026-10-15'");
  elements['mg-expansion-count'] = {value:'2'};
  elements['mg-expansion-confirm'] = {checked:true};
  elements['mg-expansion-total'] = {textContent:''};
  run('mgExpansionUpdate()');
  assert.equal(elements['mg-expansion-total'].textContent,run('mgExpansionMoney(mgExpansionQuote(2).total)'));
  assert.equal(elements['mg-expansion-confirm'].checked,false,'修改数量后须重新确认费用');
  run('mgExpansionSubmit()');
  assert.equal(run('mg.capacity'),50,'未确认报价不得扩容');
  elements['mg-expansion-confirm'].checked = true;
  run('mgExpansionSubmit()');
  assert.equal(run('mg.capacity'),52);
  assert.equal(run('mgUsedSeats()'),38,'扩容不自动给成员分配席位');
  assert.equal(run('mg.seatExpansionOrders[0].quantity'),2);
  assert.ok(run("mg.audit.some(a=>a.event==='扩容席位')"));
  run('mgExpansionSubmit()');
  assert.equal(run('mg.capacity'),52,'报价基准发生变化后不能重复提交');
  assert.equal(run('mg.capacity'),52,'只有扩容订单改变席位总数');
}

console.log('Carbon Agent management tests passed');

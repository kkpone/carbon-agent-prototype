const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const storeHtml = fs.readFileSync(path.join(root, 'agent-store.html'), 'utf8');
const purchaseHtml = fs.readFileSync(path.join(root, 'enterprise-purchase.html'), 'utf8');
assert.match(storeHtml, /id="tab-personal"[^>]*aria-selected="true"/);
assert.match(storeHtml, /id="tab-enterprise"[^>]*aria-selected="false"/);
assert.match(storeHtml, /href="enterprise-purchase.html" target="_blank" rel="noopener"/);
assert.match(storeHtml, /¥88 <span>\/ 人 \/ 月<\/span>/);
assert.match(storeHtml, /1 人坐席起购/);
assert.match(storeHtml, /id="account-trigger"[^>]*aria-haspopup="menu"/);
for (const label of ['新手引导','操作手册','咨询客服','问题反馈','个人设置','Language','消息通知','切换企业账号','退出登录']) assert.ok(storeHtml.includes(label), `${label} appears in account menu`);
assert.ok(storeHtml.indexOf('切换企业账号') < storeHtml.indexOf('退出登录'));
assert.match(storeHtml, /id="space-submenu"[^>]*role="menu"/);
assert.match(storeHtml, /id="space-qingyu"[^>]*>.*青屿科技/);
assert.match(purchaseHtml, /1 人坐席起购/);
assert.match(purchaseHtml, /id="month-count"[^>]*value="2"/);
assert.match(purchaseHtml, /id="summary-months">2 个月/);
for (const removed of ['订阅周期', '自动续费', '积分加量包']) assert.ok(!purchaseHtml.includes(removed), `${removed} is removed`);
assert.match(purchaseHtml, /不会创建订单或扣款/);
assert.match(purchaseHtml, /id="management-link"[^>]*href="index.html"/);
assert.match(purchaseHtml, /id="confirmation-title">支付成功/);
assert.match(purchaseHtml, /id="confirmation-return"[^>]*href="agent-store.html">返回Carbon Agent/);
assert.ok(!purchaseHtml.includes('confirmation-details'));
assert.ok(!purchaseHtml.includes('返回修改配置'));
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'management backend prototype exists');

function element(value = '') {
  const attributes = {};
  const classes = new Set();
  return {
    value, textContent: '', hidden: false, checked: false, tabIndex: 0,
    events: {}, children: [],
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), toggle(x, on) { if (on) classes.add(x); else classes.delete(x); }, contains: x => classes.has(x) },
    setAttribute: (k, v) => { attributes[k] = v; }, getAttribute: k => attributes[k],
    addEventListener(type, fn) { this.events[type] = fn; },
    focus() { this.focused = true; }, appendChild(child) { this.children.push(child); }, replaceChildren() { this.children = []; }
  };
}

{
  const ids = ['store-overlay','upgrade-trigger','store-close','tab-personal','tab-enterprise','panel-personal','panel-enterprise','personal-buy','store-toast','account-trigger','account-menu','switch-account','space-submenu','space-personal','space-qingyu','menu-guide','menu-manual','menu-support','menu-feedback','menu-settings','menu-language','menu-notifications','menu-logout','account-name','account-plan','menu-account-name','workspace-label','points-balance','upgrade-label','personal-projects','enterprise-projects'];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  nodes['account-menu'].hidden = true;
  nodes['space-submenu'].hidden = true;
  const document = { activeElement: nodes['upgrade-trigger'], body: element(), getElementById: id => nodes[id], addEventListener() {} };
  const storage = {};
  const context = { document, location: { search: '' }, URLSearchParams, window: {}, setTimeout: () => 1, clearTimeout() {}, localStorage: { getItem: key => storage[key], setItem: (key, value) => { storage[key] = value; } } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'agent-store.js'), 'utf8'), context);
  assert.equal(nodes['workspace-label'].textContent, '个人空间');
  nodes['account-trigger'].events.click();
  assert.equal(nodes['account-menu'].hidden, false);
  assert.equal(nodes['account-trigger'].getAttribute('aria-expanded'), 'true');
  nodes['switch-account'].events.click();
  assert.equal(nodes['space-submenu'].hidden, false);
  assert.equal(nodes['switch-account'].getAttribute('aria-expanded'), 'true');
  nodes['space-qingyu'].events.click();
  assert.equal(nodes['workspace-label'].textContent, '青屿科技 · 企业空间');
  assert.equal(nodes['space-qingyu'].getAttribute('aria-checked'), 'true');
  assert.equal(nodes['space-submenu'].hidden, true);
  assert.equal(nodes['personal-projects'].hidden, true);
  assert.equal(nodes['enterprise-projects'].hidden, false);
  assert.equal(storage['carbon-agent-active-space'], 'enterprise');
  nodes['account-trigger'].events.click();
  nodes['switch-account'].events.click();
  nodes['space-personal'].events.click();
  assert.equal(nodes['workspace-label'].textContent, '个人空间');
  assert.equal(nodes['space-personal'].getAttribute('aria-checked'), 'true');
  assert.equal(storage['carbon-agent-active-space'], 'personal');
  nodes['upgrade-trigger'].events.click();
  assert.equal(nodes['panel-personal'].hidden, false);
  assert.equal(nodes['panel-enterprise'].hidden, true);
  nodes['tab-enterprise'].events.click();
  assert.equal(nodes['panel-personal'].hidden, true);
  assert.equal(nodes['panel-enterprise'].hidden, false);
  assert.equal(nodes['tab-enterprise'].getAttribute('aria-selected'), 'true');
  nodes['store-close'].events.click();
  assert.equal(nodes['store-overlay'].hidden, true);
}

{
  const ids = ['seat-count','seat-minus','seat-plus','month-count','month-minus','month-plus','summary-seats','summary-months','summary-monthly','summary-total','form-error','confirmation','admin-name','admin-phone','company-name','acknowledge','confirm-config','confirmation-return','management-link'];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  nodes['seat-count'].value = '1';
  nodes['month-count'].value = '2';
  nodes['seat-count'].hidden = false;
  nodes.confirmation.hidden = true;
  const document = {
    getElementById: id => nodes[id],
    createElement: () => element(),
    addEventListener() {}
  };
  const context = { document, Number, Math };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'enterprise-purchase.js'), 'utf8'), context);
  assert.equal(nodes['summary-seats'].textContent, '1 席');
  assert.equal(nodes['summary-months'].textContent, '2 个月');
  assert.equal(nodes['summary-monthly'].textContent, '¥88');
  assert.equal(nodes['summary-total'].textContent, '¥176');
  nodes['seat-minus'].events.click();
  assert.equal(nodes['summary-seats'].textContent, '1 席');
  nodes['seat-plus'].events.click();
  assert.equal(nodes['summary-seats'].textContent, '2 席');
  assert.equal(nodes['summary-total'].textContent, '¥352');
  nodes['month-plus'].events.click();
  assert.equal(nodes['summary-months'].textContent, '3 个月');
  assert.equal(nodes['summary-total'].textContent, '¥528');
  nodes['month-count'].value = '0';
  nodes['confirm-config'].events.click();
  assert.equal(nodes['form-error'].textContent, '购买时长须为 1 至 36 个月的整数。');
  nodes['month-count'].value = '3';
  nodes['confirm-config'].events.click();
  assert.equal(nodes['form-error'].textContent, '请填写管理员姓名。');
  nodes['admin-name'].value = '张三';
  nodes['admin-phone'].value = '13800000000';
  nodes['company-name'].value = '青屿科技';
  nodes.acknowledge.checked = true;
  nodes['confirm-config'].events.click();
  assert.equal(nodes.confirmation.hidden, false);
  assert.equal(nodes['management-link'].focused, true);
}
console.log('Carbon Agent store flow tests passed');

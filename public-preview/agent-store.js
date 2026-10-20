const overlay = document.getElementById('store-overlay');
const trigger = document.getElementById('upgrade-trigger');
const closeButton = document.getElementById('store-close');
const tabs = [document.getElementById('tab-personal'), document.getElementById('tab-enterprise')];
const panels = [document.getElementById('panel-personal'), document.getElementById('panel-enterprise')];
const accountTrigger = document.getElementById('account-trigger');
const accountMenu = document.getElementById('account-menu');
const switchAccount = document.getElementById('switch-account');
const spaceSubmenu = document.getElementById('space-submenu');
const personalSpace = document.getElementById('space-personal');
const qingyuSpace = document.getElementById('space-qingyu');
const spaceStorageKey = 'carbon-agent-active-space';
let previousFocus = trigger;
let activeSpace = 'personal';

try {
  if (localStorage.getItem(spaceStorageKey) === 'enterprise') activeSpace = 'enterprise';
} catch (_) { /* File previews may disallow storage. */ }

function showStoreToast(message) {
  const toast = document.getElementById('store-toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.storeToastTimer);
  window.storeToastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function renderSpace() {
  const enterprise = activeSpace === 'enterprise';
  document.getElementById('account-name').textContent = enterprise ? '青屿科技' : '我的';
  document.getElementById('account-plan').textContent = enterprise ? '企业版' : '个人版';
  document.getElementById('menu-account-name').textContent = enterprise ? '青屿科技' : '我的';
  personalSpace.setAttribute('aria-checked', String(!enterprise));
  qingyuSpace.setAttribute('aria-checked', String(enterprise));
  document.getElementById('workspace-label').textContent = enterprise ? '青屿科技 · 企业空间' : '个人空间';
  document.getElementById('points-balance').textContent = enterprise ? '3,375' : '535';
  document.getElementById('upgrade-label').textContent = enterprise ? '套餐' : '升级';
  document.getElementById('personal-projects').hidden = enterprise;
  document.getElementById('enterprise-projects').hidden = !enterprise;
}

function closeAccountMenu(focusTrigger = false) {
  spaceSubmenu.hidden = true;
  switchAccount.setAttribute('aria-expanded', 'false');
  accountMenu.hidden = true;
  accountTrigger.setAttribute('aria-expanded', 'false');
  if (focusTrigger) accountTrigger.focus();
}

function openAccountMenu() {
  accountMenu.hidden = false;
  accountTrigger.setAttribute('aria-expanded', 'true');
  document.getElementById('menu-guide').focus();
}

accountTrigger.addEventListener('click', () => accountMenu.hidden ? openAccountMenu() : closeAccountMenu(true));
switchAccount.addEventListener('click', () => {
  const opening = spaceSubmenu.hidden;
  spaceSubmenu.hidden = !opening;
  switchAccount.setAttribute('aria-expanded', String(opening));
  if (opening) (activeSpace === 'personal' ? qingyuSpace : personalSpace).focus();
});

function selectSpace(nextSpace) {
  activeSpace = nextSpace;
  try { localStorage.setItem(spaceStorageKey, activeSpace); } catch (_) { /* Preview still switches for this page. */ }
  renderSpace();
  closeAccountMenu(true);
  showStoreToast(activeSpace === 'enterprise' ? '已切换至青屿科技企业空间' : '已切换至个人空间');
}

personalSpace.addEventListener('click', () => selectSpace('personal'));
qingyuSpace.addEventListener('click', () => selectSpace('enterprise'));
for (const id of ['menu-guide','menu-manual','menu-support','menu-feedback','menu-settings','menu-language','menu-notifications','menu-logout']) {
  document.getElementById(id).addEventListener('click', () => {
    closeAccountMenu(true);
    showStoreToast('该入口暂未接入演示原型');
  });
}
document.addEventListener('click', event => {
  if (!accountMenu.hidden && !accountMenu.contains(event.target) && !accountTrigger.contains(event.target)) closeAccountMenu();
});

function selectPlanTab(index) {
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i].hidden = !active;
  });
}

function openStore() {
  closeAccountMenu();
  previousFocus = document.activeElement;
  selectPlanTab(0);
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  tabs[0].focus();
}

function closeStore() {
  overlay.hidden = true;
  document.body.classList.remove('modal-open');
  (previousFocus || trigger).focus();
}

trigger.addEventListener('click', openStore);
closeButton.addEventListener('click', closeStore);
overlay.addEventListener('click', event => { if (event.target === overlay) closeStore(); });
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPlanTab(index));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = 1 - index;
    selectPlanTab(next);
    tabs[next].focus();
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !spaceSubmenu.hidden) {
    spaceSubmenu.hidden = true;
    switchAccount.setAttribute('aria-expanded', 'false');
    switchAccount.focus();
    return;
  }
  if (event.key === 'Escape' && !accountMenu.hidden) { closeAccountMenu(true); return; }
  if (event.key === 'Escape' && !overlay.hidden) closeStore();
  if (event.key === 'Tab' && !overlay.hidden) {
    const focusable = [...overlay.querySelectorAll('button:not([disabled]), a[href]')].filter(el => el.offsetParent !== null && el.tabIndex >= 0);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.getElementById('personal-buy').addEventListener('click', () => {
  showStoreToast('个人版支付尚未接入此演示原型');
});
overlay.hidden = true;
renderSpace();
if (new URLSearchParams(location.search).get('modal') === 'open') openStore();

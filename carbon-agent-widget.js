/* Reusable Carbon Agent popup for the Carbon Cloud SaaS prototype. */
(() => {
  const scriptUrl = document.currentScript?.src || location.href;
  const stylesheetUrl = new URL('carbon-agent-widget.css', scriptUrl).href;
  const atom = `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><ellipse cx="20" cy="20" rx="7.3" ry="17" stroke="currentColor" stroke-width="2.2"/><ellipse cx="20" cy="20" rx="7.3" ry="17" stroke="currentColor" stroke-width="2.2" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="7.3" ry="17" stroke="currentColor" stroke-width="2.2" transform="rotate(120 20 20)"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/></svg>`;
  const sparkle = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5 14.2 9.8 21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2L12 2.5Z" fill="currentColor"/></svg>`;
  const arrow = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const expandIcon = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const restoreIcon = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4v5H4m16 0h-5V4M4 15h5v5m6 0v-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const prompts = [
    '帮我创建一个篮球的产品碳足迹模型',
    '分析羽毛球产品碳足迹的关键排放源',
    '解读负碳混凝土获得 CDR 碳信用的最新进展',
    '解读巴黎协定第 6.2 条 ITMO 减排量最新签发动态'
  ];

  function mount(host) {
    if (host.shadowRoot) return;
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<link rel="stylesheet" href="${stylesheetUrl}">
      <div class="ca-widget">
        <button class="ca-launcher" type="button" aria-label="打开 Carbon Agent" aria-expanded="false">${atom}<span>Carbon Agent</span></button>
        <section class="ca-panel" role="dialog" aria-label="Carbon Agent 对话" hidden>
          <header class="ca-header"><button class="ca-menu-button" type="button" aria-label="打开项目和历史对话" aria-expanded="false"><span></span><span></span><span></span></button><div class="ca-header-brand">${atom}<strong>Carbon Agent</strong></div><button class="ca-expand" type="button" aria-label="放大 Carbon Agent" aria-pressed="false" title="放大弹窗">${expandIcon}</button><button class="ca-new" type="button" aria-label="新对话"><span>＋</span><span>新对话</span></button><button class="ca-close" type="button" aria-label="关闭 Carbon Agent">×</button></header>
          <aside class="ca-drawer" aria-label="项目和历史对话" hidden><div class="ca-drawer-head">工作空间 <button class="ca-drawer-close" type="button" aria-label="关闭菜单">×</button></div><div class="ca-drawer-section"><strong>能力</strong><button type="button" data-drawer-prompt="帮我创建一个产品碳足迹模型">产品碳足迹 <span>›</span></button><button type="button" data-drawer-prompt="帮我开始企业碳核算">企业碳核算 <span>›</span></button><button type="button" data-drawer-prompt="帮我了解 CBAM 填报要求">CBAM <span>›</span></button></div><div class="ca-drawer-section"><strong>项目</strong><div>▢　2024年企业碳核算</div><div>▢　羽毛球产品碳足迹</div></div><div class="ca-drawer-section"><strong>最近对话</strong><button type="button" data-drawer-prompt="分析羽毛球产品碳足迹的关键排放源">羽毛球产品排放源 <span>↗</span></button></div><div class="ca-points-card"><span class="ca-points-mark" aria-hidden="true">✦</span><span class="ca-points-label">剩余积分</span><strong class="ca-points-value"></strong></div></aside>
          <div class="ca-content"><div class="ca-welcome"><div class="ca-mascot" aria-hidden="true"><i class="ca-eye"></i><i class="ca-wink"></i></div><h1>你好，我是 <span>Carbon Agent</span></h1><p>从产品描述到碳足迹模型与核算报告，也能随时解答碳知识、追踪行业资讯。</p><div class="ca-prompts">${prompts.map(p => `<button type="button">${p}</button>`).join('')}</div></div><div class="ca-conversation" role="log" aria-live="polite" hidden></div></div>
          <div class="ca-bottom"><form class="ca-composer"><label class="ca-input-label" for="ca-textarea">向 Carbon Agent 提问</label><textarea id="ca-textarea" rows="2" placeholder="描述产品、上传资料，或直接提问碳足迹建模／报告／资讯需求…"></textarea><div class="ca-attachment-list" hidden></div><div class="ca-composer-foot"><button class="ca-attach" type="button" aria-label="添加附件">＋</button><div class="ca-modes" role="group" aria-label="核算类型"><button class="ca-mode active" type="button" data-mode="product" aria-pressed="true">产品碳足迹建模</button><button class="ca-mode" type="button" data-mode="enterprise" aria-pressed="false">企业碳核算</button></div><button class="ca-send" type="submit" aria-label="发送消息" disabled>${arrow}</button></div><input class="ca-file" type="file" multiple hidden></form><p class="ca-disclaimer">内容由 AI 生成，请仔细甄别</p></div>
        </section>
      </div>`;
    const $ = selector => root.querySelector(selector);
    const panel = $('.ca-panel');
    const launcher = $('.ca-launcher');
    const drawer = $('.ca-drawer');
    const configuredPoints = Number(host.dataset.points);
    $('.ca-points-value').textContent = new Intl.NumberFormat('zh-CN').format(
      Number.isFinite(configuredPoints) && configuredPoints >= 0 ? Math.floor(configuredPoints) : 3375
    );
    const menuButton = $('.ca-menu-button');
    const expandButton = $('.ca-expand');
    const textarea = $('.ca-composer textarea');
    const sendButton = $('.ca-send');
    const fileInput = $('.ca-file');
    const fileList = $('.ca-attachment-list');
    const conversation = $('.ca-conversation');
    const welcome = $('.ca-welcome');
    let files = [];
    let messages = [];
    let focusBeforeOpen = null;

    function setExpanded(expanded) {
      panel.classList.toggle('expanded', expanded);
      expandButton.setAttribute('aria-pressed', String(expanded));
      expandButton.setAttribute('aria-label', expanded ? '还原 Carbon Agent' : '放大 Carbon Agent');
      expandButton.title = expanded ? '还原弹窗' : '放大弹窗';
      expandButton.innerHTML = expanded ? restoreIcon : expandIcon;
    }
    function open() {
      if (!panel.hidden) { textarea.focus(); return; }
      focusBeforeOpen = root.activeElement || document.activeElement;
      panel.hidden = false;
      launcher.hidden = true;
      launcher.setAttribute('aria-expanded', 'true');
      textarea.focus();
    }
    function close() {
      setExpanded(false);
      drawer.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      launcher.hidden = false;
      launcher.setAttribute('aria-expanded', 'false');
      if (focusBeforeOpen?.isConnected && focusBeforeOpen !== document.body) focusBeforeOpen.focus();
      else launcher.focus();
    }
    function updateSend() { sendButton.disabled = !textarea.value.trim() && files.length === 0; }
    function renderFiles() {
      fileList.replaceChildren();
      files.forEach((file, index) => {
        const chip = document.createElement('span');
        chip.className = 'ca-file-chip';
        chip.append(document.createTextNode(file.name));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.setAttribute('aria-label', `移除 ${file.name}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => { files.splice(index, 1); renderFiles(); updateSend(); });
        chip.append(remove);
        fileList.append(chip);
      });
      fileList.hidden = files.length === 0;
    }
    function appendMessage(kind, body) {
      const row = document.createElement('div');
      row.className = `ca-message ca-message-${kind}`;
      const avatar = document.createElement('span');
      avatar.className = 'ca-message-avatar';
      avatar.textContent = kind === 'agent' ? '✳' : '我';
      const bubble = document.createElement('div');
      bubble.className = 'ca-message-bubble';
      bubble.textContent = body;
      row.append(avatar, bubble);
      conversation.append(row);
      conversation.scrollTop = conversation.scrollHeight;
      messages.push({kind, body});
    }
    function submit(value) {
      const content = (value ?? textarea.value).trim();
      if (!content && files.length === 0) return;
      welcome.hidden = true;
      conversation.hidden = false;
      const attached = files.map(file => `📎 ${file.name}`).join('\n');
      appendMessage('user', [content, attached].filter(Boolean).join('\n'));
      textarea.value = '';
      files = [];
      fileInput.value = '';
      renderFiles();
      updateSend();
      appendMessage('agent', '已收到你的需求。当前是 Carbon Agent 弹窗交互原型，正式接入后会在这里继续分析并生成结果。');
      textarea.focus();
    }
    launcher.addEventListener('click', open);
    $('.ca-close').addEventListener('click', close);
    expandButton.addEventListener('click', () => setExpanded(!panel.classList.contains('expanded')));
    $('.ca-new').addEventListener('click', () => { messages = []; conversation.replaceChildren(); conversation.hidden = true; welcome.hidden = false; textarea.value = ''; files = []; fileInput.value = ''; renderFiles(); updateSend(); drawer.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); textarea.focus(); });
    menuButton.addEventListener('click', () => { drawer.hidden = !drawer.hidden; menuButton.setAttribute('aria-expanded', String(!drawer.hidden)); });
    $('.ca-drawer-close').addEventListener('click', () => { drawer.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); });
    root.querySelectorAll('.ca-prompts button').forEach((button, index) => button.addEventListener('click', () => submit(prompts[index])));
    root.querySelectorAll('[data-drawer-prompt]').forEach(button => button.addEventListener('click', () => { drawer.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); submit(button.dataset.drawerPrompt); }));
    $('.ca-composer').addEventListener('submit', event => { event.preventDefault(); submit(); });
    textarea.addEventListener('input', updateSend);
    textarea.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(); } });
    $('.ca-attach').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { files.push(...fileInput.files); fileInput.value = ''; renderFiles(); updateSend(); });
    root.querySelectorAll('.ca-mode').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('.ca-mode').forEach(mode => {
        const active = mode === button;
        mode.classList.toggle('active', active);
        mode.setAttribute('aria-pressed', String(active));
      });
      textarea.placeholder = button.dataset.mode === 'enterprise'
        ? '描述企业边界、上传资料，或直接提问企业碳核算需求…'
        : '描述产品、上传资料，或直接提问碳足迹建模／报告／资讯需求…';
      textarea.focus();
    }));
    host.addEventListener('carbon-agent:open', open);
    host.addEventListener('carbon-agent:close', close);
    document.addEventListener('keydown', event => { if (event.key !== 'Escape' || panel.hidden) return; if (!drawer.hidden) { drawer.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus(); } else if (panel.classList.contains('expanded')) { setExpanded(false); expandButton.focus(); } else close(); });
    if (host.dataset.open === 'true') open();
  }
  function start() { document.querySelectorAll('[data-carbon-agent-widget]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();

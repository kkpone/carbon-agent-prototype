const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

function harness(initialized=true){
  const elements={},store={};
  const context={console,Date,Intl,Set,Math,JSON,Number,String,Array,Object,
    localStorage:{getItem:k=>store[k],setItem:(k,v)=>{store[k]=v}},
    document:{body:{classList:{remove(){},add(){},toggle(){},contains(){return false}}},getElementById:id=>elements[id]||(elements[id]={value:'',textContent:'',hidden:false,classList:{add(){},remove(){}},setAttribute(name,value){this[name]=value},focus(){this.focused=true}}),querySelectorAll:selector=>selector==='.wb-role-feature:checked'?(elements._roleChecks||[]):[],querySelector:()=>null},
    window:{scrollY:0,scrollTo(){}},views:{},items:[],icons:{},page:'overview',renderNav(){},svg:()=>'<svg></svg>',
    head:(_a,title,_c,actions)=>`<h1>${title}</h1>${actions}`,toast(){},closeModal(){},go(){}};
  vm.createContext(context);
  for(const name of ['management.js','platform.js','orgsync.js','workbuddy.js','seat-expansion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
  vm.runInContext('pl.workbuddy.directoryInitialized='+initialized,context);
  return {elements,run:s=>vm.runInContext(s,context)};
}

{
  const {elements,run}=harness();
  assert.equal(run('items.length'),9);
  for(const name of ['工作台','用户列表','角色管理','席位管理','积分管理','订单记录','企业信息','数据概览','操作日志'])assert.ok(run(`items.some(x=>x[1]==='${name}')`));
  assert.ok(!run('items.some(x=>x[1]==="对话日志")'));
  assert.equal(run("items.some(x=>x[1]==='部门管理')"),false,'部门管理已并入用户页面');
  for(const name of ['用户管理','配额管理','企业设置','运行监控','日志管理'])assert.ok(run(`plNavTree.some(x=>x.label==='${name}')`));
  for(const fn of ['plOverview','plEnterpriseInfo','plDataOverview','wbPeopleView','wbRoles','wbSubscription','wbOperationLogs'])assert.ok(run(`${fn}().length>500`),`${fn} renders`);
  assert.ok(run("plOverview().includes('pl-workspace-overview')"),'工作台显示数据概览');
  assert.ok(run("plOverview().includes('pl-workspace-subscription')"),'工作台显示订阅资源卡');
  for(const label of ['剩余天数','续费订阅','剩余席位','扩容席位','剩余积分','购买增量包'])assert.ok(run(`plOverview().includes('${label}')`));
  assert.ok(!run("plOverview().includes('pl-guide')"),'不再显示入门引导');
  assert.ok(!run("plOverview().includes('pl-kpi-grid')"),'不再显示原四张指标卡');
  assert.ok(!run("plOverview().includes('导出概览')"));
  assert.ok(!run("plOverview().includes('＋ 添加成员')"));
  for(const label of ['活跃用户人数','任务数','积分消耗','新增用户','日活渗透率'])assert.ok(run(`plOverview().includes('${label}')`));
  assert.ok(!run("plOverview().includes('需要关注')"));
  assert.ok(!run("plOverview().includes('最近任务')"));
  assert.ok(!run("plOverview().includes('<h2>资源概览</h2>')"));
  assert.ok(run("plOverview().includes('pl-overview-single')"));
  assert.equal(run('plWorkspaceStats().taskCount'),run('pl.tasks.filter(t=>t.created.slice(0,10)===plOverviewToday()).length'));
  run("plWorkspaceSetRange('week')");
  assert.ok(run('plWorkspaceStats().taskCount')>=run('pl.tasks.filter(t=>t.created.slice(0,10)===plOverviewToday()).length'));
  assert.ok(run('plOverview().includes("aria-pressed=\\"true\\" class=\\"active\\" onclick=\\"plWorkspaceSetRange(\'week\')")'));
  assert.ok(run("wbPeopleView().includes('部门列表')"));
  assert.ok(run("wbPeopleView().includes('用户列表')"));
  assert.ok(!run('plUserRoute("users").includes("用户组")'));
  assert.ok(run('plOrgSyncOpenPreview !== undefined'));
  assert.equal(run('mg.people.length'),48);

  elements['pl-new-name']={value:'测试成员'};
  elements['pl-new-email']={value:'demo.member@qingyu.ai'};
  elements['pl-new-dept']={value:'市场部'};
  elements['pl-new-role']={value:'成员'};
  run('plSubmitAddUser()');
  assert.equal(run('mg.people.length'),49);
  assert.equal(run("mg.people.at(-1).source"),null,'新用户不自动占用席位');
  assert.equal(run('mgUsedSeats()'),38);
  run('plSubmitAddUser()');
  assert.equal(run('mg.people.length'),49,'重复邮箱不可再次创建');

  elements['pl-edit-dept']={value:'产品研发部'};
  elements['pl-edit-role']={value:'成员'};
  elements['pl-edit-status']={value:'已停用'};
  elements['pl-edit-email']={value:run('plMeta(mg.people.find(p=>p.id==="u1")).email')};
  elements['pl-edit-confirm']={checked:true};
  run("plSubmitEditUser('u1')");
  assert.equal(run("plMeta(mg.people.find(p=>p.id==='u1')).status"),'已停用');
  assert.equal(run('mgUsedSeats()'),37,'停用成员应回收席位');
  assert.ok(run("pl.events.some(e=>e.action==='编辑用户')"));
  const historicalUsage=run("mg.people.find(p=>p.id==='u1').used");
  elements['pl-delete-name']={value:'陈思远'};
  run("plSubmitRemoveUser('u1')");
  assert.equal(run("plMeta(mg.people.find(p=>p.id==='u1')).status"),'已删除');
  assert.equal(run("mg.people.find(p=>p.id==='u1').used"),historicalUsage,'删除账号保留历史消耗');
  assert.equal(run('mgUsedSeats()'),37);

  elements['pl-org-name']={value:'青屿智能科技'};
  elements['pl-org-short']={value:'青屿'};
  elements['pl-org-contact']={value:'ops@qingyu.ai'};
  run('plSubmitProfile()');
  assert.equal(run('pl.org.name'),'青屿智能科技');

  elements['pl-confirm']={checked:true};
  elements['pl-domain']={value:'qingyu-ai'};
  run('plSubmitDomain()');
  assert.equal(run('pl.org.domain'),'qingyu-ai');
  elements['pl-domain']={value:'another-domain'};
  run('plSubmitDomain()');
  assert.equal(run('pl.org.domain'),'qingyu-ai','域名每 365 天最多修改一次');

  run("plLogTab='operation';plLogRange='7'");
  const recent=run('plLogRows().length');
  run("plLogRange='90'");
  assert.ok(run('plLogRows().length')>recent,'时间范围筛选生效');
}

{
  const {elements,run}=harness(false);
  assert.equal(run('mg.people.length'),48,'旧演示样本在首次同步前不显示');
  assert.ok(run('wbPeopleView().includes("同步碳云 SaaS 组织架构")'));
  assert.ok(run('wbPeopleView().includes("＋ 新增部门")'));
  assert.ok(!run('wbPeopleView().includes("wb-empty-sync-users")'));
  assert.ok(run('wbPeopleView().includes("手动新增部门")'));
  assert.ok(!run('wbPeopleView().includes("wb-people-shell")'));
  assert.equal(run('plOrgSyncPlan(false).existingCount'),0,'首次预览不应将演示样本视为既有组织');
  run('wbOpenInitialOrgSync()');
  assert.ok(elements.modal.innerHTML.includes('预览碳云 SaaS 组织同步'));
  assert.ok(elements.modal.innerHTML.includes('部门预览'));
  assert.ok(elements.modal.innerHTML.includes('用户预览'));
  assert.ok(elements.modal.innerHTML.includes('上级部门'));
  assert.ok(elements.modal.innerHTML.includes('工作邮箱'));
  assert.ok(elements.modal.innerHTML.includes('pl-sync-preview-head'));
  assert.ok(elements.modal.innerHTML.includes('id="pl-sync-users" type="checkbox"'));
  assert.ok(!elements.modal.innerHTML.includes('现有部门'));
  assert.ok(!elements.modal.innerHTML.includes('新增 / 移除'));
  assert.ok(!elements.modal.innerHTML.includes('pl-sync-impact'));
  assert.ok(!elements.modal.innerHTML.includes('用户新增 / 匹配更新'));
  assert.ok(elements.modal.innerHTML.includes('id="pl-sync-panel-users" class="pl-sync-preview-panel" role="tabpanel" aria-labelledby="pl-sync-tab-users" hidden'));
  assert.ok(elements.modal.innerHTML.includes('id="pl-sync-users" type="checkbox" checked'),'用户同步选择位于预览弹窗');
  assert.ok(!elements.modal.innerHTML.includes('我已了解现有组织架构将被覆盖'));
  elements['pl-sync-users']={checked:false};
  elements['pl-sync-panel-departments']={hidden:false};
  elements['pl-sync-panel-users']={hidden:true};
  elements['pl-sync-tab-departments']={setAttribute(name,value){this[name]=value},focus(){this.focused=true}};
  elements['pl-sync-tab-users']={setAttribute(name,value){this[name]=value},focus(){this.focused=true}};
  run("plOrgSyncPreviewTab('users',true)");
  assert.equal(elements['pl-sync-panel-departments'].hidden,true);
  assert.equal(elements['pl-sync-panel-users'].hidden,false);
  assert.equal(elements['pl-sync-tab-users']['aria-selected'],'true');
  assert.equal(elements['pl-sync-tab-users'].focused,true);
  assert.equal(elements['pl-sync-users'].checked,false,'切换预览不改变同步范围');
  run('plOrgSyncApply()');
  assert.equal(run('pl.workbuddy.departments.length'),6,'首次同步导入部门');
  assert.equal(run('mg.people.length'),0,'未勾选时不导入用户');
  assert.equal(run('pl.workbuddy.directoryInitialized'),true);
  assert.ok(run('wbPeopleView().includes("wb-people-shell")'),'已有部门时显示列表和部门树');
}

{
  const {elements,run}=harness(false);
  run('wbOpenDepartment()');
  assert.ok(elements.modal.innerHTML.includes('新建部门'));
  assert.ok(!elements.modal.innerHTML.includes('市场部</option>'),'首次手动创建不能带出演示部门');
  elements['wb-dept-name']={value:'自建部门'};
  elements['wb-dept-parent']={value:''};
  run('wbSaveDepartment()');
  assert.equal(run('pl.workbuddy.directoryInitialized'),true);
  assert.equal(run('pl.workbuddy.departments.length'),1);
  assert.equal(run('pl.workbuddy.departments[0].name'),'自建部门');
  assert.equal(run('mg.people.length'),0,'手动创建不应带入演示用户');
  assert.ok(run('wbPeopleView().includes("wb-people-shell")'));
}

{
  const {elements,run}=harness(false);
  elements['pl-sync-users']={checked:true};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),6,'首次同步由来源创建用户，而非直接展示演示样本');
  assert.equal(run('mgLedgerRows().length'),12,'同步后即使尚无实际消耗也展示演示流水');
  assert.ok(run('mgUsageLedger().includes("林立")'));
  assert.equal(run("mg.people.find(p=>p.name==='林立').department"),'青屿科技');
  assert.equal(run("plMeta(mg.people.find(p=>p.name==='林立')).role"),'超级管理员');
  assert.ok(run('wbPeopleView().includes("部门列表")'));
  assert.ok(!run('wbPeopleView().includes("wb-people-empty")'));
}

{
  const {elements,run}=harness();
  assert.equal(run('plOrgSyncPlan(true).existingCount'),4);
  assert.equal(run('plOrgSyncPlan(true).createUsers'),1);
  elements['pl-sync-users']={checked:true};
  elements['pl-sync-confirm']={checked:false};
  elements['pl-sync-phrase']={value:''};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),48,'未确认覆盖不得同步');
  assert.equal(run('pl.workbuddy.departments.length'),4,'未确认覆盖不得修改组织树');
  elements['pl-sync-confirm']={checked:true};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),48,'还须输入覆盖确认词');
  elements['pl-sync-phrase']={value:'覆盖'};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),49,'勾选同步用户时导入来源新成员');
  assert.equal(run('pl.workbuddy.departments.length'),6,'完整覆盖组织树');
  assert.equal(run("pl.workbuddy.departments.find(d=>d.name==='研发部').parentId"),'saas-product','保留来源层级');
  assert.equal(run("mg.people.find(p=>p.id==='u1').department"),'研发部','按邮箱匹配既有成员');
  assert.equal(run("pl.memberMeta.u6.role"),'超级管理员','保留管理员权限');
  assert.equal(run("pl.memberMeta.u2.scope"),'待配置','失效管理范围不应扩大权限');
  assert.equal(run("mg.people.find(p=>p.id==='u1').source"),'direct','组织同步保留现有席位');
  assert.equal(run('mgUsedSeats()'),38,'同步不得回收席位');
  assert.equal(run('mg.policies.length'),0);
  assert.equal(run('Object.keys(mg.budgets).length'),0);
  assert.equal(run("mg.people.find(p=>p.id==='u7').department"),'未归属部门','未匹配本地成员待重新归属');
  assert.equal(run("plMeta(mg.people.find(p=>p.id==='u5')).status"),'正常','同步不自动停用成员');
  assert.equal(run('pl.orgSync.history[0].createdUsers'),1);
  run("plUserPage=3;plSelectedUsers.add('u1');wbPeopleSelectDepartment('saas-product')");
  assert.equal(run('plUserDept'),'产品中心');
  assert.equal(run('plUserPage'),1,'切换部门回到第一页');
  assert.equal(run('plSelectedUsers.size'),0,'切换部门清除跨范围选择');
  assert.equal(run('plFilteredUsers().length'),run("mg.people.filter(p=>['产品中心','研发部','设计部'].includes(p.department)).length"),'选择父部门包含下级用户');
  assert.equal(run('wbPeopleDeptCount("产品中心")'),run('plFilteredUsers().length'));
  run("wbPeopleDeptQuery='研发'");
  assert.equal(run("wbPeopleDeptBranch().includes('研发部')"),true,'部门搜索保留匹配节点');
  assert.equal(run("wbPeopleDeptBranch().includes('市场部')"),false,'部门搜索隐藏不匹配分支');
  run("wbPeopleDeptQuery='';wbPeopleDeptCollapsed.add('saas-product')");
  assert.equal(run("wbPeopleDeptBranch().includes('研发部')"),false,'收起父部门隐藏下级节点');
  run("wbPeopleDeptCollapsed.clear()");
  run('plResetUserFilter()');
  assert.equal(run('plUserDept'),'产品中心','右侧重置保留左侧部门');
  run("wbPeopleSelectDepartment('all')");
  assert.equal(run('plFilteredUsers().length'),49);
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),49,'重复同步按来源 ID 匹配，不能重复导入');
  assert.ok(run("pl.events.some(e=>e.module==='组织同步')"));
}

{
  const {elements,run}=harness();
  elements['pl-sync-users']={checked:false};
  elements['pl-sync-confirm']={checked:true};
  elements['pl-sync-phrase']={value:'覆盖'};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),48,'不勾选用户时不创建成员');
  assert.equal(run("mg.people.find(p=>p.id==='u1').department"),'未归属部门','失效部门的本地成员需重新归属');
  assert.equal(run('pl.orgSync.history[0].withUsers'),false);
  assert.equal(run('pl.orgSync.history[0].updatedUsers'),0);
  assert.equal(run('mgUsedSeats()'),38,'仅同步组织也不回收原有席位');
  elements['pl-sync-users']={checked:true};
  run('plOrgSyncApply()');
  assert.equal(run('mg.people.length'),49,'后续可补同步来源用户');
  assert.equal(run("mg.people.find(p=>p.id==='u1').department"),'研发部');
}

{
  const {elements,run}=harness();
  elements['pl-sync-users']={checked:true};
  elements['pl-sync-confirm']={checked:true};
  elements['pl-sync-phrase']={value:'覆盖'};
  run("pl.memberMeta.u6.email='different@example.com'");
  assert.throws(()=>run('plOrgSyncPlan(true)'),/当前管理员与碳云 SaaS 组织不匹配/,'来源身份校验应阻止预览');
  run('plOrgSyncApply()');
  assert.equal(run('pl.workbuddy.departments.length'),4,'管理员不属于来源租户时不得覆盖组织');
  assert.equal(run('mg.people.length'),48);
  run("pl.memberMeta.u6.email='lin6@qingyu.ai';plSaasDirectory.departments[1].parentId='saas-rd'");
  run('plOrgSyncApply()');
  assert.equal(run('pl.workbuddy.departments.length'),4,'来源组织形成循环时不得写入');
}

{
  const {elements,run}=harness();
  elements['pl-confirm']={checked:true};
  const failed=run("pl.tasks.find(t=>t.status==='失败').id");
  run(`plSubmitRetry('${failed}')`);
  assert.equal(run("pl.tasks[0].status"),'运行中');
  assert.ok(run('pl.tasks.length')>11);
  const running=run("pl.tasks.find(t=>t.status==='运行中').id");
  run(`plSubmitCancel('${running}')`);
  assert.equal(run(`pl.tasks.find(t=>t.id==='${running}').status`),'已取消');

  elements['pl-failure-threshold']={value:'7'};
  elements['pl-duration-threshold']={value:'240'};
  elements['pl-notify']={value:'站内信'};
  run('plSubmitMonitorRule()');
  assert.equal(run('pl.monitor.failureThreshold'),7);
  assert.equal(run('pl.monitor.durationThreshold'),240);
}

{
  const {elements,run}=harness();
  const csv='userId,name,department,email,phone,username\n,"张,三",市场部,zhangsan@example.com,,zhang.san\nu2,更新成员,设计部,li.wanqing@qingyu.ai,,li.wanqing\nu2,重复更新,设计部,again@example.com,,again.user\nu999,无效更新,市场部,unknown@example.com,,unknown.user';
  const plan=run(`wbPlanImport(${JSON.stringify(csv)})`);
  assert.equal(plan.valid,2,'有效新增和更新应可执行');
  assert.equal(plan.invalid,2,'重复 ID 和不存在的更新目标应拦截');
  assert.equal(plan.rows[0].values.name,'张,三','CSV 引号内逗号应按字段内容处理');
  assert.ok(plan.rows[2].error.includes('userId'));
  assert.ok(plan.rows[3].error.includes('用户 ID 不存在'));
  run('wbStartImport()');
  assert.ok(elements.modal.innerHTML.includes('下载空白模板'));
  assert.ok(!elements.modal.innerHTML.includes('导出可更新成员'));
  run(`wbImportPlan=wbPlanImport(${JSON.stringify(csv)})`);
  run('wbApplyImport()');
  assert.equal(run('mg.people.length'),49);
  assert.equal(run("mg.people.find(p=>p.id==='u2').name"),'更新成员');
  assert.equal(run("mg.people.find(p=>p.id==='u2').department"),'设计部');
  assert.equal(run("mg.people.at(-1).name"),'张,三');
  assert.equal(run('pl.workbuddy.imports[0].failed'),2);
  assert.ok(run("pl.events.some(e=>e.action==='批量导入与更新成员')"));

  run("plSelectedUsers.add('u2');plSelectedUsers.add('u6')");
  elements['wb-batch-confirm']={checked:true};
  elements['wb-batch-type']={value:'disable'};
  run('wbSubmitBatchAction()');
  assert.equal(run("plMeta(mg.people.find(p=>p.id==='u2')).status"),'已停用');
  assert.equal(run("plMeta(mg.people.find(p=>p.id==='u6')).status"),'正常','企业创建人不受批量操作影响');
  assert.equal(run("mg.people.find(p=>p.id==='u2').source"),null);
}

{
  const {elements,run}=harness();
  elements['wb-dept-name']={value:'项目交付部'};
  elements['wb-dept-parent']={value:''};
  run('wbSaveDepartment()');
  assert.ok(run("mgDepartments.includes('项目交付部')"));
  const newId=run("pl.workbuddy.departments.find(d=>d.name==='项目交付部').id");
  elements['wb-dept-confirm']={checked:true};
  run(`wbDeleteDepartment(${JSON.stringify(newId)})`);
  assert.ok(!run("mgDepartments.includes('项目交付部')"));
  run("pl.workbuddy.departments.push(...Array.from({length:9},(_,i)=>({id:'q'+i,name:'层级'+i,parentId:i?'q'+(i-1):'d1'})))");
  elements['wb-dept-name']={value:run("wbDept('d1').name")};
  elements['wb-dept-parent']={value:'d2'};
  run("wbSaveDepartment('d1')");
  assert.equal(run("wbDept('d1').parentId"),null,'移动后子树超过十层时应阻止');
  assert.ok(elements['mg-error'].textContent.includes('10 层'));
  elements['wb-dept-parent']={value:''};
  run("wbDeleteDepartment('d1')");
  assert.ok(run("!!wbDept('d1')"),'有成员或子部门的部门不能删除');
}

{
  const {elements,run}=harness();
  assert.ok(run('wbRoles().includes("角色描述")'));
  assert.ok(run('wbRoles().includes("账号数量")'));
  assert.ok(run('wbRoles().includes("新增角色")'));
  assert.ok(!run('wbRoles().includes("管理员成员")'));
  assert.ok(!run('wbRoles().includes("权限边界")'));
  run('wbOpenRole()');
  assert.ok(elements.modal.innerHTML.includes('角色名称'));
  assert.ok(elements.modal.innerHTML.includes('角色描述'));
  assert.ok(elements.modal.innerHTML.includes('页面-功能权限配置'));
  elements['wb-role-title']={value:'审计专员'};
  elements['wb-role-description']={value:'查看任务与组织管理信息'};
  elements._roleChecks=[{value:'工作台:查看'},{value:'组织管理:查看'}];
  run('wbSaveRoleDefinition()');
  assert.equal(run("pl.workbuddy.roles.find(r=>r.name==='审计专员').permissions.length"),2);
  assert.ok(run("pl.events.some(e=>e.action==='新增角色')"));
  run('wbSaveRoleDefinition()');
  assert.equal(run("pl.workbuddy.roles.filter(r=>r.name==='审计专员').length"),1,'角色名称不可重复');
  const roleId=run("pl.workbuddy.roles.find(r=>r.name==='审计专员').id");
  run(`plMeta(mg.people[0]).role=${JSON.stringify('审计专员')}`);
  elements['wb-delete-role-confirm']={checked:true};
  run(`wbDeleteRole(${JSON.stringify(roleId)})`);
  assert.equal(run("pl.workbuddy.roles.some(r=>r.name==='审计专员')"),true,'被账号使用的角色不可删除');
  run(`plMeta(mg.people[0]).role='成员'`);
  run(`wbDeleteRole(${JSON.stringify(roleId)})`);
  assert.equal(run("pl.workbuddy.roles.some(r=>r.name==='审计专员')"),false);
  assert.ok(!run('wbSubscription().includes("最近用量明细")'));
  assert.ok(run('wbSubscription().includes("所有订单记录")'));
  assert.ok(run('wbSubscription().includes("开具发票")'));
  assert.ok(run('wbSubscription().includes("开票记录")'));
  run("wbBillingChangeTab('invoices')");
  assert.equal(run('wbVisibleInvoices().length'),3,'开票记录初始有三条演示数据');
  assert.ok(run('wbSubscription().includes("INV-DEMO-20261008-002")'));
  assert.ok(!run('wbInvoicePanel().includes("<th>关联订单</th>")'));
  assert.ok(!run('wbInvoicePanel().includes("<th>发票号码</th>")'));
  run("wbOpenInvoice('INV-DEMO-20261008-002')");
  assert.ok(!elements.modal.innerHTML.includes('关联订单'));
  assert.ok(!elements.modal.innerHTML.includes('发票号码'));
  run("wbInvoiceSetStatus('opening')");
  assert.equal(run('wbVisibleInvoices().length'),1);
  run("wbInvoiceSetStatus('issued')");
  assert.equal(run('wbVisibleInvoices().length'),2);
  run("wbInvoiceSetStatus('all')");
  elements['wb-invoice-search']={value:'INV-DEMO-20260922-001'};
  run('wbInvoiceSearchApply()');
  assert.equal(run('wbVisibleInvoices().length'),1,'可按发票 ID 搜索');
  run('wbInvoiceSearchReset()');
  assert.ok(!run('wbSubscription().includes("wb-order-type")'));
  run("wbBillingChangeTab('orders')");
  assert.ok(!run('wbOrderPanel().includes("wb-order-type")'),'订单页不展示类型筛选');
  assert.ok(!run('wbOrderPanel().includes("条订单")'),'订单页不展示顶部条数栏');
  for(const label of ['订阅席位','本期积分','本期已消耗','可用余额'])assert.ok(!run(`wbSubscription().includes('${label}')`),`${label} 统计卡已移除`);
  assert.equal(run('wbSubscriptionOrders().length'),2);
  assert.equal(run('wbInvoiceEligibleOrders().length'),1,'免费试用订单不可开票');
  run('wbOpenInvoicePicker()');
  assert.ok(elements.modal.innerHTML.includes('选择未开票订单'));
  assert.ok(!elements.modal.innerHTML.includes('ORD-20260718-001'));
  run("wbToggleInvoiceOrder('ORD-20261013-001',true)");
  assert.equal(elements['wb-invoice-next'].disabled,false);
  run('wbContinueInvoice()');
  assert.ok(elements.content.innerHTML.includes('发票信息'));
  elements['wb-invoice-title']={value:'青屿科技'};
  elements['wb-invoice-tax-id']={value:'91310110MA1G123456'};
  elements['wb-invoice-email']={value:'finance@qingyu.ai'};
  run('wbSubmitInvoice()');
  assert.equal(run('pl.workbuddy.subscription.invoices.length'),1,'演示记录不写入申请数据');
  assert.equal(run('wbVisibleInvoices().length'),4,'新申请与演示记录一起展示');
  assert.equal(run('wbInvoiceEligibleOrders().length'),0,'已申请订单不能重复开票');
  assert.ok(run('wbSubscription().includes("开票申请中")'));
  for(const value of ['青屿科技','91310110MA1G123456','finance@qingyu.ai'])assert.ok(run(`wbSubscription().includes(${JSON.stringify(value)})`),`开票记录显示 ${value}`);
  assert.ok(!run('wbInvoicePanel().includes("ORD-20261013-001")'),'开票列表不显示关联订单');
  run("wbBillingChangeTab('orders')");
  assert.ok(run('wbSubscription().includes("开票申请中")'),'订单列表同步显示开票状态');
  run("mg.seatExpansionOrders.push({id:'SO-TEST',time:'2026-10-15 12:00',quantity:2,total:176,periodStart:'2026-10-15',periodEnd:'2027-10-12',status:'模拟已生效'})");
  assert.ok(run("wbSubscriptionOrders().some(o=>o.id==='SO-TEST'&&o.type==='席位扩容')"));
  run("plOverviewRange='custom';plOverviewStart='2026-10-14';plOverviewEnd='2026-10-14'");
  assert.equal(run('plOverviewTasks().length'),1);
  assert.ok(run('plDataOverview().includes("统计时间")'));
  assert.ok(!run('plDataOverview().includes("运行信号")'));
  run("page='data_overview';plOverviewStart='2026-10-15';plOverviewEnd='2026-10-15'");
  const runs=run('plMonitorRuns()');
  const columns=['开始时间','对话 ID','成员','智能体','会话主题','轮次','状态','积分','操作'];
  assert.ok(columns.every((column,index)=>runs.indexOf(`<th>${column}</th>`)>=0&&(index===0||runs.indexOf(`<th>${columns[index-1]}</th>`)<runs.indexOf(`<th>${column}</th>`))),'最近执行列顺序与参考图一致');
  assert.ok(runs.includes('C-20261015-0862'));
  assert.ok(runs.includes('>详情</button>'));
  run("plMonitorQuery='C-20261015-0862'");
  assert.equal(run('plFilteredTasks().length'),1,'对话 ID 可用于搜索');
  run("plMonitorQuery=''");
  assert.ok(!run('plSettingsProfile().includes("企业资料")'));
}

console.log('Carbon Agent platform tests passed');

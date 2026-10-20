/* Carbon Cloud SaaS organization sync. Source and results are local prototype data. */
const plSaasDirectory={
  tenantId:'SAAS-QY-001',agentOrgId:'ORG-8C29F4',orgName:'青屿科技',adminId:'saas-u6',adminName:'林立',adminEmail:'lin6@qingyu.ai',capturedAt:'2026-10-15 10:30',
  departments:[
    {id:'saas-root',name:'青屿科技',parentId:null},
    {id:'saas-product',name:'产品中心',parentId:'saas-root'},
    {id:'saas-rd',name:'研发部',parentId:'saas-product'},
    {id:'saas-design',name:'设计部',parentId:'saas-product'},
    {id:'saas-market',name:'市场部',parentId:'saas-root'},
    {id:'saas-finance',name:'财务部',parentId:'saas-root'}
  ],
  users:[
    {id:'saas-u6',name:'林立',email:'lin6@qingyu.ai',departmentId:'saas-root'},
    {id:'saas-u1',name:'陈思远',email:'chen1@qingyu.ai',departmentId:'saas-rd'},
    {id:'saas-u2',name:'李宛清',email:'li2@qingyu.ai',departmentId:'saas-market'},
    {id:'saas-u3',name:'王越',email:'wang3@qingyu.ai',departmentId:'saas-finance'},
    {id:'saas-u5',name:'周启明',email:'zhou5@qingyu.ai',departmentId:'saas-design'},
    {id:'saas-u49',name:'余清舟',email:'yuqingzhou@qingyu.ai',departmentId:'saas-rd'}
  ]
};
function plOrgSyncSeed(){return {version:2,last:null,history:[]}}
if(!pl.orgSync||pl.orgSync.version!==2)pl.orgSync=plOrgSyncSeed();
pl.orgSync.history ||= [];
const plOrgUnassigned='未归属部门';
function plOrgSyncValidate(){
  const src=plSaasDirectory,depts=src.departments,users=src.users,ids=new Set(),names=new Set(),emails=new Set(),userIds=new Set();
  if(!depts.length||depts.length>1000||users.length>10000)throw new Error('碳云 SaaS 组织数据超出同步范围');
  for(const d of depts){if(!d.id||!d.name||ids.has(d.id)||names.has(d.name))throw new Error('来源部门 ID 或名称重复');ids.add(d.id);names.add(d.name)}
  for(const d of depts){let parent=d.parentId,depth=1,seen=new Set([d.id]);while(parent){if(!ids.has(parent)||seen.has(parent)||++depth>10)throw new Error('来源组织层级无效');seen.add(parent);parent=depts.find(x=>x.id===parent).parentId}}
  if(depts.filter(d=>!d.parentId).length!==1)throw new Error('来源组织必须有且仅有一个根节点');
  for(const u of users){const email=String(u.email||'').trim().toLowerCase();if(!u.id||userIds.has(u.id)||!u.name||!/^\S+@\S+\.\S+$/.test(email)||emails.has(email)||!ids.has(u.departmentId))throw new Error('来源用户数据无效或重复');userIds.add(u.id);emails.add(email)}
  if(!users.some(u=>u.id===src.adminId&&u.email.toLowerCase()===src.adminEmail))throw new Error('当前管理员不在来源组织中');
  const localAdmin=mg.people.find(p=>p.name===src.adminName&&plMeta(p).role==='超级管理员'&&plMeta(p).status!=='已删除');
  if(pl.org.id!==src.agentOrgId||pl.org.owner!==src.adminName||(localAdmin&&plMeta(localAdmin).email?.toLowerCase()!==src.adminEmail))throw new Error('当前管理员与碳云 SaaS 组织不匹配');
  return true;
}
function plOrgSyncMatch(u){if(!pl.workbuddy.directoryInitialized)return null;return mg.people.find(p=>pl.memberMeta[p.id]?.carbonSaasUserId===u.id&&plMeta(p).status!=='已删除')||mg.people.find(p=>pl.memberMeta[p.id]?.email?.toLowerCase()===u.email.toLowerCase()&&plMeta(p).status!=='已删除')}
function plOrgSyncPlan(withUsers=true){
  plOrgSyncValidate();
  const src=plSaasDirectory,depts=src.departments,byId=new Map(depts.map(d=>[d.id,d.name])),nextNames=new Set(depts.map(d=>d.name)),existing=pl.workbuddy.directoryInitialized?(pl.workbuddy.departments||[]):[],oldNames=new Set(existing.map(d=>d.name));
  const removed=existing.filter(d=>!nextNames.has(d.name)),added=depts.filter(d=>!oldNames.has(d.name)),sourceUsers=withUsers?src.users:[];
  const matches=sourceUsers.map(u=>plOrgSyncMatch(u)),matchedIds=new Set(matches.filter(Boolean).map(p=>p.id));
  const unassigned=pl.workbuddy.directoryInitialized?mg.people.filter(p=>!matchedIds.has(p.id)&&!nextNames.has(p.department)&&plMeta(p).status!=='已删除').length:0;
  const scopedAdmins=pl.workbuddy.directoryInitialized?mg.people.filter(p=>plMeta(p).role==='部门管理员'&&!nextNames.has(plMeta(p).scope||p.department)).length:0;
  return {withUsers,existingCount:existing.length,departments:depts.map(d=>({...d,created:new Date().toISOString().slice(0,10),source:'carbon_saas'})),sourceUsers,byId,removed,added,createUsers:matches.filter(x=>!x).length,updateUsers:matches.filter(Boolean).length,unassigned,scopedAdmins};
}
function plOrgSyncDepartmentPreview(plan){const source=plSaasDirectory.departments,byId=new Map(source.map(d=>[d.id,d])),existing=new Set(pl.workbuddy.directoryInitialized?pl.workbuddy.departments.map(d=>d.name):[]);return `<div class="pl-sync-table-wrap"><table class="mg-table pl-table"><thead><tr><th>部门名称</th><th>上级部门</th><th>层级</th><th>来源用户</th><th>同步结果</th></tr></thead><tbody>${source.map(d=>{let depth=1,parent=d.parentId;while(parent&&depth<10){depth++;parent=byId.get(parent)?.parentId}return `<tr><td><b>${mgEsc(d.name)}</b></td><td>${mgEsc(byId.get(d.parentId)?.name||'—')}</td><td>第 ${depth} 层</td><td>${plSaasDirectory.users.filter(u=>u.departmentId===d.id).length} 人</td><td>${plBadge(existing.has(d.name)?'更新':'新增')}</td></tr>`}).join('')}</tbody></table></div>`}
function plOrgSyncUserPreview(){return `<div class="pl-sync-table-wrap"><table class="mg-table pl-table"><thead><tr><th>姓名</th><th>工作邮箱</th><th>来源部门</th><th>匹配结果</th></tr></thead><tbody>${plSaasDirectory.users.map(u=>`<tr><td><b>${mgEsc(u.name)}</b></td><td>${mgEsc(u.email)}</td><td>${mgEsc(plSaasDirectory.departments.find(d=>d.id===u.departmentId)?.name)}</td><td>${plBadge(plOrgSyncMatch(u)?'更新':'新增')}</td></tr>`).join('')}</tbody></table></div>`}
function plOrgSyncPreviewTabs(plan,withUsers){return `<div class="pl-sync-preview-head"><div class="pl-sync-preview-tabs" role="tablist" aria-label="同步数据预览"><button id="pl-sync-tab-departments" type="button" role="tab" aria-selected="true" aria-controls="pl-sync-panel-departments" tabindex="0" onclick="plOrgSyncPreviewTab('departments')" onkeydown="if(event.key==='ArrowRight'){event.preventDefault();plOrgSyncPreviewTab('users',true)}">部门预览 <span>${plan.departments.length}</span></button><button id="pl-sync-tab-users" type="button" role="tab" aria-selected="false" aria-controls="pl-sync-panel-users" tabindex="-1" onclick="plOrgSyncPreviewTab('users')" onkeydown="if(event.key==='ArrowLeft'){event.preventDefault();plOrgSyncPreviewTab('departments',true)}">用户预览 <span>${plSaasDirectory.users.length}</span></button></div><label class="pl-sync-inline-toggle" title="按碳云 SaaS 用户 ID 或工作邮箱匹配；新增用户不自动占用席位"><input id="pl-sync-users" type="checkbox" ${withUsers?'checked':''}> 同时同步用户</label></div><section id="pl-sync-panel-departments" class="pl-sync-preview-panel" role="tabpanel" aria-labelledby="pl-sync-tab-departments">${plOrgSyncDepartmentPreview(plan)}</section><section id="pl-sync-panel-users" class="pl-sync-preview-panel" role="tabpanel" aria-labelledby="pl-sync-tab-users" hidden>${plOrgSyncUserPreview()}</section>`}
function plOrgSyncPreviewTab(tab,focus=false){if(!['departments','users'].includes(tab))return;for(const name of ['departments','users']){const panel=document.getElementById('pl-sync-panel-'+name),button=document.getElementById('pl-sync-tab-'+name);if(panel)panel.hidden=name!==tab;if(button){button.setAttribute('aria-selected',String(name===tab));button.tabIndex=name===tab?0:-1;if(name===tab&&focus)button.focus()}}}
function plOrgSyncOpenPreview(withUsers=true){
  let p;try{p=plOrgSyncPlan(withUsers)}catch(e){return mgError(e.message)}
  const src=plSaasDirectory;
  plModal('预览碳云 SaaS 组织同步',`来源：${src.orgName} · 当前管理员 ${src.adminName}。请核对同步内容。`,`<div class="pl-sync-summary-grid"><div><span>来源部门</span><b>${p.departments.length} 个</b></div><div><span>来源用户</span><b>${src.users.length} 人</b></div></div>${plOrgSyncPreviewTabs(p,withUsers)}${p.existingCount?`${mgCallout('!','已有组织架构，需确认覆盖','继续后将以碳云 SaaS 的完整组织树覆盖现有部门。','warning')}<label class="mg-confirm"><input id="pl-sync-confirm" type="checkbox"> 我已了解现有组织架构将被覆盖</label><label class="field">输入“覆盖”以确认<input id="pl-sync-phrase" autocomplete="off" placeholder="覆盖"></label>`:''}`,`<button class="btn primary" onclick="plOrgSyncApply()">确认同步</button>`);
}
function plOrgSyncApply(){
  let p;try{p=plOrgSyncPlan(!!document.getElementById('pl-sync-users')?.checked)}catch(e){return mgError(e.message)}
  if(p.existingCount&&(!document.getElementById('pl-sync-confirm')?.checked||document.getElementById('pl-sync-phrase')?.value?.trim()!=='覆盖'))return mgError('请勾选覆盖确认，并输入“覆盖”');
  const src=plSaasDirectory,stamp=new Date().toLocaleString('zh-CN',{hour12:false}),nextNames=new Set(p.departments.map(d=>d.name)),matched=new Set();
  const assignments=p.sourceUsers.map(u=>({source:u,member:plOrgSyncMatch(u),department:p.byId.get(u.departmentId)}));
  const firstSetup=!pl.workbuddy.directoryInitialized,oldScopes=new Map(firstSetup?[]:mg.people.map(x=>[x.id,plMeta(x).scope||x.department]));
  const newMembers=firstSetup?[]:mg.people.map(x=>({...x})),newMeta=firstSetup?{}:Object.fromEntries(Object.entries(pl.memberMeta).map(([id,m])=>[id,{...m}]));let nextId=Math.max(0,...newMembers.map(x=>Number(x.id.slice(1))||0));
  for(const {source:u,member,department} of assignments){if(member){const x=newMembers.find(x=>x.id===member.id);x.name=u.name;x.department=department;matched.add(x.id);Object.assign(newMeta[x.id],{email:u.email.toLowerCase(),carbonSaasUserId:u.id,externalSource:'carbon_saas',orgSyncReview:false})}else{const id='u'+(++nextId);newMembers.push({id,name:u.name,department,source:null,excluded:false,quota:25000,used:0,lastLogin:'—'});newMeta[id]={email:u.email.toLowerCase(),role:u.id===src.adminId?'超级管理员':'成员',status:u.id===src.adminId?'正常':'待激活',created:new Date().toISOString().slice(0,10),carbonSaasUserId:u.id,externalSource:'carbon_saas',orgSyncReview:false};matched.add(id)}}
  let unassigned=0;for(const x of newMembers){if(!matched.has(x.id)&&!nextNames.has(x.department)){x.department=plOrgUnassigned;newMeta[x.id]={...newMeta[x.id],orgSyncReview:true};if(newMeta[x.id].status!=='已删除')unassigned++}const m=newMeta[x.id];if(m?.role==='部门管理员'&&!nextNames.has(oldScopes.get(x.id)||x.department)){m.scope='待配置';m.orgSyncReview=true}}
  pl.workbuddy.directoryInitialized=true;pl.workbuddy.departments=p.departments;mgDepartments.splice(0,mgDepartments.length,...p.departments.map(d=>d.name));mg.people=newMembers;pl.memberMeta=newMeta;
  const result={id:'SYNC-'+Date.now(),time:stamp,withUsers:p.withUsers,departments:p.departments.length,createdUsers:p.createUsers,updatedUsers:p.updateUsers,unassigned,result:'成功',actor:src.adminName};pl.orgSync.last=result;pl.orgSync.history.unshift(result);pl.orgSync.history=pl.orgSync.history.slice(0,20);
  mgSeatDepartment='all';mgUsageDepartment='all';plUserDept='all';mgSelectedSeats.clear();mgSelectedUsage.clear();plSelectedUsers.clear();mgSave();plLog('组织同步','从碳云 SaaS 同步组织',`${src.orgName} / ${p.withUsers?'含用户':'仅部门'} / 覆盖 ${p.existingCount} 个部门`);closeModal();plRefresh();toast(`同步完成：${p.departments.length} 个部门${p.withUsers?`，新增 ${p.createUsers} 位用户`:''}`);
}

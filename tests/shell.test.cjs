const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'inline shell script exists');
assert.ok(html.includes('management.css')&&html.includes('platform.css')&&html.includes('tdesign.css'));
assert.ok(html.indexOf('platform.css')<html.indexOf('tdesign.css'),'TDesign theme overrides the base layout');
const theme=fs.readFileSync(path.join(root,'tdesign.css'),'utf8');
for(const token of ['--td-brand-color:#0052d9','--td-success-color:','--td-warning-color:','--td-error-color:'])assert.ok(theme.includes(token));
assert.ok(html.indexOf('management.js')<html.indexOf('platform.js'));
assert.ok(html.indexOf('platform.js')<html.indexOf('orgsync.js'));
assert.ok(html.indexOf('orgsync.js')<html.indexOf('workbuddy.js'));
assert.ok(html.indexOf('workbuddy.js')<html.indexOf('seat-expansion.js'));

const nodes={};
const document={
  body:{classList:{remove(){},add(){},toggle(){},contains(){return false}}},
  getElementById:id=>nodes[id]||(nodes[id]={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}}}),
  querySelector:()=>({textContent:'',setAttribute(){}}),
  querySelectorAll:()=>[],addEventListener(){}
};
const storage={};
const context={console,Date,Intl,Set,Math,JSON,Number,String,Array,Object,document,window:{scrollY:0,scrollTo(){}},
  localStorage:{getItem:k=>storage[k],setItem:(k,v)=>{storage[k]=v}},setTimeout:()=>0,clearTimeout(){}};
vm.createContext(context);
for(const code of [inline,...['management.js','platform.js','orgsync.js','workbuddy.js','seat-expansion.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8'))])vm.runInContext(code,context);

for(const [key,label] of [['overview','工作台'],['users','用户列表'],['roles','角色管理'],['seat_management','席位管理'],['resource_points','积分管理'],['subscription','订单记录'],['enterprise_info','企业信息'],['data_overview','数据概览'],['operation_logs','操作日志']]){
  vm.runInContext(`go('${key}')`,context);
  assert.ok(nodes.content.innerHTML.includes(label),`${label} renders through shell`);
  assert.equal(nodes.crumb.textContent,label);
  assert.ok(nodes.nav.innerHTML.includes(label));
}
for(const group of ['用户管理','配额管理','企业设置','运行监控','日志管理'])assert.ok(nodes.nav.innerHTML.includes(group));
for(const removed of ['组织同步','安全管理','访问控制','用户组','能力拓展管理','文件管理','登录认证','登陆认证','管理员设置','访问域名'])assert.ok(!nodes.nav.innerHTML.includes(removed),`${removed} should not appear in navigation`);
assert.equal(vm.runInContext('JSON.stringify(items.map(x=>x[1]))',context),JSON.stringify(['工作台','用户列表','角色管理','席位管理','积分管理','订单记录','企业信息','数据概览','操作日志']));
assert.ok(!nodes.nav.innerHTML.includes('对话日志'));
assert.ok(!nodes.nav.innerHTML.includes('部门管理'),'部门管理不再作为独立导航');
vm.runInContext("go('departments')",context);
assert.equal(nodes.crumb.textContent,'用户列表','旧部门入口跳转合并页');
assert.ok(nodes.content.innerHTML.includes('同步碳云 SaaS 组织架构'),'首次进入用户列表显示空状态');
document.getElementById('pl-sync-users').checked=true;
vm.runInContext('plOrgSyncApply()',context);
assert.equal(vm.runInContext('mg.people.length',context),6);
assert.ok(nodes.content.innerHTML.includes('部门列表'),'同步后初始化有数据的列表');
vm.runInContext("go('members')",context);
assert.equal(nodes.crumb.textContent,'用户列表');
vm.runInContext("go('org_sync')",context);
assert.equal(nodes.crumb.textContent,'用户列表','旧组织同步入口跳转用户列表');
vm.runInContext("go('monitor')",context);
assert.equal(nodes.crumb.textContent,'数据概览');
vm.runInContext("go('logs')",context);
assert.equal(nodes.crumb.textContent,'操作日志');
vm.runInContext("go('conversation_logs')",context);
assert.equal(nodes.crumb.textContent,'数据概览','旧对话日志入口跳转数据概览');
vm.runInContext("go('seat_expansion')",context);
assert.equal(nodes.crumb.textContent,'席位管理 / 扩容席位');
assert.ok(nodes.content.innerHTML.includes('扩容摘要'));
assert.ok(nodes.nav.innerHTML.includes('配额管理'));
for(const [call,expected] of [['plOpenAddUser()','添加用户'],['plOpenProfile()','编辑企业资料'],['plOpenDomain()','修改企业访问域名'],['plOpenMonitorRule()','运行预警规则']]){
  vm.runInContext(call,context);
  assert.ok(nodes.modal.innerHTML.includes(expected),`${expected} modal renders`);
}
console.log('Carbon Agent shell navigation tests passed');

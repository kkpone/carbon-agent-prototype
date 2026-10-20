# Carbon Agent 原型

企业管理后台与相关购买流程的静态交互原型。主入口为 [index.html](./index.html)。

## 预览

直接用浏览器打开 `index.html`，或在本目录运行：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000/`。原型使用本地演示数据，部分操作写入浏览器 `localStorage`，不连接正式服务。

## 其他页面

- [企业购买流程](./enterprise-purchase.html)
- [智能体商店](./agent-store.html)
- [SaaS 智能体页面](./saas-agent.html)

## 文档与检查

- [企业管理后台 PRD](./Carbon_Agent_企业管理后台_PRD.md)
- [当前原型产品需求文档](./Carbon%20Agent%20产品需求文档（当前原型）.md)

运行原型检查：

```bash
for file in tests/*.test.cjs; do node "$file" || exit 1; done
```

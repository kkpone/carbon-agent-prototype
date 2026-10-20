"""Build a self-contained, static Carbon Agent demo for GitHub Pages."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "public-preview"
ASSETS = (
    "agent-store.html",
    "agent-store.css",
    "agent-store.js",
    "enterprise-purchase.html",
    "enterprise-purchase.css",
    "enterprise-purchase.js",
    "management.css",
    "management.js",
    "platform.css",
    "platform.js",
    "orgsync.js",
    "workbuddy.js",
    "seat-expansion.js",
    "tdesign.css",
    "saas-agent.html",
    "saas-agent.css",
    "carbon-agent-widget.js",
    "carbon-agent-widget.css",
)


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    for name in ASSETS:
        shutil.copy2(ROOT / name, OUTPUT / name)

    admin_page = (ROOT / "index.html").read_text(encoding="utf-8")
    (OUTPUT / "admin.html").write_text(admin_page, encoding="utf-8")

    checkout = OUTPUT / "enterprise-purchase.html"
    content = checkout.read_text(encoding="utf-8")
    old = 'id="management-link" class="confirmation-primary" href="index.html"'
    assert content.count(old) == 1, "Management link must be updated for public preview"
    checkout.write_text(content.replace(old, old.replace('index.html', 'admin.html')), encoding="utf-8")

    (OUTPUT / "index.html").write_text(
        '<!doctype html>\n<html lang="zh-CN">\n<head>\n'
        '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta http-equiv="refresh" content="0; url=agent-store.html">\n'
        '<title>Carbon Agent 原型</title>\n</head>\n<body>\n'
        '<p><a href="agent-store.html">进入 Carbon Agent 原型</a></p>\n'
        '</body>\n</html>\n',
        encoding="utf-8",
    )
    (OUTPUT / ".nojekyll").touch()
    (OUTPUT / "README.md").write_text(
        "# Carbon Agent 公开预览\n\n"
        "此仓库只包含静态演示页面和示例数据。购买配置不会创建真实订单或发起支付。\n\n"
        "- [Carbon Agent 前台](./agent-store.html)\n"
        "- [企业版购买配置](./enterprise-purchase.html)\n"
        "- [企业管理后台](./admin.html)\n"
        "- [碳云工作台集成演示](./saas-agent.html)\n\n"
        "GitHub Pages 可设置为从 main 分支的根目录发布。\n",
        encoding="utf-8",
    )
    print(f"Built {len(ASSETS) + 4} public preview files in {OUTPUT}")


if __name__ == "__main__":
    main()

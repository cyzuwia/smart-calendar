# GitHub 仓库上传指南

本指南将帮助您将智能科技日历系统上传到 GitHub 仓库，以便于版本管理和部署。

## 目录
1. [准备工作](#准备工作)
2. [创建 GitHub 仓库](#创建-github-仓库)
3. [初始化本地仓库](#初始化本地仓库)
4. [添加文件并提交](#添加文件并提交)
5. [推送到 GitHub](#推送到-github)
6. [配置 GitHub Pages (可选)](#配置-github-pages-可选)
7. [持续集成/持续部署 (可选)](#持续集成持续部署-可选)

## 准备工作

在开始之前，请确保您已经：

1. 安装了 Git
2. 拥有 GitHub 账号
3. 配置了 Git 的用户名和邮箱

如果尚未配置 Git，请运行以下命令：

```bash
git config --global user.name "您的名字"
git config --global user.email "您的邮箱"
```

## 创建 GitHub 仓库

1. 登录 GitHub 账号
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `smart-calendar` (或您喜欢的名称)
   - Description: 智能科技日历系统 - 现代化的日历应用，支持多种通知方式和自定义事件
   - 选择 "Public" 或 "Private"
   - 勾选 "Add a README file"
   - 勾选 "Add .gitignore" 并选择 "Node"
   - 勾选 "Choose a license" 并选择适合的开源许可证（如 MIT License）
4. 点击 "Create repository" 按钮

## 初始化本地仓库

1. 进入项目目录：

```bash
cd /path/to/smart-calendar
```

2. 初始化 Git 仓库：

```bash
git init
```

3. 添加 `.gitignore` 文件（如果尚未创建）：

```bash
cat > .gitignore << EOF
# 依赖包
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
package-lock.json

# 构建输出
dist/
build/
frontend/dist/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 数据库文件
*.db
*.sqlite

# 日志文件
logs/
*.log

# 编辑器配置
.idea/
.vscode/
*.swp
*.swo

# 操作系统文件
.DS_Store
Thumbs.db
EOF
```

4. 添加 README.md 文件（如果尚未创建）：

```bash
cat > README.md << EOF
# 智能科技日历系统

现代化的智能科技日历应用，支持多种通知方式和自定义事件。

## 主要功能

- 实时显示当前时间，精确到秒
- 事件添加和提醒功能
- 支持阴历和阳历生日管理
- 值日表管理功能
- 多种通知方式（WxPusher、邮件、Telegram）
- 完善的后台管理系统

## 技术栈

- 前端：Vue.js 3 + Element Plus
- 后端：Node.js + Express
- 数据库：SQLite
- 通知系统：WxPusher、邮件、Telegram

## 部署指南

详细的部署指南请参考 [部署文档](docs/deployment_guide.md)。

## 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件。
EOF
```

## 添加文件并提交

1. 添加所有文件到暂存区：

```bash
git add .
```

2. 提交更改：

```bash
git commit -m "初始提交：智能科技日历系统"
```

## 推送到 GitHub

1. 添加远程仓库：

```bash
git remote add origin https://github.com/您的用户名/smart-calendar.git
```

2. 拉取远程仓库的更改（如果有）：

```bash
git pull origin main --rebase
```

3. 推送到 GitHub：

```bash
git push -u origin main
```

如果您的默认分支是 `master` 而不是 `main`，请相应地调整命令。

## 配置 GitHub Pages (可选)

如果您希望通过 GitHub Pages 展示项目文档，可以按照以下步骤操作：

1. 在项目根目录创建 `docs` 文件夹（如果尚未创建）
2. 将文档文件放入 `docs` 文件夹
3. 在 GitHub 仓库页面，点击 "Settings"
4. 滚动到 "GitHub Pages" 部分
5. 在 "Source" 下拉菜单中选择 "main branch /docs folder"
6. 点击 "Save" 按钮

文档将在 `https://您的用户名.github.io/smart-calendar/` 可访问。

## 持续集成/持续部署 (可选)

您可以配置 GitHub Actions 来自动化测试和部署流程：

1. 在项目根目录创建 `.github/workflows` 文件夹：

```bash
mkdir -p .github/workflows
```

2. 创建 CI 工作流文件：

```bash
cat > .github/workflows/ci.yml << EOF
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x]

    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: \${{ matrix.node-version }}
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    - name: Run backend tests
      run: |
        cd backend
        npm test
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    - name: Build frontend
      run: |
        cd frontend
        npm run build
EOF
```

3. 提交并推送这些更改：

```bash
git add .github/workflows/ci.yml
git commit -m "添加 GitHub Actions CI 工作流"
git push
```

现在，每当您推送到 `main` 分支或创建针对 `main` 分支的拉取请求时，GitHub Actions 将自动运行测试和构建过程。

---

完成以上步骤后，您的智能科技日历系统将成功上传到 GitHub 仓库，并可以通过 GitHub 进行版本管理和协作开发。

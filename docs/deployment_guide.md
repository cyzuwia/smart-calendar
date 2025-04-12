# 智能科技日历系统部署文档

## 目录
1. [系统概述](#系统概述)
2. [系统要求](#系统要求)
3. [部署方式](#部署方式)
   - [方式一：GitHub仓库克隆部署](#方式一github仓库克隆部署)
   - [方式二：一键部署脚本](#方式二一键部署脚本)
4. [系统配置](#系统配置)
5. [通知服务配置](#通知服务配置)
6. [常见问题](#常见问题)
7. [维护指南](#维护指南)

## 系统概述

智能科技日历系统是一个现代化的日历应用，具有以下特点：

- 实时显示当前时间，精确到秒
- 事件添加和提醒功能
- 支持阴历和阳历生日管理
- 值日表管理功能
- 多种通知方式（WxPusher、邮件、Telegram）
- 完善的后台管理系统

系统采用前后端分离架构，前端使用Vue.js，后端使用Node.js和SQLite数据库，具有轻量级、高效、易部署的特点。

## 系统要求

### 最低VPS配置要求

- CPU: 1核
- 内存: 1GB
- 存储: 10GB
- 操作系统: Ubuntu 20.04 LTS或更高版本

### 软件要求

- Node.js 14.x或更高版本
- npm 6.x或更高版本
- Git

## 部署方式

### 方式一：GitHub仓库克隆部署

#### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/smart-calendar.git
cd smart-calendar
```

#### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 3. 配置环境变量

创建后端环境变量文件：

```bash
cd ../backend
cp .env.example .env
```

编辑`.env`文件，设置必要的环境变量：

```
PORT=3000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production

# 通知服务配置
WXPUSHER_APP_TOKEN=your_wxpusher_app_token
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

#### 4. 构建前端

```bash
cd ../frontend
npm run build
```

#### 5. 启动服务

```bash
# 启动后端服务
cd ../backend
npm start

# 或者使用PM2进行进程管理
npm install -g pm2
pm2 start server.js --name smart-calendar
```

#### 6. 访问系统

前端访问地址：`http://your_server_ip:3000`
后台管理地址：`http://your_server_ip:3000/admin`

### 方式二：一键部署脚本

我们提供了一键部署脚本，可以自动完成所有部署步骤。

#### 1. 下载部署脚本

```bash
curl -O https://raw.githubusercontent.com/yourusername/smart-calendar/main/deploy.sh
chmod +x deploy.sh
```

#### 2. 运行部署脚本

```bash
./deploy.sh
```

脚本会自动执行以下操作：
- 安装必要的系统依赖
- 克隆代码仓库
- 安装Node.js依赖
- 配置环境变量
- 构建前端代码
- 启动后端服务
- 配置Nginx反向代理（如果选择）

#### 3. 按照提示完成配置

脚本运行过程中会提示您输入必要的配置信息，如：
- 服务器域名或IP
- JWT密钥
- 通知服务配置信息
- 是否配置SSL

#### 4. 访问系统

部署完成后，脚本会显示访问地址。

## 系统配置

### 数据库配置

系统默认使用SQLite数据库，无需额外配置。数据库文件位于`backend/database/calendar.db`。

如果需要使用其他数据库（如MySQL或PostgreSQL），请修改`backend/database/init.js`文件。

### 端口配置

默认端口为3000，可以通过修改`.env`文件中的`PORT`变量来更改。

### 安全配置

1. JWT密钥：修改`.env`文件中的`JWT_SECRET`变量
2. 管理员账户：默认管理员账户为admin/admin123，首次登录后请立即修改密码

## 通知服务配置

### WxPusher配置

1. 访问[WxPusher官网](https://wxpusher.zjiecode.com)注册账号
2. 创建一个应用，获取AppToken
3. 将AppToken填入`.env`文件的`WXPUSHER_APP_TOKEN`变量
4. 在系统后台的通知设置中配置用户UID

### 邮件服务配置

1. 准备一个SMTP邮箱账号
2. 在`.env`文件中配置以下变量：
   - EMAIL_HOST: SMTP服务器地址
   - EMAIL_PORT: SMTP端口
   - EMAIL_USER: 邮箱用户名
   - EMAIL_PASS: 邮箱密码
3. 在系统后台的通知设置中配置收件人邮箱

### Telegram配置

1. 使用BotFather创建一个Telegram机器人，获取Bot Token
2. 将Bot Token填入`.env`文件的`TELEGRAM_BOT_TOKEN`变量
3. 在系统后台的通知设置中配置Chat ID

## 常见问题

### Q: 系统无法启动，报错"端口已被占用"
A: 修改`.env`文件中的`PORT`变量，或者关闭占用该端口的其他程序。

### Q: 通知没有发送成功
A: 检查通知服务配置是否正确，可以在后台通知设置中使用"发送测试消息"功能进行测试。

### Q: 农历生日计算不准确
A: 确保系统时间正确，并且lunar-javascript库已正确安装。

### Q: 管理员密码忘记了怎么办
A: 可以通过数据库直接修改密码：
```bash
cd backend
sqlite3 database/calendar.db
UPDATE users SET password='$2b$10$6Bnvs3H4Jn3DeBlfxHEx1uzYHR6rKV0jzGvBwv1TpZdS/pEEEUvAe' WHERE username='admin';
```
这将重置管理员密码为"admin123"。

## 维护指南

### 日常维护

1. 定期备份数据库文件：
```bash
cp backend/database/calendar.db backend/database/calendar.db.backup
```

2. 检查日志文件：
```bash
tail -f backend/logs/app.log
```

3. 更新系统：
```bash
cd smart-calendar
git pull
cd backend
npm install
cd ../frontend
npm install
npm run build
cd ../backend
pm2 restart smart-calendar
```

### 性能优化

如果系统运行缓慢，可以考虑以下优化措施：

1. 增加服务器资源（CPU、内存）
2. 配置Nginx反向代理和静态资源缓存
3. 优化数据库查询，添加适当的索引
4. 使用Redis缓存频繁访问的数据

### 安全维护

1. 定期更新系统和依赖包
2. 定期更改管理员密码
3. 配置防火墙，只开放必要的端口
4. 配置SSL证书，使用HTTPS访问

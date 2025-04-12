#!/bin/bash

# 智能科技日历系统一键部署脚本
# 作者: Manus AI
# 版本: 1.1.0
# 日期: 2025-04-12

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_warning "$1 未安装，尝试安装 $1"
        install_package $1
    fi
}

# 安装软件包
install_package() {
    if [[ $OS == "Ubuntu" || $OS == "Debian GNU/Linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y $1
    elif [[ $OS == "CentOS Linux" ]]; then
        sudo yum update -y
        sudo yum install -y $1
    else
        print_error "无法为未知操作系统安装 $1，请手动安装"
        exit 1
    fi
}

# 检查系统环境
check_system() {
    print_info "检查系统环境..."
    
    # 检查操作系统
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "无法确定操作系统类型"
        exit 1
    fi
    
    print_info "操作系统: $OS $VER"
    
    # 检查必要命令
    check_command "git"
    check_command "node"
    check_command "npm"
    
    # 检查Node.js版本
    NODE_VER=$(node -v | cut -d 'v' -f 2)
    print_info "Node.js版本: $NODE_VER"
    
    # 检查npm版本
    NPM_VER=$(npm -v)
    print_info "npm版本: $NPM_VER"
    
    print_success "系统环境检查通过"
}

# 安装系统依赖
install_dependencies() {
    print_info "安装系统依赖..."
    
    if [[ $OS == "Ubuntu" || $OS == "Debian GNU/Linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y build-essential sqlite3 bc
    elif [[ $OS == "CentOS Linux" ]]; then
        sudo yum update -y
        sudo yum install -y gcc-c++ make sqlite bc
    else
        print_warning "未知的操作系统，请手动安装必要的依赖"
    fi
    
    print_success "系统依赖安装完成"
}

# 克隆代码仓库
clone_repository() {
    print_info "克隆代码仓库..."
    
    # 询问仓库地址
    read -p "请输入代码仓库地址 (默认: https://github.com/cyzuwia/smart-calendar.git): " REPO_URL
    REPO_URL=${REPO_URL:-https://github.com/cyzuwia/smart-calendar.git}
    
    # 克隆仓库
    git clone $REPO_URL smart-calendar
    if [ $? -ne 0 ]; then
        print_error "克隆仓库失败，请检查仓库地址是否正确"
        exit 1
    fi
    
    cd smart-calendar
    print_success "代码仓库克隆完成"
}

# 安装项目依赖
install_project_dependencies() {
    print_info "安装项目依赖..."
    
    # 安装后端依赖
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        print_warning "安装后端依赖时出现警告，但将继续执行"
    fi
    
    # 安装前端依赖
    cd ../frontend
    npm install
    if [ $? -ne 0 ]; then
        print_warning "安装前端依赖时出现警告，但将继续执行"
    fi
    
    print_success "项目依赖安装完成"
}

# 配置环境变量
configure_environment() {
    print_info "配置环境变量..."
    
    cd ../backend
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        print_warning ".env.example 文件不存在，创建新的 .env 文件"
        cat > .env << EOF
# 服务器端口
PORT=3001

# JWT密钥（用于生成和验证令牌）
JWT_SECRET=smart_calendar_secret_key_$(date +%s)

# 环境模式（development或production）
NODE_ENV=production

# 数据库配置
DB_PATH=./database/calendar.db

# WxPusher配置
WXPUSHER_APP_TOKEN=
WXPUSHER_DEFAULT_UID=

# 邮件服务配置
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

# Telegram配置
TELEGRAM_BOT_TOKEN=
TELEGRAM_DEFAULT_CHAT_ID=

# 跨域配置
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF
    fi
    
    # 配置基本环境变量
    read -p "请输入服务器端口 (默认: 3001): " PORT
    PORT=${PORT:-3001}
    sed -i "s/PORT=.*/PORT=$PORT/" .env
    
    # 生成随机JWT密钥
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1 || echo "smart_calendar_secret_key_$(date +%s)")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    # 配置通知服务
    print_info "配置通知服务..."
    
    # WxPusher配置
    read -p "是否配置WxPusher通知? (y/n, 默认: y): " CONFIGURE_WXPUSHER
    CONFIGURE_WXPUSHER=${CONFIGURE_WXPUSHER:-y}
    if [[ $CONFIGURE_WXPUSHER == "y" ]]; then
        read -p "请输入WxPusher AppToken: " WXPUSHER_APP_TOKEN
        sed -i "s/WXPUSHER_APP_TOKEN=.*/WXPUSHER_APP_TOKEN=$WXPUSHER_APP_TOKEN/" .env
    fi
    
    # 邮件配置
    read -p "是否配置邮件通知? (y/n, 默认: n): " CONFIGURE_EMAIL
    CONFIGURE_EMAIL=${CONFIGURE_EMAIL:-n}
    if [[ $CONFIGURE_EMAIL == "y" ]]; then
        read -p "请输入SMTP服务器地址: " EMAIL_HOST
        read -p "请输入SMTP端口: " EMAIL_PORT
        read -p "请输入邮箱用户名: " EMAIL_USER
        read -p "请输入邮箱密码: " EMAIL_PASS
        
        sed -i "s/EMAIL_HOST=.*/EMAIL_HOST=$EMAIL_HOST/" .env
        sed -i "s/EMAIL_PORT=.*/EMAIL_PORT=$EMAIL_PORT/" .env
        sed -i "s/EMAIL_USER=.*/EMAIL_USER=$EMAIL_USER/" .env
        sed -i "s/EMAIL_PASS=.*/EMAIL_PASS=$EMAIL_PASS/" .env
        sed -i "s/EMAIL_FROM=.*/EMAIL_FROM=$EMAIL_USER/" .env
    fi
    
    # Telegram配置
    read -p "是否配置Telegram通知? (y/n, 默认: n): " CONFIGURE_TELEGRAM
    CONFIGURE_TELEGRAM=${CONFIGURE_TELEGRAM:-n}
    if [[ $CONFIGURE_TELEGRAM == "y" ]]; then
        read -p "请输入Telegram Bot Token: " TELEGRAM_BOT_TOKEN
        sed -i "s/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN/" .env
    fi
    
    print_success "环境变量配置完成"
}

# 构建前端
build_frontend() {
    print_info "构建前端..."
    
    cd ../frontend
    
    # 检查是否有build脚本
    if ! grep -q '"build"' package.json; then
        print_warning "package.json中缺少build脚本，添加build脚本"
        sed -i 's/"scripts": {/"scripts": {\n    "build": "vite build",/' package.json
    fi
    
    npm run build
    if [ $? -ne 0 ]; then
        print_error "前端构建失败"
        print_info "尝试使用兼容模式构建..."
        
        # 创建vite.config.js（如果不存在）
        if [ ! -f vite.config.js ]; then
            cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:$PORT',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
EOF
        fi
        
        # 再次尝试构建
        npm run build
        if [ $? -ne 0 ]; then
            print_error "前端构建再次失败，请手动检查前端代码"
            exit 1
        fi
    fi
    
    print_success "前端构建完成"
}

# 创建数据库目录
setup_database() {
    print_info "设置数据库..."
    
    cd ../backend
    mkdir -p database logs
    
    # 检查数据库初始化脚本
    if [ ! -f database/init.js ]; then
        print_warning "数据库初始化脚本不存在，创建新的初始化脚本"
        cat > database/init.js << EOF
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// 获取数据库路径
const dbPath = process.env.DB_PATH || path.join(__dirname, 'calendar.db');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 初始化数据库表
function initDatabase() {
    console.log('初始化数据库...');
    
    // 用户表
    db.run(\`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`);
    
    // 事件表
    db.run(\`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        all_day INTEGER DEFAULT 0,
        reminder INTEGER DEFAULT 1,
        reminder_time INTEGER DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 生日表
    db.run(\`CREATE TABLE IF NOT EXISTS birthdays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        calendar_type TEXT DEFAULT 'solar',
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 值日表
    db.run(\`CREATE TABLE IF NOT EXISTS duty_roster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        task TEXT,
        reminder INTEGER DEFAULT 1,
        reminder_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 通知设置表
    db.run(\`CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 通知分组表
    db.run(\`CREATE TABLE IF NOT EXISTS notification_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        event_types TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 通知时间设置表
    db.run(\`CREATE TABLE IF NOT EXISTS notification_time_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        start_hour INTEGER NOT NULL,
        start_minute INTEGER NOT NULL,
        end_hour INTEGER NOT NULL,
        end_minute INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )\`);
    
    // 创建默认管理员账户
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, row) => {
        if (err) {
            console.error('查询用户失败:', err);
            return;
        }
        
        if (!row) {
            // 创建管理员账户
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error('密码加密失败:', err);
                    return;
                }
                
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                    [adminUsername, hash, 'admin'],
                    function(err) {
                        if (err) {
                            console.error('创建管理员账户失败:', err);
                            return;
                        }
                        console.log('创建默认管理员账户成功');
                    }
                );
            });
        }
    });
    
    console.log('数据库初始化完成');
}

// 执行初始化
initDatabase();

// 导出数据库连接
module.exports = db;
EOF
    fi
    
    print_success "数据库设置完成"
}

# 启动服务
start_service() {
    print_info "启动服务..."
    
    # 询问是否使用PM2
    read -p "是否使用PM2进行进程管理? (y/n, 默认: y): " USE_PM2
    USE_PM2=${USE_PM2:-y}
    
    cd ../backend
    
    if [[ $USE_PM2 == "y" ]]; then
        # 检查PM2是否安装
        if ! command -v pm2 &> /dev/null; then
            print_info "安装PM2..."
            npm install -g pm2
        fi
        
        # 启动服务
        pm2 start server.js --name smart-calendar
        if [ $? -ne 0 ]; then
            print_error "服务启动失败"
            exit 1
        fi
        
        # 设置开机自启
        pm2 startup
        pm2 save
    else
        # 使用nohup启动
        mkdir -p ../logs
        nohup node server.js > ../logs/app.log 2>&1 &
        if [ $? -ne 0 ]; then
            print_error "服务启动失败"
            exit 1
        fi
    fi
    
    print_success "服务启动成功"
}

# 配置Nginx反向代理
configure_nginx() {
    print_info "配置Nginx反向代理..."
    
    # 询问是否配置Nginx
    read -p "是否配置Nginx反向代理? (y/n, 默认: n): " CONFIGURE_NGINX
    CONFIGURE_NGINX=${CONFIGURE_NGINX:-n}
    
    if [[ $CONFIGURE_NGINX == "y" ]]; then
        # 检查Nginx是否安装
        if ! command -v nginx &> /dev/null; then
            print_info "安装Nginx..."
            if [[ $OS == "Ubuntu" || $OS == "Debian GNU/Linux" ]]; then
                sudo apt-get install -y nginx
            elif [[ $OS == "CentOS Linux" ]]; then
                sudo yum install -y nginx
            else
                print_warning "未知的操作系统，请手动安装Nginx"
                return
            fi
        fi
        
        # 询问域名
        read -p "请输入您的域名 (如果没有，请输入服务器IP): " DOMAIN
        
        # 创建Nginx配置文件
        sudo bash -c "cat > /etc/nginx/conf.d/smart-calendar.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $(pwd)/../frontend/dist;
        index index.html;
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"
        
        # 测试Nginx配置
        sudo nginx -t
        if [ $? -ne 0 ]; then
            print_error "Nginx配置测试失败"
            return
        fi
        
        # 重启Nginx
        sudo systemctl restart nginx
        
        # 询问是否配置SSL
        read -p "是否配置SSL (需要域名)? (y/n, 默认: n): " CONFIGURE_SSL
        CONFIGURE_SSL=${CONFIGURE_SSL:-n}
        
        if [[ $CONFIGURE_SSL == "y" ]]; then
            # 检查是否有域名
            if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                print_warning "使用IP地址无法配置SSL，跳过SSL配置"
                return
            fi
            
            # 安装Certbot
            print_info "安装Certbot..."
            if [[ $OS == "Ubuntu" || $OS == "Debian GNU/Linux" ]]; then
                sudo apt-get install -y certbot python3-certbot-nginx
            elif [[ $OS == "CentOS Linux" ]]; then
                sudo yum install -y certbot python3-certbot-nginx
            else
                print_warning "未知的操作系统，请手动安装Certbot"
                return
            fi
            
            # 获取SSL证书
            sudo certbot --nginx -d $DOMAIN
            if [ $? -ne 0 ]; then
                print_error "SSL证书获取失败"
                return
            fi
            
            print_success "SSL配置完成"
        fi
        
        print_success "Nginx配置完成"
    fi
}

# 显示部署信息
show_deployment_info() {
    print_info "获取服务器IP..."
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    echo ""
    echo "=============================================="
    echo "          智能科技日历系统部署完成            "
    echo "=============================================="
    echo ""
    
    if [[ $CONFIGURE_NGINX == "y" && $CONFIGURE_SSL == "y" && ! $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "前端访问地址: https://$DOMAIN"
        echo "后台管理地址: https://$DOMAIN/admin"
    elif [[ $CONFIGURE_NGINX == "y" ]]; then
        echo "前端访问地址: http://$DOMAIN"
        echo "后台管理地址: http://$DOMAIN/admin"
    else
        echo "前端访问地址: http://$SERVER_IP:$PORT"
        echo "后台管理地址: http://$SERVER_IP:$PORT/admin"
    fi
    
    echo ""
    echo "默认管理员账号: admin"
    echo "默认管理员密码: admin123"
    echo ""
    echo "请立即登录后台并修改默认密码！"
    echo ""
    echo "=============================================="
}

# 主函数
main() {
    echo "=============================================="
    echo "          智能科技日历系统部署脚本            "
    echo "=============================================="
    echo ""
    
    check_system
    install_dependencies
    clone_repository
    install_project_dependencies
    configure_environment
    setup_database
    build_frontend
    start_service
    configure_nginx
    show_deployment_info
}

# 执行主函数
main

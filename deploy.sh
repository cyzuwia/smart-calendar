#!/bin/bash

# 智能科技日历系统一键部署脚本
# 作者: Manus AI
# 版本: 1.0.0
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
        print_error "$1 未安装，请先安装 $1"
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
    if [[ $(echo "$NODE_VER < 14.0.0" | bc -l) -eq 1 ]]; then
        print_error "Node.js版本过低，请升级到14.0.0或更高版本"
        exit 1
    fi
    
    print_info "Node.js版本: $NODE_VER"
    
    # 检查npm版本
    NPM_VER=$(npm -v)
    if [[ $(echo "$NPM_VER < 6.0.0" | bc -l) -eq 1 ]]; then
        print_warning "npm版本较低，建议升级到6.0.0或更高版本"
    fi
    
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
    read -p "请输入代码仓库地址 (默认: https://github.com/yourusername/smart-calendar.git): " REPO_URL
    REPO_URL=${REPO_URL:-https://github.com/yourusername/smart-calendar.git}
    
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
        print_error "安装后端依赖失败"
        exit 1
    fi
    
    # 安装前端依赖
    cd ../frontend
    npm install
    if [ $? -ne 0 ]; then
        print_error "安装前端依赖失败"
        exit 1
    fi
    
    print_success "项目依赖安装完成"
}

# 配置环境变量
configure_environment() {
    print_info "配置环境变量..."
    
    cd ../backend
    cp .env.example .env
    
    # 配置基本环境变量
    read -p "请输入服务器端口 (默认: 3000): " PORT
    PORT=${PORT:-3000}
    sed -i "s/PORT=.*/PORT=$PORT/" .env
    
    # 生成随机JWT密钥
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
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
    npm run build
    if [ $? -ne 0 ]; then
        print_error "前端构建失败"
        exit 1
    fi
    
    print_success "前端构建完成"
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
    SERVER_IP=$(curl -s ifconfig.me)
    
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
    build_frontend
    start_service
    configure_nginx
    show_deployment_info
}

# 执行主函数
main

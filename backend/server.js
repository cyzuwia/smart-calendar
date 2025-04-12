const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database/init');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 身份验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'auth_required', message: '需要身份验证' } });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: { code: 'invalid_token', message: '无效的令牌' } });
    }
    
    req.user = user;
    next();
  });
};

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ success: false, error: { code: 'admin_required', message: '需要管理员权限' } });
  }
  
  next();
};

// 路由
// 1. 用户认证路由
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // 验证请求数据
    if (!username || !password) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '用户名和密码为必填项' } });
    }
    
    // 检查用户名是否已存在
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '数据库错误' } });
      }
      
      if (row) {
        return res.status(400).json({ success: false, error: { code: 'username_exists', message: '用户名已存在' } });
      }
      
      // 加密密码
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // 创建新用户
      db.run(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '创建用户失败' } });
          }
          
          // 返回新用户信息（不包含密码）
          db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [this.lastID], (err, user) => {
            if (err) {
              return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取用户信息失败' } });
            }
            
            res.status(201).json({ success: true, message: '注册成功', data: user });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证请求数据
    if (!username || !password) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '用户名和密码为必填项' } });
    }
    
    // 查找用户
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '数据库错误' } });
      }
      
      if (!user) {
        return res.status(401).json({ success: false, error: { code: 'invalid_credentials', message: '用户名或密码错误' } });
      }
      
      // 验证密码
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, error: { code: 'invalid_credentials', message: '用户名或密码错误' } });
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id, username: user.username, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // 返回用户信息和令牌
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: Boolean(user.is_admin)
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

app.post('/api/v1/auth/refresh', authenticateToken, (req, res) => {
  try {
    // 生成新的JWT令牌
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username, is_admin: req.user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 2. 用户路由
app.get('/api/v1/users/me', authenticateToken, (req, res) => {
  try {
    db.get(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '数据库错误' } });
        }
        
        if (!user) {
          return res.status(404).json({ success: false, error: { code: 'user_not_found', message: '用户不存在' } });
        }
        
        res.json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: Boolean(user.is_admin),
            created_at: user.created_at
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

app.put('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 构建更新查询
    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];
    
    if (email) {
      updateQuery += 'email = ?';
      updateParams.push(email);
    }
    
    if (password) {
      if (updateParams.length > 0) {
        updateQuery += ', ';
      }
      updateQuery += 'password = ?';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateParams.push(hashedPassword);
    }
    
    if (updateParams.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '没有提供要更新的字段' } });
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(req.user.id);
    
    // 执行更新
    db.run(updateQuery, updateParams, function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '更新用户信息失败' } });
      }
      
      // 获取更新后的用户信息
      db.get(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取用户信息失败' } });
          }
          
          res.json({
            success: true,
            message: '用户信息更新成功',
            data: {
              ...user,
              updated_at: new Date().toISOString()
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});

module.exports = app;

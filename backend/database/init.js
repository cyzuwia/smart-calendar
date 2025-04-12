const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dbDir, 'calendar.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
    
    // 创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      is_admin INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
      } else {
        console.log('用户表已创建或已存在');
        
        // 创建默认管理员账户
        db.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
          if (err) {
            console.error('查询管理员账户失败:', err.message);
          } else if (!row) {
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const defaultPassword = 'admin123';
            
            bcrypt.hash(defaultPassword, saltRounds, (err, hash) => {
              if (err) {
                console.error('密码加密失败:', err.message);
              } else {
                db.run(`INSERT INTO users (username, password, email, is_admin) 
                  VALUES (?, ?, ?, ?)`, ['admin', hash, 'admin@example.com', 1], (err) => {
                  if (err) {
                    console.error('创建默认管理员账户失败:', err.message);
                  } else {
                    console.log('默认管理员账户已创建');
                  }
                });
              }
            });
          }
        });
      }
    });
    
    // 创建事件表
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      all_day INTEGER DEFAULT 0,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('创建事件表失败:', err.message);
      } else {
        console.log('事件表已创建或已存在');
      }
    });
    
    // 创建生日表
    db.run(`CREATE TABLE IF NOT EXISTS birthdays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birth_date DATE NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('创建生日表失败:', err.message);
      } else {
        console.log('生日表已创建或已存在');
      }
    });
    
    // 创建值日表
    db.run(`CREATE TABLE IF NOT EXISTS duty_roster (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duty_date DATE NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('创建值日表失败:', err.message);
      } else {
        console.log('值日表已创建或已存在');
      }
    });
    
    // 创建通知设置表
    db.run(`CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'wxpusher', 'email', 'telegram'
      config TEXT NOT NULL, -- JSON格式存储配置信息
      enabled INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('创建通知设置表失败:', err.message);
      } else {
        console.log('通知设置表已创建或已存在');
      }
    });
  }
});

// 导出数据库连接
module.exports = db;

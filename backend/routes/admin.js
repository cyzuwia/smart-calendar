// 后台管理API路由
const express = require('express');
const router = express.Router();
const db = require('../database/init');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// 获取所有用户 (仅管理员)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.all('SELECT id, username, email, is_admin, created_at FROM users', (err, users) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取用户列表失败' } });
      }
      
      // 处理布尔值
      const processedUsers = users.map(user => ({
        ...user,
        is_admin: Boolean(user.is_admin)
      }));
      
      res.json({ success: true, data: processedUsers });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 更新用户信息 (仅管理员)
router.put('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    const { email, is_admin } = req.body;
    
    // 检查用户是否存在
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询用户失败' } });
      }
      
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'user_not_found', message: '用户不存在' } });
      }
      
      // 构建更新查询
      let updateQuery = 'UPDATE users SET ';
      const updateParams = [];
      
      if (email !== undefined) {
        updateQuery += 'email = ?';
        updateParams.push(email);
      }
      
      if (is_admin !== undefined) {
        if (updateParams.length > 0) {
          updateQuery += ', ';
        }
        updateQuery += 'is_admin = ?';
        updateParams.push(is_admin ? 1 : 0);
      }
      
      if (updateParams.length === 0) {
        return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '没有提供要更新的字段' } });
      }
      
      updateQuery += ' WHERE id = ?';
      updateParams.push(userId);
      
      // 执行更新
      db.run(updateQuery, updateParams, function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '更新用户信息失败' } });
        }
        
        // 获取更新后的用户信息
        db.get(
          'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?',
          [userId],
          (err, updatedUser) => {
            if (err) {
              return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取用户信息失败' } });
            }
            
            res.json({
              success: true,
              message: '用户信息更新成功',
              data: {
                ...updatedUser,
                is_admin: Boolean(updatedUser.is_admin),
                updated_at: new Date().toISOString()
              }
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 删除用户 (仅管理员)
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户是否存在
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询用户失败' } });
      }
      
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'user_not_found', message: '用户不存在' } });
      }
      
      // 防止删除自己
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ success: false, error: { code: 'invalid_operation', message: '不能删除当前登录的用户' } });
      }
      
      // 删除用户
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '删除用户失败' } });
        }
        
        res.json({ success: true, message: '用户删除成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 获取系统状态 (仅管理员)
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 获取系统运行时间
    const uptime = process.uptime();
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    
    // 获取用户数量
    db.get('SELECT COUNT(*) as count FROM users', (err, userCount) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取用户数量失败' } });
      }
      
      // 获取事件数量
      db.get('SELECT COUNT(*) as count FROM events', (err, eventCount) => {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取事件数量失败' } });
        }
        
        // 获取磁盘使用情况（简化版）
        const diskUsage = {
          free: '计算中...',
          total: '计算中...',
          used: '计算中...'
        };
        
        res.json({
          success: true,
          data: {
            uptime,
            memory_usage: {
              rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
              heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
              heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
            },
            disk_usage: diskUsage,
            user_count: userCount.count,
            event_count: eventCount.count
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 获取通知日志 (仅管理员)
router.get('/notification-logs', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.all('SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 100', (err, logs) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取通知日志失败' } });
      }
      
      res.json({ success: true, data: logs });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 获取所有通知设置 (仅管理员)
router.get('/notification-settings', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.all('SELECT * FROM notification_settings', (err, settings) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取通知设置失败' } });
      }
      
      // 处理JSON配置
      const processedSettings = settings.map(setting => {
        try {
          return {
            ...setting,
            config: JSON.parse(setting.config),
            enabled: Boolean(setting.enabled)
          };
        } catch (e) {
          return {
            ...setting,
            config: {},
            enabled: Boolean(setting.enabled)
          };
        }
      });
      
      res.json({ success: true, data: processedSettings });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

module.exports = router;

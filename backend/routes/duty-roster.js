// 值日表管理功能API路由
const express = require('express');
const router = express.Router();
const db = require('../database/init');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// 获取值日表
router.get('/', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM duty_roster';
    const params = [];
    
    // 添加日期过滤
    if (start_date) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ' duty_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      if (params.length === 0) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ' duty_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY duty_date ASC';
    
    db.all(query, params, (err, dutyRoster) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取值日表失败' } });
      }
      
      res.json({ success: true, data: dutyRoster });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 添加值日安排 (仅管理员)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, duty_date } = req.body;
    
    // 验证请求数据
    if (!name || !duty_date) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '值日人和值日日期为必填项' } });
    }
    
    // 创建值日安排
    db.run(
      'INSERT INTO duty_roster (name, duty_date, user_id) VALUES (?, ?, ?)',
      [name, duty_date, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '添加值日安排失败' } });
        }
        
        // 获取新创建的值日安排
        db.get('SELECT * FROM duty_roster WHERE id = ?', [this.lastID], (err, dutyRoster) => {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取值日安排失败' } });
          }
          
          res.status(201).json({ success: true, message: '值日安排添加成功', data: dutyRoster });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 批量添加值日安排 (仅管理员)
router.post('/batch', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { roster } = req.body;
    
    // 验证请求数据
    if (!roster || !Array.isArray(roster) || roster.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '值日安排列表为必填项' } });
    }
    
    // 验证每个值日安排
    for (const item of roster) {
      if (!item.name || !item.duty_date) {
        return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '每个值日安排必须包含值日人和值日日期' } });
      }
    }
    
    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let successCount = 0;
      let stmt = db.prepare('INSERT INTO duty_roster (name, duty_date, user_id) VALUES (?, ?, ?)');
      
      // 批量插入值日安排
      roster.forEach(item => {
        stmt.run([item.name, item.duty_date, req.user.id], function(err) {
          if (!err) {
            successCount++;
          }
        });
      });
      
      stmt.finalize();
      
      // 提交事务
      db.run('COMMIT', err => {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '批量添加值日安排失败' } });
        }
        
        res.status(201).json({ success: true, message: '值日安排批量添加成功', data: { count: successCount } });
      });
    });
  } catch (error) {
    // 回滚事务
    db.run('ROLLBACK');
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 更新值日安排 (仅管理员)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const dutyId = req.params.id;
    const { name, duty_date } = req.body;
    
    // 验证请求数据
    if (!name || !duty_date) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '值日人和值日日期为必填项' } });
    }
    
    // 检查值日安排是否存在
    db.get('SELECT * FROM duty_roster WHERE id = ?', [dutyId], (err, dutyRoster) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询值日安排失败' } });
      }
      
      if (!dutyRoster) {
        return res.status(404).json({ success: false, error: { code: 'duty_not_found', message: '值日安排不存在' } });
      }
      
      // 更新值日安排
      db.run(
        'UPDATE duty_roster SET name = ?, duty_date = ? WHERE id = ?',
        [name, duty_date, dutyId],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '更新值日安排失败' } });
          }
          
          // 获取更新后的值日安排
          db.get('SELECT * FROM duty_roster WHERE id = ?', [dutyId], (err, updatedDutyRoster) => {
            if (err) {
              return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取值日安排失败' } });
            }
            
            res.json({
              success: true,
              message: '值日安排更新成功',
              data: {
                ...updatedDutyRoster,
                updated_at: new Date().toISOString()
              }
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 删除值日安排 (仅管理员)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const dutyId = req.params.id;
    
    // 检查值日安排是否存在
    db.get('SELECT * FROM duty_roster WHERE id = ?', [dutyId], (err, dutyRoster) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询值日安排失败' } });
      }
      
      if (!dutyRoster) {
        return res.status(404).json({ success: false, error: { code: 'duty_not_found', message: '值日安排不存在' } });
      }
      
      // 删除值日安排
      db.run('DELETE FROM duty_roster WHERE id = ?', [dutyId], function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '删除值日安排失败' } });
        }
        
        res.json({ success: true, message: '值日安排删除成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

module.exports = router;

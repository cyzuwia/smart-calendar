// 事件管理API路由
const express = require('express');
const router = express.Router();
const db = require('../database/init');
const authenticateToken = require('../middleware/auth');

// 获取事件列表
router.get('/', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM events WHERE user_id = ?';
    const params = [req.user.id];
    
    // 添加日期过滤
    if (start_date) {
      query += ' AND start_time >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND start_time <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY start_time ASC';
    
    db.all(query, params, (err, events) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取事件列表失败' } });
      }
      
      res.json({ success: true, data: events });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 创建事件
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, start_time, end_time, all_day } = req.body;
    
    // 验证请求数据
    if (!title || !start_time) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '标题和开始时间为必填项' } });
    }
    
    // 创建事件
    db.run(
      'INSERT INTO events (title, description, start_time, end_time, all_day, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, start_time, end_time, all_day ? 1 : 0, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '创建事件失败' } });
        }
        
        // 获取新创建的事件
        db.get('SELECT * FROM events WHERE id = ?', [this.lastID], (err, event) => {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取事件信息失败' } });
          }
          
          res.status(201).json({ success: true, message: '事件创建成功', data: event });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 获取事件详情
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.id;
    
    db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', [eventId, req.user.id], (err, event) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取事件详情失败' } });
      }
      
      if (!event) {
        return res.status(404).json({ success: false, error: { code: 'event_not_found', message: '事件不存在' } });
      }
      
      res.json({ success: true, data: event });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 更新事件
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, start_time, end_time, all_day } = req.body;
    
    // 验证请求数据
    if (!title || !start_time) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '标题和开始时间为必填项' } });
    }
    
    // 检查事件是否存在且属于当前用户
    db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', [eventId, req.user.id], (err, event) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询事件失败' } });
      }
      
      if (!event) {
        return res.status(404).json({ success: false, error: { code: 'event_not_found', message: '事件不存在' } });
      }
      
      // 更新事件
      db.run(
        'UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, all_day = ? WHERE id = ? AND user_id = ?',
        [title, description, start_time, end_time, all_day ? 1 : 0, eventId, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '更新事件失败' } });
          }
          
          // 获取更新后的事件
          db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, updatedEvent) => {
            if (err) {
              return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取事件信息失败' } });
            }
            
            res.json({
              success: true,
              message: '事件更新成功',
              data: {
                ...updatedEvent,
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

// 删除事件
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.id;
    
    // 检查事件是否存在且属于当前用户
    db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', [eventId, req.user.id], (err, event) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询事件失败' } });
      }
      
      if (!event) {
        return res.status(404).json({ success: false, error: { code: 'event_not_found', message: '事件不存在' } });
      }
      
      // 删除事件
      db.run('DELETE FROM events WHERE id = ? AND user_id = ?', [eventId, req.user.id], function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '删除事件失败' } });
        }
        
        res.json({ success: true, message: '事件删除成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

module.exports = router;

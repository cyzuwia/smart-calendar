// 生日提醒功能API路由
const express = require('express');
const router = express.Router();
const db = require('../database/init');
const authenticateToken = require('../middleware/auth');

// 获取生日列表
router.get('/', authenticateToken, (req, res) => {
  try {
    db.all('SELECT * FROM birthdays WHERE user_id = ? ORDER BY birth_date ASC', [req.user.id], (err, birthdays) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取生日列表失败' } });
      }
      
      // 计算下一个生日日期和倒计时
      const today = new Date();
      const processedBirthdays = birthdays.map(birthday => {
        const birthDate = new Date(birthday.birth_date);
        const nextBirthdayInfo = calculateNextBirthday(birthDate);
        
        return {
          ...birthday,
          next_birthday: nextBirthdayInfo.next_birthday,
          days_remaining: nextBirthdayInfo.days_remaining
        };
      });
      
      // 按倒计时天数排序
      processedBirthdays.sort((a, b) => a.days_remaining - b.days_remaining);
      
      res.json({ success: true, data: processedBirthdays });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 添加生日
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, birth_date } = req.body;
    
    // 验证请求数据
    if (!name || !birth_date) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '姓名和出生日期为必填项' } });
    }
    
    // 创建生日记录
    db.run(
      'INSERT INTO birthdays (name, birth_date, user_id) VALUES (?, ?, ?)',
      [name, birth_date, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '添加生日信息失败' } });
        }
        
        // 获取新创建的生日记录
        db.get('SELECT * FROM birthdays WHERE id = ?', [this.lastID], (err, birthday) => {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取生日信息失败' } });
          }
          
          // 计算下一个生日日期和倒计时
          const birthDate = new Date(birthday.birth_date);
          const nextBirthdayInfo = calculateNextBirthday(birthDate);
          
          res.status(201).json({
            success: true,
            message: '生日信息添加成功',
            data: {
              ...birthday,
              next_birthday: nextBirthdayInfo.next_birthday,
              days_remaining: nextBirthdayInfo.days_remaining
            }
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 更新生日信息
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const birthdayId = req.params.id;
    const { name, birth_date } = req.body;
    
    // 验证请求数据
    if (!name || !birth_date) {
      return res.status(400).json({ success: false, error: { code: 'invalid_input', message: '姓名和出生日期为必填项' } });
    }
    
    // 检查生日记录是否存在且属于当前用户
    db.get('SELECT * FROM birthdays WHERE id = ? AND user_id = ?', [birthdayId, req.user.id], (err, birthday) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询生日信息失败' } });
      }
      
      if (!birthday) {
        return res.status(404).json({ success: false, error: { code: 'birthday_not_found', message: '生日信息不存在' } });
      }
      
      // 更新生日记录
      db.run(
        'UPDATE birthdays SET name = ?, birth_date = ? WHERE id = ? AND user_id = ?',
        [name, birth_date, birthdayId, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: { code: 'db_error', message: '更新生日信息失败' } });
          }
          
          // 获取更新后的生日记录
          db.get('SELECT * FROM birthdays WHERE id = ?', [birthdayId], (err, updatedBirthday) => {
            if (err) {
              return res.status(500).json({ success: false, error: { code: 'db_error', message: '获取生日信息失败' } });
            }
            
            // 计算下一个生日日期和倒计时
            const birthDate = new Date(updatedBirthday.birth_date);
            const nextBirthdayInfo = calculateNextBirthday(birthDate);
            
            res.json({
              success: true,
              message: '生日信息更新成功',
              data: {
                ...updatedBirthday,
                next_birthday: nextBirthdayInfo.next_birthday,
                days_remaining: nextBirthdayInfo.days_remaining,
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

// 删除生日信息
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const birthdayId = req.params.id;
    
    // 检查生日记录是否存在且属于当前用户
    db.get('SELECT * FROM birthdays WHERE id = ? AND user_id = ?', [birthdayId, req.user.id], (err, birthday) => {
      if (err) {
        return res.status(500).json({ success: false, error: { code: 'db_error', message: '查询生日信息失败' } });
      }
      
      if (!birthday) {
        return res.status(404).json({ success: false, error: { code: 'birthday_not_found', message: '生日信息不存在' } });
      }
      
      // 删除生日记录
      db.run('DELETE FROM birthdays WHERE id = ? AND user_id = ?', [birthdayId, req.user.id], function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: { code: 'db_error', message: '删除生日信息失败' } });
        }
        
        res.json({ success: true, message: '生日信息删除成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'server_error', message: '服务器错误' } });
  }
});

// 辅助函数：计算下一个生日日期和倒计时
function calculateNextBirthday(birthDate) {
  const today = new Date();
  
  // 计算今年的生日日期
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  // 如果今年的生日已经过了，计算明年的生日
  const nextBirthdayYear = today > thisYearBirthday ? today.getFullYear() + 1 : today.getFullYear();
  const nextBirthday = new Date(nextBirthdayYear, birthDate.getMonth(), birthDate.getDate());
  
  // 计算剩余天数
  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    next_birthday: nextBirthday.toISOString().split('T')[0],
    days_remaining: diffDays
  };
}

module.exports = router;

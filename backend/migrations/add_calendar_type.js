// 修改数据库结构，添加日历类型字段
const sqlite3 = require('sqlite3').verbose();
const db = require('../database/init');

// 执行数据库迁移
function migrateBirthdayTable() {
  return new Promise((resolve, reject) => {
    // 检查calendar_type字段是否已存在
    db.get("PRAGMA table_info(birthdays)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 检查是否已有calendar_type字段
      const hasCalendarType = rows.some(row => row.name === 'calendar_type');
      
      if (!hasCalendarType) {
        // 添加calendar_type字段
        db.run("ALTER TABLE birthdays ADD COLUMN calendar_type TEXT DEFAULT 'solar'", (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log('成功添加calendar_type字段到birthdays表');
          resolve(true);
        });
      } else {
        console.log('calendar_type字段已存在');
        resolve(false);
      }
    });
  });
}

// 执行迁移
migrateBirthdayTable()
  .then(migrated => {
    console.log(migrated ? '数据库迁移成功' : '无需迁移');
  })
  .catch(err => {
    console.error('数据库迁移失败:', err);
  });

module.exports = { migrateBirthdayTable };

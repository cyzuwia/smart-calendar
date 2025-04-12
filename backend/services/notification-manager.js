// 通知服务 - 通知分组和时间设置
const db = require('../database/init');
const wxpusher = require('./wxpusher');
const email = require('./email');
const telegram = require('./telegram');

class NotificationManager {
  constructor() {
    this.notificationServices = {
      wxpusher,
      email,
      telegram
    };
  }

  /**
   * 发送通知
   * @param {Object} options - 通知选项
   * @param {string} options.userId - 用户ID
   * @param {string} options.title - 通知标题
   * @param {string} options.content - 通知内容
   * @param {string} options.eventType - 事件类型 (event/birthday/duty)
   * @param {number} options.eventId - 事件ID
   * @param {Array} options.channels - 通知渠道列表 (可选，默认使用用户设置的所有启用渠道)
   * @returns {Promise<Object>} - 发送结果
   */
  async sendNotification(options) {
    try {
      const { userId, title, content, eventType, eventId, channels } = options;
      
      // 获取用户的通知分组设置
      const groups = await this.getUserNotificationGroups(userId);
      
      // 检查是否应该发送通知（基于时间设置）
      const shouldSend = await this.checkNotificationTime(userId, eventType);
      if (!shouldSend) {
        console.log(`根据时间设置，不发送通知给用户 ${userId}`);
        return { success: false, message: '根据时间设置，不发送通知' };
      }
      
      // 确定要使用的通知渠道
      let notificationChannels = channels;
      if (!notificationChannels) {
        // 如果没有指定渠道，使用用户设置的所有启用渠道
        const settings = await this.getUserNotificationSettings(userId);
        notificationChannels = settings.map(setting => setting.type);
      }
      
      // 根据事件类型获取对应的通知分组
      const groupId = this.getGroupIdByEventType(groups, eventType);
      
      // 如果事件类型属于某个分组，检查该分组是否启用
      if (groupId && !this.isGroupEnabled(groups, groupId)) {
        console.log(`用户 ${userId} 的通知分组 ${groupId} 未启用`);
        return { success: false, message: '通知分组未启用' };
      }
      
      // 发送通知到所有指定渠道
      const results = [];
      for (const channel of notificationChannels) {
        if (this.notificationServices[channel]) {
          const result = await this.notificationServices[channel].sendNotification({
            userId,
            title,
            content,
            eventType,
            eventId
          });
          
          results.push({
            channel,
            success: result.success,
            message: result.message
          });
        }
      }
      
      return {
        success: results.some(result => result.success),
        message: '通知发送完成',
        data: { results }
      };
    } catch (error) {
      console.error('通知发送失败:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取用户的通知设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} - 用户通知设置列表
   */
  getUserNotificationSettings(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM notification_settings WHERE user_id = ? AND enabled = 1',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const settings = rows.map(row => {
            try {
              const config = JSON.parse(row.config);
              return {
                id: row.id,
                user_id: row.user_id,
                type: row.type,
                config,
                enabled: Boolean(row.enabled)
              };
            } catch (error) {
              return {
                id: row.id,
                user_id: row.user_id,
                type: row.type,
                config: {},
                enabled: Boolean(row.enabled)
              };
            }
          });
          
          resolve(settings);
        }
      );
    });
  }
  
  /**
   * 获取用户的通知分组设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} - 用户通知分组列表
   */
  getUserNotificationGroups(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM notification_groups WHERE user_id = ?',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(rows);
        }
      );
    });
  }
  
  /**
   * 根据事件类型获取对应的通知分组ID
   * @param {Array} groups - 通知分组列表
   * @param {string} eventType - 事件类型
   * @returns {number|null} - 分组ID或null
   */
  getGroupIdByEventType(groups, eventType) {
    for (const group of groups) {
      try {
        const eventTypes = JSON.parse(group.event_types);
        if (eventTypes.includes(eventType)) {
          return group.id;
        }
      } catch (error) {
        console.error('解析事件类型失败:', error);
      }
    }
    
    return null;
  }
  
  /**
   * 检查通知分组是否启用
   * @param {Array} groups - 通知分组列表
   * @param {number} groupId - 分组ID
   * @returns {boolean} - 是否启用
   */
  isGroupEnabled(groups, groupId) {
    const group = groups.find(g => g.id === groupId);
    return group ? Boolean(group.enabled) : false;
  }
  
  /**
   * 检查是否应该发送通知（基于时间设置）
   * @param {string} userId - 用户ID
   * @param {string} eventType - 事件类型
   * @returns {Promise<boolean>} - 是否应该发送
   */
  async checkNotificationTime(userId, eventType) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM notification_time_settings WHERE user_id = ? AND event_type = ?',
        [userId, eventType],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            // 如果没有特定设置，默认允许发送
            resolve(true);
            return;
          }
          
          try {
            // 检查当前时间是否在允许发送的时间范围内
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute; // 转换为分钟
            
            const startTime = row.start_hour * 60 + row.start_minute;
            const endTime = row.end_hour * 60 + row.end_minute;
            
            // 如果开始时间小于结束时间，表示在同一天内的时间范围
            if (startTime <= endTime) {
              resolve(currentTime >= startTime && currentTime <= endTime);
            } else {
              // 如果开始时间大于结束时间，表示跨天的时间范围（如晚上10点到早上6点）
              resolve(currentTime >= startTime || currentTime <= endTime);
            }
          } catch (error) {
            console.error('检查通知时间失败:', error);
            // 出错时默认允许发送
            resolve(true);
          }
        }
      );
    });
  }
  
  /**
   * 创建通知分组
   * @param {Object} groupData - 分组数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createNotificationGroup(groupData) {
    const { userId, name, eventTypes, enabled } = groupData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO notification_groups (user_id, name, event_types, enabled) VALUES (?, ?, ?, ?)',
        [userId, name, JSON.stringify(eventTypes), enabled ? 1 : 0],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            success: true,
            message: '通知分组创建成功',
            data: { id: this.lastID }
          });
        }
      );
    });
  }
  
  /**
   * 更新通知分组
   * @param {Object} groupData - 分组数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateNotificationGroup(groupData) {
    const { id, name, eventTypes, enabled } = groupData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notification_groups SET name = ?, event_types = ?, enabled = ? WHERE id = ?',
        [name, JSON.stringify(eventTypes), enabled ? 1 : 0, id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            success: true,
            message: '通知分组更新成功',
            data: { id }
          });
        }
      );
    });
  }
  
  /**
   * 设置通知时间
   * @param {Object} timeData - 时间设置数据
   * @returns {Promise<Object>} - 设置结果
   */
  async setNotificationTime(timeData) {
    const { userId, eventType, startHour, startMinute, endHour, endMinute } = timeData;
    
    return new Promise((resolve, reject) => {
      // 先检查是否已存在设置
      db.get(
        'SELECT * FROM notification_time_settings WHERE user_id = ? AND event_type = ?',
        [userId, eventType],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            // 更新现有设置
            db.run(
              'UPDATE notification_time_settings SET start_hour = ?, start_minute = ?, end_hour = ?, end_minute = ? WHERE id = ?',
              [startHour, startMinute, endHour, endMinute, row.id],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                
                resolve({
                  success: true,
                  message: '通知时间设置更新成功',
                  data: { id: row.id }
                });
              }
            );
          } else {
            // 创建新设置
            db.run(
              'INSERT INTO notification_time_settings (user_id, event_type, start_hour, start_minute, end_hour, end_minute) VALUES (?, ?, ?, ?, ?, ?)',
              [userId, eventType, startHour, startMinute, endHour, endMinute],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                
                resolve({
                  success: true,
                  message: '通知时间设置创建成功',
                  data: { id: this.lastID }
                });
              }
            );
          }
        }
      );
    });
  }
}

module.exports = new NotificationManager();

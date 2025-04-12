// 通知服务 - Telegram通知集成
const axios = require('axios');
const db = require('../database/init');

class TelegramService {
  constructor() {
    this.baseUrl = 'https://api.telegram.org/bot';
  }

  /**
   * 发送Telegram通知
   * @param {Object} options - 通知选项
   * @param {string} options.userId - 用户ID
   * @param {string} options.title - 通知标题
   * @param {string} options.content - 通知内容
   * @param {string} options.eventType - 事件类型 (event/birthday/duty)
   * @param {number} options.eventId - 事件ID
   * @returns {Promise<Object>} - 发送结果
   */
  async sendNotification(options) {
    try {
      const { userId, title, content, eventType, eventId } = options;
      
      // 获取用户的Telegram设置
      const settings = await this.getUserTelegramSettings(userId);
      if (!settings || !settings.enabled) {
        console.log(`用户 ${userId} 未启用Telegram通知或未配置`);
        return { success: false, message: '用户未启用Telegram通知' };
      }
      
      const { botToken, chatId } = settings.config;
      
      if (!botToken || !chatId) {
        console.log(`用户 ${userId} 的Telegram配置不完整`);
        return { success: false, message: 'Telegram配置不完整' };
      }
      
      // 构建消息内容
      const message = `*${title}*\n\n${content}`;
      
      // 发送请求
      const url = `${this.baseUrl}${botToken}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      });
      
      // 记录通知日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'telegram',
        status: response.data.ok ? 'success' : 'failed',
        response: JSON.stringify(response.data)
      });
      
      return {
        success: response.data.ok,
        message: response.data.ok ? '消息发送成功' : '消息发送失败',
        data: response.data.result
      };
    } catch (error) {
      console.error('Telegram通知发送失败:', error);
      
      // 记录失败日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'telegram',
        status: 'failed',
        response: JSON.stringify({ error: error.message })
      });
      
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取用户的Telegram设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 用户设置
   */
  getUserTelegramSettings(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM notification_settings WHERE user_id = ? AND type = ? AND enabled = 1',
        [userId, 'telegram'],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve(null);
            return;
          }
          
          try {
            const config = JSON.parse(row.config);
            resolve({
              id: row.id,
              user_id: row.user_id,
              type: row.type,
              config,
              enabled: Boolean(row.enabled)
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }
  
  /**
   * 记录通知日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<void>}
   */
  logNotification(logData) {
    return new Promise((resolve, reject) => {
      const { userId, eventId, eventType, type, status, response } = logData;
      
      db.run(
        'INSERT INTO notification_logs (user_id, event_id, event_type, type, status, response, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, eventId, eventType, type, status, response, new Date().toISOString()],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(this.lastID);
        }
      );
    });
  }
}

module.exports = new TelegramService();

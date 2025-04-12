// 通知服务 - WxPusher集成
const axios = require('axios');
const db = require('../database/init');

class WxPusherService {
  constructor() {
    this.baseUrl = 'https://wxpusher.zjiecode.com/api/send/message';
  }

  /**
   * 发送WxPusher通知
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
      
      // 获取用户的WxPusher设置
      const settings = await this.getUserWxPusherSettings(userId);
      if (!settings || !settings.enabled) {
        console.log(`用户 ${userId} 未启用WxPusher通知或未配置`);
        return { success: false, message: '用户未启用WxPusher通知' };
      }
      
      const { appToken, uids, topicIds } = settings.config;
      
      if (!appToken || (!uids && !topicIds)) {
        console.log(`用户 ${userId} 的WxPusher配置不完整`);
        return { success: false, message: 'WxPusher配置不完整' };
      }
      
      // 构建请求数据
      const requestData = {
        appToken,
        content,
        summary: title,
        contentType: 1, // 1表示文本, 2表示HTML
        uids: uids ? (Array.isArray(uids) ? uids : [uids]) : undefined,
        topicIds: topicIds ? (Array.isArray(topicIds) ? topicIds : [topicIds]) : undefined,
        url: '' // 可选的点击跳转URL
      };
      
      // 发送请求
      const response = await axios.post(this.baseUrl, requestData);
      
      // 记录通知日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'wxpusher',
        status: response.data.success ? 'success' : 'failed',
        response: JSON.stringify(response.data)
      });
      
      return {
        success: response.data.success,
        message: response.data.msg,
        data: response.data.data
      };
    } catch (error) {
      console.error('WxPusher通知发送失败:', error);
      
      // 记录失败日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'wxpusher',
        status: 'failed',
        response: JSON.stringify({ error: error.message })
      });
      
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取用户的WxPusher设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 用户设置
   */
  getUserWxPusherSettings(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM notification_settings WHERE user_id = ? AND type = ? AND enabled = 1',
        [userId, 'wxpusher'],
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

module.exports = new WxPusherService();

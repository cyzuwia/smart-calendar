// 通知服务 - 邮件通知集成
const nodemailer = require('nodemailer');
const db = require('../database/init');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * 初始化邮件传输器
   * @param {Object} config - 邮件配置
   * @returns {Object} - 邮件传输器
   */
  initTransporter(config) {
    const { host, port, secure, user, pass } = config;
    
    return nodemailer.createTransport({
      host,
      port,
      secure: secure || false,
      auth: {
        user,
        pass
      }
    });
  }

  /**
   * 发送邮件通知
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
      
      // 获取用户的邮件设置
      const settings = await this.getUserEmailSettings(userId);
      if (!settings || !settings.enabled) {
        console.log(`用户 ${userId} 未启用邮件通知或未配置`);
        return { success: false, message: '用户未启用邮件通知' };
      }
      
      const { smtp, recipient } = settings.config;
      
      if (!smtp || !recipient) {
        console.log(`用户 ${userId} 的邮件配置不完整`);
        return { success: false, message: '邮件配置不完整' };
      }
      
      // 初始化邮件传输器
      this.transporter = this.initTransporter(smtp);
      
      // 构建邮件内容
      const mailOptions = {
        from: `"智能科技日历" <${smtp.user}>`,
        to: recipient,
        subject: title,
        text: content,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #3498db;">${title}</h2>
                <div style="margin: 20px 0; line-height: 1.5;">
                  ${content.replace(/\n/g, '<br>')}
                </div>
                <div style="color: #7f8c8d; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                  此邮件由智能科技日历系统自动发送，请勿直接回复。
                </div>
              </div>`
      };
      
      // 发送邮件
      const info = await this.transporter.sendMail(mailOptions);
      
      // 记录通知日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'email',
        status: 'success',
        response: JSON.stringify({ messageId: info.messageId })
      });
      
      return {
        success: true,
        message: '邮件发送成功',
        data: { messageId: info.messageId }
      };
    } catch (error) {
      console.error('邮件通知发送失败:', error);
      
      // 记录失败日志
      await this.logNotification({
        userId,
        eventId,
        eventType,
        type: 'email',
        status: 'failed',
        response: JSON.stringify({ error: error.message })
      });
      
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 获取用户的邮件设置
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 用户设置
   */
  getUserEmailSettings(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM notification_settings WHERE user_id = ? AND type = ? AND enabled = 1',
        [userId, 'email'],
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

module.exports = new EmailService();

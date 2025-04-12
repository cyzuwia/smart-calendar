const { describe, it, expect, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const notificationManager = require('../services/notification-manager');
const wxpusher = require('../services/wxpusher');
const email = require('../services/email');
const telegram = require('../services/telegram');
const db = require('../database/init');

describe('Notification Manager Service', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建沙盒以隔离测试
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有存根和模拟
    sandbox.restore();
  });
  
  describe('sendNotification', () => {
    it('应该根据用户设置发送通知到多个渠道', async () => {
      // 模拟通知分组和时间设置
      sandbox.stub(notificationManager, 'getUserNotificationGroups').resolves([
        { id: 1, name: '重要提醒', event_types: '["event", "birthday"]', enabled: 1 }
      ]);
      
      sandbox.stub(notificationManager, 'checkNotificationTime').resolves(true);
      
      // 模拟用户通知设置
      sandbox.stub(notificationManager, 'getUserNotificationSettings').resolves([
        { id: 1, user_id: 'user1', type: 'wxpusher', config: {}, enabled: true },
        { id: 2, user_id: 'user1', type: 'email', config: {}, enabled: true }
      ]);
      
      // 模拟各通知服务的发送方法
      const wxpusherStub = sandbox.stub(wxpusher, 'sendNotification').resolves({ success: true, message: 'WxPusher发送成功' });
      const emailStub = sandbox.stub(email, 'sendNotification').resolves({ success: true, message: '邮件发送成功' });
      const telegramStub = sandbox.stub(telegram, 'sendNotification').resolves({ success: true, message: 'Telegram发送成功' });
      
      // 测试发送通知
      const result = await notificationManager.sendNotification({
        userId: 'user1',
        title: '测试通知',
        content: '这是一条测试通知',
        eventType: 'event',
        eventId: 1
      });
      
      // 验证结果
      expect(result.success).to.be.true;
      expect(wxpusherStub.calledOnce).to.be.true;
      expect(emailStub.calledOnce).to.be.true;
      expect(telegramStub.called).to.be.false; // Telegram未在用户设置中启用
    });
    
    it('应该根据时间设置决定是否发送通知', async () => {
      // 模拟通知分组
      sandbox.stub(notificationManager, 'getUserNotificationGroups').resolves([
        { id: 1, name: '重要提醒', event_types: '["event", "birthday"]', enabled: 1 }
      ]);
      
      // 模拟时间设置检查返回false
      sandbox.stub(notificationManager, 'checkNotificationTime').resolves(false);
      
      // 测试发送通知
      const result = await notificationManager.sendNotification({
        userId: 'user1',
        title: '测试通知',
        content: '这是一条测试通知',
        eventType: 'event',
        eventId: 1
      });
      
      // 验证结果
      expect(result.success).to.be.false;
      expect(result.message).to.equal('根据时间设置，不发送通知');
    });
    
    it('应该根据通知分组决定是否发送通知', async () => {
      // 模拟通知分组（已禁用）
      sandbox.stub(notificationManager, 'getUserNotificationGroups').resolves([
        { id: 1, name: '重要提醒', event_types: '["event", "birthday"]', enabled: 0 }
      ]);
      
      sandbox.stub(notificationManager, 'checkNotificationTime').resolves(true);
      
      // 模拟获取分组ID
      sandbox.stub(notificationManager, 'getGroupIdByEventType').returns(1);
      
      // 模拟检查分组状态
      sandbox.stub(notificationManager, 'isGroupEnabled').returns(false);
      
      // 测试发送通知
      const result = await notificationManager.sendNotification({
        userId: 'user1',
        title: '测试通知',
        content: '这是一条测试通知',
        eventType: 'event',
        eventId: 1
      });
      
      // 验证结果
      expect(result.success).to.be.false;
      expect(result.message).to.equal('通知分组未启用');
    });
  });
  
  describe('checkNotificationTime', () => {
    it('应该检查当前时间是否在允许发送的时间范围内', async () => {
      // 模拟当前时间为上午10点
      const clock = sandbox.useFakeTimers(new Date('2025-04-12T10:00:00').getTime());
      
      // 模拟数据库查询结果
      sandbox.stub(db, 'get').callsFake((sql, params, callback) => {
        // 允许发送时间为8:00-22:00
        callback(null, {
          user_id: 'user1',
          event_type: 'event',
          start_hour: 8,
          start_minute: 0,
          end_hour: 22,
          end_minute: 0
        });
      });
      
      const result = await notificationManager.checkNotificationTime('user1', 'event');
      
      // 验证结果
      expect(result).to.be.true; // 10:00在8:00-22:00范围内
      
      clock.restore();
    });
    
    it('应该处理跨天的时间范围', async () => {
      // 模拟当前时间为凌晨2点
      const clock = sandbox.useFakeTimers(new Date('2025-04-12T02:00:00').getTime());
      
      // 模拟数据库查询结果
      sandbox.stub(db, 'get').callsFake((sql, params, callback) => {
        // 允许发送时间为22:00-6:00（跨天）
        callback(null, {
          user_id: 'user1',
          event_type: 'event',
          start_hour: 22,
          start_minute: 0,
          end_hour: 6,
          end_minute: 0
        });
      });
      
      const result = await notificationManager.checkNotificationTime('user1', 'event');
      
      // 验证结果
      expect(result).to.be.true; // 2:00在22:00-6:00范围内
      
      clock.restore();
    });
    
    it('应该在没有时间设置时默认允许发送', async () => {
      // 模拟数据库查询结果为空
      sandbox.stub(db, 'get').callsFake((sql, params, callback) => {
        callback(null, null);
      });
      
      const result = await notificationManager.checkNotificationTime('user1', 'event');
      
      // 验证结果
      expect(result).to.be.true;
    });
  });
  
  // 可以添加更多测试用例，如createNotificationGroup和setNotificationTime方法的测试
});

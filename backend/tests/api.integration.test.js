const { describe, it, expect, before, after } = require('mocha');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../server');
const db = require('../database/init');
const lunarBirthdayService = require('../services/lunar-birthday');
const notificationManager = require('../services/notification-manager');

describe('API集成测试', () => {
  let server;
  let authToken;
  
  before(async () => {
    // 启动服务器
    server = app.listen(3001);
    
    // 获取认证令牌
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.token;
  });
  
  after(() => {
    // 关闭服务器
    server.close();
  });
  
  describe('认证API', () => {
    it('应该成功登录并返回令牌', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
      expect(response.body.user.username).to.equal('admin');
    });
    
    it('应该拒绝错误的凭据', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });
      
      expect(response.status).to.equal(401);
    });
  });
  
  describe('事件API', () => {
    it('应该返回用户的事件列表', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
    
    it('应该创建新事件', async () => {
      const newEvent = {
        title: '测试事件',
        description: '这是一个测试事件',
        start_time: '2025-05-01 10:00:00',
        end_time: '2025-05-01 11:00:00',
        all_day: false
      };
      
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.title).to.equal(newEvent.title);
    });
  });
  
  describe('生日API', () => {
    it('应该返回用户的生日列表', async () => {
      // 模拟生日服务
      const getBirthdayListStub = sinon.stub(lunarBirthdayService, 'getBirthdayList').resolves([
        {
          id: 1,
          name: '张三',
          birth_date: '1990-05-15',
          calendar_type: 'solar',
          next_birthday: '2025-05-15',
          days_remaining: 33
        }
      ]);
      
      const response = await request(app)
        .get('/api/birthdays')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('next_birthday');
      expect(response.body[0]).to.have.property('days_remaining');
      
      getBirthdayListStub.restore();
    });
    
    it('应该创建新生日记录', async () => {
      // 模拟添加生日服务
      const addBirthdayStub = sinon.stub(lunarBirthdayService, 'addBirthday').resolves({
        success: true,
        message: '生日信息添加成功',
        data: {
          id: 2,
          name: '李四',
          birth_date: '1985-03-10',
          calendar_type: 'lunar',
          next_birthday: '2026-02-28',
          days_remaining: 320
        }
      });
      
      const newBirthday = {
        name: '李四',
        birth_date: '1985-03-10',
        calendar_type: 'lunar',
        note: '朋友生日'
      };
      
      const response = await request(app)
        .post('/api/birthdays')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBirthday);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.equal(newBirthday.name);
      expect(response.body.calendar_type).to.equal('lunar');
      
      addBirthdayStub.restore();
    });
  });
  
  describe('值日表API', () => {
    it('应该返回值日安排列表', async () => {
      const response = await request(app)
        .get('/api/duty-roster')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
    
    it('应该创建新值日安排', async () => {
      const newDuty = {
        date: '2025-05-01',
        member_id: 1,
        task: '打扫教室',
        reminder: true,
        reminder_time: '08:00'
      };
      
      const response = await request(app)
        .post('/api/duty-roster')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDuty);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.date).to.equal(newDuty.date);
    });
  });
  
  describe('通知API', () => {
    it('应该发送测试通知', async () => {
      // 模拟通知管理器
      const sendNotificationStub = sinon.stub(notificationManager, 'sendNotification').resolves({
        success: true,
        message: '通知发送完成',
        data: {
          results: [
            { channel: 'wxpusher', success: true, message: 'WxPusher发送成功' }
          ]
        }
      });
      
      const testNotification = {
        title: '测试通知',
        content: '这是一条测试通知',
        channel: 'wxpusher'
      };
      
      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testNotification);
      
      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      
      sendNotificationStub.restore();
    });
    
    it('应该更新通知设置', async () => {
      const settings = {
        wxpusher: {
          enabled: true,
          app_token: 'test_token',
          uid: 'test_uid'
        }
      };
      
      const response = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settings);
      
      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
    });
  });
});

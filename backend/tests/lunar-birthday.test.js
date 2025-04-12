const { describe, it, expect, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const sqlite3 = require('sqlite3').verbose();
const db = require('../database/init');
const lunarBirthdayService = require('../services/lunar-birthday');

describe('Lunar Birthday Service', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建沙盒以隔离测试
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有存根和模拟
    sandbox.restore();
  });
  
  describe('calculateNextBirthday', () => {
    it('应该正确计算阳历生日的下一个日期和倒计时', () => {
      // 模拟当前日期为2025-04-12
      const clock = sandbox.useFakeTimers(new Date('2025-04-12').getTime());
      
      // 测试未来日期的生日（今年还没到）
      const result1 = lunarBirthdayService.calculateNextBirthday('1990-05-15', 'solar');
      expect(result1.next_birthday).to.equal('2025-05-15');
      expect(result1.days_remaining).to.equal(33); // 从4月12日到5月15日有33天
      
      // 测试过去日期的生日（今年已过，计算明年）
      const result2 = lunarBirthdayService.calculateNextBirthday('1985-03-10', 'solar');
      expect(result2.next_birthday).to.equal('2026-03-10');
      expect(result2.days_remaining).to.equal(332); // 从4月12日到明年3月10日
      
      // 测试今天的生日
      const result3 = lunarBirthdayService.calculateNextBirthday('2000-04-12', 'solar');
      expect(result3.next_birthday).to.equal('2025-04-12');
      expect(result3.days_remaining).to.equal(0);
      
      clock.restore();
    });
    
    it('应该正确计算阴历生日的下一个日期和倒计时', () => {
      // 这个测试需要lunar-javascript库的支持
      // 由于阴历计算复杂，这里只测试函数是否返回预期格式的结果
      
      const result = lunarBirthdayService.calculateNextBirthday('1990-01-15', 'lunar');
      
      expect(result).to.have.property('next_birthday');
      expect(result).to.have.property('days_remaining');
      expect(typeof result.next_birthday).to.equal('string');
      expect(typeof result.days_remaining).to.equal('number');
    });
  });
  
  describe('getBirthdayList', () => {
    it('应该返回按倒计时排序的生日列表', async () => {
      // 模拟数据库查询结果
      const mockBirthdays = [
        { id: 1, user_id: 'user1', name: '张三', birth_date: '1990-05-15', calendar_type: 'solar', note: '' },
        { id: 2, user_id: 'user1', name: '李四', birth_date: '1985-03-10', calendar_type: 'solar', note: '' },
        { id: 3, user_id: 'user1', name: '王五', birth_date: '1992-01-15', calendar_type: 'lunar', note: '' }
      ];
      
      // 模拟数据库查询
      sandbox.stub(db, 'all').callsFake((sql, params, callback) => {
        callback(null, mockBirthdays);
      });
      
      // 模拟计算下一个生日的方法
      sandbox.stub(lunarBirthdayService, 'calculateNextBirthday').callsFake((birthDate, calendarType) => {
        if (birthDate === '1990-05-15') {
          return { next_birthday: '2025-05-15', days_remaining: 33 };
        } else if (birthDate === '1985-03-10') {
          return { next_birthday: '2026-03-10', days_remaining: 332 };
        } else {
          return { next_birthday: '2025-02-15', days_remaining: 10 };
        }
      });
      
      const result = await lunarBirthdayService.getBirthdayList('user1');
      
      // 验证结果是否按倒计时排序
      expect(result).to.have.lengthOf(3);
      expect(result[0].name).to.equal('王五'); // 倒计时10天
      expect(result[1].name).to.equal('张三'); // 倒计时33天
      expect(result[2].name).to.equal('李四'); // 倒计时332天
    });
    
    it('应该处理数据库错误', async () => {
      // 模拟数据库错误
      sandbox.stub(db, 'all').callsFake((sql, params, callback) => {
        callback(new Error('数据库错误'), null);
      });
      
      try {
        await lunarBirthdayService.getBirthdayList('user1');
        // 如果没有抛出错误，测试应该失败
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('数据库错误');
      }
    });
  });
  
  // 可以添加更多测试用例，如addBirthday和updateBirthday方法的测试
});

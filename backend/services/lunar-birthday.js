// 农历生日服务
const { Lunar, Solar } = require('lunar-javascript');
const db = require('../database/init');

class LunarBirthdayService {
  /**
   * 计算下一个生日日期和倒计时
   * @param {string} birthDate - 出生日期 (YYYY-MM-DD格式)
   * @param {string} calendarType - 日历类型 ('solar'或'lunar')
   * @returns {Object} - 包含下一个生日日期和倒计时天数
   */
  calculateNextBirthday(birthDate, calendarType = 'solar') {
    const today = new Date();
    
    if (calendarType === 'solar') {
      // 阳历生日计算
      return this.calculateSolarNextBirthday(birthDate);
    } else {
      // 阴历生日计算
      return this.calculateLunarNextBirthday(birthDate);
    }
  }
  
  /**
   * 计算阳历生日的下一个日期和倒计时
   * @param {string} birthDate - 阳历出生日期 (YYYY-MM-DD格式)
   * @returns {Object} - 包含下一个生日日期和倒计时天数
   */
  calculateSolarNextBirthday(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    
    // 计算今年的生日日期
    const thisYearBirthday = new Date(today.getFullYear(), birthDateObj.getMonth(), birthDateObj.getDate());
    
    // 如果今年的生日已经过了，计算明年的生日
    const nextBirthdayYear = today > thisYearBirthday ? today.getFullYear() + 1 : today.getFullYear();
    const nextBirthday = new Date(nextBirthdayYear, birthDateObj.getMonth(), birthDateObj.getDate());
    
    // 计算剩余天数
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      next_birthday: nextBirthday.toISOString().split('T')[0],
      days_remaining: diffDays
    };
  }
  
  /**
   * 计算阴历生日的下一个日期和倒计时
   * @param {string} birthDate - 阴历出生日期 (YYYY-MM-DD格式)
   * @returns {Object} - 包含下一个生日日期和倒计时天数
   */
  calculateLunarNextBirthday(birthDate) {
    try {
      const today = new Date();
      const [year, month, day] = birthDate.split('-').map(Number);
      
      // 将阳历出生日期转换为阴历日期
      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();
      
      // 获取阴历的月和日
      const lunarMonth = lunar.getMonth();
      const lunarDay = lunar.getDay();
      
      // 计算今年的阴历生日对应的阳历日期
      const thisYearLunar = Lunar.fromYmd(today.getFullYear(), lunarMonth, lunarDay);
      const thisYearSolar = thisYearLunar.getSolar();
      
      // 转换为Date对象
      const thisYearBirthday = new Date(thisYearSolar.getYear(), thisYearSolar.getMonth() - 1, thisYearSolar.getDay());
      
      // 如果今年的生日已经过了，计算明年的生日
      let nextYearLunar, nextYearSolar;
      if (today > thisYearBirthday) {
        nextYearLunar = Lunar.fromYmd(today.getFullYear() + 1, lunarMonth, lunarDay);
        nextYearSolar = nextYearLunar.getSolar();
      } else {
        nextYearSolar = thisYearSolar;
      }
      
      // 转换为标准日期格式
      const nextBirthday = `${nextYearSolar.getYear()}-${String(nextYearSolar.getMonth()).padStart(2, '0')}-${String(nextYearSolar.getDay()).padStart(2, '0')}`;
      
      // 计算剩余天数
      const nextBirthdayDate = new Date(nextYearSolar.getYear(), nextYearSolar.getMonth() - 1, nextYearSolar.getDay());
      const diffTime = nextBirthdayDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        next_birthday: nextBirthday,
        days_remaining: diffDays
      };
    } catch (error) {
      console.error('计算阴历生日失败:', error);
      // 出错时返回默认值
      return {
        next_birthday: 'Unknown',
        days_remaining: 0
      };
    }
  }
  
  /**
   * 获取生日列表，包含下一个生日日期和倒计时
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} - 生日列表
   */
  async getBirthdayList(userId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM birthdays WHERE user_id = ?', [userId], (err, birthdays) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 处理每个生日，计算下一个生日日期和倒计时
        const processedBirthdays = birthdays.map(birthday => {
          const calendarType = birthday.calendar_type || 'solar';
          const nextBirthdayInfo = this.calculateNextBirthday(birthday.birth_date, calendarType);
          
          return {
            ...birthday,
            calendar_type: calendarType,
            next_birthday: nextBirthdayInfo.next_birthday,
            days_remaining: nextBirthdayInfo.days_remaining
          };
        });
        
        // 按倒计时天数排序
        processedBirthdays.sort((a, b) => a.days_remaining - b.days_remaining);
        
        resolve(processedBirthdays);
      });
    });
  }
  
  /**
   * 添加生日信息
   * @param {Object} birthdayData - 生日数据
   * @returns {Promise<Object>} - 添加结果
   */
  async addBirthday(birthdayData) {
    const { userId, name, birthDate, calendarType = 'solar', note = '' } = birthdayData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO birthdays (user_id, name, birth_date, calendar_type, note) VALUES (?, ?, ?, ?, ?)',
        [userId, name, birthDate, calendarType, note],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // 获取新添加的生日信息
          db.get('SELECT * FROM birthdays WHERE id = ?', [this.lastID], (err, birthday) => {
            if (err) {
              reject(err);
              return;
            }
            
            // 计算下一个生日日期和倒计时
            const nextBirthdayInfo = this.calculateNextBirthday(birthday.birth_date, birthday.calendar_type);
            
            resolve({
              success: true,
              message: '生日信息添加成功',
              data: {
                ...birthday,
                next_birthday: nextBirthdayInfo.next_birthday,
                days_remaining: nextBirthdayInfo.days_remaining
              }
            });
          });
        }.bind(this)
      );
    });
  }
  
  /**
   * 更新生日信息
   * @param {Object} birthdayData - 生日数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateBirthday(birthdayData) {
    const { id, name, birthDate, calendarType, note = '' } = birthdayData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE birthdays SET name = ?, birth_date = ?, calendar_type = ?, note = ? WHERE id = ?',
        [name, birthDate, calendarType, note, id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // 获取更新后的生日信息
          db.get('SELECT * FROM birthdays WHERE id = ?', [id], (err, birthday) => {
            if (err) {
              reject(err);
              return;
            }
            
            // 计算下一个生日日期和倒计时
            const nextBirthdayInfo = this.calculateNextBirthday(birthday.birth_date, birthday.calendar_type);
            
            resolve({
              success: true,
              message: '生日信息更新成功',
              data: {
                ...birthday,
                next_birthday: nextBirthdayInfo.next_birthday,
                days_remaining: nextBirthdayInfo.days_remaining
              }
            });
          });
        }.bind(this)
      );
    });
  }
}

module.exports = new LunarBirthdayService();

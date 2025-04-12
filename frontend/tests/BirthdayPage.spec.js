import { mount } from '@vue/test-utils';
import { expect } from 'chai';
import BirthdayPage from '../src/components/BirthdayPage.vue';

describe('BirthdayPage.vue', () => {
  let wrapper;
  
  beforeEach(() => {
    // 挂载组件
    wrapper = mount(BirthdayPage);
  });
  
  afterEach(() => {
    // 销毁组件
    wrapper.unmount();
  });
  
  it('应该正确显示生日列表', () => {
    // 检查表格是否存在
    expect(wrapper.find('.birthday-list').exists()).to.be.true;
    
    // 检查是否有正确数量的生日记录
    const rows = wrapper.findAll('.birthday-list .el-table__row');
    expect(rows.length).to.equal(3); // 示例数据中有3条记录
  });
  
  it('应该显示阴历/阳历标签', () => {
    // 检查是否显示了日历类型标签
    const tags = wrapper.findAll('.el-tag');
    expect(tags.length).to.be.at.least(3); // 至少有3个标签（每个生日记录一个）
    
    // 检查标签内容
    const tagTexts = tags.map(tag => tag.text());
    expect(tagTexts).to.include('阳历');
    expect(tagTexts).to.include('农历');
  });
  
  it('应该显示最近的生日倒计时', () => {
    // 检查倒计时卡片是否存在
    expect(wrapper.find('.birthday-countdown').exists()).to.be.true;
    
    // 检查倒计时值是否为数字
    const countdownValue = wrapper.find('.countdown-value').text();
    expect(Number(countdownValue)).to.be.a('number');
  });
  
  it('应该能打开添加生日对话框', async () => {
    // 初始状态对话框应该是关闭的
    expect(wrapper.find('.el-dialog').exists()).to.be.false;
    
    // 点击添加按钮
    await wrapper.find('.add-birthday button').trigger('click');
    
    // 对话框应该打开
    expect(wrapper.vm.dialogVisible).to.be.true;
    
    // 检查对话框标题
    expect(wrapper.find('.el-dialog__title').text()).to.equal('添加生日信息');
  });
  
  it('应该能在表单中选择日历类型', async () => {
    // 打开添加对话框
    await wrapper.find('.add-birthday button').trigger('click');
    
    // 检查日历类型选择是否存在
    const radioGroup = wrapper.find('.el-radio-group');
    expect(radioGroup.exists()).to.be.true;
    
    // 检查是否有阳历和农历选项
    const radioButtons = wrapper.findAll('.el-radio');
    expect(radioButtons.length).to.equal(2);
    
    // 默认应该选择阳历
    expect(wrapper.vm.birthdayForm.calendar_type).to.equal('solar');
    
    // 选择农历
    await radioButtons[1].trigger('click');
    
    // 检查是否更新了表单值
    expect(wrapper.vm.birthdayForm.calendar_type).to.equal('lunar');
    
    // 检查是否显示了农历提示信息
    expect(wrapper.find('.calendar-type-hint').exists()).to.be.true;
  });
});

import { mount } from '@vue/test-utils';
import { expect } from 'chai';
import Clock from '../src/components/Clock.vue';

describe('Clock.vue', () => {
  let wrapper;
  let clock;
  
  beforeEach(() => {
    // 模拟固定时间为2025-04-12 14:30:45
    clock = sinon.useFakeTimers(new Date('2025-04-12T14:30:45').getTime());
    
    // 挂载组件
    wrapper = mount(Clock);
  });
  
  afterEach(() => {
    // 恢复时钟
    clock.restore();
    
    // 销毁组件
    wrapper.unmount();
  });
  
  it('应该正确显示当前时间', () => {
    // 检查时间格式
    expect(wrapper.find('.time').text()).to.match(/\d{2}:\d{2}:\d{2}/);
    
    // 检查具体时间值
    expect(wrapper.find('.time').text()).to.equal('14:30:45');
  });
  
  it('应该正确显示当前日期', () => {
    // 检查日期格式
    expect(wrapper.find('.date').text()).to.match(/\d{4}-\d{2}-\d{2}/);
    
    // 检查具体日期值
    expect(wrapper.find('.date').text()).to.equal('2025-04-12');
  });
  
  it('应该正确显示星期几', () => {
    // 2025-04-12是星期六
    expect(wrapper.find('.weekday').text()).to.equal('星期六');
  });
  
  it('应该每秒更新时间', async () => {
    // 记录初始时间
    const initialTime = wrapper.find('.time').text();
    
    // 前进1秒
    clock.tick(1000);
    
    // 等待DOM更新
    await wrapper.vm.$nextTick();
    
    // 检查时间是否已更新
    const updatedTime = wrapper.find('.time').text();
    expect(updatedTime).to.not.equal(initialTime);
    expect(updatedTime).to.equal('14:30:46');
  });
});

import type { MenuItem, SalesOrder, TeaBreakOrder, KitchenPrepItem, DailySettlement } from './types';

export const mockMenuItems: MenuItem[] = [
  { id: 'm1', name: '龙井茶', category: '茶饮', unitCost: 5, unitPrice: 15, stock: 200, allergens: [], isSpecial: false },
  { id: 'm2', name: '美式咖啡', category: '咖啡', unitCost: 8, unitPrice: 25, stock: 150, allergens: [], isSpecial: false },
  { id: 'm3', name: '拿铁咖啡', category: '咖啡', unitCost: 10, unitPrice: 30, stock: 100, allergens: ['乳制品'], isSpecial: false },
  { id: 'm4', name: '三明治拼盘', category: '点心', unitCost: 15, unitPrice: 38, stock: 50, allergens: ['麸质', '乳制品'], isSpecial: false },
  { id: 'm5', name: '水果拼盘', category: '水果', unitCost: 20, unitPrice: 48, stock: 40, allergens: [], isSpecial: false },
  { id: 'm6', name: '蛋糕切件', category: '点心', unitCost: 12, unitPrice: 32, stock: 60, allergens: ['麸质', '乳制品', '鸡蛋'], isSpecial: false },
  { id: 'm7', name: '坚果杂盘', category: '小食', unitCost: 18, unitPrice: 42, stock: 30, allergens: ['坚果'], isSpecial: false },
  { id: 'm8', name: '蔬菜卷', category: '小食', unitCost: 10, unitPrice: 28, stock: 45, allergens: ['麸质'], isSpecial: false },
  { id: 'm9', name: '无麸质曲奇', category: '点心', unitCost: 16, unitPrice: 40, stock: 20, allergens: [], isSpecial: true },
  { id: 'm10', name: '纯素慕斯', category: '点心', unitCost: 14, unitPrice: 36, stock: 15, allergens: [], isSpecial: true },
  { id: 'm11', name: '低糖酸奶杯', category: '小食', unitCost: 9, unitPrice: 22, stock: 25, allergens: ['乳制品'], isSpecial: true },
  { id: 'm12', name: '有机果汁', category: '饮品', unitCost: 12, unitPrice: 28, stock: 60, allergens: [], isSpecial: false },
];

let _orderCounter = 6;

export const mockSalesOrders: SalesOrder[] = [
  {
    id: 'o1',
    orderNo: 'HTB-20260610-001',
    customerName: '华为技术',
    contactPhone: '13800138001',
    meetingName: '2026年渠道合作伙伴大会',
    meetingRoom: '宴会厅A',
    meetingDate: '2026-06-15',
    meetingStartTime: '09:00',
    meetingEndTime: '17:00',
    headcount: 120,
    headcountConfirmed: true,
    specialRequirements: '需要提供纯素和无麸质选项',
    hasSpecialDiet: true,
    allergyNotes: '3位嘉宾对坚果过敏，2位对麸质过敏',
    status: 'scheduled',
    menuItems: [
      { menuItemId: 'm1', quantity: 120 },
      { menuItemId: 'm5', quantity: 15 },
      { menuItemId: 'm4', quantity: 15 },
      { menuItemId: 'm9', quantity: 5 },
      { menuItemId: 'm10', quantity: 5 },
    ],
    totalCost: 0,
    supplementRecords: [],
    createdBy: '张销售',
    createdAt: '2026-06-10 10:30:00',
    updatedAt: '2026-06-12 14:00:00',
  },
  {
    id: 'o2',
    orderNo: 'HTB-20260611-002',
    customerName: '腾讯云',
    contactPhone: '13900139002',
    meetingName: '云原生技术沙龙',
    meetingRoom: '会议室B2',
    meetingDate: '2026-06-16',
    meetingStartTime: '14:00',
    meetingEndTime: '18:00',
    headcount: 50,
    headcountConfirmed: true,
    specialRequirements: '',
    hasSpecialDiet: false,
    allergyNotes: '',
    status: 'kitchen_prep',
    menuItems: [
      { menuItemId: 'm2', quantity: 50 },
      { menuItemId: 'm5', quantity: 8 },
      { menuItemId: 'm6', quantity: 8 },
      { menuItemId: 'm12', quantity: 30 },
    ],
    totalCost: 0,
    supplementRecords: [],
    createdBy: '李销售',
    createdAt: '2026-06-11 09:15:00',
    updatedAt: '2026-06-13 10:00:00',
  },
  {
    id: 'o3',
    orderNo: 'HTB-20260612-003',
    customerName: '字节跳动',
    contactPhone: '13700137003',
    meetingName: '产品战略评审会',
    meetingRoom: 'VIP厅',
    meetingDate: '2026-06-14',
    meetingStartTime: '10:00',
    meetingEndTime: '12:00',
    headcount: null,
    headcountConfirmed: false,
    specialRequirements: '高管会议，需要精品茶歇',
    hasSpecialDiet: true,
    allergyNotes: '',
    status: 'pending_confirm',
    menuItems: [
      { menuItemId: 'm3', quantity: 20 },
      { menuItemId: 'm6', quantity: 10 },
      { menuItemId: 'm7', quantity: 5 },
    ],
    totalCost: 0,
    supplementRecords: [],
    createdBy: '王销售',
    createdAt: '2026-06-12 16:45:00',
    updatedAt: '2026-06-12 16:45:00',
  },
  {
    id: 'o5',
    orderNo: 'HTB-20260613-005',
    customerName: '阿里巴巴',
    contactPhone: '13500135005',
    meetingName: '回归测试-过敏备注缺失场景',
    meetingRoom: '会议室C1',
    meetingDate: '2026-06-17',
    meetingStartTime: '09:30',
    meetingEndTime: '11:30',
    headcount: 30,
    headcountConfirmed: true,
    specialRequirements: '有素食和无乳糖需求',
    hasSpecialDiet: true,
    allergyNotes: '',
    status: 'confirmed',
    menuItems: [
      { menuItemId: 'm9', quantity: 10 },
      { menuItemId: 'm10', quantity: 10 },
      { menuItemId: 'm11', quantity: 5 },
    ],
    totalCost: 0,
    supplementRecords: [],
    createdBy: '测试员',
    createdAt: '2026-06-13 08:00:00',
    updatedAt: '2026-06-13 08:00:00',
  },
  {
    id: 'o4',
    orderNo: 'HTB-20260613-004',
    customerName: '小米科技',
    contactPhone: '13600136004',
    meetingName: '新品发布会筹备',
    meetingRoom: '宴会厅B',
    meetingDate: '2026-06-14',
    meetingStartTime: '08:00',
    meetingEndTime: '16:00',
    headcount: 80,
    headcountConfirmed: true,
    specialRequirements: '需要坚果类小食',
    hasSpecialDiet: false,
    allergyNotes: '',
    status: 'setup_in_progress',
    menuItems: [
      { menuItemId: 'm1', quantity: 80 },
      { menuItemId: 'm2', quantity: 40 },
      { menuItemId: 'm7', quantity: 10 },
      { menuItemId: 'm5', quantity: 10 },
      { menuItemId: 'm4', quantity: 10 },
    ],
    totalCost: 0,
    supplementRecords: [
      {
        id: 's1',
        orderId: 'o4',
        items: [{ menuItemId: 'm12', quantity: 20 }],
        cost: 240,
        reason: '客户临时增加果汁需求',
        operator: '赵主管',
        createdAt: '2026-06-14 09:30:00',
      },
    ],
    createdBy: '赵销售',
    createdAt: '2026-06-13 11:20:00',
    updatedAt: '2026-06-14 09:30:00',
  },
];

export const mockTeaBreakOrders: TeaBreakOrder[] = [
  {
    id: 'tb1',
    salesOrderId: 'o1',
    orderNo: 'TBO-20260612-001',
    menuItems: [
      { menuItemId: 'm1', quantity: 120 },
      { menuItemId: 'm5', quantity: 15 },
      { menuItemId: 'm4', quantity: 15 },
      { menuItemId: 'm9', quantity: 5 },
      { menuItemId: 'm10', quantity: 5 },
    ],
    headcount: 120,
    waiterShift: '早班 07:00-15:00 (3人)',
    setupTime: '2026-06-15 08:00',
    status: 'pending_prep',
    kitchenNote: '纯素和无麸质需单独准备，标注过敏原',
  },
  {
    id: 'tb2',
    salesOrderId: 'o2',
    orderNo: 'TBO-20260613-002',
    menuItems: [
      { menuItemId: 'm2', quantity: 50 },
      { menuItemId: 'm5', quantity: 8 },
      { menuItemId: 'm6', quantity: 8 },
      { menuItemId: 'm12', quantity: 30 },
    ],
    headcount: 50,
    waiterShift: '午班 12:00-20:00 (2人)',
    setupTime: '2026-06-16 13:30',
    status: 'preparing',
    kitchenNote: '',
    preparedBy: '刘厨师',
    preparedAt: '2026-06-13 16:00:00',
  },
];

export const mockKitchenPrepItems: KitchenPrepItem[] = [
  { id: 'kp1', teaBreakOrderId: 'tb1', menuItemId: 'm1', menuItemName: '龙井茶', requiredQty: 120, preparedQty: 120, isReady: true, shortage: 0, note: '' },
  { id: 'kp2', teaBreakOrderId: 'tb1', menuItemId: 'm5', menuItemName: '水果拼盘', requiredQty: 15, preparedQty: 15, isReady: true, shortage: 0, note: '' },
  { id: 'kp3', teaBreakOrderId: 'tb1', menuItemId: 'm4', menuItemName: '三明治拼盘', requiredQty: 15, preparedQty: 15, isReady: true, shortage: 0, note: '' },
  { id: 'kp4', teaBreakOrderId: 'tb1', menuItemId: 'm9', menuItemName: '无麸质曲奇', requiredQty: 5, preparedQty: 3, isReady: false, shortage: 2, note: '库存不足，需调整' },
  { id: 'kp5', teaBreakOrderId: 'tb1', menuItemId: 'm10', menuItemName: '纯素慕斯', requiredQty: 5, preparedQty: 5, isReady: true, shortage: 0, note: '' },
  { id: 'kp6', teaBreakOrderId: 'tb2', menuItemId: 'm2', menuItemName: '美式咖啡', requiredQty: 50, preparedQty: 50, isReady: true, shortage: 0, note: '' },
  { id: 'kp7', teaBreakOrderId: 'tb2', menuItemId: 'm5', menuItemName: '水果拼盘', requiredQty: 8, preparedQty: 8, isReady: true, shortage: 0, note: '' },
  { id: 'kp8', teaBreakOrderId: 'tb2', menuItemId: 'm6', menuItemName: '蛋糕切件', requiredQty: 8, preparedQty: 8, isReady: true, shortage: 0, note: '' },
  { id: 'kp9', teaBreakOrderId: 'tb2', menuItemId: 'm12', menuItemName: '有机果汁', requiredQty: 30, preparedQty: 25, isReady: false, shortage: 5, note: '果汁备料中' },
];

export const mockDailySettlements: DailySettlement[] = [
  { date: '2026-06-13', totalOrders: 2, completedOrders: 1, cancelledOrders: 0, extendedOrders: 0, totalRevenue: 3120, totalCost: 1050, grossProfit: 2070, supplementCost: 0 },
  { date: '2026-06-14', totalOrders: 4, completedOrders: 1, cancelledOrders: 0, extendedOrders: 1, totalRevenue: 8560, totalCost: 3120, grossProfit: 5440, supplementCost: 240 },
];

export function nextOrderNo(): string {
  _orderCounter++;
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `HTB-${ds}-${String(_orderCounter).padStart(3, '0')}`;
}

let _tbCounter = 2;
export function nextTbOrderNo(): string {
  _tbCounter++;
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `TBO-${ds}-${String(_tbCounter).padStart(3, '0')}`;
}

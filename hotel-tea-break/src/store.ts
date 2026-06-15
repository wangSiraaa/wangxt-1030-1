import { create } from 'zustand';
import type { SalesOrder, TeaBreakOrder, KitchenPrepItem, MenuItem, DailySettlement, OrderMenuItem, SupplementRecord, VerificationIssue, CostBreakdown, OrderStatus } from './types';
import { mockMenuItems, mockSalesOrders, mockTeaBreakOrders, mockKitchenPrepItems, mockDailySettlements, nextOrderNo, nextTbOrderNo } from './mockData';

interface TeaBreakStore {
  menuItems: MenuItem[];
  salesOrders: SalesOrder[];
  teaBreakOrders: TeaBreakOrder[];
  kitchenPrepItems: KitchenPrepItem[];
  dailySettlements: DailySettlement[];

  addSalesOrder: (order: Omit<SalesOrder, 'id' | 'orderNo' | 'totalCost' | 'supplementRecords' | 'createdAt' | 'updatedAt'>) => SalesOrder;
  updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
  confirmHeadcount: (id: string, headcount: number, allergyNotes?: string) => void;
  deleteSalesOrder: (id: string) => boolean;
  extendOrder: (id: string, reason: string) => void;
  cancelOrder: (id: string, reason: string) => void;

  createTeaBreakOrder: (salesOrderId: string, data: { waiterShift: string; setupTime: string; kitchenNote: string }) => TeaBreakOrder | null;
  updateTeaBreakOrder: (id: string, updates: Partial<TeaBreakOrder>) => void;

  updateKitchenPrepItem: (id: string, updates: Partial<KitchenPrepItem>) => void;
  confirmKitchenPrep: (teaBreakOrderId: string) => void;

  confirmSetup: (teaBreakOrderId: string, confirmedBy: string) => void;
  signOff: (salesOrderId: string, signedBy: string) => void;

  addSupplementRecord: (orderId: string, items: OrderMenuItem[], reason: string, operator: string) => SupplementRecord | null;

  calcCostBreakdown: (orderId: string) => CostBreakdown;
  verifyOrders: () => VerificationIssue[];
  validateOrderForSchedule: (orderId: string) => VerificationIssue[];
  generateDailySettlement: (date: string) => DailySettlement;
}

export const useTeaBreakStore = create<TeaBreakStore>((set, get) => {
  const now = () => new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');

  const recalcOrderCost = (order: SalesOrder, menuItems: MenuItem[]): SalesOrder => {
    let menuCost = 0;
    for (const omi of order.menuItems) {
      const mi = menuItems.find(m => m.id === omi.menuItemId);
      if (mi) menuCost += mi.unitCost * omi.quantity;
    }
    let supplementCost = 0;
    for (const sr of order.supplementRecords) {
      supplementCost += sr.cost;
    }
    return { ...order, totalCost: menuCost + supplementCost };
  };

  const initializedOrders = mockSalesOrders.map(o => recalcOrderCost(o, mockMenuItems));

  return {
    menuItems: mockMenuItems,
    salesOrders: initializedOrders,
    teaBreakOrders: mockTeaBreakOrders,
    kitchenPrepItems: mockKitchenPrepItems,
    dailySettlements: mockDailySettlements,

    addSalesOrder: (orderData) => {
      const ts = now();
      const order: SalesOrder = {
        ...orderData,
        id: `o${Date.now()}`,
        orderNo: nextOrderNo(),
        totalCost: 0,
        supplementRecords: [],
        createdAt: ts,
        updatedAt: ts,
      };
      const recalced = recalcOrderCost(order, get().menuItems);
      set(s => ({ salesOrders: [...s.salesOrders, recalced] }));
      return recalced;
    },

    updateSalesOrder: (id, updates) => {
      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === id ? recalcOrderCost({ ...o, ...updates, updatedAt: now() }, s.menuItems) : o
        ),
      }));
    },

    confirmHeadcount: (id, headcount, allergyNotes) => {
      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === id
            ? recalcOrderCost({
                ...o,
                headcount,
                headcountConfirmed: true,
                allergyNotes: allergyNotes !== undefined ? allergyNotes : o.allergyNotes,
                status: 'confirmed' as OrderStatus,
                updatedAt: now()
              }, s.menuItems)
            : o
        ),
      }));
    },

    deleteSalesOrder: (id) => {
      const order = get().salesOrders.find(o => o.id === id);
      if (!order) return false;
      const meetingDate = new Date(order.meetingDate + 'T' + order.meetingStartTime);
      if (meetingDate <= new Date()) return false;
      set(s => ({ salesOrders: s.salesOrders.filter(o => o.id !== id) }));
      return true;
    },

    extendOrder: (id, reason) => {
      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === id
            ? { ...o, status: 'extended' as OrderStatus, extensionReason: reason, updatedAt: now() }
            : o
        ),
      }));
    },

    cancelOrder: (id, reason) => {
      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === id
            ? { ...o, status: 'cancelled' as OrderStatus, cancelReason: reason, updatedAt: now() }
            : o
        ),
      }));
    },

    createTeaBreakOrder: (salesOrderId, data) => {
      const issues = get().validateOrderForSchedule(salesOrderId);
      const errors = issues.filter(i => i.severity === 'error');
      if (errors.length > 0) return null;

      const order = get().salesOrders.find(o => o.id === salesOrderId);
      if (!order) return null;

      const tbOrder: TeaBreakOrder = {
        id: `tb${Date.now()}`,
        salesOrderId,
        orderNo: nextTbOrderNo(),
        menuItems: [...order.menuItems],
        headcount: order.headcount!,
        waiterShift: data.waiterShift,
        setupTime: data.setupTime,
        status: 'pending_prep',
        kitchenNote: data.kitchenNote,
      };

      const prepItems: KitchenPrepItem[] = order.menuItems.map((omi, idx) => {
        const mi = get().menuItems.find(m => m.id === omi.menuItemId);
        const shortage = Math.max(0, omi.quantity - (mi?.stock ?? 0));
        return {
          id: `kp_${tbOrder.id}_${idx}`,
          teaBreakOrderId: tbOrder.id,
          menuItemId: omi.menuItemId,
          menuItemName: mi?.name ?? '未知',
          requiredQty: omi.quantity,
          preparedQty: 0,
          isReady: false,
          shortage,
          note: shortage > 0 ? `库存不足，缺口 ${shortage}` : '',
        };
      });

      set(s => {
        const newOrders = s.salesOrders.map(o =>
          o.id === salesOrderId ? { ...o, status: 'scheduled' as OrderStatus, updatedAt: now() } : o
        );
        return {
          salesOrders: newOrders,
          teaBreakOrders: [...s.teaBreakOrders, tbOrder],
          kitchenPrepItems: [...s.kitchenPrepItems, ...prepItems],
        };
      });
      return tbOrder;
    },

    updateTeaBreakOrder: (id, updates) => {
      set(s => ({
        teaBreakOrders: s.teaBreakOrders.map(tb =>
          tb.id === id ? { ...tb, ...updates } : tb
        ),
      }));
    },

    updateKitchenPrepItem: (id, updates) => {
      set(s => ({
        kitchenPrepItems: s.kitchenPrepItems.map(kp =>
          kp.id === id
            ? {
                ...kp,
                ...updates,
                isReady: updates.preparedQty !== undefined ? updates.preparedQty >= kp.requiredQty : kp.isReady,
                shortage: updates.preparedQty !== undefined ? Math.max(0, kp.requiredQty - updates.preparedQty) : kp.shortage,
              }
            : kp
        ),
      }));
    },

    confirmKitchenPrep: (teaBreakOrderId) => {
      const items = get().kitchenPrepItems.filter(kp => kp.teaBreakOrderId === teaBreakOrderId);
      const allReady = items.every(kp => kp.isReady);

      set(s => ({
        salesOrders: s.salesOrders.map(o => {
          const tb = s.teaBreakOrders.find(t => t.id === teaBreakOrderId);
          if (tb && tb.salesOrderId === o.id) {
            return { ...o, status: 'kitchen_prep' as OrderStatus, updatedAt: now() };
          }
          return o;
        }),
        teaBreakOrders: s.teaBreakOrders.map(tb =>
          tb.id === teaBreakOrderId
            ? {
                ...tb,
                status: allReady ? 'ready' : 'preparing',
                preparedBy: '厨房确认',
                preparedAt: now(),
              }
            : tb
        ),
      }));
    },

    confirmSetup: (teaBreakOrderId, confirmedBy) => {
      set(s => {
        const tb = s.teaBreakOrders.find(t => t.id === teaBreakOrderId);
        if (!tb) return s;
        return {
          salesOrders: s.salesOrders.map(o =>
            o.id === tb.salesOrderId ? { ...o, status: 'awaiting_signoff' as OrderStatus, updatedAt: now() } : o
          ),
          teaBreakOrders: s.teaBreakOrders.map(t =>
            t.id === teaBreakOrderId
              ? { ...t, status: 'serving' as TeaBreakOrder['status'], confirmedBy, confirmedAt: now() }
              : t
          ),
        };
      });
    },

    signOff: (salesOrderId, signedBy) => {
      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === salesOrderId
            ? { ...o, status: 'completed' as OrderStatus, signedOffBy: signedBy, signedOffAt: now(), updatedAt: now() }
            : o
        ),
        teaBreakOrders: s.teaBreakOrders.map(tb => {
          if (tb.salesOrderId === salesOrderId) {
            return { ...tb, status: 'completed' as TeaBreakOrder['status'] };
          }
          return tb;
        }),
      }));
    },

    addSupplementRecord: (orderId, items, reason, operator) => {
      const order = get().salesOrders.find(o => o.id === orderId);
      if (!order) return null;

      let supplementCost = 0;
      for (const omi of items) {
        const mi = get().menuItems.find(m => m.id === omi.menuItemId);
        if (mi) supplementCost += mi.unitCost * omi.quantity;
      }

      const record: SupplementRecord = {
        id: `s${Date.now()}`,
        orderId,
        items,
        cost: supplementCost,
        reason,
        operator,
        createdAt: now(),
      };

      set(s => ({
        salesOrders: s.salesOrders.map(o =>
          o.id === orderId
            ? recalcOrderCost(
                { ...o, supplementRecords: [...o.supplementRecords, record], updatedAt: now() },
                s.menuItems
              )
            : o
        ),
      }));
      return record;
    },

    calcCostBreakdown: (orderId) => {
      const order = get().salesOrders.find(o => o.id === orderId);
      if (!order || !order.headcount) {
        return { menuCost: 0, perPersonCost: 0, totalMenuCost: 0, supplementCost: 0, grandTotal: 0, grossMargin: 0 };
      }
      const menuItems = get().menuItems;
      let menuCost = 0;
      let menuRevenue = 0;
      for (const omi of order.menuItems) {
        const mi = menuItems.find(m => m.id === omi.menuItemId);
        if (mi) {
          menuCost += mi.unitCost * omi.quantity;
          menuRevenue += mi.unitPrice * omi.quantity;
        }
      }
      let supplementCost = 0;
      for (const sr of order.supplementRecords) {
        supplementCost += sr.cost;
      }
      const totalRevenue = menuRevenue;
      const grandTotal = menuCost + supplementCost;
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - grandTotal) / totalRevenue) * 100 : 0;
      return {
        menuCost,
        perPersonCost: order.headcount > 0 ? menuCost / order.headcount : 0,
        totalMenuCost: menuCost,
        supplementCost,
        grandTotal,
        grossMargin: Math.round(grossMargin * 100) / 100,
      };
    },

    verifyOrders: () => {
      const issues: VerificationIssue[] = [];
      const orders = get().salesOrders;

      for (const order of orders) {
        if (order.status === 'cancelled' || order.status === 'completed') continue;

        if (!order.headcountConfirmed || order.headcount === null) {
          issues.push({
            type: 'headcount_unconfirmed',
            orderId: order.id,
            orderNo: order.orderNo,
            message: `订单 ${order.orderNo}（${order.meetingName}）人数未确认，无法生成茶歇单`,
            severity: 'error',
          });
        }

        if (order.hasSpecialDiet && !order.allergyNotes.trim()) {
          issues.push({
            type: 'allergy_missing',
            orderId: order.id,
            orderNo: order.orderNo,
            message: `订单 ${order.orderNo}（${order.meetingName}）含特殊餐标但缺少过敏备注，不可过审`,
            severity: 'error',
          });
        }

        const meetingDate = new Date(order.meetingDate + 'T' + order.meetingStartTime);
        if (meetingDate <= new Date() && order.status !== 'draft') {
          issues.push({
            type: 'delete_after_start',
            orderId: order.id,
            orderNo: order.orderNo,
            message: `订单 ${order.orderNo}（${order.meetingName}）会议已开始，禁止删除`,
            severity: 'warning',
          });
        }

        if (order.supplementRecords.length > 0) {
          let supplementCost = 0;
          for (const sr of order.supplementRecords) supplementCost += sr.cost;
          if (supplementCost > 0) {
            issues.push({
              type: 'supplement_cost_recalc',
              orderId: order.id,
              orderNo: order.orderNo,
              message: `订单 ${order.orderNo}（${order.meetingName}）存在补录成本 ¥${supplementCost}，需重算总成本`,
              severity: 'warning',
            });
          }
        }
      }

      return issues;
    },

    validateOrderForSchedule: (orderId) => {
      const issues: VerificationIssue[] = [];
      const order = get().salesOrders.find(o => o.id === orderId);
      if (!order) return issues;
      if (order.status === 'cancelled' || order.status === 'completed') return issues;

      if (!order.headcountConfirmed || order.headcount === null) {
        issues.push({
          type: 'headcount_unconfirmed',
          orderId: order.id,
          orderNo: order.orderNo,
          message: `订单 ${order.orderNo}（${order.meetingName}）人数未确认，无法生成茶歇单`,
          severity: 'error',
        });
      }

      if (order.hasSpecialDiet && !order.allergyNotes.trim()) {
        issues.push({
          type: 'allergy_missing',
          orderId: order.id,
          orderNo: order.orderNo,
          message: `订单 ${order.orderNo}（${order.meetingName}）含特殊餐标但缺少过敏备注，不可过审`,
          severity: 'error',
        });
      }

      return issues;
    },

    generateDailySettlement: (date) => {
      const orders = get().salesOrders.filter(o => o.meetingDate === date);
      const menuItems = get().menuItems;

      let totalRevenue = 0;
      let totalCost = 0;
      let supplementCost = 0;

      for (const order of orders) {
        for (const omi of order.menuItems) {
          const mi = menuItems.find(m => m.id === omi.menuItemId);
          if (mi) {
            totalRevenue += mi.unitPrice * omi.quantity;
            totalCost += mi.unitCost * omi.quantity;
          }
        }
        for (const sr of order.supplementRecords) {
          supplementCost += sr.cost;
        }
      }

      const settlement: DailySettlement = {
        date,
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        extendedOrders: orders.filter(o => o.status === 'extended').length,
        totalRevenue,
        totalCost: totalCost + supplementCost,
        grossProfit: totalRevenue - totalCost - supplementCost,
        supplementCost,
      };

      set(s => ({
        dailySettlements: s.dailySettlements.some(ds => ds.date === date)
          ? s.dailySettlements.map(ds => ds.date === date ? settlement : ds)
          : [...s.dailySettlements, settlement],
      }));

      return settlement;
    },
  };
});

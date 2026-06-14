export type OrderStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'scheduled'
  | 'kitchen_prep'
  | 'setup_in_progress'
  | 'awaiting_signoff'
  | 'completed'
  | 'extended'
  | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: '草稿',
  pending_confirm: '待确认人数',
  confirmed: '人数已确认',
  scheduled: '已排单',
  kitchen_prep: '厨房备料中',
  setup_in_progress: '布置中',
  awaiting_signoff: '待签收',
  completed: '已完成签收',
  extended: '已延期',
  cancelled: '已撤单',
};

export type TeaBreakStatus =
  | 'draft'
  | 'pending_prep'
  | 'preparing'
  | 'ready'
  | 'serving'
  | 'completed';

export const TEA_BREAK_STATUS_LABEL: Record<TeaBreakStatus, string> = {
  draft: '待排单',
  pending_prep: '待备料',
  preparing: '备料中',
  ready: '备料完成',
  serving: '服务中',
  completed: '已完成',
};

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  unitPrice: number;
  stock: number;
  allergens: string[];
  isSpecial: boolean;
}

export interface OrderMenuItem {
  menuItemId: string;
  quantity: number;
  note?: string;
}

export interface SupplementRecord {
  id: string;
  orderId: string;
  items: OrderMenuItem[];
  cost: number;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  customerName: string;
  contactPhone: string;
  meetingName: string;
  meetingRoom: string;
  meetingDate: string;
  meetingStartTime: string;
  meetingEndTime: string;
  headcount: number | null;
  headcountConfirmed: boolean;
  specialRequirements: string;
  hasSpecialDiet: boolean;
  allergyNotes: string;
  status: OrderStatus;
  menuItems: OrderMenuItem[];
  tableLayout?: string;
  totalCost: number;
  supplementRecords: SupplementRecord[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  signedOffBy?: string;
  signedOffAt?: string;
  extensionReason?: string;
  cancelReason?: string;
}

export interface TeaBreakOrder {
  id: string;
  salesOrderId: string;
  orderNo: string;
  menuItems: OrderMenuItem[];
  headcount: number;
  waiterShift: string;
  setupTime: string;
  status: TeaBreakStatus;
  kitchenNote: string;
  preparedBy?: string;
  preparedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  tableLayoutSnapshot?: string;
}

export interface KitchenPrepItem {
  id: string;
  teaBreakOrderId: string;
  menuItemId: string;
  menuItemName: string;
  requiredQty: number;
  preparedQty: number;
  isReady: boolean;
  shortage: number;
  note: string;
}

export interface DailySettlement {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  extendedOrders: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  supplementCost: number;
}

export interface VerificationIssue {
  type: 'headcount_unconfirmed' | 'allergy_missing' | 'delete_after_start' | 'supplement_cost_recalc';
  orderId: string;
  orderNo: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CostBreakdown {
  menuCost: number;
  perPersonCost: number;
  totalMenuCost: number;
  supplementCost: number;
  grandTotal: number;
  grossMargin: number;
}

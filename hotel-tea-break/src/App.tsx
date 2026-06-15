import { useState } from 'react';
import {
  Tabs, Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Card,
  Statistic, Row, Col, Alert, Descriptions, Popconfirm, message, Badge, Tooltip, Divider, Steps
} from 'antd';
import {
  PlusOutlined, CheckOutlined, DeleteOutlined, EditOutlined, WarningOutlined,
  AuditOutlined, DollarOutlined, FileAddOutlined, FileProtectOutlined,
  BarChartOutlined, SafetyCertificateOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTeaBreakStore } from './store';
import { ORDER_STATUS_LABEL, TEA_BREAK_STATUS_LABEL } from './types';
import type { SalesOrder, TeaBreakOrder, KitchenPrepItem, OrderMenuItem, VerificationIssue } from './types';
import './App.css';

const statusColorMap: Record<string, string> = {
  draft: 'default',
  pending_confirm: 'orange',
  confirmed: 'blue',
  scheduled: 'cyan',
  kitchen_prep: 'geekblue',
  setup_in_progress: 'purple',
  awaiting_signoff: 'gold',
  completed: 'green',
  extended: 'magenta',
  cancelled: 'red',
};

const tbStatusColorMap: Record<string, string> = {
  draft: 'default',
  pending_prep: 'orange',
  preparing: 'blue',
  ready: 'cyan',
  serving: 'purple',
  completed: 'green',
};

function SalesOrderPanel() {
  const { salesOrders, menuItems, addSalesOrder, updateSalesOrder, confirmHeadcount, deleteSalesOrder, extendOrder, cancelOrder } = useTeaBreakStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<SalesOrder | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState('');
  const [confirmCount, setConfirmCount] = useState<number>(0);
  const [confirmAllergyNotes, setConfirmAllergyNotes] = useState('');
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendOrderId, setExtendOrderId] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [form] = Form.useForm();

  const openEdit = (order: SalesOrder) => {
    setEditOrder(order);
    form.setFieldsValue({
      ...order,
      menuItems: order.menuItems.map(omi => ({
        menuItemId: omi.menuItemId,
        quantity: omi.quantity,
        note: omi.note,
      })),
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditOrder(null);
    form.resetFields();
    form.setFieldsValue({ headcount: null, headcountConfirmed: false, hasSpecialDiet: false, specialRequirements: '', allergyNotes: '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const menuItemsList: OrderMenuItem[] = (values.menuItems || []).map((m: { menuItemId: string; quantity: number; note?: string }) => ({
        menuItemId: m.menuItemId,
        quantity: m.quantity,
        note: m.note,
      }));
      if (editOrder) {
        const hasSpecialDiet = menuItemsList.some(omi => {
          const mi = menuItems.find(m => m.id === omi.menuItemId);
          return mi?.isSpecial;
        });
        updateSalesOrder(editOrder.id, {
          customerName: values.customerName,
          contactPhone: values.contactPhone,
          meetingName: values.meetingName,
          meetingRoom: values.meetingRoom,
          meetingDate: values.meetingDate,
          meetingStartTime: values.meetingStartTime,
          meetingEndTime: values.meetingEndTime,
          specialRequirements: values.specialRequirements,
          hasSpecialDiet,
          allergyNotes: values.allergyNotes || '',
          menuItems: menuItemsList,
          status: values.headcountConfirmed ? 'confirmed' : editOrder.status,
        });
        message.success('订单已更新');
      } else {
        const hasSpecialDiet = menuItemsList.some(omi => {
          const mi = menuItems.find(m => m.id === omi.menuItemId);
          return mi?.isSpecial;
        });
        addSalesOrder({
          customerName: values.customerName,
          contactPhone: values.contactPhone,
          meetingName: values.meetingName,
          meetingRoom: values.meetingRoom,
          meetingDate: values.meetingDate,
          meetingStartTime: values.meetingStartTime,
          meetingEndTime: values.meetingEndTime,
          headcount: values.headcount,
          headcountConfirmed: values.headcountConfirmed || false,
          specialRequirements: values.specialRequirements || '',
          hasSpecialDiet,
          allergyNotes: values.allergyNotes || '',
          status: 'draft',
          menuItems: menuItemsList,
          createdBy: '当前用户',
        });
        message.success('订单已创建');
      }
      setModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    const ok = deleteSalesOrder(id);
    if (ok) {
      message.success('订单已删除');
    } else {
      message.error('会议已开始，禁止删除');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 100 },
    { title: '会议名称', dataIndex: 'meetingName', key: 'meetingName', width: 180, ellipsis: true },
    { title: '会议室', dataIndex: 'meetingRoom', key: 'meetingRoom', width: 90 },
    { title: '日期', dataIndex: 'meetingDate', key: 'meetingDate', width: 110 },
    { title: '人数', key: 'headcount', width: 80, render: (_: unknown, r: SalesOrder) =>
      r.headcountConfirmed && r.headcount ? <Tag color="green">{r.headcount}</Tag> : <Tag color="orange">未确认</Tag>
    },
    { title: '状态', key: 'status', width: 100, render: (_: unknown, r: SalesOrder) =>
      <Tag color={statusColorMap[r.status]}>{ORDER_STATUS_LABEL[r.status]}</Tag>
    },
    { title: '特殊餐标', key: 'specialDiet', width: 90, render: (_: unknown, r: SalesOrder) =>
      r.hasSpecialDiet ? <Tag color="red">是</Tag> : <Tag>否</Tag>
    },
    { title: '过敏备注', dataIndex: 'allergyNotes', key: 'allergyNotes', width: 140, ellipsis: true, render: (t: string, r: SalesOrder) =>
      r.hasSpecialDiet && !t ? <Tag color="red">缺失！</Tag> : t || '-'
    },
    { title: '操作', key: 'action', width: 280, render: (_: unknown, r: SalesOrder) => (
      <Space size={4} wrap>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
        {!r.headcountConfirmed && <Button size="small" type="primary" onClick={() => {
          setConfirmOrderId(r.id);
          setConfirmCount(r.headcount || 0);
          setConfirmAllergyNotes(r.allergyNotes || '');
          setConfirmModalOpen(true);
          if (r.hasSpecialDiet && !r.allergyNotes.trim()) {
            message.warning('该订单含特殊餐标，请同时补填过敏备注');
          }
        }}>确认人数</Button>}
        {r.status === 'confirmed' && <Tag color="blue">可排单</Tag>}
        {!['completed', 'cancelled'].includes(r.status) && r.status !== 'extended' && (
          <Button size="small" onClick={() => { setExtendOrderId(r.id); setExtendReason(''); setExtendModalOpen(true); }}>延期</Button>
        )}
        {!['completed', 'cancelled'].includes(r.status) && (
          <Button size="small" danger onClick={() => { setCancelOrderId(r.id); setCancelReason(''); setCancelModalOpen(true); }}>撤单</Button>
        )}
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建销售订单</Button>
      </div>
      <Table dataSource={salesOrders} columns={columns} rowKey="id" size="small" scroll={{ x: 1400 }} />

      <Modal title={editOrder ? '编辑订单' : '新建订单'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave} width={720}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="meetingName" label="会议名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="meetingRoom" label="会议室" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="meetingDate" label="会议日期" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
            <Col span={8}><Form.Item name="meetingStartTime" label="开始时间" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
            <Col span={8}><Form.Item name="meetingEndTime" label="结束时间" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="headcount" label="预计人数"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="headcountConfirmed" label="人数已确认" valuePropName="checked"><Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="specialRequirements" label="特殊要求"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="allergyNotes" label="过敏备注">
            <Input.TextArea rows={2} placeholder="如含特殊餐标，必须填写过敏信息" />
          </Form.Item>
          <Form.List name="menuItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) => (
                  <Row gutter={8} key={field.key} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={10}>
                      <Form.Item name={[idx, 'menuItemId']} noStyle rules={[{ required: true }]}>
                        <Select placeholder="选择菜品" options={menuItems.map(m => ({ value: m.id, label: `${m.name} (¥${m.unitPrice})${m.isSpecial ? ' [特殊餐标]' : ''}` }))} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[idx, 'quantity']} noStyle rules={[{ required: true }]}>
                        <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[idx, 'note']} noStyle><Input placeholder="备注" /></Form.Item>
                    </Col>
                    <Col span={2}><Button danger size="small" onClick={() => remove(idx)}>×</Button></Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>添加菜品</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal title="确认人数" open={confirmModalOpen} onCancel={() => setConfirmModalOpen(false)}
        onOk={() => {
          const order = salesOrders.find(o => o.id === confirmOrderId);
          if (order?.hasSpecialDiet && !confirmAllergyNotes.trim()) {
            message.error('该订单含特殊餐标，必须填写过敏备注才能确认人数');
            return;
          }
          confirmHeadcount(confirmOrderId, confirmCount, confirmAllergyNotes);
          setConfirmModalOpen(false);
          message.success('人数已确认');
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <InputNumber min={1} value={confirmCount} onChange={v => setConfirmCount(v || 0)} style={{ width: '100%' }} addonBefore="确认人数" />
        </div>
        {(salesOrders.find(o => o.id === confirmOrderId)?.hasSpecialDiet || confirmAllergyNotes.trim()) && (
          <div>
            <Input.TextArea
              rows={3}
              value={confirmAllergyNotes}
              onChange={e => setConfirmAllergyNotes(e.target.value)}
              placeholder={salesOrders.find(o => o.id === confirmOrderId)?.hasSpecialDiet ? "请填写过敏备注（必填）：如花生过敏、无乳糖、清真等" : "过敏备注（可选）"}
              style={{ width: '100%' }}
            />
            {salesOrders.find(o => o.id === confirmOrderId)?.hasSpecialDiet && !confirmAllergyNotes.trim() && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                该订单含特殊餐标，过敏备注为必填项
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal title="会议延期" open={extendModalOpen} onCancel={() => setExtendModalOpen(false)} onOk={() => { extendOrder(extendOrderId, extendReason); setExtendModalOpen(false); message.success('订单已延期'); }}>
        <Input.TextArea rows={3} value={extendReason} onChange={e => setExtendReason(e.target.value)} placeholder="请输入延期原因" />
      </Modal>

      <Modal title="撤单" open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)} onOk={() => { cancelOrder(cancelOrderId, cancelReason); setCancelModalOpen(false); message.success('订单已撤单'); }}>
        <Input.TextArea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="请输入撤单原因" />
      </Modal>
    </div>
  );
}

function BanquetSchedulePanel() {
  const { salesOrders, teaBreakOrders, createTeaBreakOrder, updateTeaBreakOrder, validateOrderForSchedule } = useTeaBreakStore();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [form] = Form.useForm();

  const confirmedOrders = salesOrders.filter(o =>
    o.headcountConfirmed &&
    !teaBreakOrders.some(tb => tb.salesOrderId === o.id) &&
    !['cancelled'].includes(o.status) &&
    !(o.hasSpecialDiet && !o.allergyNotes.trim())
  );

  const blockedOrders = salesOrders.filter(o =>
    o.headcountConfirmed &&
    !teaBreakOrders.some(tb => tb.salesOrderId === o.id) &&
    !['cancelled'].includes(o.status) &&
    o.hasSpecialDiet &&
    !o.allergyNotes.trim()
  );

  const handleSchedule = () => {
    form.validateFields().then(values => {
      const issues = validateOrderForSchedule(selectedOrderId);
      const errors = issues.filter(i => i.severity === 'error');
      if (errors.length > 0) {
        message.error(`创建失败：${errors.map(e => e.message).join('；')}`);
        return;
      }
      const tb = createTeaBreakOrder(selectedOrderId, values);
      if (tb) {
        message.success('茶歇单已创建');
        setScheduleModalOpen(false);
      } else {
        message.error('创建失败：订单校验未通过');
      }
    });
  };

  const salesOrderMap = Object.fromEntries(salesOrders.map(o => [o.id, o]));

  const tbColumns = [
    { title: '茶歇单号', dataIndex: 'orderNo', key: 'orderNo', width: 170 },
    { title: '关联订单', key: 'salesOrder', width: 170, render: (_: unknown, r: TeaBreakOrder) => salesOrderMap[r.salesOrderId]?.orderNo || '-' },
    { title: '会议名称', key: 'meetingName', width: 160, render: (_: unknown, r: TeaBreakOrder) => salesOrderMap[r.salesOrderId]?.meetingName || '-' },
    { title: '人数', dataIndex: 'headcount', key: 'headcount', width: 70 },
    { title: '服务员班次', dataIndex: 'waiterShift', key: 'waiterShift', width: 200 },
    { title: '布置时间', dataIndex: 'setupTime', key: 'setupTime', width: 150 },
    { title: '状态', key: 'status', width: 100, render: (_: unknown, r: TeaBreakOrder) => <Tag color={tbStatusColorMap[r.status]}>{TEA_BREAK_STATUS_LABEL[r.status]}</Tag> },
    { title: '厨房备注', dataIndex: 'kitchenNote', key: 'kitchenNote', width: 180, ellipsis: true },
    { title: '操作', key: 'action', width: 120, render: (_: unknown, r: TeaBreakOrder) => (
      <Space>
        {r.status === 'pending_prep' && <Button size="small" type="primary" onClick={() => { updateTeaBreakOrder(r.id, { status: 'preparing' }); message.success('已推送至厨房'); }}>推送厨房</Button>}
        {r.status === 'ready' && <Button size="small" type="primary" onClick={() => { updateTeaBreakOrder(r.id, { status: 'serving' }); }}>开始布置</Button>}
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          style={{ width: 360 }}
          placeholder="选择已确认人数的订单进行排单"
          value={selectedOrderId || undefined}
          onChange={v => setSelectedOrderId(v)}
          options={confirmedOrders.map(o => ({ value: o.id, label: `${o.orderNo} - ${o.meetingName} (${o.headcount}人)` }))}
        />
        <Button type="primary" disabled={!selectedOrderId} onClick={() => { form.resetFields(); setScheduleModalOpen(true); }}>创建茶歇单</Button>
      </div>

      {confirmedOrders.length === 0 && teaBreakOrders.filter(tb => salesOrderMap[tb.salesOrderId]?.status !== 'cancelled').length === 0 && (
        <Alert message="暂无可排单的订单，请先在销售订单中确认人数" type="info" showIcon />
      )}

      {blockedOrders.length > 0 && (
        <Alert
          message={`${blockedOrders.length} 个订单因缺少过敏备注被拦截，不可排单`}
          description={
            <Table dataSource={blockedOrders} rowKey="id" size="small" pagination={false}
              columns={[
                { title: '订单号', dataIndex: 'orderNo', width: 170 },
                { title: '会议', dataIndex: 'meetingName', width: 180 },
                { title: '人数', dataIndex: 'headcount', width: 70 },
                { title: '问题', key: 'issue', width: 240, render: () => <Tag color="red">含特殊餐标但缺少过敏备注</Tag> },
                { title: '操作', key: 'action', width: 100, render: (_: unknown, r: SalesOrder) =>
                  <Button size="small" type="link" onClick={() => message.info(`请在销售订单中为 ${r.orderNo} 补充过敏备注`)}>去补填</Button>
                },
              ]}
            />
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table dataSource={teaBreakOrders} columns={tbColumns} rowKey="id" size="small" scroll={{ x: 1300 }} />

      <Modal title="创建茶歇单" open={scheduleModalOpen} onCancel={() => setScheduleModalOpen(false)} onOk={handleSchedule} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="waiterShift" label="服务员班次" rules={[{ required: true }]}>
            <Select options={[
              { value: '早班 07:00-15:00 (2人)', label: '早班 07:00-15:00 (2人)' },
              { value: '早班 07:00-15:00 (3人)', label: '早班 07:00-15:00 (3人)' },
              { value: '午班 12:00-20:00 (2人)', label: '午班 12:00-20:00 (2人)' },
              { value: '午班 12:00-20:00 (3人)', label: '午班 12:00-20:00 (3人)' },
              { value: '晚班 15:00-23:00 (2人)', label: '晚班 15:00-23:00 (2人)' },
            ]} />
          </Form.Item>
          <Form.Item name="setupTime" label="布置时间" rules={[{ required: true }]}>
            <Input placeholder="如：2026-06-15 08:00" />
          </Form.Item>
          <Form.Item name="kitchenNote" label="厨房备注">
            <Input.TextArea rows={3} placeholder="过敏原提醒、特殊要求等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function KitchenPrepPanel() {
  const { teaBreakOrders, kitchenPrepItems, menuItems, updateKitchenPrepItem, confirmKitchenPrep } = useTeaBreakStore();
  const [activeTbId, setActiveTbId] = useState<string>(teaBreakOrders[0]?.id || '');

  const activeItems = kitchenPrepItems.filter(kp => kp.teaBreakOrderId === activeTbId);
  const hasShortage = activeItems.some(kp => kp.shortage > 0);
  const allReady = activeItems.length > 0 && activeItems.every(kp => kp.isReady);

  const columns = [
    { title: '菜品', dataIndex: 'menuItemName', key: 'menuItemName', width: 120 },
    { title: '需求数量', dataIndex: 'requiredQty', key: 'requiredQty', width: 90 },
    {
      title: '已备数量', key: 'preparedQty', width: 130,
      render: (_: unknown, r: KitchenPrepItem) => (
        <InputNumber min={0} max={r.requiredQty + 10} value={r.preparedQty}
          onChange={v => updateKitchenPrepItem(r.id, { preparedQty: v || 0 })}
          status={r.shortage > 0 ? 'error' : undefined}
        />
      ),
    },
    { title: '缺口', dataIndex: 'shortage', key: 'shortage', width: 70, render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag> },
    { title: '状态', key: 'isReady', width: 90, render: (_: unknown, r: KitchenPrepItem) => r.isReady ? <Tag color="green">就绪</Tag> : <Tag color="orange">未就绪</Tag> },
    { title: '备注', dataIndex: 'note', key: 'note', width: 180, ellipsis: true },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>选择茶歇单：</span>
        <Select style={{ width: 300 }} value={activeTbId || undefined} onChange={setActiveTbId}
          options={teaBreakOrders.map(tb => ({ value: tb.id, label: `${tb.orderNo}` }))} />
      </div>

      {hasShortage && (
        <Alert message="存在库存不足的菜品，请调整备料数量或通知宴会主管修改菜单" type="warning" showIcon style={{ marginBottom: 16 }} />
      )}

      <Table dataSource={activeItems} columns={columns} rowKey="id" size="small" pagination={false} />

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Button type="primary" icon={<CheckOutlined />} disabled={!allReady && activeItems.length > 0}
          onClick={() => { confirmKitchenPrep(activeTbId); message.success('厨房备料已确认'); }}>
          确认备料完成
        </Button>
        {!allReady && activeItems.length > 0 && (
          <Button onClick={() => { confirmKitchenPrep(activeTbId); message.info('部分备料确认，状态标记为备料中'); }}>
            部分确认
          </Button>
        )}
      </div>

      <Divider />
      <h4>全部茶歇单备料总览</h4>
      <Table
        dataSource={kitchenPrepItems}
        columns={[
          { title: '茶歇单号', key: 'tbOrder', width: 160, render: (_: unknown, r: KitchenPrepItem) => teaBreakOrders.find(tb => tb.id === r.teaBreakOrderId)?.orderNo || '-' },
          { title: '菜品', dataIndex: 'menuItemName', width: 120 },
          { title: '需求', dataIndex: 'requiredQty', width: 70 },
          { title: '已备', dataIndex: 'preparedQty', width: 70 },
          { title: '缺口', key: 'shortage', width: 70, render: (_: unknown, r: KitchenPrepItem) => r.shortage > 0 ? <Tag color="red">{r.shortage}</Tag> : '-' },
          { title: '状态', key: 'isReady', width: 80, render: (_: unknown, r: KitchenPrepItem) => r.isReady ? <Tag color="green">就绪</Tag> : <Tag color="orange">待备</Tag> },
        ]}
        rowKey="id" size="small" pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

function WaiterConfirmPanel() {
  const { teaBreakOrders, salesOrders, confirmSetup, signOff } = useTeaBreakStore();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [signOffModalOpen, setSignOffModalOpen] = useState(false);
  const [activeTbId, setActiveTbId] = useState('');
  const [activeSalesId, setActiveSalesId] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [signOffName, setSignOffName] = useState('');

  const salesOrderMap = Object.fromEntries(salesOrders.map(o => [o.id, o]));
  const readyTbs = teaBreakOrders.filter(tb => ['ready', 'serving'].includes(tb.status));

  const awaitingOrders = salesOrders.filter(o => o.status === 'awaiting_signoff');

  return (
    <div>
      <Card title="布置确认" size="small" style={{ marginBottom: 16 }}>
        {readyTbs.length === 0 ? <Alert message="暂无待确认布置的茶歇单" type="info" /> : (
          <Table dataSource={readyTbs} rowKey="id" size="small" pagination={false}
            columns={[
              { title: '茶歇单号', dataIndex: 'orderNo', width: 170 },
              { title: '会议', key: 'meeting', width: 160, render: (_: unknown, r: TeaBreakOrder) => salesOrderMap[r.salesOrderId]?.meetingName || '-' },
              { title: '布置时间', dataIndex: 'setupTime', width: 150 },
              { title: '状态', key: 'status', width: 100, render: (_: unknown, r: TeaBreakOrder) => <Tag color={tbStatusColorMap[r.status]}>{TEA_BREAK_STATUS_LABEL[r.status]}</Tag> },
              { title: '操作', key: 'action', width: 150, render: (_: unknown, r: TeaBreakOrder) => (
                r.status === 'ready' ? <Button size="small" type="primary" onClick={() => { setActiveTbId(r.id); setConfirmModalOpen(true); }}>确认布置完成</Button> : <Tag color="purple">服务中</Tag>
              )},
            ]}
          />
        )}
      </Card>

      <Card title="客户签收" size="small">
        {awaitingOrders.length === 0 ? <Alert message="暂无待签收的订单" type="info" /> : (
          <Table dataSource={awaitingOrders} rowKey="id" size="small" pagination={false}
            columns={[
              { title: '订单号', dataIndex: 'orderNo', width: 170 },
              { title: '客户', dataIndex: 'customerName', width: 100 },
              { title: '会议', dataIndex: 'meetingName', width: 180 },
              { title: '状态', key: 'status', width: 100, render: (_: unknown, r: SalesOrder) => <Tag color={statusColorMap[r.status]}>{ORDER_STATUS_LABEL[r.status]}</Tag> },
              { title: '操作', key: 'action', width: 120, render: (_: unknown, r: SalesOrder) => (
                <Button size="small" type="primary" icon={<FileProtectOutlined />} onClick={() => { setActiveSalesId(r.id); setSignOffName(''); setSignOffModalOpen(true); }}>签收</Button>
              )},
            ]}
          />
        )}
      </Card>

      <Modal title="确认布置完成" open={confirmModalOpen} onCancel={() => setConfirmModalOpen(false)} onOk={() => { confirmSetup(activeTbId, waiterName); setConfirmModalOpen(false); message.success('布置已确认'); }}>
        <Input value={waiterName} onChange={e => setWaiterName(e.target.value)} placeholder="确认人姓名" addonBefore="确认人" />
      </Modal>

      <Modal title="客户签收" open={signOffModalOpen} onCancel={() => setSignOffModalOpen(false)} onOk={() => { signOff(activeSalesId, signOffName); setSignOffModalOpen(false); message.success('签收完成'); }}>
        <Input value={signOffName} onChange={e => setSignOffName(e.target.value)} placeholder="签收人姓名" addonBefore="签收人" />
      </Modal>
    </div>
  );
}

function AllergyAlertPanel() {
  const { salesOrders, menuItems } = useTeaBreakStore();

  const ordersWithSpecialDiet = salesOrders.filter(o => o.hasSpecialDiet);

  const getMenuItemAllergens = (menuItemId: string) => {
    const mi = menuItems.find(m => m.id === menuItemId);
    return mi?.allergens || [];
  };

  return (
    <div>
      {ordersWithSpecialDiet.length === 0 ? <Alert message="暂无含特殊餐标的订单" type="info" /> : (
        <Table dataSource={ordersWithSpecialDiet} rowKey="id" size="small"
          columns={[
            { title: '订单号', dataIndex: 'orderNo', width: 170 },
            { title: '会议', dataIndex: 'meetingName', width: 180 },
            { title: '过敏备注', key: 'allergyNotes', width: 200, render: (_: unknown, r: SalesOrder) =>
              r.allergyNotes ? <span>{r.allergyNotes}</span> : <Tag color="red">⚠ 缺失过敏备注</Tag>
            },
            { title: '菜单过敏原', key: 'menuAllergens', render: (_: unknown, r: SalesOrder) => {
              const allergens = new Set<string>();
              r.menuItems.forEach(omi => getMenuItemAllergens(omi.menuItemId).forEach(a => allergens.add(a)));
              return allergens.size > 0 ? (
                <Space>{[...allergens].map(a => <Tag color="red" key={a}>{a}</Tag>)}</Space>
              ) : <Tag color="green">无已知过敏原</Tag>;
            }},
            { title: '审核', key: 'review', width: 120, render: (_: unknown, r: SalesOrder) =>
              r.hasSpecialDiet && !r.allergyNotes.trim() ? <Tag color="red" icon={<WarningOutlined />}>不可过审</Tag> : <Tag color="green" icon={<CheckOutlined />}>可过审</Tag>
            },
          ]}
        />
      )}
    </div>
  );
}

function CostEstimatePanel() {
  const { salesOrders, calcCostBreakdown } = useTeaBreakStore();
  const [selectedId, setSelectedId] = useState('');

  const breakdown = selectedId ? calcCostBreakdown(selectedId) : null;
  const order = salesOrders.find(o => o.id === selectedId);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>选择订单：</span>
        <Select style={{ width: 360 }} value={selectedId || undefined} onChange={setSelectedId}
          options={salesOrders.map(o => ({ value: o.id, label: `${o.orderNo} - ${o.meetingName}` }))} />
      </div>

      {breakdown && order && (
        <Row gutter={16}>
          <Col span={6}>
            <Card><Statistic title="菜单成本" value={breakdown.totalMenuCost} prefix="¥" precision={2} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="人均成本" value={breakdown.perPersonCost} prefix="¥" precision={2} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="补录成本" value={breakdown.supplementCost} prefix="¥" precision={2} valueStyle={breakdown.supplementCost > 0 ? { color: '#cf1322' } : undefined} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="总成本" value={breakdown.grandTotal} prefix="¥" precision={2} /></Card>
          </Col>
        </Row>
      )}

      {breakdown && (
        <Card style={{ marginTop: 16 }}>
          <Statistic title="毛利率" value={breakdown.grossMargin} suffix="%" precision={1}
            valueStyle={breakdown.grossMargin >= 40 ? { color: '#3f8600' } : { color: '#cf1322' }} />
        </Card>
      )}

      {order && order.supplementRecords.length > 0 && (
        <Card title="补录成本明细" style={{ marginTop: 16 }} size="small">
          <Table dataSource={order.supplementRecords} rowKey="id" size="small" pagination={false}
            columns={[
              { title: '补录时间', dataIndex: 'createdAt', width: 170 },
              { title: '原因', dataIndex: 'reason', width: 200 },
              { title: '操作人', dataIndex: 'operator', width: 100 },
              { title: '成本', dataIndex: 'cost', width: 100, render: (v: number) => <span style={{ color: '#cf1322' }}>¥{v}</span> },
              { title: '明细', key: 'items', render: (_: unknown, r: typeof order.supplementRecords[0]) => r.items.map(i => {
                const mi = useTeaBreakStore.getState().menuItems.find(m => m.id === i.menuItemId);
                return `${mi?.name || i.menuItemId}×${i.quantity}`;
              }).join('、') },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

function SupplementRecordPanel() {
  const { salesOrders, menuItems, addSupplementRecord } = useTeaBreakStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [items, setItems] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [reason, setReason] = useState('');

  const activeOrders = salesOrders.filter(o => !['cancelled', 'draft', 'pending_confirm'].includes(o.status));

  const handleAdd = () => {
    if (!selectedOrderId || items.length === 0) return;
    addSupplementRecord(selectedOrderId, items, reason, '当前操作员');
    message.success('补录已添加，成本已重算');
    setModalOpen(false);
    setItems([]);
    setReason('');
  };

  const allSupplements = salesOrders.flatMap(o => o.supplementRecords.map(sr => ({ ...sr, orderNo: o.orderNo, meetingName: o.meetingName })));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<FileAddOutlined />} onClick={() => { setModalOpen(true); setItems([]); setReason(''); setSelectedOrderId(''); }}>新增补录</Button>
        <Alert message="会议开始后只能补录，不能删除原订单" type="warning" showIcon style={{ marginTop: 8 }} />
      </div>

      <Table dataSource={allSupplements} rowKey="id" size="small"
        columns={[
          { title: '订单号', dataIndex: 'orderNo', width: 170 },
          { title: '会议', dataIndex: 'meetingName', width: 160 },
          { title: '补录时间', dataIndex: 'createdAt', width: 170 },
          { title: '原因', dataIndex: 'reason', width: 200 },
          { title: '操作人', dataIndex: 'operator', width: 100 },
          { title: '成本', dataIndex: 'cost', width: 100, render: (v: number) => <span style={{ color: '#cf1322' }}>¥{v}</span> },
        ]}
      />

      <Modal title="新增补录" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleAdd} width={600}>
        <div style={{ marginBottom: 12 }}>
          <Select style={{ width: '100%' }} placeholder="选择订单" value={selectedOrderId || undefined}
            onChange={setSelectedOrderId} options={activeOrders.map(o => ({ value: o.id, label: `${o.orderNo} - ${o.meetingName}` }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          {items.map((item, idx) => (
            <Row gutter={8} key={idx} style={{ marginBottom: 8 }}>
              <Col span={14}>
                <Select value={item.menuItemId || undefined} placeholder="选择菜品"
                  onChange={v => { const newItems = [...items]; newItems[idx] = { ...newItems[idx], menuItemId: v }; setItems(newItems); }}
                  options={menuItems.map(m => ({ value: m.id, label: `${m.name} (成本¥${m.unitCost})` }))} />
              </Col>
              <Col span={6}>
                <InputNumber min={1} value={item.quantity} onChange={v => { const newItems = [...items]; newItems[idx] = { ...newItems[idx], quantity: v || 1 }; setItems(newItems); }} style={{ width: '100%' }} />
              </Col>
              <Col span={4}><Button danger onClick={() => setItems(items.filter((_, i) => i !== idx))}>删除</Button></Col>
            </Row>
          ))}
          <Button type="dashed" onClick={() => setItems([...items, { menuItemId: '', quantity: 1 }])} icon={<PlusOutlined />}>添加菜品</Button>
        </div>
        <Input.TextArea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="补录原因" />
      </Modal>
    </div>
  );
}

function DailySettlementPanel() {
  const { dailySettlements, generateDailySettlement } = useTeaBreakStore();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const handleGenerate = () => {
    generateDailySettlement(date);
    message.success('日结已生成');
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '总单数', dataIndex: 'totalOrders', key: 'totalOrders', width: 80 },
    { title: '已完成', dataIndex: 'completedOrders', key: 'completedOrders', width: 80 },
    { title: '已撤单', dataIndex: 'cancelledOrders', key: 'cancelledOrders', width: 80 },
    { title: '已延期', dataIndex: 'extendedOrders', key: 'extendedOrders', width: 80 },
    { title: '总收入', dataIndex: 'totalRevenue', key: 'totalRevenue', width: 110, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '总成本', dataIndex: 'totalCost', key: 'totalCost', width: 110, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '补录成本', dataIndex: 'supplementCost', key: 'supplementCost', width: 100, render: (v: number) => v > 0 ? <span style={{ color: '#cf1322' }}>¥{v.toLocaleString()}</span> : '-' },
    { title: '毛利润', dataIndex: 'grossProfit', key: 'grossProfit', width: 110, render: (v: number) => <span style={{ color: v >= 0 ? '#3f8600' : '#cf1322' }}>¥{v.toLocaleString()}</span> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 180 }} />
        <Button type="primary" icon={<BarChartOutlined />} onClick={handleGenerate}>生成日结</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {dailySettlements.length > 0 && (() => {
          const latest = dailySettlements[dailySettlements.length - 1];
          return (
            <>
              <Col span={6}><Card size="small"><Statistic title="日期" value={latest.date} /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="总收入" value={latest.totalRevenue} prefix="¥" /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="总成本" value={latest.totalCost} prefix="¥" /></Card></Col>
              <Col span={6}><Card size="small"><Statistic title="毛利润" value={latest.grossProfit} prefix="¥" valueStyle={{ color: latest.grossProfit >= 0 ? '#3f8600' : '#cf1322' }} /></Card></Col>
            </>
          );
        })()}
      </Row>

      <Table dataSource={dailySettlements} columns={columns} rowKey="date" size="small" />
    </div>
  );
}

function BusinessVerifyPanel() {
  const { salesOrders, verifyOrders, calcCostBreakdown } = useTeaBreakStore();
  const [verifyResult, setVerifyResult] = useState<VerificationIssue[]>([]);
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    const issues = verifyOrders();
    setVerifyResult(issues);
    setVerified(true);
  };

  const errors = verifyResult.filter(i => i.severity === 'error');
  const warnings = verifyResult.filter(i => i.severity === 'warning');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleVerify} size="large">一键验收</Button>
      </div>

      {verified && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}><Card><Statistic title="检查订单" value={salesOrders.filter(o => !['cancelled', 'completed'].includes(o.status)).length} /></Card></Col>
            <Col span={8}><Card><Statistic title="错误" value={errors.length} valueStyle={{ color: '#cf1322' }} prefix={<ExclamationCircleOutlined />} /></Card></Col>
            <Col span={8}><Card><Statistic title="警告" value={warnings.length} valueStyle={{ color: '#fa8c16' }} prefix={<WarningOutlined />} /></Card></Col>
          </Row>

          {errors.length > 0 && (
            <Card title="❌ 阻断性问题" size="small" style={{ marginBottom: 16 }}>
              {errors.map((e, i) => <Alert key={i} message={e.message} type="error" showIcon style={{ marginBottom: 8 }} />)}
            </Card>
          )}

          {warnings.length > 0 && (
            <Card title="⚠️ 警告性问题" size="small" style={{ marginBottom: 16 }}>
              {warnings.map((w, i) => <Alert key={i} message={w.message} type="warning" showIcon style={{ marginBottom: 8 }} />)}
            </Card>
          )}

          {errors.length === 0 && warnings.length === 0 && (
            <Alert message="所有订单验收通过，无异常" type="success" showIcon />
          )}

          <Divider>验收明细</Divider>
          <Table
            dataSource={salesOrders.filter(o => !['cancelled', 'completed'].includes(o.status))}
            rowKey="id" size="small"
            columns={[
              { title: '订单号', dataIndex: 'orderNo', width: 170 },
              { title: '会议', dataIndex: 'meetingName', width: 180 },
              { title: '人数确认', key: 'hc', width: 100, render: (_: unknown, r: SalesOrder) => r.headcountConfirmed ? <Tag color="green">已确认</Tag> : <Tag color="red">未确认</Tag> },
              { title: '过敏备注', key: 'allergy', width: 100, render: (_: unknown, r: SalesOrder) => r.hasSpecialDiet && !r.allergyNotes ? <Tag color="red">缺失</Tag> : <Tag color="green">正常</Tag> },
              { title: '可删除', key: 'del', width: 100, render: (_: unknown, r: SalesOrder) => {
                const mt = new Date(r.meetingDate + 'T' + r.meetingStartTime);
                return mt <= new Date() ? <Tag color="red">禁止</Tag> : <Tag color="green">可以</Tag>;
              }},
              { title: '补录成本', key: 'supp', width: 120, render: (_: unknown, r: SalesOrder) => {
                const bd = calcCostBreakdown(r.id);
                return bd.supplementCost > 0 ? <Tag color="orange">¥{bd.supplementCost}</Tag> : <Tag>无</Tag>;
              }},
              { title: '总成本', key: 'total', width: 120, render: (_: unknown, r: SalesOrder) => {
                const bd = calcCostBreakdown(r.id);
                return `¥${bd.grandTotal.toFixed(2)}`;
              }},
            ]}
          />
        </>
      )}
    </div>
  );
}

function OrderFlowChart({ order }: { order: SalesOrder }) {
  const steps = [
    { title: '草稿', status: order.status === 'draft' ? 'process' : 'finish' },
    { title: '人数确认', status: order.status === 'pending_confirm' ? 'process' : ['confirmed', 'scheduled', 'kitchen_prep', 'setup_in_progress', 'awaiting_signoff', 'completed'].includes(order.status) ? 'finish' : 'wait' },
    { title: '排单', status: order.status === 'scheduled' ? 'process' : ['kitchen_prep', 'setup_in_progress', 'awaiting_signoff', 'completed'].includes(order.status) ? 'finish' : 'wait' },
    { title: '备料', status: order.status === 'kitchen_prep' ? 'process' : ['setup_in_progress', 'awaiting_signoff', 'completed'].includes(order.status) ? 'finish' : 'wait' },
    { title: '布置', status: order.status === 'setup_in_progress' ? 'process' : ['awaiting_signoff', 'completed'].includes(order.status) ? 'finish' : 'wait' },
    { title: '签收', status: order.status === 'awaiting_signoff' ? 'process' : order.status === 'completed' ? 'finish' : 'wait' },
  ];

  if (order.status === 'extended') steps.push({ title: '已延期', status: 'error' });
  if (order.status === 'cancelled') return <Steps size="small" items={[{ title: '已撤单', status: 'error' }]} />;

  return <Steps size="small" items={steps.map(s => ({ title: s.title, status: s.status as 'process' | 'finish' | 'wait' | 'error' }))} />;
}

function OrderDetailModal({ order, open, onClose }: { order: SalesOrder | null; open: boolean; onClose: () => void }) {
  const { menuItems } = useTeaBreakStore();
  if (!order) return null;

  return (
    <Modal title={`订单详情 - ${order.orderNo}`} open={open} onCancel={onClose} footer={null} width={800}>
      <OrderFlowChart order={order} />
      <Divider />
      <Descriptions column={2} size="small">
        <Descriptions.Item label="客户">{order.customerName}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{order.contactPhone}</Descriptions.Item>
        <Descriptions.Item label="会议名称">{order.meetingName}</Descriptions.Item>
        <Descriptions.Item label="会议室">{order.meetingRoom}</Descriptions.Item>
        <Descriptions.Item label="会议日期">{order.meetingDate}</Descriptions.Item>
        <Descriptions.Item label="时间">{order.meetingStartTime} - {order.meetingEndTime}</Descriptions.Item>
        <Descriptions.Item label="人数">{order.headcountConfirmed ? `${order.headcount}人 (已确认)` : `${order.headcount || '未填写'}人 (未确认)`}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag color={statusColorMap[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Tag></Descriptions.Item>
        <Descriptions.Item label="特殊要求" span={2}>{order.specialRequirements || '-'}</Descriptions.Item>
        <Descriptions.Item label="过敏备注" span={2}>{order.allergyNotes || '-'}</Descriptions.Item>
      </Descriptions>
      <Divider>菜单明细</Divider>
      <Table dataSource={order.menuItems.map((omi, idx) => {
        const mi = menuItems.find(m => m.id === omi.menuItemId);
        return { key: idx, name: mi?.name, unitPrice: mi?.unitPrice, unitCost: mi?.unitCost, quantity: omi.quantity, total: (mi?.unitPrice || 0) * omi.quantity, costTotal: (mi?.unitCost || 0) * omi.quantity, allergens: mi?.allergens?.join('、') || '无', note: omi.note };
      })} size="small" pagination={false}
        columns={[
          { title: '菜品', dataIndex: 'name', width: 120 },
          { title: '单价', dataIndex: 'unitPrice', width: 80, render: (v: number) => `¥${v}` },
          { title: '数量', dataIndex: 'quantity', width: 60 },
          { title: '金额', dataIndex: 'total', width: 90, render: (v: number) => `¥${v}` },
          { title: '成本', dataIndex: 'costTotal', width: 90, render: (v: number) => `¥${v}` },
          { title: '过敏原', dataIndex: 'allergens', width: 100 },
          { title: '备注', dataIndex: 'note', width: 120 },
        ]}
      />
      {order.supplementRecords.length > 0 && (
        <>
          <Divider>补录记录</Divider>
          <Table dataSource={order.supplementRecords} rowKey="id" size="small" pagination={false}
            columns={[
              { title: '时间', dataIndex: 'createdAt', width: 160 },
              { title: '原因', dataIndex: 'reason', width: 200 },
              { title: '成本', dataIndex: 'cost', width: 100, render: (v: number) => <span style={{ color: '#cf1322' }}>¥{v}</span> },
            ]}
          />
        </>
      )}
      {order.extensionReason && <Alert message={`延期原因：${order.extensionReason}`} type="warning" style={{ marginTop: 12 }} />}
      {order.cancelReason && <Alert message={`撤单原因：${order.cancelReason}`} type="error" style={{ marginTop: 12 }} />}
    </Modal>
  );
}

export default function App() {
  const { salesOrders, teaBreakOrders } = useTeaBreakStore();
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);

  const pendingCount = salesOrders.filter(o => ['pending_confirm', 'draft'].includes(o.status)).length;
  const scheduledCount = teaBreakOrders.filter(tb => tb.status === 'pending_prep').length;
  const awaitingCount = salesOrders.filter(o => o.status === 'awaiting_signoff').length;

  const tabItems = [
    {
      key: 'sales',
      label: <span><Badge count={pendingCount} size="small" offset={[6, -2]}>销售订单</Badge></span>,
      children: <SalesOrderPanel />,
      icon: <EditOutlined />,
    },
    {
      key: 'banquet',
      label: <span><Badge count={scheduledCount} size="small" offset={[6, -2]}>宴会排单</Badge></span>,
      children: <BanquetSchedulePanel />,
      icon: <AuditOutlined />,
    },
    {
      key: 'kitchen',
      label: '厨房备料',
      children: <KitchenPrepPanel />,
      icon: <ClockCircleOutlined />,
    },
    {
      key: 'waiter',
      label: <span><Badge count={awaitingCount} size="small" offset={[6, -2]}>服务员确认</Badge></span>,
      children: <WaiterConfirmPanel />,
      icon: <CheckOutlined />,
    },
    {
      key: 'allergy',
      label: '过敏提示',
      children: <AllergyAlertPanel />,
      icon: <WarningOutlined />,
    },
    {
      key: 'cost',
      label: '成本试算',
      children: <CostEstimatePanel />,
      icon: <DollarOutlined />,
    },
    {
      key: 'supplement',
      label: '补录记录',
      children: <SupplementRecordPanel />,
      icon: <FileAddOutlined />,
    },
    {
      key: 'daily',
      label: '日结统计',
      children: <DailySettlementPanel />,
      icon: <BarChartOutlined />,
    },
    {
      key: 'verify',
      label: '业务验收',
      children: <BusinessVerifyPanel />,
      icon: <SafetyCertificateOutlined />,
    },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">🏨 酒店会议茶歇管理系统</h1>
          <span className="header-subtitle">宴会部排单工作台</span>
        </div>
        <div className="header-stats">
          <Tooltip title="待确认人数">
            <Tag color="orange" style={{ cursor: 'pointer' }}>{pendingCount} 待确认</Tag>
          </Tooltip>
          <Tooltip title="待排单">
            <Tag color="blue">{scheduledCount} 待排单</Tag>
          </Tooltip>
          <Tooltip title="待签收">
            <Tag color="gold">{awaitingCount} 待签收</Tag>
          </Tooltip>
        </div>
      </header>

      <div className="order-quick-view">
        <div className="quick-view-label">订单快速查看（点击查看详情）：</div>
        <div className="quick-view-tags">
          {salesOrders.slice(0, 8).map(o => (
            <Tag key={o.id} color={statusColorMap[o.status]} style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
              {o.orderNo.slice(-7)} {o.customerName}
            </Tag>
          ))}
        </div>
      </div>

      <Tabs items={tabItems} size="small" className="main-tabs" />

      <OrderDetailModal order={detailOrder} open={!!detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  );
}

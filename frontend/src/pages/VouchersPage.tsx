import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  InputNumber, 
  Select, 
  DatePicker, 
  Switch, 
  message, 
  Tooltip, 
  Popconfirm 
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { 
  Ticket, 
  Search, 
  Plus, 
  Edit, 
  Ban, 
  CheckCircle,
  Clock,
  BarChart
} from 'lucide-react';
import dayjs from 'dayjs';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'disabled';
  usageCount: number;
  usageLimit: number;
}

const mockVouchers: Voucher[] = [
  {
    id: '1',
    code: 'WELCOME20',
    description: 'Welcome discount for new members',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 50,
    minOrderValue: 100,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'active',
    usageCount: 1540,
    usageLimit: 5000,
  },
  {
    id: '2',
    code: 'FREESHIP',
    description: 'Free shipping up to $15',
    discountType: 'fixed',
    discountValue: 15,
    minOrderValue: 50,
    startDate: '2023-06-01',
    endDate: '2023-11-30',
    status: 'expired',
    usageCount: 890,
    usageLimit: 1000,
  },
  {
    id: '3',
    code: 'FLASH50',
    description: 'Flash sale 50% max $100',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 100,
    minOrderValue: 200,
    startDate: '2023-11-20',
    endDate: '2023-11-25',
    status: 'active',
    usageCount: 120,
    usageLimit: 200,
  },
  {
    id: '4',
    code: 'ERROR15',
    description: '15$ off for delayed shipping',
    discountType: 'fixed',
    discountValue: 15,
    minOrderValue: 0,
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    status: 'disabled',
    usageCount: 45,
    usageLimit: 100,
  }
];

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [form] = Form.useForm();
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.code.toLowerCase().includes(searchText.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showModal = (voucher?: Voucher) => {
    setEditingVoucher(voucher || null);
    if (voucher) {
      setDiscountType(voucher.discountType);
      form.setFieldsValue({
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscount: voucher.maxDiscount,
        minOrderValue: voucher.minOrderValue,
        usageLimit: voucher.usageLimit,
        dates: [dayjs(voucher.startDate), dayjs(voucher.endDate)],
        isActive: voucher.status === 'active'
      });
    } else {
      setDiscountType('percentage');
      form.resetFields();
      form.setFieldsValue({
        discountType: 'percentage',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    try {
      const values = await form.validateFields();
      const newStatus = values.isActive ? 'active' : 'disabled';
      
      if (editingVoucher) {
        setVouchers(prev => prev.map(v => 
          v.id === editingVoucher.id ? { 
            ...v, 
            ...values, 
            startDate: values.dates[0].format('YYYY-MM-DD'),
            endDate: values.dates[1].format('YYYY-MM-DD'),
            status: newStatus 
          } : v
        ));
        message.success(`Voucher ${values.code} updated successfully`);
      } else {
        const newVoucher: Voucher = {
          id: Date.now().toString(),
          ...values,
          startDate: values.dates[0].format('YYYY-MM-DD'),
          endDate: values.dates[1].format('YYYY-MM-DD'),
          status: newStatus,
          usageCount: 0
        };
        setVouchers([newVoucher, ...vouchers]);
        message.success(`New voucher ${values.code} created successfully`);
      }
      setIsModalOpen(false);
    } catch (error) {
      // Validate Failed
    }
  };

  const toggleVoucherStatus = (disabled: boolean, id: string) => {
    setVouchers(prev => prev.map(v => {
      if (v.id === id) {
        const newStatus = disabled ? 'disabled' : 'active';
        message.info(`Voucher ${v.code} has been ${disabled ? 'disabled' : 'activated'}.`);
        return { ...v, status: newStatus };
      }
      return v;
    }));
  };

  const columns: ColumnsType<Voucher> = [
    {
      title: 'Voucher Code',
      dataIndex: 'code',
      key: 'code',
      render: (text, record) => (
        <div>
          <div className="font-bold font-mono text-[#af101a] text-base">{text}</div>
          <div className="text-xs text-gray-500 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Discount Value',
      key: 'value',
      render: (_, record) => {
        if (record.discountType === 'percentage') {
          return (
            <div>
              <span className="font-semibold">{record.discountValue}%</span>
              {record.maxDiscount && <div className="text-xs text-gray-500 mt-1">Cap: ${record.maxDiscount}</div>}
            </div>
          );
        }
        return <span className="font-semibold text-green-600">${record.discountValue}</span>;
      }
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (val) => <span className="text-gray-600">${val}</span>,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div className="text-sm">
          <div><span className="text-gray-400">Start:</span> {record.startDate}</div>
          <div><span className="text-gray-400">End:</span> {record.endDate}</div>
        </div>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Used:</span>
            <span className="font-semibold">{record.usageCount} / {record.usageLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-[#af101a] h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, (record.usageCount / record.usageLimit) * 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = <Ban size={12} />;
        if (status === 'active') { color = 'success'; icon = <CheckCircle size={12} />; }
        if (status === 'expired') { color = 'warning'; icon = <Clock size={12} />; }
        
        return (
          <Tag color={color} className="flex items-center gap-1 w-max capitalize">
            {icon} {status}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Stats">
            <Button type="text" icon={<BarChart size={16} />} className="text-blue-600 hover:bg-blue-50" />
          </Tooltip>
          <Tooltip title="Edit Voucher">
            <Button type="text" icon={<Edit size={16} />} onClick={() => showModal(record)} className="text-[#00799c] hover:bg-[#e0f2fe]" />
          </Tooltip>
          {record.status !== 'expired' && (
            <Popconfirm 
              title={record.status === 'active' ? "Disable this voucher?" : "Re-activate voucher?"} 
              onConfirm={() => toggleVoucherStatus(record.status === 'active', record.id)}
            >
              <Tooltip title={record.status === 'active' ? "Disable Voucher" : "Activate Voucher"}>
                <Button type="text" danger={record.status === 'active'} icon={<Ban size={16} />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e] flex items-center gap-2">
            <Ticket className="text-[#af101a]" size={28} />
            Voucher Management
          </h1>
          <p className="text-[#5b403d] mt-1 text-sm">Create, monitor and track discount campaigns.</p>
        </div>
        <Button 
          type="primary" 
          size="large"
          icon={<Plus size={18} />} 
          className="bg-[#af101a] hover:bg-[#930010] font-semibold" 
          onClick={() => showModal()}
        >
          Create New Voucher
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#d8dadc] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        <Input 
          prefix={<Search size={16} className="text-gray-400" />} 
          placeholder="Search by voucher code or description..." 
          className="w-full sm:max-w-md rounded-lg"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-48"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active Only' },
            { value: 'expired', label: 'Expired Only' },
            { value: 'disabled', label: 'Disabled Only' },
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#d8dadc] overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filteredVouchers} 
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold flex items-center gap-2"><Ticket size={20} className="text-[#af101a]"/> {editingVoucher ? "Edit Voucher Details" : "Create New Voucher"}</span>}
        open={isModalOpen}
        onOk={handleModalSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingVoucher ? "Update Voucher" : "Create Voucher"}
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#af101a] hover:bg-[#930010]" }}
        width={700}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="code" label="Voucher Code" rules={[{ required: true, message: 'Code is required' }]}>
              <Input placeholder="e.g. SUMMER2024" className="font-mono uppercase text-lg" />
            </Form.Item>
            
            <Form.Item name="isActive" label="Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
            </Form.Item>
            
            <Form.Item name="description" label="Description" className="md:col-span-2">
              <Input.TextArea rows={2} placeholder="Internal note or customer facing description..." />
            </Form.Item>

            <div className="md:col-span-2 mt-4 mb-2 border-b pb-2">
              <h4 className="font-bold text-[#191c1e] uppercase text-xs tracking-wider">Discount Configuration</h4>
            </div>

            <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]}>
              <Select 
                onChange={(val: 'percentage' | 'fixed') => setDiscountType(val)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount ($)' }
                ]}
              />
            </Form.Item>

            <Form.Item name="discountValue" label="Discount Value" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber 
                className="w-full"
                min={1} 
                max={discountType === 'percentage' ? 100 : undefined} 
                addonAfter={discountType === 'percentage' ? '%' : '$'} 
              />
            </Form.Item>

            {discountType === 'percentage' && (
              <Form.Item name="maxDiscount" label="Maximum Cap Amount (Optional)" tooltip="Maximum discount amount allowed for percentage discounts.">
                <InputNumber className="w-full" min={0} addonBefore="$" placeholder="e.g. 50" />
              </Form.Item>
            )}

            <Form.Item name="minOrderValue" label="Minimum Order Value ($)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} placeholder="0 for no minimum" />
            </Form.Item>

            <div className="md:col-span-2 mt-4 mb-2 border-b pb-2">
              <h4 className="font-bold text-[#191c1e] uppercase text-xs tracking-wider">Usage & Duration</h4>
            </div>

            <Form.Item name="usageLimit" label="Total Usage Limit" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={1} placeholder="Max number of times this code can be used" />
            </Form.Item>

            <Form.Item name="dates" label="Validity Period" rules={[{ required: true, message: 'Please select duration' }]}>
              <DatePicker.RangePicker className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

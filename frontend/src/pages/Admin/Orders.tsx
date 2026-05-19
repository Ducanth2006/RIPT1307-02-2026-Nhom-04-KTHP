import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Tag, Input, Select, Modal, 
  Drawer, Steps, message, Popconfirm, Divider, Space, Form 
} from 'antd';
import { 
  Download, Search, Eye, AlertTriangle, 
  CheckCircle, FileText, X, ChevronRight, Package, Truck, Check, XCircle 
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';

type OrderStatus = 'PENDING' | 'PACKING' | 'SHIPPING' | 'SUCCESS' | 'FAILED';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  variant: string;
  qty: number;
  price: number;
}

interface OrderEvent {
  time: string;
  status: OrderStatus | 'CREATED' | 'CANCEL_REQUESTED';
  note?: string;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  date: string;
  paymentMethod: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  voucherCode?: string;
  discountAmount: number;
  total: number;
  items: OrderItem[];
  timeline: OrderEvent[];
}

interface CancelRequest {
  id: string;
  orderId: string;
  customerName: string;
  reason: string;
  time: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-8091',
    customerName: 'Nguyen Van A',
    phone: '0901234567',
    email: 'nva@example.com',
    address: '123 B Street, District 1, HCMC',
    date: '2023-11-20 10:42',
    paymentMethod: 'COD',
    status: 'PENDING',
    subtotal: 1250000,
    shippingFee: 30000,
    voucherCode: 'FREESHIP',
    discountAmount: 30000,
    total: 1250000,
    items: [
      { id: '1', name: 'TF Football Shoes', sku: 'SHOE-01', variant: 'Size 42 / Black', qty: 1, price: 1000000 },
      { id: '2', name: 'Anti-slip Socks', sku: 'SOCK-01', variant: 'White', qty: 5, price: 50000 }
    ],
    timeline: [
      { time: '2023-11-20 10:42', status: 'CREATED', note: 'Customer placed order successfully' }
    ]
  },
  {
    id: 'ORD-8090',
    customerName: 'Tran Thi B',
    phone: '0987654321',
    email: 'ttb@example.com',
    address: '456 C Street, Cau Giay, Hanoi',
    date: '2023-11-19 09:15',
    paymentMethod: 'Bank Transfer',
    status: 'PACKING',
    subtotal: 450000,
    shippingFee: 35000,
    discountAmount: 0,
    total: 485000,
    items: [
      { id: '3', name: 'Sports Shirt', sku: 'SHIRT-02', variant: 'Size M / Blue', qty: 2, price: 225000 }
    ],
    timeline: [
      { time: '2023-11-19 09:15', status: 'CREATED', note: 'Customer placed order' },
      { time: '2023-11-19 10:00', status: 'PENDING', note: 'Payment confirmed' },
      { time: '2023-11-19 14:00', status: 'PACKING', note: 'Packing in progress' }
    ]
  },
  {
    id: 'ORD-8088',
    customerName: 'Le Van C',
    phone: '0912345678',
    email: 'lvc@example.com',
    address: '789 D Street, Hai Chau, Da Nang',
    date: '2023-11-18 16:30',
    paymentMethod: 'VNPay',
    status: 'SHIPPING',
    subtotal: 3100000,
    shippingFee: 50000,
    voucherCode: 'GIAM100K',
    discountAmount: 100000,
    total: 3050000,
    items: [
      { id: '4', name: 'Pro Tennis Racquet', sku: 'RACQUET-01', variant: 'Professional', qty: 1, price: 3100000 }
    ],
    timeline: [
      { time: '2023-11-18 16:30', status: 'CREATED' },
      { time: '2023-11-18 17:00', status: 'PACKING' },
      { time: '2023-11-19 08:00', status: 'SHIPPING', note: 'Handed over to shipping carrier (GHN)' }
    ]
  },
];

const mockCancelRequests: CancelRequest[] = [
  { id: 'REQ-01', orderId: 'ORD-8091', customerName: 'Nguyen Van A', reason: 'Found a cheaper place', time: '2 hours ago' },
  { id: 'REQ-02', orderId: 'ORD-8100', customerName: 'Pham Thi D', reason: 'Ordered wrong shoe size', time: '5 hours ago' },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'default', icon: <FileText size={14} /> },
  PACKING: { label: 'Packing', color: 'processing', icon: <Package size={14} /> },
  SHIPPING: { label: 'Shipping', color: 'purple', icon: <Truck size={14} /> },
  SUCCESS: { label: 'Success', color: 'success', icon: <Check size={14} /> },
  FAILED: { label: 'Failed', color: 'error', icon: <XCircle size={14} /> },
};

const getStatusStep = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING': return 0;
    case 'PACKING': return 1;
    case 'SHIPPING': return 2;
    case 'SUCCESS': return 3;
    case 'FAILED': return 3; // or error status
    default: return 0;
  }
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>(mockCancelRequests);
  const [filterTab, setFilterTab] = useState<'ALL' | OrderStatus>('ALL');
  const [searchText, setSearchText] = useState('');
  
  // Detail Drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination state (simulated)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterTab !== 'ALL') {
      result = result.filter(o => o.status === filterTab);
    }
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(lowerSearch) || 
        o.customerName.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [orders, filterTab, searchText]);

  const handleExport = () => {
    try {
      const BOM = '\uFEFF';
      const headers = ['Order ID', 'Customer Name', 'Phone', 'Payment Method', 'Total', 'Status', 'Order Date'].join(',');
      const rows = filteredOrders.map(o => 
        `"${o.id}","${o.customerName}","${o.phone}","${o.paymentMethod}",${o.total},"${statusConfig[o.status].label}","${o.date}"`
      ).join('\n');
      
      const csvContent = BOM + headers + '\n' + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Orders_List.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('File exported successfully!');
    } catch (error) {
      message.error('Error occurred while exporting file');
    }
  };

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    // Simulate DB transaction & constraint
    setOrders(prev => prev.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: newStatus,
          timeline: [
            ...o.timeline,
            { time: new Date().toISOString().replace('T', ' ').substring(0, 16), status: newStatus, note: 'Admin updated status' }
          ]
        };
      }
      return o;
    }));

    // Update the drawer view immediately
    setSelectedOrder(prev => prev ? ({
      ...prev,
      status: newStatus,
      timeline: [
        ...prev.timeline,
        { time: new Date().toISOString().replace('T', ' ').substring(0, 16), status: newStatus, note: 'Admin updated status' }
      ]
    }) : null);

    message.success(`Status updated to: ${statusConfig[newStatus].label}`);
    message.info('Automated notification sent to customer via Email/SMS');
  };

  const handleApproveCancel = (reqId: string, orderId: string, reasonDetails: string) => {
    if (!reasonDetails) {
      message.error('Please enter reason for approval/rejection');
      return;
    }
    
    // Attempt to find order and set to FAILED if not shipping yet
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (o.status === 'SHIPPING' || o.status === 'SUCCESS' || o.status === 'FAILED') {
          message.warning(`Cannot cancel order ${orderId} because it has been handed over to shipping.`);
          return o;
        }
        return { ...o, status: 'FAILED' as OrderStatus };
      }
      return o;
    }));
    
    setCancelRequests(prev => prev.filter(r => r.id !== reqId));
    message.success(`Approved cancellation for order ${orderId}. Refunds (if any) will be processed.`);
  };

  const handleRejectCancel = (reqId: string, reasonDetails: string) => {
    if (!reasonDetails) {
      message.error('Please enter reason for approval/rejection');
      return;
    }
    setCancelRequests(prev => prev.filter(r => r.id !== reqId));
    message.success('Cancellation request rejected. Order will continue processing.');
  };

  const columns: ColumnsType<Order> = [
    { 
      title: 'Order ID', 
      dataIndex: 'id', 
      className: 'font-mono font-medium text-[#191c1e]',
      width: 120,
    },
    { 
      title: 'Customer', 
      dataIndex: 'customerName',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.phone}</div>
        </div>
      )
    },
    { 
      title: 'Order Date', 
      dataIndex: 'date',
      className: 'text-[#5b403d]'
    },
    { 
      title: 'Total Amount', 
      dataIndex: 'total', 
      align: 'right',
      render: (val: number) => <span className="font-medium">{val.toLocaleString('vi-VN')} ₫</span>
    },
    { 
      title: 'Payment', 
      dataIndex: 'paymentMethod',
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      align: 'center',
      render: (val: OrderStatus) => (
        <Tag color={statusConfig[val].color} icon={statusConfig[val].icon}>
          {statusConfig[val].label}
        </Tag>
      ) 
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<Eye size={16} />} 
          onClick={() => {
            setSelectedOrder(record);
            setIsDrawerOpen(true);
          }}
          className="text-[#00799c] hover:bg-[#e0f2fe]"
        />
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#191c1e] tracking-tight">Order Management</h2>
          <p className="text-[#5b403d] text-sm mt-1">Monitor, update, and manage transactions</p>
        </div>
        <Button icon={<Download size={16} />} className="text-sm font-medium" onClick={handleExport}>
          Export Excel/CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-4">
          
          <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full flex overflow-x-auto pb-1 md:pb-0 gap-2 hide-scrollbar">
              {(['ALL', 'PENDING', 'PACKING', 'SHIPPING', 'SUCCESS', 'FAILED'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    filterTab === tab ? 'bg-[#d32f2f] text-white' : 'bg-[#eceef0] text-[#5b403d] hover:bg-gray-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : statusConfig[tab].label}
                </button>
              ))}
            </div>
            <Input 
              placeholder="Search by Order ID, Customer Name..." 
              prefix={<Search size={16} className="text-gray-400" />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="md:w-64 rounded-lg"
              allowClear
            />
          </div>

          <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm overflow-hidden">
            <Table 
              columns={columns} 
              dataSource={filteredOrders} 
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: itemsPerPage,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
              }}
              rowClassName="hover:bg-[#f7f9fb]"
              className="custom-table"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-[#d8dadc] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#191c1e]">
                  <AlertTriangle className="text-[#ba1a1a]" size={20} />
                  Cancellation Requests
                </h3>
                <p className="text-xs text-[#5b403d] mt-1">Needs review from store</p>
              </div>
              {cancelRequests.length > 0 && (
                <span className="bg-[#ba1a1a] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cancelRequests.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f7f9fb]">
              {cancelRequests.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No pending cancellation requests</p>
                </div>
              ) : (
                cancelRequests.map(req => (
                  <CancelRequestCard 
                    key={req.id} 
                    request={req} 
                    onApprove={(reason) => handleApproveCancel(req.id, req.orderId, reason)}
                    onReject={(reason) => handleRejectCancel(req.id, reason)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        title={<span className="font-bold text-lg">Order Details: {selectedOrder?.id}</span>}
        placement="right"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          selectedOrder && <Tag color={statusConfig[selectedOrder.status].color}>{statusConfig[selectedOrder.status].label}</Tag>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            
            {/* Status Workflow */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold mb-4 flex items-center gap-2"><Truck size={16} /> Update Status</h4>
              <Steps
                current={getStatusStep(selectedOrder.status)}
                status={selectedOrder.status === 'FAILED' ? 'error' : 'process'}
                size="small"
                items={[
                  { title: 'Pending' },
                  { title: 'Packing' },
                  { title: 'Shipping' },
                  { title: selectedOrder.status === 'FAILED' ? 'Failed' : 'Success' },
                ]}
              />
              
              <Divider className="my-4" />
              <div className="flex gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <Button type="primary" onClick={() => handleUpdateStatus('PACKING')}>Move to Packing</Button>
                )}
                {selectedOrder.status === 'PACKING' && (
                  <Button type="primary" onClick={() => handleUpdateStatus('SHIPPING')}>Move to Shipping</Button>
                )}
                {selectedOrder.status === 'SHIPPING' && (
                  <>
                    <Button type="primary" success onClick={() => handleUpdateStatus('SUCCESS')} className="bg-green-600 hover:bg-green-700">Confirm Successful Delivery</Button>
                    <Button danger onClick={() => handleUpdateStatus('FAILED')}>Delivery Failed</Button>
                  </>
                )}
                {(selectedOrder.status === 'SUCCESS' || selectedOrder.status === 'FAILED') && (
                  <span className="text-gray-500 text-sm italic">Order has reached end of status workflow.</span>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold mb-4 text-[#191c1e]">Customer Info</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="font-medium text-right">{selectedOrder.customerName}</div>
                <div className="text-gray-500">Phone:</div>
                <div className="font-medium text-right">{selectedOrder.phone}</div>
                <div className="text-gray-500">Email:</div>
                <div className="font-medium text-right">{selectedOrder.email}</div>
                <div className="text-gray-500">Shipping Address:</div>
                <div className="font-medium text-right col-span-2 mt-1 p-2 bg-gray-50 rounded text-left">{selectedOrder.address}</div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold mb-3 text-[#191c1e]">Products ({selectedOrder.items.length})</h4>
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku} | {item.variant}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.price.toLocaleString('vi-VN')} ₫</p>
                      <p className="text-xs text-gray-500">x {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance & Total */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold mb-3 text-[#191c1e]">Finance & Payment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{selectedOrder.subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee:</span>
                  <span>{selectedOrder.shippingFee.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Applied Voucher: 
                    {selectedOrder.voucherCode && <Tag color="blue" className="ml-2">{selectedOrder.voucherCode}</Tag>}
                  </span>
                  <span className="text-red-500">-{selectedOrder.discountAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Payment:</span>
                  <span className="text-[#d32f2f]">{selectedOrder.total.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{selectedOrder.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold mb-4 text-[#191c1e]">Timeline & History</h4>
              <div className="space-y-4">
                {selectedOrder.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== selectedOrder.timeline.length - 1 && (
                      <div className="absolute top-6 left-[11px] bottom-[-20px] w-px bg-gray-200" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.status}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                      {event.note && <p className="text-sm mt-1 text-gray-700 bg-gray-50 p-2 rounded">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}

function CancelRequestCard({ 
  request, 
  onApprove, 
  onReject 
}: { 
  key?: React.Key, // Add key to props to fix ts error
  request: CancelRequest, 
  onApprove: (reason: string) => void, 
  onReject: (reason: string) => void 
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="bg-white border-2 border-[#ffdad6] rounded-xl p-4 relative shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-2 h-full bg-[#ba1a1a]/10 rounded-r-xl"></div>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm font-bold text-[#ba1a1a]">{request.orderId}</span>
        <span className="text-xs text-[#5b403d] bg-[#eceef0] px-2 py-1 rounded-full">{request.time}</span>
      </div>
      <p className="text-sm text-gray-800 mb-1">
        <strong className="text-gray-900">Reason:</strong> "{request.reason}"
      </p>
      <p className="text-xs text-[#5b403d] mb-4">Customer: <strong>{request.customerName}</strong></p>
      
      <div className="pt-3 border-t border-dashed border-gray-200">
        <label className="block text-xs font-semibold mb-1 text-gray-600">Store Feedback (Required)</label>
        <Input.TextArea 
          className="w-full text-sm mb-3 rounded-lg" 
          rows={2} 
          placeholder="Enter approval/rejection reason..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Popconfirm
            title="Reject cancellation"
            description="Order will continue to be delivered. Are you sure?"
            onConfirm={() => onReject(reason)}
            okText="Reject cancel"
            cancelText="Go back"
          >
            <Button className="flex-1 rounded-lg">Reject Req</Button>
          </Popconfirm>
          <Popconfirm
            title="Approve order cancellation"
            description="Order will be marked as cancelled and refunded (if any). Are you sure?"
            onConfirm={() => onApprove(reason)}
            okText="Approve cancel"
            cancelText="Go back"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger className="flex-1 flex items-center justify-center gap-1 rounded-lg">
              <CheckCircle size={16} /> Approve
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Button, Table, Tag, Input, Select, Modal, 
  Drawer, Steps, message, Popconfirm, Divider, Space, Form, Spin 
} from 'antd';
import { 
  Download, Search, Eye, AlertTriangle, 
  CheckCircle, FileText, X, ChevronRight, Package, Truck, Check, XCircle 
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus } from '../../services/adminOrderService';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKING' | 'SHIPPING' | 'SUCCESS' | 'FAILED';

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
  status: string;
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

const mockCancelRequests: CancelRequest[] = [
  { id: 'REQ-01', orderId: 'ORD-8091', customerName: 'Nguyen Van A', reason: 'Muốn thay đổi địa chỉ giao hàng', time: '2 giờ trước' },
  { id: 'REQ-02', orderId: 'ORD-8100', customerName: 'Pham Thi D', reason: 'Đặt nhầm size giày đá bóng', time: '5 giờ trước' },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'default', icon: <FileText size={14} /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'processing', icon: <Check size={14} /> },
  PACKING: { label: 'Đang soạn hàng', color: 'warning', icon: <Package size={14} /> },
  SHIPPING: { label: 'Đang vận chuyển', color: 'purple', icon: <Truck size={14} /> },
  SUCCESS: { label: 'Thành công', color: 'success', icon: <CheckCircle size={14} /> },
  FAILED: { label: 'Đã hủy / Giao lỗi', color: 'error', icon: <XCircle size={14} /> },
};

const getStatusStep = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING': return 0;
    case 'CONFIRMED': return 1;
    case 'PACKING': return 2;
    case 'SHIPPING': return 3;
    case 'SUCCESS': return 4;
    case 'FAILED': return 4;
    default: return 0;
  }
};

export default function Orders() {
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>(mockCancelRequests);
  const [filterTab, setFilterTab] = useState<'ALL' | OrderStatus>('ALL');
  const [searchText, setSearchText] = useState('');
  
  // Detail Drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDbOrder, setSelectedDbOrder] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOrdersList = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrders();
      setDbOrders(res.data || res || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const mapDbOrderToFe = (o: any): Order => {
    const statusMap: Record<string, OrderStatus> = {
      'Pending': 'PENDING',
      'Confirmed': 'CONFIRMED',
      'Packing': 'PACKING',
      'Shipping': 'SHIPPING',
      'Completed': 'SUCCESS',
      'Cancelled': 'FAILED'
    };
    
    const feStatus = statusMap[o.status] || 'PENDING';
    const cleanDate = o.created_at ? new Date(o.created_at).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : 'N/A';

    return {
      id: String(o.id),
      customerName: o.users?.name || o.nguoiNhan || 'Khách vãng lai',
      phone: o.soDienThoaiNhan || o.users?.phone || 'N/A',
      email: o.users?.email || 'N/A',
      address: o.diaChiGiaoHang || 'N/A',
      date: cleanDate,
      paymentMethod: o.thanhToan?.method || 'N/A',
      status: feStatus,
      subtotal: Number(o.total_amount || 0),
      shippingFee: 0,
      discountAmount: Number(o.discount_amount || 0),
      total: Number(o.final_amount || 0),
      items: (o.order_items || []).map((it: any) => ({
        id: String(it.id),
        name: it.product?.name || 'Sản phẩm',
        sku: it.product?.sku || 'SKU-N/A',
        variant: `${it.product?.size || ''} / ${it.product?.color || ''}`.trim().replace(/^\/|\/$/g, '').trim() || 'N/A',
        qty: Number(it.quantity || 0),
        price: Number(it.unit_price || 0)
      })),
      timeline: [
        { 
          time: cleanDate, 
          status: 'Tạo đơn hàng', 
          note: 'Khách hàng đặt mua thành công từ Website' 
        },
        ...(o.status !== 'Pending' ? [
          { 
            time: o.updated_at ? new Date(o.updated_at).toLocaleString('vi-VN') : cleanDate, 
            status: statusConfig[feStatus]?.label || o.status, 
            note: o.cancel_reason ? `Lý do hủy: ${o.cancel_reason}` : 'Đã được cập nhật bởi hệ thống' 
          }
        ] : [])
      ]
    };
  };

  const formattedOrders = useMemo(() => {
    return dbOrders.map(mapDbOrderToFe);
  }, [dbOrders]);

  const filteredOrders = useMemo(() => {
    let result = formattedOrders;
    if (filterTab !== 'ALL') {
      result = result.filter(o => o.status === filterTab);
    }
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(lowerSearch) || 
        o.customerName.toLowerCase().includes(lowerSearch) ||
        o.phone.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [formattedOrders, filterTab, searchText]);

  const handleExport = () => {
    try {
      const BOM = '\uFEFF';
      const headers = ['Mã Đơn Hàng', 'Tên Khách Hàng', 'Số Điện Thoại', 'Phương Thức Thanh Toán', 'Tổng Tiền', 'Trạng Thái', 'Ngày Đặt'].join(',');
      const rows = filteredOrders.map(o => 
        `"${o.id}","${o.customerName}","${o.phone}","${o.paymentMethod}",${o.total},"${statusConfig[o.status].label}","${o.date}"`
      ).join('\n');
      
      const csvContent = BOM + headers + '\n' + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Danh_Sach_Don_Hang.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Xuất file thành công!');
    } catch (error) {
      message.error('Lỗi khi xuất file');
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus, cancelReason?: string) => {
    if (!selectedOrder) return;

    try {
      const backendStatusMap: Record<OrderStatus, string> = {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        PACKING: 'Packing',
        SHIPPING: 'Shipping',
        SUCCESS: 'Completed',
        FAILED: 'Cancelled'
      };
      const statusToSend = backendStatusMap[newStatus];
      
      await updateAdminOrderStatus(selectedOrder.id, statusToSend);
      message.success(`Cập nhật trạng thái thành công: ${statusConfig[newStatus].label}`);
      
      // Reload orders list
      await fetchOrdersList();
      
      // Reload drawer details
      const detailRes = await getAdminOrderById(selectedOrder.id);
      const dbOrder = detailRes.data || detailRes;
      const feOrder = mapDbOrderToFe(dbOrder);
      setSelectedOrder(feOrder);
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const handleApproveCancel = (reqId: string, orderId: string, reasonDetails: string) => {
    if (!reasonDetails) {
      message.error('Vui lòng nhập lý do duyệt hủy!');
      return;
    }
    
    // Call updates to cancel order
    updateAdminOrderStatus(orderId, 'Cancelled')
      .then(() => {
        message.success(`Đã đồng ý hủy đơn hàng #${orderId}`);
        setCancelRequests(prev => prev.filter(r => r.id !== reqId));
        fetchOrdersList();
      })
      .catch((err) => {
        message.error(err.response?.data?.message || err.message || 'Lỗi khi hủy đơn hàng');
      });
  };

  const handleRejectCancel = (reqId: string, reasonDetails: string) => {
    if (!reasonDetails) {
      message.error('Vui lòng nhập lý do từ chối!');
      return;
    }
    setCancelRequests(prev => prev.filter(r => r.id !== reqId));
    message.success('Đã từ chối yêu cầu hủy. Đơn hàng tiếp tục xử lý.');
  };

  const columns: ColumnsType<Order> = [
    { 
      title: 'Mã Đơn', 
      dataIndex: 'id', 
      className: 'font-mono font-medium text-[#191c1e]',
      width: 100,
    },
    { 
      title: 'Khách Hàng', 
      dataIndex: 'customerName',
      render: (text, record) => (
        <div>
          <div className="font-semibold text-sm">{text}</div>
          <div className="text-xs text-gray-500">{record.phone}</div>
        </div>
      )
    },
    { 
      title: 'Ngày Đặt', 
      dataIndex: 'date',
      className: 'text-[#5b403d] text-sm'
    },
    { 
      title: 'Tổng Giá Trị', 
      dataIndex: 'total', 
      align: 'right' as const,
      render: (val: number) => <span className="font-bold text-[#af101a]">{val.toLocaleString('vi-VN')} ₫</span>
    },
    { 
      title: 'Thanh Toán', 
      dataIndex: 'paymentMethod',
      className: 'text-sm'
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'status', 
      align: 'center' as const,
      render: (val: OrderStatus) => (
        <Tag color={statusConfig[val].color} icon={statusConfig[val].icon} className="px-2 py-0.5 rounded font-medium">
          {statusConfig[val].label}
        </Tag>
      ) 
    },
    {
      title: 'Xem',
      key: 'action',
      align: 'center' as const,
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<Eye size={16} />} 
          onClick={async () => {
            try {
              const detailRes = await getAdminOrderById(record.id);
              const dbOrder = detailRes.data || detailRes;
              setSelectedDbOrder(dbOrder);
              setSelectedOrder(mapDbOrderToFe(dbOrder));
              setIsDrawerOpen(true);
            } catch (err: any) {
              message.error('Không thể tải chi tiết đơn hàng');
            }
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
          <h2 className="text-2xl md:text-3xl font-bold text-[#191c1e] tracking-tight">Quản Lý Đơn Hàng</h2>
          <p className="text-[#5b403d] text-sm mt-1">Theo dõi, duyệt đơn, cập nhật lộ trình vận chuyển và hoàn kho</p>
        </div>
        <Button icon={<Download size={16} />} className="text-sm font-semibold border-[#e4beba] text-[#af101a] hover:text-[#af101a] hover:border-[#af101a] hover:bg-[#fff2f0]" onClick={handleExport}>
          Xuất File Excel/CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-4">
          
          <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full flex overflow-x-auto pb-1 md:pb-0 gap-2 hide-scrollbar">
              {(['ALL', 'PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'SUCCESS', 'FAILED'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                    filterTab === tab ? 'bg-[#af101a] text-white' : 'bg-[#eceef0] text-[#5b403d] hover:bg-[#e0e3e5]'
                  }`}
                >
                  {tab === 'ALL' ? 'Tất cả' : statusConfig[tab].label}
                </button>
              ))}
            </div>
            <Input 
              placeholder="Tìm theo Mã đơn, Tên KH, SĐT..." 
              prefix={<Search size={16} className="text-[#5b403d]" />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="md:w-64 rounded-lg border-[#e4beba]"
              allowClear
            />
          </div>

          <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
            <Spin spinning={loading} tip="Đang tải dữ liệu...">
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
                rowClassName="hover:bg-[#fbfcfd]"
                className="custom-table"
                scroll={{ x: 'max-content' }}
              />
            </Spin>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-[#eceef0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-[#ba1a1a]">
                  <AlertTriangle className="text-[#ba1a1a]" size={20} />
                  Yêu Cầu Hủy Đơn Hàng
                </h3>
                <p className="text-xs text-[#5b403d] mt-1">Khách hàng gửi yêu cầu chờ duyệt hủy</p>
              </div>
              {cancelRequests.length > 0 && (
                <span className="bg-[#ba1a1a] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cancelRequests.length} đơn
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fbfcfd]">
              {cancelRequests.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-50 text-green-500" />
                  <p className="text-sm font-medium">Không có yêu cầu hủy nào</p>
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
        title={<span className="font-bold text-[#af101a] text-lg">Chi Tiết Đơn Hàng: #{selectedOrder?.id}</span>}
        placement="right"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          selectedOrder && <Tag color={statusConfig[selectedOrder.status].color} className="px-2 py-0.5 rounded font-medium">{statusConfig[selectedOrder.status].label}</Tag>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            
            {/* Status Workflow */}
            <div className="bg-white rounded-xl border border-[#e4beba] p-5 shadow-sm">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-[#af101a]"><Truck size={16} /> Cập Nhật Trạng Thái</h4>
              <Steps
                current={getStatusStep(selectedOrder.status)}
                status={selectedOrder.status === 'FAILED' ? 'error' : 'process'}
                size="small"
                className="mb-6"
                items={[
                  { title: 'Chờ duyệt' },
                  { title: 'Đã xác nhận' },
                  { title: 'Đóng gói' },
                  { title: 'Giao hàng' },
                  { title: selectedOrder.status === 'FAILED' ? 'Đã hủy' : 'Thành công' },
                ]}
              />
              
              <Divider className="my-4 border-[#eceef0]" />
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <Button type="primary" className="bg-[#af101a] hover:bg-[#8d0c13]" onClick={() => handleUpdateStatus('CONFIRMED')}>Duyệt đơn hàng</Button>
                    <Button danger onClick={() => handleUpdateStatus('FAILED')}>Hủy đơn</Button>
                  </>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <>
                    <Button type="primary" className="bg-[#00799c] hover:bg-[#005f7b]" onClick={() => handleUpdateStatus('PACKING')}>Bắt đầu soạn hàng</Button>
                    <Button danger onClick={() => handleUpdateStatus('FAILED')}>Hủy đơn</Button>
                  </>
                )}
                {selectedOrder.status === 'PACKING' && (
                  <>
                    <Button type="primary" className="bg-[#8f6f6c] hover:bg-[#5b403d]" onClick={() => handleUpdateStatus('SHIPPING')}>Bắt đầu vận chuyển</Button>
                    <Button danger onClick={() => handleUpdateStatus('FAILED')}>Hủy đơn</Button>
                  </>
                )}
                {selectedOrder.status === 'SHIPPING' && (
                  <>
                    <Button type="primary" onClick={() => handleUpdateStatus('SUCCESS')} className="bg-green-600 hover:bg-green-700 border-green-600">Giao thành công</Button>
                    <Button danger onClick={() => handleUpdateStatus('FAILED')}>Giao hàng thất bại (Hoàn kho)</Button>
                  </>
                )}
                {(selectedOrder.status === 'SUCCESS' || selectedOrder.status === 'FAILED') && (
                  <span className="text-[#5b403d] text-sm italic font-medium">Đơn hàng này đã hoàn thành quy trình xử lý.</span>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-[#e4beba] p-5 shadow-sm">
              <h4 className="font-bold mb-4 text-[#191c1e] border-b pb-2 border-[#eceef0]">Thông Tin Khách Nhận</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500 font-medium">Người nhận:</div>
                <div className="font-semibold text-right">{selectedOrder.customerName}</div>
                <div className="text-gray-500 font-medium">Số điện thoại:</div>
                <div className="font-semibold text-right">{selectedOrder.phone}</div>
                <div className="text-gray-500 font-medium">Email:</div>
                <div className="font-semibold text-right text-gray-700">{selectedOrder.email}</div>
                <div className="text-gray-500 font-medium col-span-2">Địa chỉ giao hàng:</div>
                <div className="font-medium text-left col-span-2 mt-1 p-2.5 bg-[#f7f9fb] border border-[#e4beba] rounded text-[#191c1e]">{selectedOrder.address}</div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-[#e4beba] p-5 shadow-sm">
              <h4 className="font-bold mb-3 text-[#191c1e] border-b pb-2 border-[#eceef0]">Danh Sách Sản Phẩm ({selectedOrder.items.length})</h4>
              <div className="space-y-3">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-start justify-between py-2 border-b border-dashed border-[#eceef0] last:border-0">
                    <div>
                      <p className="font-semibold text-sm text-[#191c1e]">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Mã SKU: {item.sku} | Phân loại: {item.variant}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#af101a]">{item.price.toLocaleString('vi-VN')} ₫</p>
                      <p className="text-xs text-gray-500 font-medium">Số lượng: x {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance & Total */}
            <div className="bg-white rounded-xl border border-[#e4beba] p-5 shadow-sm">
              <h4 className="font-bold mb-3 text-[#191c1e] border-b pb-2 border-[#eceef0]">Chi Tiết Thanh Toán</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Tạm tính:</span>
                  <span className="font-semibold">{selectedOrder.subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Phí vận chuyển:</span>
                  <span className="font-semibold">Miễn phí (0 ₫)</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      Giảm giá Voucher: 
                      {selectedOrder.voucherCode && <Tag color="green" className="ml-1">{selectedOrder.voucherCode}</Tag>}
                    </span>
                    <span className="text-red-500 font-bold">-{selectedOrder.discountAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <Divider className="my-2 border-[#eceef0]" />
                <div className="flex justify-between font-bold text-base">
                  <span className="text-[#191c1e]">Tổng cộng thanh toán:</span>
                  <span className="text-[#af101a] text-lg">{selectedOrder.total.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-[#eceef0]">
                  <span className="text-gray-500 font-medium">Hình thức thanh toán:</span>
                  <span className="font-bold text-gray-700">{selectedOrder.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-[#e4beba] p-5 shadow-sm">
              <h4 className="font-bold mb-4 text-[#191c1e] border-b pb-2 border-[#eceef0]">Lịch Sử Lộ Trình</h4>
              <div className="space-y-4">
                {selectedOrder.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== selectedOrder.timeline.length - 1 && (
                      <div className="absolute top-6 left-[11px] bottom-[-20px] w-px bg-[#e4beba]" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0 z-10 border-2 border-white">
                      <div className="w-2 h-2 rounded-full bg-[#af101a]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{event.status}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{event.time}</p>
                      {event.note && <p className="text-xs mt-1 text-[#5b403d] bg-[#f7f9fb] p-2 rounded border border-[#eceef0]">{event.note}</p>}
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
  request: CancelRequest, 
  onApprove: (reason: string) => void, 
  onReject: (reason: string) => void 
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="bg-white border-2 border-[#ffdad6] rounded-xl p-4 relative shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-2 h-full bg-[#ba1a1a]/10 rounded-r-xl"></div>
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded">Mã: #{request.orderId}</span>
        <span className="text-[11px] text-[#5b403d] font-semibold">{request.time}</span>
      </div>
      <p className="text-xs text-gray-800 mb-1 leading-relaxed">
        <strong className="text-gray-900">Lý do:</strong> "{request.reason}"
      </p>
      <p className="text-[11px] text-[#5b403d] mb-4">Khách hàng: <strong>{request.customerName}</strong></p>
      
      <div className="pt-3 border-t border-dashed border-[#eceef0]">
        <label className="block text-[11px] font-bold mb-1 text-[#5b403d]">Phản hồi của shop (Bắt buộc)</label>
        <Input.TextArea 
          className="w-full text-xs mb-3 rounded-lg border-[#e4beba]" 
          rows={2} 
          placeholder="Nhập lý do duyệt hủy hoặc lý do từ chối..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Popconfirm
            title="Từ chối yêu cầu hủy"
            description="Đơn hàng sẽ tiếp tục giao đi. Bạn chắc chắn chứ?"
            onConfirm={() => onReject(reason)}
            okText="Từ chối hủy"
            cancelText="Quay lại"
          >
            <Button size="small" className="flex-1 rounded-lg text-xs font-medium">Từ chối</Button>
          </Popconfirm>
          <Popconfirm
            title="Đồng ý hủy đơn hàng này"
            description="Đơn sẽ được chuyển sang đã hủy và hoàn kho. Bạn chắc chắn?"
            onConfirm={() => onApprove(reason)}
            okText="Đồng ý hủy"
            cancelText="Quay lại"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="primary" danger className="flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold">
              <CheckCircle size={14} /> Đồng ý hủy
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}

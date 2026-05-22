import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Input,
  Drawer,
  Steps,
  message,
  Popconfirm,
  Divider,
  Spin,
  Empty,
} from 'antd';

import {
  Download,
  Search,
  Eye,
  Package,
  Truck,
  Check,
  XCircle,
  FileText,
  CheckCircle,
} from 'lucide-react';

import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

// =========================
// AXIOS
// =========================
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// =========================
// TYPES BACKEND
// =========================
type BackendOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packing'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled';

interface BackendOrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    sku: string;
    image_url: string | null;
    size: string | null;
    color: string | null;
  };
}

interface BackendOrder {
  id: string;
  created_at: string;
  status: BackendOrderStatus;
  payment_status: string;
  final_amount: number;

  khachHang?: {
    name?: string;
    email?: string;
  };

  nguoiNhan?: string;
  soDienThoaiNhan?: string;
  diaChiGiaoHang?: string;

  thanhToan?: {
    method?: string;
  };

  order_items?: BackendOrderItem[];
}

// =========================
// FRONTEND TYPES
// =========================
type OrderStatus =
  | 'PENDING'
  | 'PACKING'
  | 'SHIPPING'
  | 'SUCCESS'
  | 'FAILED';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  variant: string;
  qty: number;
  price: number;
  image?: string | null;
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
  total: number;
  items: OrderItem[];
}

// =========================
// STATUS MAP
// =========================
const mapBackendStatusToFrontend = (
  status: BackendOrderStatus
): OrderStatus => {
  switch (status) {
    case 'Pending':
    case 'Confirmed':
      return 'PENDING';

    case 'Packing':
      return 'PACKING';

    case 'Shipping':
      return 'SHIPPING';

    case 'Completed':
      return 'SUCCESS';

    case 'Cancelled':
      return 'FAILED';

    default:
      return 'PENDING';
  }
};

const mapFrontendToBackend = (
  status: OrderStatus
): BackendOrderStatus => {
  switch (status) {
    case 'PENDING':
      return 'Confirmed';

    case 'PACKING':
      return 'Packing';

    case 'SHIPPING':
      return 'Shipping';

    case 'SUCCESS':
      return 'Completed';

    case 'FAILED':
      return 'Cancelled';

    default:
      return 'Pending';
  }
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: 'Pending',
    color: 'default',
    icon: <FileText size={14} />,
  },

  PACKING: {
    label: 'Packing',
    color: 'processing',
    icon: <Package size={14} />,
  },

  SHIPPING: {
    label: 'Shipping',
    color: 'purple',
    icon: <Truck size={14} />,
  },

  SUCCESS: {
    label: 'Success',
    color: 'success',
    icon: <Check size={14} />,
  },

  FAILED: {
    label: 'Cancelled',
    color: 'error',
    icon: <XCircle size={14} />,
  },
};

const getStatusStep = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return 0;

    case 'PACKING':
      return 1;

    case 'SHIPPING':
      return 2;

    case 'SUCCESS':
      return 3;

    case 'FAILED':
      return 3;

    default:
      return 0;
  }
};

// =========================
// COMPONENT
// =========================
export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const [filterTab, setFilterTab] = useState<
    'ALL' | OrderStatus
  >('ALL');

  const [searchText, setSearchText] = useState('');

  // =========================
  // GET LIST ORDERS
  // =========================
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await api.get('/admin/orders');

      const rawOrders: BackendOrder[] =
        response.data.data || [];

      const mappedOrders: Order[] = rawOrders.map(
        (order) => ({
          id: order.id,

          customerName:
            order.nguoiNhan ||
            order.khachHang?.name ||
            'Không có tên',

          phone:
            order.soDienThoaiNhan || '---',

          email:
            order.khachHang?.email || '---',

          address:
            order.diaChiGiaoHang || '---',

          date: new Date(
            order.created_at
          ).toLocaleString('vi-VN'),

          paymentMethod:
            order.thanhToan?.method || '---',

          status:
            mapBackendStatusToFrontend(
              order.status
            ),

          total: Number(
            order.final_amount || 0
          ),

          items: [],
        })
      );

      setOrders(mappedOrders);
    } catch (error: any) {
      console.error(error);

      message.error(
        error?.response?.data?.message ||
          'Lỗi tải danh sách đơn hàng'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET DETAIL ORDER
  // =========================
  const fetchOrderDetail = async (
    orderId: string
  ) => {
    try {
      const response = await api.get(
        `/admin/orders/${orderId}`
      );

      const order: BackendOrder =
        response.data.data;

      const mappedOrder: Order = {
        id: order.id,

        customerName:
          order.nguoiNhan ||
          order.khachHang?.name ||
          'Không có tên',

        phone:
          order.soDienThoaiNhan || '---',

        email:
          order.khachHang?.email || '---',

        address:
          order.diaChiGiaoHang || '---',

        date: new Date(
          order.created_at
        ).toLocaleString('vi-VN'),

        paymentMethod:
          order.thanhToan?.method || '---',

        status:
          mapBackendStatusToFrontend(
            order.status
          ),

        total: Number(
          order.final_amount || 0
        ),

        items: (order.order_items || []).map(
          (item) => ({
            id: item.id,

            name:
              item.product?.name || '',

            sku:
              item.product?.sku || '',

            variant: `${item.product?.size || ''} ${
              item.product?.color || ''
            }`,

            qty: item.quantity,

            price: item.unit_price,

            image:
              item.product?.image_url,
          })
        ),
      };

      setSelectedOrder(mappedOrder);
      setIsDrawerOpen(true);
    } catch (error: any) {
      console.error(error);

      message.error(
        error?.response?.data?.message ||
          'Lỗi tải chi tiết đơn hàng'
      );
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const handleUpdateStatus = async (
    newStatus: OrderStatus
  ) => {
    if (!selectedOrder) return;

    try {
      const backendStatus =
        mapFrontendToBackend(newStatus);

      await api.patch(
        `/admin/orders/${selectedOrder.id}/status`,
        {
          status: backendStatus,
        }
      );

      message.success(
        'Cập nhật trạng thái thành công'
      );

      await fetchOrders();
      await fetchOrderDetail(selectedOrder.id);
    } catch (error: any) {
      console.error(error);

      message.error(
        error?.response?.data?.message ||
          'Cập nhật trạng thái thất bại'
      );
    }
  };

  // =========================
  // EXPORT CSV
  // =========================
  const handleExport = () => {
    try {
      const BOM = '\uFEFF';

      const headers = [
        'Order ID',
        'Customer Name',
        'Phone',
        'Payment Method',
        'Total',
        'Status',
        'Order Date',
      ].join(',');

      const rows = filteredOrders
        .map(
          (o) =>
            `"${o.id}","${o.customerName}","${o.phone}","${o.paymentMethod}",${o.total},"${statusConfig[o.status].label}","${o.date}"`
        )
        .join('\n');

      const csvContent =
        BOM + headers + '\n' + rows;

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });

      const link =
        document.createElement('a');

      link.href =
        URL.createObjectURL(blob);

      link.download = 'orders.csv';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      message.success('Export CSV thành công');
    } catch {
      message.error('Export thất bại');
    }
  };

  // =========================
  // FILTER
  // =========================
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterTab !== 'ALL') {
      result = result.filter(
        (o) => o.status === filterTab
      );
    }

    if (searchText) {
      const lower = searchText.toLowerCase();

      result = result.filter(
        (o) =>
          o.id
            .toLowerCase()
            .includes(lower) ||
          o.customerName
            .toLowerCase()
            .includes(lower)
      );
    }

    return result;
  }, [orders, filterTab, searchText]);

  // =========================
  // TABLE
  // =========================
  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      width: 220,
    },

    {
      title: 'Customer',

      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.customerName}
          </div>

          <div className="text-xs text-gray-500">
            {record.phone}
          </div>
        </div>
      ),
    },

    {
      title: 'Date',
      dataIndex: 'date',
    },

    {
      title: 'Total',

      render: (_, record) => (
        <span className="font-semibold">
          {record.total.toLocaleString(
            'vi-VN'
          )}{' '}
          ₫
        </span>
      ),
    },

    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
    },

    {
      title: 'Status',

      render: (_, record) => (
        <Tag
          color={
            statusConfig[record.status]
              .color
          }
          icon={
            statusConfig[record.status]
              .icon
          }
        >
          {
            statusConfig[record.status]
              .label
          }
        </Tag>
      ),
    },

    {
      title: 'Actions',

      render: (_, record) => (
        <Button
          type="text"
          icon={<Eye size={18} />}
          onClick={() =>
            fetchOrderDetail(record.id)
          }
        />
      ),
    },
  ];

  // =========================
  // USE EFFECT
  // =========================
  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================
  // UI
  // =========================
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Order Management
          </h2>

          <p className="text-gray-500">
            Quản lý đơn hàng
          </p>
        </div>

        <Button
          icon={<Download size={16} />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl border p-4 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          {(
            [
              'ALL',
              'PENDING',
              'PACKING',
              'SHIPPING',
              'SUCCESS',
              'FAILED',
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setFilterTab(tab)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filterTab === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Input
          placeholder="Search..."
          prefix={<Search size={16} />}
          className="max-w-[300px]"
          value={searchText}
          onChange={(e) =>
            setSearchText(e.target.value)
          }
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border">
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty description="Không có đơn hàng" />
            ),
          }}
        />
      </div>

      {/* DRAWER */}
      <Drawer
        title={`Chi tiết đơn hàng ${selectedOrder?.id}`}
        placement="right"
        width={600}
        open={isDrawerOpen}
        onClose={() =>
          setIsDrawerOpen(false)
        }
      >
        {!selectedOrder ? (
          <Spin />
        ) : (
          <div className="space-y-6">
            {/* STATUS */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold mb-4">
                Trạng thái đơn hàng
              </h3>

              <Steps
                current={getStatusStep(
                  selectedOrder.status
                )}
                items={[
                  { title: 'Pending' },
                  { title: 'Packing' },
                  { title: 'Shipping' },
                  {
                    title:
                      selectedOrder.status ===
                      'FAILED'
                        ? 'Cancelled'
                        : 'Completed',
                  },
                ]}
              />

              <Divider />

              <div className="flex gap-2 flex-wrap">
                {selectedOrder.status ===
                  'PENDING' && (
                  <Button
                    type="primary"
                    onClick={() =>
                      handleUpdateStatus(
                        'PACKING'
                      )
                    }
                  >
                    Xác nhận đơn
                  </Button>
                )}

                {selectedOrder.status ===
                  'PACKING' && (
                  <Button
                    type="primary"
                    onClick={() =>
                      handleUpdateStatus(
                        'SHIPPING'
                      )
                    }
                  >
                    Chuyển giao hàng
                  </Button>
                )}

                {selectedOrder.status ===
                  'SHIPPING' && (
                  <>
                    <Button
                      type="primary"
                      onClick={() =>
                        handleUpdateStatus(
                          'SUCCESS'
                        )
                      }
                    >
                      Hoàn thành
                    </Button>

                    <Popconfirm
                      title="Huỷ đơn?"
                      onConfirm={() =>
                        handleUpdateStatus(
                          'FAILED'
                        )
                      }
                    >
                      <Button danger>
                        Huỷ đơn
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </div>
            </div>

            {/* CUSTOMER */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold mb-4">
                Thông tin khách hàng
              </h3>

              <div className="space-y-2 text-sm">
                <div>
                  <strong>Tên:</strong>{' '}
                  {
                    selectedOrder.customerName
                  }
                </div>

                <div>
                  <strong>SĐT:</strong>{' '}
                  {selectedOrder.phone}
                </div>

                <div>
                  <strong>Email:</strong>{' '}
                  {selectedOrder.email}
                </div>

                <div>
                  <strong>Địa chỉ:</strong>{' '}
                  {selectedOrder.address}
                </div>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold mb-4">
                Sản phẩm
              </h3>

              <div className="space-y-4">
                {selectedOrder.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b pb-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={
                            item.image ||
                            'https://placehold.co/80x80'
                          }
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover border"
                        />

                        <div>
                          <div className="font-medium">
                            {item.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            SKU:{' '}
                            {item.sku}
                          </div>

                          <div className="text-xs text-gray-500">
                            {item.variant}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div>
                          {item.price.toLocaleString(
                            'vi-VN'
                          )}{' '}
                          ₫
                        </div>

                        <div className="text-xs text-gray-500">
                          x {item.qty}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <Divider />

              <div className="flex justify-between font-bold text-lg">
                <span>Tổng tiền</span>

                <span className="text-red-600">
                  {selectedOrder.total.toLocaleString(
                    'vi-VN'
                  )}{' '}
                  ₫
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
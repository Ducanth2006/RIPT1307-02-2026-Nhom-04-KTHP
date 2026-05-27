import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import dayjs from 'dayjs';

import {
  Tabs,
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Tag,
  Image,
  Card,
  Statistic,
  Empty,
  Select,
  Space,
  Alert,
  DatePicker,
  Row,
  Col
} from 'antd';

import type { ColumnsType } from 'antd/es/table';

import {
  AlertTriangle,
  Search,
  RefreshCw,
  DollarSign,
  Package2,
  Plus,
  Box
} from 'lucide-react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

const { RangePicker } = DatePicker;

// =========================
// TYPES
// =========================

interface AnhSanPham {
  is_main: boolean;
  url: string;
}

interface BienTheKho {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  size: string | null;
  color: string | null;
  costPrice: number | null;
  stock: number | null;
  product_images?: AnhSanPham[];
}

interface ThongKeKho {
  tongGiaTriKho: number;
  soLuongSapHet: number;
}

interface NhatKyBienDong {
  id: string;
  variantId: string;
  timestamp: string;
  type:
    | 'IMPORT'
    | 'EXPORT_SELL'
    | 'EXPORT_DELETE';
  quantity: number;
  costPrice: number;
  sku?: string;
  productName?: string;
  size?: string;
  color?: string;
}

export default function Inventory() {
  const [messageApi, contextHolder] =
    message.useMessage();

  // =========================
  // STATE
  // =========================

  const [danhSachKho, setDanhSachKho] =
    useState<BienTheKho[]>([]);

  const [cancelRequestedOrders, setCancelRequestedOrders] =
    useState<any[]>([]);

  const [activeCancelModalOpen, setActiveCancelModalOpen] =
    useState(false);

  const [cancellableOrdersForSelectedVariant, setCancellableOrdersForSelectedVariant] =
    useState<any[]>([]);

  const [danhSachLichSu, setDanhSachLichSu] =
    useState<NhatKyBienDong[]>([]);

  const [statsKho, setStatsKho] =
    useState<ThongKeKho>({
      tongGiaTriKho: 0,
      soLuongSapHet: 0
    });

  const [loadingDanhSach, setLoadingDanhSach] =
    useState(false);

  const [loadingLichSu, setLoadingLichSu] =
    useState(false);

  const [loadingLuuPhieu, setLoadingLuuPhieu] =
    useState(false);

  const [tuKhoaTimKiem, setTuKhoaTimKiem] =
    useState('');

  // =========================
  // FILTER LỊCH SỬ
  // =========================

  const [
    loaiGiaoDichFilter,
    setLoaiGiaoDichFilter
  ] = useState<string>('ALL');

  const [
    khoangThoiGian,
    setKhoangThoiGian
  ] = useState<
    [
      dayjs.Dayjs | null,
      dayjs.Dayjs | null
    ] | null
  >(null);

  const [
    tuKhoaTimKiemLichSu,
    setTuKhoaTimKiemLichSu
  ] = useState('');

  const [dangMoModal, setDangMoModal] =
    useState(false);

  const [tabModal, setTabModal] = useState<
    'IMPORT' | 'EXPORT'
  >('IMPORT');

  const [bienTheDangChon, setBienTheDangChon] =
    useState<BienTheKho | null>(null);

  const [formNhap] = Form.useForm();

  const [formXuat] = Form.useForm();

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {
    taiTatCaDuLieu();
  }, []);

  // =========================
  // FORMAT
  // =========================

  const dinhDangTien = (
    soTien?: number | null
  ) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(soTien || 0));
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return dayjs(date).format(
      'DD/MM/YYYY HH:mm'
    );
  };

  const layAnhChinh = (
    danhSachAnh?: AnhSanPham[]
  ) => {
    if (!danhSachAnh?.length) {
      return '';
    }

    const anhChinh = danhSachAnh.find(
      (item) => item.is_main
    );

    return (
      anhChinh?.url ||
      danhSachAnh?.[0]?.url ||
      ''
    );
  };

  // =========================
  // API
  // =========================

  const taiDuLieuKho = async () => {
    try {
      setLoadingDanhSach(true);

      const phanHoi =
        await axiosInstance.get(
          `${ip}/admin/inventory`
        );

      const duLieu =
        phanHoi.data?.data || [];

      const duLieuChuanHoa =
        duLieu.map((item: any) => ({
          id: String(item.id),

          productId: String(
            item.product_id ||
              item.productId ||
              ''
          ),

          productName:
            item.product_name ||
            item.productName ||
            '---',

          sku: item.sku || '---',

          size: item.size || null,

          color: item.color || null,

          costPrice: Number(
            item.cost_price ||
              item.costPrice ||
              0
          ),

          stock: Number(
            item.stock_quantity ||
              item.stock ||
              0
          ),

          product_images:
            item.product_images || []
        }));

      setDanhSachKho(duLieuChuanHoa);
    } catch (loi: any) {
      messageApi.error(
        loi.response?.data?.message ||
          'Không thể tải tồn kho!'
      );
    } finally {
      setLoadingDanhSach(false);
    }
  };

  const taiThongKeKho = async () => {
    try {
      const phanHoi =
        await axiosInstance.get(
          `${ip}/admin/inventory/stats`
        );

      const duLieu =
        phanHoi.data?.data || {};

      setStatsKho({
        tongGiaTriKho: Number(
          duLieu.tongGiaTriKho || 0
        ),

        soLuongSapHet: Number(
          duLieu.soLuongSapHet || 0
        )
      });
    } catch (loi) {
      console.log(loi);
    }
  };

  const taiLichSuKho = async () => {
    try {
      setLoadingLichSu(true);

      const promises = danhSachKho.map(
        (item) =>
          axiosInstance.get(
            `${ip}/admin/inventory/${item.id}/logs`
          )
      );

      const responses =
        await Promise.allSettled(promises);

      const mergedLogs: NhatKyBienDong[] = [];

      responses.forEach((result) => {
        if (
          result.status === 'fulfilled'
        ) {
          const duLieu =
            result.value.data?.data ||
            [];

          duLieu.forEach((item: any) => {
            mergedLogs.push({
              id: String(item.id),

              variantId: String(
                item.variant_id ||
                  item.variantId ||
                  ''
              ),

              timestamp:
                item.created_at ||
                item.createdAt ||
                item.timestamp ||
                new Date().toISOString(),

              type:
                item.action_type ||
                item.type,

              quantity: Number(
                item.quantity || 0
              ),

              costPrice: Number(
                item.cost_price ||
                  item.costPrice ||
                  0
              ),

              sku:
                item.sku || '',

              productName:
                item.product_name ||
                item.productName ||
                '',

              size:
                item.size || '',

              color:
                item.color || ''
            });
          });
        }
      });

      mergedLogs.sort((a, b) => {
        return (
          new Date(
            b.timestamp
          ).getTime() -
          new Date(
            a.timestamp
          ).getTime()
        );
      });

      setDanhSachLichSu(
        mergedLogs
      );
    } catch (loi: any) {
      messageApi.error(
        loi.response?.data?.message ||
          'Không thể tải lịch sử!'
      );
    } finally {
      setLoadingLichSu(false);
    }
  };

  const taiDanhSachDonHangChoHuy = async () => {
    try {
      const res = await axiosInstance.get(`${ip}/admin/orders`);
      const data = res.data?.data || [];
      const cancelRequests = data.filter((o: any) => o.status === 'CancelRequested');
      setCancelRequestedOrders(cancelRequests);
    } catch (error) {
      console.log('Lỗi tải danh sách đơn hàng:', error);
    }
  };

  const xacNhanDuyetHuyTuInventory = async (orderId: string) => {
    try {
      setLoadingLuuPhieu(true);
      await axiosInstance.patch(`${ip}/admin/orders/${orderId}/status`, {
        status: 'Cancelled'
      });
      messageApi.success('Duyệt hủy đơn và hoàn kho thành công!');
      setActiveCancelModalOpen(false);
      await taiTatCaDuLieu();
    } catch (loi: any) {
      console.log(loi);
      messageApi.error(
        loi.response?.data?.message || 'Có lỗi xảy ra khi duyệt hủy đơn!'
      );
    } finally {
      setLoadingLuuPhieu(false);
    }
  };

  const taiTatCaDuLieu = async () => {
    await taiDuLieuKho();
    await taiDanhSachDonHangChoHuy();

    await Promise.all([
      taiThongKeKho(),
      taiLichSuKho()
    ]);
  };

  // =========================
  // FILTER TỒN KHO
  // =========================

  const danhSachLocDuoc = useMemo(() => {
    const keyword =
      tuKhoaTimKiem
        .toLowerCase()
        .trim();

    if (!keyword) {
      return danhSachKho;
    }

    return danhSachKho.filter(
      (item) =>
        item.sku
          ?.toLowerCase()
          .includes(keyword) ||
        item.productName
          ?.toLowerCase()
          .includes(keyword) ||
        item.size
          ?.toLowerCase()
          .includes(keyword) ||
        item.color
          ?.toLowerCase()
          .includes(keyword)
    );
  }, [
    danhSachKho,
    tuKhoaTimKiem
  ]);

  // =========================
  // FILTER LỊCH SỬ
  // =========================

  const danhSachLichSuLocDuoc =
    useMemo(() => {
      return danhSachLichSu.filter(
        (log) => {
          // KEYWORD

          const keyword =
            tuKhoaTimKiemLichSu
              .trim()
              .toLowerCase();

          const matchKeyword =
            !keyword
              ? true
              : (
                  log.sku
                    ?.toLowerCase()
                    .includes(
                      keyword
                    ) ||
                  log.productName
                    ?.toLowerCase()
                    .includes(
                      keyword
                    )
                );

          // TYPE

          const matchType =
            loaiGiaoDichFilter ===
            'ALL'
              ? true
              : log.type ===
                loaiGiaoDichFilter;

          // DATE

          let matchDate = true;

          if (
            khoangThoiGian &&
            khoangThoiGian[0] &&
            khoangThoiGian[1]
          ) {
            const startOfDay =
              khoangThoiGian[0]
                .startOf('day')
                .toDate();

            const endOfDay =
              khoangThoiGian[1]
                .endOf('day')
                .toDate();

            const logDate =
              new Date(
                log.timestamp
              );

            matchDate =
              logDate >=
                startOfDay &&
              logDate <=
                endOfDay;
          }

          return (
            matchKeyword &&
            matchType &&
            matchDate
          );
        }
      );
    }, [
      danhSachLichSu,
      tuKhoaTimKiemLichSu,
      loaiGiaoDichFilter,
      khoangThoiGian
    ]);

  // =========================
  // MODAL
  // =========================

  const moModal = () => {
    formNhap.resetFields();

    formXuat.resetFields();

    setBienTheDangChon(null);

    setTabModal('IMPORT');

    setDangMoModal(true);
  };

  const dongModal = () => {
    formNhap.resetFields();

    formXuat.resetFields();

    setBienTheDangChon(null);

    setDangMoModal(false);
  };

  const xuLyChonSanPham = (
    value: string
  ) => {
    const bienThe =
      danhSachKho.find(
        (item) => item.id === value
      ) || null;

    setBienTheDangChon(bienThe);

    if (!bienThe) return;

    if (tabModal === 'IMPORT') {
      formNhap.setFieldsValue({
        variant_id: bienThe.id,
        giaVon:
          bienThe.costPrice || 0
      });
    } else {
      formXuat.setFieldsValue({
        variant_id: bienThe.id
      });
    }
  };

  const xacNhanTaoPhieu =
    async () => {
      try {
        setLoadingLuuPhieu(true);

        const values =
          tabModal === 'IMPORT'
            ? await formNhap.validateFields()
            : await formXuat.validateFields();

        if (!bienTheDangChon) {
          messageApi.error(
            'Vui lòng chọn sản phẩm'
          );

          return;
        }

        if (
          tabModal === 'EXPORT'
        ) {
          const tonKho =
            Number(
              bienTheDangChon.stock ||
                0
            );

          if (
            Number(
              values.soLuongXuat
            ) > tonKho
          ) {
            messageApi.error(
              'Số lượng xuất vượt quá tồn kho hiện tại'
            );

            return;
          }
        }

        if (
          tabModal === 'IMPORT'
        ) {
          const payload = {
            variant_id: Number(
              values.variant_id
            ),

            quantity: Number(
              values.soLuongNhap
            ),

            cost_price: Number(
              values.giaVon
            )
          };

          await axiosInstance.post(
            `${ip}/admin/inventory/import`,
            payload
          );
        } else {
          const payload = {
            variant_id: Number(
              values.variant_id
            ),

            quantity: Number(
              values.soLuongXuat
            )
          };

          await axiosInstance.post(
            `${ip}/admin/inventory/export`,
            payload
          );
        }

        messageApi.success(
          'Tạo phiếu thành công!'
        );

        dongModal();

        await taiTatCaDuLieu();
      } catch (loi: any) {
        console.log(loi);

        messageApi.error(
          loi.response?.data?.message ||
            'Có lỗi xảy ra!'
        );
      } finally {
        setLoadingLuuPhieu(false);
      }
    };

  // =========================
  // TABLE TỒN KHO
  // =========================

  const cotTonKho: ColumnsType<BienTheKho> =
    [
      {
        title: 'Ảnh',
        key: 'image',
        width: 90,

        render: (
          _: any,
          record
        ) => {
          const anh =
            layAnhChinh(
              record.product_images
            );

          if (!anh) {
            return (
              <div className="w-[54px] h-[54px] rounded-xl bg-gray-100 flex items-center justify-center">
                <Box size={18} />
              </div>
            );
          }

          return (
            <Image
              src={anh}
              width={54}
              height={54}
              className="rounded-xl object-cover"
              preview={false}
            />
          );
        }
      },

      {
        title: 'Sản phẩm',
        key: 'productName',
        render: (_, record) => (
          <div>
            <div className="font-semibold text-[15px] text-[#191c1e]">
              {record.productName}
            </div>
            <div className="text-[#5b403d] text-sm mt-1">
              SKU: {record.sku}
            </div>
          </div>
        )
      },

      {
        title: 'Biến thể',
        key: 'variant',

        render: (_, record) => (
          <div className="text-[#5b403d]">
            Size: <span className="font-medium text-[#191c1e]">{record.size || '-'}</span>
            <br />
            Màu: <span className="font-medium text-[#191c1e]">{record.color || '-'}</span>
          </div>
        )
      },

      {
        title: 'Tồn kho',
        dataIndex: 'stock',
        key: 'stock',

        render: (
          stock: number
        ) => {
          if (stock <= 0) {
            return (
              <Tag color="red" className="rounded-full px-3 py-1">
                Hết hàng
              </Tag>
            );
          }

          if (stock <= 5) {
            return (
              <Tag color="orange" className="rounded-full px-3 py-1">
                Sắp hết ({stock})
              </Tag>
            );
          }

          return (
            <Tag color="green" className="rounded-full px-3 py-1">
              Còn hàng ({stock})
            </Tag>
          );
        }
      },

      {
        title: 'Giá vốn',
        dataIndex: 'costPrice',
        key: 'costPrice',

        render: (v) => (
          <span className="font-semibold text-[#15803d]">
            {dinhDangTien(v)}
          </span>
        )
      },

      {
        title: 'Yêu cầu huỷ đơn',
        key: 'cancelRequests',
        width: 150,
        render: (_, record) => {
          const ordersWithCancelRequest = cancelRequestedOrders.filter((order: any) =>
            order.chiTietDonHang?.some((item: any) => String(item.sanPhamChiTiet?.id || item.variantId) === String(record.id))
          );

          if (ordersWithCancelRequest.length === 0) return null;

          return (
            <Button
              type="primary"
              size="small"
              className="bg-[#af101a] hover:!bg-[#930010] text-xs rounded-lg border-none"
              onClick={() => {
                setCancellableOrdersForSelectedVariant(ordersWithCancelRequest);
                setBienTheDangChon(record);
                setActiveCancelModalOpen(true);
              }}
            >
              Yêu cầu hủy ({ordersWithCancelRequest.length})
            </Button>
          );
        }
      }
    ];

  // =========================
  // TABLE LỊCH SỬ
  // =========================

  const cotLichSu: ColumnsType<NhatKyBienDong> =
    [
      {
        title: 'Thời gian',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (value) => (
          <span className="text-[#5b403d]">{formatDate(value)}</span>
        )
      },

      {
        title: 'Loại Phiếu',
        dataIndex: 'type',
        key: 'type',

        render: (type) => {
          if (type === 'IMPORT') {
            return (
              <Tag color="green" className="rounded-full px-3 py-1">
                NHẬP KHO
              </Tag>
            );
          }

          if (type === 'EXPORT_DELETE') {
            return (
              <Tag color="red" className="rounded-full px-3 py-1">
                XUẤT HỦY
              </Tag>
            );
          }

          return (
            <Tag color="processing" className="rounded-full px-3 py-1">
              BÁN HÀNG
            </Tag>
          );
        }
      },

      {
        title: 'Sản phẩm',
        key: 'product',

        render: (_, record) => (
          <div>
            <div className="font-semibold text-[15px] text-[#191c1e]">
              {record.productName}
            </div>
            <div className="text-[#5b403d] text-sm mt-1">
              SKU: {record.sku} | Size: {record.size || '-'} | Màu: {record.color || '-'}
            </div>
          </div>
        )
      },

      {
        title: 'Biến Động',
        dataIndex: 'quantity',
        key: 'quantity',

        render: (
          quantity,
          record
        ) => {
          const isImport =
            record.type === 'IMPORT';

          return (
            <span
              className={`font-bold text-[15px] ${
                isImport
                  ? 'text-[#15803d]'
                  : 'text-[#af101a]'
              }`}
            >
              {isImport
                ? `+${quantity}`
                : `-${quantity}`}
            </span>
          );
        }
      },

      {
        title: 'Giá Trị',
        key: 'value',

        render: (_, record) => (
          <span className="font-medium text-[#191c1e]">
            {dinhDangTien(Number(record.quantity || 0) * Number(record.costPrice || 0))}
          </span>
        )
      }
    ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {contextHolder}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <Package2 size={30} className="text-[#af101a]" />
            Quản Lý Kho Hàng
          </h1>
          <p className="text-[#5b403d] mt-2">
            Quản lý tồn kho và biến động giao dịch kho.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            onClick={taiTatCaDuLieu}
            icon={<RefreshCw size={16} />}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<Plus size={18} />}
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={moModal}
          >
            Tạo Phiếu Kho
          </Button>
        </Space>
      </div>

      {/* TABS & MAIN CONTENT */}
      <div className="bg-white border border-[#ead0d0] rounded-3xl shadow-sm overflow-hidden">
        <Tabs
          defaultActiveKey="1"
          className="px-5 pt-3"
          items={[
            {
              key: '1',
              label: <span className="font-semibold text-[15px]">Danh Sách Tồn Kho</span>,
              children: (
                <div className="pb-5 space-y-6 mt-2">
                  {/* STATS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
                      <Statistic
                        title="Tổng giá trị kho"
                        value={statsKho.tongGiaTriKho}
                        formatter={(value) => dinhDangTien(Number(value))}
                        prefix={<DollarSign size={18} className="text-[#af101a]" />}
                        valueStyle={{ color: '#af101a', fontWeight: 'bold' }}
                      />
                    </Card>

                    <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
                      <Statistic
                        title="Sản phẩm sắp hết hàng"
                        value={statsKho.soLuongSapHet}
                        prefix={<AlertTriangle size={18} className="text-[#f97316]" />}
                        valueStyle={{ color: '#f97316' }}
                      />
                    </Card>
                  </div>

                  {/* FILTER */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Input
                      placeholder="Tìm SKU, sản phẩm..."
                      prefix={<Search size={16} />}
                      value={tuKhoaTimKiem}
                      onChange={(e) => setTuKhoaTimKiem(e.target.value)}
                      allowClear
                      size="large"
                      className="max-w-md"
                    />
                  </div>

                  {/* TABLE */}
                  <Table<BienTheKho>
                    rowKey="id"
                    columns={cotTonKho}
                    dataSource={danhSachLocDuoc}
                    loading={loadingDanhSach}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{
                      emptyText: <Empty description="Không có dữ liệu tồn kho" />
                    }}
                  />
                </div>
              )
            },
            {
              key: '2',
              label: <span className="font-semibold text-[15px]">Lịch Sử Giao Dịch</span>,
              children: (
                <div className="pb-5 space-y-5 mt-2">
                  {/* FILTER */}
                  <Row gutter={[12, 12]} className="items-center">
                    <Col xs={24} md={8}>
                      <Input
                        allowClear
                        size="large"
                        prefix={<Search size={16} />}
                        placeholder="Tìm SKU / tên sản phẩm..."
                        value={tuKhoaTimKiemLichSu}
                        onChange={(e) => setTuKhoaTimKiemLichSu(e.target.value)}
                      />
                    </Col>

                    <Col xs={24} md={6}>
                      <Select
                        size="large"
                        value={loaiGiaoDichFilter}
                        onChange={setLoaiGiaoDichFilter}
                        style={{ width: '100%' }}
                        options={[
                          { label: 'Tất cả giao dịch', value: 'ALL' },
                          { label: 'Nhập kho', value: 'IMPORT' },
                          { label: 'Xuất bán', value: 'EXPORT_SELL' },
                          { label: 'Xuất hủy', value: 'EXPORT_DELETE' }
                        ]}
                      />
                    </Col>

                    <Col xs={24} md={10}>
                      <RangePicker
                        size="large"
                        style={{ width: '100%' }}
                        value={khoangThoiGian}
                        onChange={(dates) => {
                          if (!dates) {
                            setKhoangThoiGian(null);
                            return;
                          }
                          setKhoangThoiGian([dates[0], dates[1]]);
                        }}
                        format="DD/MM/YYYY"
                      />
                    </Col>
                  </Row>

                  {/* TABLE */}
                  <Table<NhatKyBienDong>
                    rowKey="id"
                    columns={cotLichSu}
                    dataSource={danhSachLichSuLocDuoc}
                    loading={loadingLichSu}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{
                      emptyText: <Empty description="Không có dữ liệu lịch sử" />
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </div>

      {/* MODAL TẠO PHIẾU */}
      <Modal
        open={dangMoModal}
        title={<span className="text-[18px] font-bold text-[#191c1e]">Tạo Phiếu Giao Dịch Kho</span>}
        onCancel={dongModal}
        onOk={xacNhanTaoPhieu}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={loadingLuuPhieu}
        okButtonProps={{
          className: tabModal === 'EXPORT' ? 'bg-red-500 hover:bg-red-600 border-none' : 'bg-[#af101a] hover:!bg-[#930010] border-none'
        }}
        width={700}
      >
        <Tabs
          type="card"
          className="mt-4"
          activeKey={tabModal}
          onChange={(value) => {
            setTabModal(value as 'IMPORT' | 'EXPORT');
            setBienTheDangChon(null);
            formNhap.resetFields();
            formXuat.resetFields();
          }}
          items={[
            {
              key: 'IMPORT',
              label: 'Nhập Kho',
              children: (
                <Form layout="vertical" form={formNhap} className="mt-3">
                  <Form.Item
                    label="Chọn sản phẩm"
                    name="variant_id"
                    rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                  >
                    <Select
                      size="large"
                      showSearch
                      placeholder="Tìm SKU..."
                      optionFilterProp="label"
                      onChange={xuLyChonSanPham}
                      options={danhSachKho.map((item) => ({
                        value: item.id,
                        label: `${item.sku} | ${item.productName} | Size: ${item.size || '-'} | Màu: ${item.color || '-'}`
                      }))}
                    />
                  </Form.Item>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label="Số lượng nhập"
                      name="soLuongNhap"
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                    >
                      <InputNumber min={1} size="large" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Giá vốn"
                      name="giaVon"
                      rules={[{ required: true, message: 'Nhập giá vốn' }]}
                    >
                      <InputNumber min={0} size="large" style={{ width: '100%' }} />
                    </Form.Item>
                  </div>

                  {bienTheDangChon && (
                    <Alert
                      type="info"
                      showIcon
                      className="border-[#ead0d0] bg-gray-50 text-[#191c1e]"
                      message={`Giá vốn hiện tại: ${dinhDangTien(bienTheDangChon.costPrice)}`}
                    />
                  )}
                </Form>
              )
            },
            {
              key: 'EXPORT',
              label: 'Xuất Kho (Hủy/Hao hụt)',
              children: (
                <div className="space-y-4 mt-3">
                  <Alert
                    type="warning"
                    showIcon
                    message="Xuất kho sẽ làm giảm tồn kho thực tế"
                    className="border-orange-200 bg-orange-50"
                  />

                  <Form layout="vertical" form={formXuat}>
                    <Form.Item
                      label="Chọn sản phẩm"
                      name="variant_id"
                      rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                    >
                      <Select
                        size="large"
                        showSearch
                        placeholder="Tìm SKU..."
                        optionFilterProp="label"
                        onChange={xuLyChonSanPham}
                        options={danhSachKho.map((item) => ({
                          value: item.id,
                          label: `${item.sku} | ${item.productName} | Size: ${item.size || '-'} | Màu: ${item.color || '-'}`
                        }))}
                      />
                    </Form.Item>

                    {bienTheDangChon && (
                      <Alert
                        type="error"
                        showIcon
                        className="mb-4"
                        message={`Tồn kho hiện tại: ${bienTheDangChon.stock}`}
                      />
                    )}

                    <Form.Item
                      label="Số lượng xuất"
                      name="soLuongXuat"
                      rules={[{ required: true, message: 'Nhập số lượng xuất' }]}
                    >
                      <InputNumber
                        min={1}
                        size="large"
                        max={Number(bienTheDangChon?.stock || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Form>
                </div>
              )
            }
          ]}
        />
      </Modal>

      {/* CANCEL REQUEST MODAL FROM INVENTORY */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#af101a] font-bold text-[18px]">
            <AlertTriangle size={20} />
            <span>Yêu Cầu Hủy Đơn - {bienTheDangChon?.productName}</span>
          </div>
        }
        open={activeCancelModalOpen}
        onCancel={() => setActiveCancelModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="space-y-5 mt-4">
          <Alert
            message={<span className="font-semibold text-[#af101a]">Xác nhận duyệt hủy đơn hàng</span>}
            description="Phê duyệt hủy đơn tại đây sẽ cập nhật trạng thái đơn hàng thành 'Đã hủy', tự động hoàn trả số lượng sản phẩm vào tồn kho thực tế, và ghi nhận nhật ký biến động kho 'NHẬP KHO'."
            showIcon
            className="rounded-xl border-[#ead0d0] bg-[#f1dede] text-[#5b403d]"
          />

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {cancellableOrdersForSelectedVariant.map((order) => {
              const orderItem = order.chiTietDonHang?.find(
                (item: any) => String(item.sanPhamChiTiet?.id || item.variantId) === String(bienTheDangChon?.id)
              );
              
              let parsedReason = order.cancel_reason;
              let proofImage = null;
              try {
                const parsed = JSON.parse(order.cancel_reason || '');
                parsedReason = parsed.reason || order.cancel_reason;
                proofImage = parsed.image || null;
              } catch {}

              return (
                <div key={order.id} className="border border-[#ead0d0] rounded-2xl p-4 bg-white space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#af101a] text-[15px] block">Mã đơn hàng: #{order.id}</span>
                      <span className="text-[#5b403d] text-xs">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <Tag color="orange" className="px-3 py-1 rounded-full text-xs font-semibold">Chờ duyệt hủy</Tag>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[14px] border-t border-b border-[#f1dede] py-3 text-[#191c1e]">
                    <div><span className="text-[#5b403d]">Khách hàng:</span> {order.nguoiNhan || order.khachHang?.name || '---'}</div>
                    <div><span className="text-[#5b403d]">SĐT:</span> {order.soDienThoaiNhan || '---'}</div>
                    <div><span className="text-[#5b403d]">SL đặt mua:</span> <span className="font-bold">{orderItem?.quantity || 1}</span></div>
                    <div><span className="text-[#5b403d]">Tổng tiền:</span> <span className="font-bold text-[#15803d]">{dinhDangTien(order.final_amount)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[#5b403d] text-sm font-semibold block">Lý do hủy đơn:</span>
                    <div className="bg-gray-50 border border-[#ead0d0] rounded-xl p-3 text-[#191c1e] text-[14px] italic">
                      "{parsedReason || 'Không cung cấp lý do chi tiết'}"
                    </div>
                  </div>

                  {proofImage && (
                    <div className="space-y-2">
                      <span className="text-[#5b403d] text-sm font-semibold block">Minh chứng hình ảnh:</span>
                      <div className="flex justify-start">
                        <Image
                          src={proofImage}
                          alt="Proof"
                          className="rounded-xl border border-[#ead0d0] max-h-[200px] object-contain shadow-sm bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-[#f1dede] mt-2">
                    <Button
                      type="primary"
                      loading={loadingLuuPhieu}
                      className="bg-[#af101a] hover:!bg-[#930010] rounded-xl px-5 h-[40px] font-semibold text-sm border-none shadow-sm flex items-center gap-2"
                      onClick={() => xacNhanDuyetHuyTuInventory(order.id)}
                    >
                      Duyệt hủy đơn & Hoàn kho
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
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
  Plus
} from 'lucide-react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

const { RangePicker } = DatePicker;

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
              <div className="w-[50px] h-[50px] rounded bg-gray-100 flex items-center justify-center">
                <Package2 size={18} />
              </div>
            );
          }

          return (
            <Image
              src={anh}
              width={50}
              height={50}
              className="rounded object-cover"
              preview={false}
            />
          );
        }
      },

      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 180
      },

      {
        title: 'Sản phẩm',
        dataIndex: 'productName',
        key: 'productName'
      },

      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',

        render: (v) => v || '-'
      },

      {
        title: 'Màu',
        dataIndex: 'color',
        key: 'color',

        render: (v) => v || '-'
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
              <Tag color="red">
                Hết hàng
              </Tag>
            );
          }

          if (stock <= 5) {
            return (
              <Tag color="orange">
                Sắp hết ({stock})
              </Tag>
            );
          }

          return (
            <Tag color="green">
              Còn hàng ({stock})
            </Tag>
          );
        }
      },

      {
        title: 'Giá vốn',
        dataIndex: 'costPrice',
        key: 'costPrice',

        render: (v) =>
          dinhDangTien(v)
      },

      {
        title: 'Yêu cầu huỷ đơn',
        key: 'cancelRequests',
        width: 180,
        render: (_, record) => {
          const ordersWithCancelRequest = cancelRequestedOrders.filter((order: any) =>
            order.chiTietDonHang?.some((item: any) => String(item.sanPhamChiTiet?.id || item.variantId) === String(record.id))
          );

          if (ordersWithCancelRequest.length === 0) return null;

          return (
            <Button
              type="primary"
              danger
              size="small"
              className="bg-red-500 hover:bg-red-600 text-xs rounded-lg border-none"
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

        render: (value) =>
          formatDate(value)
      },

      {
        title: 'Loại Phiếu',
        dataIndex: 'type',
        key: 'type',

        render: (type) => {
          if (type === 'IMPORT') {
            return (
              <Tag color="green">
                NHẬP KHO
              </Tag>
            );
          }

          if (
            type ===
            'EXPORT_DELETE'
          ) {
            return (
              <Tag color="red">
                XUẤT HỦY
              </Tag>
            );
          }

          return (
            <Tag color="blue">
              BÁN HÀNG
            </Tag>
          );
        }
      },

      {
        title: 'Sản phẩm',
        key: 'product',

        render: (
          _: any,
          record
        ) => (
          <div>
            <div className="font-medium">
              {
                record.productName
              }
            </div>

            <div className="text-gray-500 text-sm">
              SKU:
              {' '}
              {record.sku}
              {' | '}
              Size:
              {' '}
              {record.size || '-'}
              {' | '}
              Màu:
              {' '}
              {record.color || '-'}
            </div>
          </div>
        )
      },

      {
        title:
          'Biến Động Số Lượng',

        dataIndex: 'quantity',
        key: 'quantity',

        render: (
          quantity,
          record
        ) => {
          const isImport =
            record.type ===
            'IMPORT';

          return (
            <span
              className={`font-bold ${
                isImport
                  ? 'text-green-600'
                  : 'text-red-500'
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

        render: (
          _: any,
          record
        ) =>
          dinhDangTien(
            Number(
              record.quantity || 0
            ) *
              Number(
                record.costPrice || 0
              )
          )
      }
    ];

  return (
    <div className="p-6">
      {contextHolder}

      <Card
        className="shadow-sm border-2 border-gray-300"
        title={
          <div>
            <h1 className="text-2xl font-bold">
              Quản Lý Kho
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Quản lý tồn kho và giao dịch kho
            </p>
          </div>
        }
        extra={
          <Space>
            <Button
              onClick={
                taiTatCaDuLieu
              }
              icon={
                <RefreshCw size={16} />
              }
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={moModal}
            >
              Tạo Phiếu
            </Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',

              label:
                'Danh Sách Tồn Kho',

              children: (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card bordered>
                      <Statistic
                        title="Tổng giá trị kho"
                        value={
                          statsKho.tongGiaTriKho
                        }
                        formatter={(
                          value
                        ) =>
                          dinhDangTien(
                            Number(
                              value
                            )
                          )
                        }
                        prefix={
                          <DollarSign size={18} />
                        }
                      />
                    </Card>

                    <Card bordered>
                      <Statistic
                        title="Sắp hết hàng"
                        value={
                          statsKho.soLuongSapHet
                        }
                        prefix={
                          <AlertTriangle size={18} />
                        }
                        valueStyle={{
                          color:
                            '#ef4444'
                        }}
                      />
                    </Card>
                  </div>

                  <div className="bg-white rounded-xl border p-5">
                    <div className="mb-4">
                      <Input
                        placeholder="Tìm SKU, sản phẩm..."
                        prefix={
                          <Search size={16} />
                        }
                        value={
                          tuKhoaTimKiem
                        }
                        onChange={(
                          e
                        ) =>
                          setTuKhoaTimKiem(
                            e.target
                              .value
                          )
                        }
                        allowClear
                        className="max-w-md"
                      />
                    </div>

                    <Table<BienTheKho>
                      rowKey="id"
                      columns={
                        cotTonKho
                      }
                      dataSource={
                        danhSachLocDuoc
                      }
                      loading={
                        loadingDanhSach
                      }
                      bordered
                      scroll={{
                        x: 1200
                      }}
                      pagination={{
                        pageSize: 10
                      }}
                      locale={{
                        emptyText:
                          (
                            <Empty description="Không có dữ liệu" />
                          )
                      }}
                    />
                  </div>
                </div>
              )
            },

            {
              key: '2',

              label:
                'Lịch Sử Giao Dịch',

              children: (
                <div className="space-y-4">
                  <div className="bg-white border rounded-xl p-4">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Input
                          allowClear
                          prefix={
                            <Search size={16} />
                          }
                          placeholder="Tìm SKU / tên sản phẩm..."
                          value={
                            tuKhoaTimKiemLichSu
                          }
                          onChange={(
                            e
                          ) =>
                            setTuKhoaTimKiemLichSu(
                              e.target
                                .value
                            )
                          }
                        />
                      </Col>

                      <Col xs={24} md={6}>
                        <Select
                          value={
                            loaiGiaoDichFilter
                          }
                          onChange={
                            setLoaiGiaoDichFilter
                          }
                          style={{
                            width:
                              '100%'
                          }}
                          options={[
                            {
                              label:
                                'Tất cả giao dịch',
                              value:
                                'ALL'
                            },

                            {
                              label:
                                'Nhập kho',
                              value:
                                'IMPORT'
                            },

                            {
                              label:
                                'Xuất bán',
                              value:
                                'EXPORT_SELL'
                            },

                            {
                              label:
                                'Xuất hủy',
                              value:
                                'EXPORT_DELETE'
                            }
                          ]}
                        />
                      </Col>

                      <Col xs={24} md={10}>
                        <RangePicker
                          style={{
                            width:
                              '100%'
                          }}
                          value={
                            khoangThoiGian
                          }
                          onChange={(
                            dates
                          ) => {
                            if (
                              !dates
                            ) {
                              setKhoangThoiGian(
                                null
                              );

                              return;
                            }

                            setKhoangThoiGian(
                              [
                                dates[0],
                                dates[1]
                              ]
                            );
                          }}
                          format="DD/MM/YYYY"
                        />
                      </Col>
                    </Row>
                  </div>

                  <Table<NhatKyBienDong>
                    rowKey="id"
                    columns={
                      cotLichSu
                    }
                    dataSource={
                      danhSachLichSuLocDuoc
                    }
                    loading={
                      loadingLichSu
                    }
                    bordered
                    scroll={{
                      x: 1200
                    }}
                    pagination={{
                      pageSize: 10
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        open={dangMoModal}
        title="Tạo Phiếu Giao Dịch Kho"
        onCancel={dongModal}
        onOk={xacNhanTaoPhieu}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={
          loadingLuuPhieu
        }
        okButtonProps={{
          danger:
            tabModal ===
            'EXPORT'
        }}
        width={700}
      >
        <Tabs
          type="card"
          activeKey={tabModal}
          onChange={(value) => {
            setTabModal(
              value as
                | 'IMPORT'
                | 'EXPORT'
            );

            setBienTheDangChon(
              null
            );

            formNhap.resetFields();

            formXuat.resetFields();
          }}
          items={[
            {
              key: 'IMPORT',

              label: 'Nhập Kho',

              children: (
                <Form
                  layout="vertical"
                  form={formNhap}
                >
                  <Form.Item
                    label="Chọn sản phẩm"
                    name="variant_id"
                    rules={[
                      {
                        required: true,
                        message:
                          'Vui lòng chọn sản phẩm'
                      }
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Tìm SKU..."
                      optionFilterProp="label"
                      onChange={
                        xuLyChonSanPham
                      }
                      options={danhSachKho.map(
                        (
                          item
                        ) => ({
                          value:
                            item.id,

                          label: `${item.sku} | ${item.productName} | Size: ${item.size || '-'} | Màu: ${item.color || '-'}`
                        })
                      )}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Số lượng nhập"
                    name="soLuongNhap"
                    rules={[
                      {
                        required: true,
                        message:
                          'Nhập số lượng'
                      }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      controls
                      style={{
                        width: '100%'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Giá vốn"
                    name="giaVon"
                    rules={[
                      {
                        required: true,
                        message:
                          'Nhập giá vốn'
                      }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      controls
                      style={{
                        width: '100%'
                      }}
                    />
                  </Form.Item>

                  {bienTheDangChon && (
                    <Alert
                      type="info"
                      showIcon
                      message={`Giá vốn hiện tại: ${dinhDangTien(
                        bienTheDangChon.costPrice
                      )}`}
                    />
                  )}
                </Form>
              )
            },

            {
              key: 'EXPORT',

              label:
                'Xuất Kho (Hủy/Hao hụt)',

              children: (
                <div className="space-y-4">
                  <Alert
                    type="warning"
                    showIcon
                    message="Xuất kho sẽ làm giảm tồn kho thực tế"
                  />

                  <Form
                    layout="vertical"
                    form={formXuat}
                  >
                    <Form.Item
                      label="Chọn sản phẩm"
                      name="variant_id"
                      rules={[
                        {
                          required: true,
                          message:
                            'Vui lòng chọn sản phẩm'
                        }
                      ]}
                    >
                      <Select
                        showSearch
                        placeholder="Tìm SKU..."
                        optionFilterProp="label"
                        onChange={
                          xuLyChonSanPham
                        }
                        options={danhSachKho.map(
                          (
                            item
                          ) => ({
                            value:
                              item.id,

                            label: `${item.sku} | ${item.productName} | Size: ${item.size || '-'} | Màu: ${item.color || '-'}`
                          })
                        )}
                      />
                    </Form.Item>

                    {bienTheDangChon && (
                      <Alert
                        type="error"
                        showIcon
                        message={`Tồn kho hiện tại: ${bienTheDangChon.stock}`}
                      />
                    )}

                    <Form.Item
                      label="Số lượng xuất"
                      name="soLuongXuat"
                      rules={[
                        {
                          required: true,
                          message:
                            'Nhập số lượng xuất'
                        }
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={Number(
                          bienTheDangChon?.stock ||
                            0
                        )}
                        controls
                        style={{
                          width: '100%'
                        }}
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
          <div className="flex items-center gap-2 text-red-600 font-bold text-lg border-b border-gray-100 pb-3">
            <AlertTriangle size={20} className="text-red-500" />
            <span>Yêu Cầu Hủy Đơn Hàng - {bienTheDangChon?.productName}</span>
          </div>
        }
        open={activeCancelModalOpen}
        onCancel={() => setActiveCancelModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="space-y-6 mt-4">
          <Alert
            message="Xác nhận duyệt hủy đơn hàng"
            description="Phê duyệt hủy đơn tại đây sẽ cập nhật trạng thái đơn hàng thành 'Đã hủy', tự động hoàn trả số lượng sản phẩm vào tồn kho thực tế, và ghi nhận nhật ký biến động kho 'NHẬP KHO'."
            type="warning"
            showIcon
            className="rounded-2xl"
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
                <div key={order.id} className="border border-gray-150 rounded-2xl p-5 bg-[#fafafa] space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-red-600 text-[16px] block">Mã đơn hàng: #{order.id}</span>
                      <span className="text-gray-400 text-xs">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <Tag color="orange" className="px-3 py-1 rounded-full text-xs font-semibold">Chờ duyệt hủy</Tag>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-b border-gray-150 py-3 text-gray-600">
                    <div><strong>Khách hàng:</strong> {order.nguoiNhan || order.khachHang?.name || '---'}</div>
                    <div><strong>Số điện thoại:</strong> {order.soDienThoaiNhan || '---'}</div>
                    <div><strong>Số lượng đặt mua:</strong> <span className="font-bold text-red-500">{orderItem?.quantity || 1} sản phẩm</span></div>
                    <div><strong>Tổng tiền đơn hàng:</strong> <span className="font-bold text-green-600">{dinhDangTien(order.final_amount)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <strong className="text-gray-700 block">Lý do hủy đơn của khách hàng:</strong>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 text-gray-600 italic">
                      "{parsedReason || 'Không cung cấp lý do chi tiết'}"
                    </div>
                  </div>

                  {proofImage && (
                    <div className="space-y-2">
                      <strong className="text-gray-700 block">Minh chứng hình ảnh:</strong>
                      <div className="flex justify-start">
                        <Image
                          src={proofImage}
                          alt="Proof"
                          className="rounded-xl border border-gray-200 max-h-[250px] object-contain shadow-sm bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                    <Button
                      type="primary"
                      danger
                      loading={loadingLuuPhieu}
                      className="bg-red-500 hover:bg-red-600 rounded-xl px-5 h-[42px] font-semibold text-sm border-none shadow-sm flex items-center gap-2"
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
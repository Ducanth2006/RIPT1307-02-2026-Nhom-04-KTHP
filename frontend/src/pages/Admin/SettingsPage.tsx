import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Input,
  message,
  Tabs,
  Form,
  Modal,
  Spin,
  Card,
  Row,
  Col,
} from 'antd';

import {
  Save,
  RefreshCw,
  Mail,
  Database,
  Eye,
  Settings,
} from 'lucide-react';

import {
  layCauHinh,
  capNhatCauHinh,
  kiemTraSMTP,
  flushRedisCache,
} from '../../services/adminSettingsService';

export default function SettingsPage() {
  const [form] = Form.useForm();

  const [dangTai, setDangTai] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangTestSMTP, setDangTestSMTP] = useState(false);
  const [dangFlushCache, setDangFlushCache] = useState(false);
  const [isViewingSystemInfo, setIsViewingSystemInfo] = useState(false);

  // =========================================
  // LOAD SETTINGS
  // =========================================
  const layDuLieuCauHinh = async () => {
    try {
      setDangTai(true);
      const response = await layCauHinh();
      const cauHinh = response?.data || {};
      form.setFieldsValue(cauHinh);
    } catch (error: any) {
      console.log(error);
      message.error(
        error?.response?.data?.message || 'Không thể tải cấu hình hệ thống',
      );
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    layDuLieuCauHinh();
  }, []);

  // =========================================
  // SAVE SETTINGS
  // =========================================
  const xuLyLuuCauHinh = async () => {
    try {
      const values = await form.validateFields();
      setDangLuu(true);

      await capNhatCauHinh(values);
      message.success('Cập nhật cấu hình thành công');
      await layDuLieuCauHinh();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Cập nhật cấu hình thất bại',
      );
    } finally {
      setDangLuu(false);
    }
  };

  // =========================================
  // TEST SMTP
  // =========================================
  const xuLyKiemTraSMTP = async () => {
    try {
      setDangTestSMTP(true);
      const values = form.getFieldsValue(true);

      const response = await kiemTraSMTP({
        smtpHost: values.smtp_host,
        smtpPort: values.smtp_port,
        smtpUser: values.smtp_user,
      });

      message.success(response?.message || 'Kiểm tra SMTP thành công');
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Kiểm tra SMTP thất bại',
      );
    } finally {
      setDangTestSMTP(false);
    }
  };

  // =========================================
  // CLEAR CACHE
  // =========================================
  const xuLyFlushCache = async () => {
    try {
      setDangFlushCache(true);
      const response = await flushRedisCache();
      message.success(response?.message || 'Đã flush Redis cache thành công');
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Flush cache thất bại',
      );
    } finally {
      setDangFlushCache(false);
    }
  };

  // =========================================
  // RENDER HELPERS
  // =========================================
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6 mb-5 border-b border-[#f1dede] pb-2">
      <h4 className="font-bold text-[#af101a] uppercase text-[13px] tracking-wider">
        {title}
      </h4>
    </div>
  );

  // =========================================
  // TAB 1: THÔNG TIN CHUNG
  // =========================================
  const noiDungThongTinHeThong = (
    <div className="pb-4">
      <SectionHeader title="Thông tin liên hệ" />
      <Row gutter={[20, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="hotline"
            label="Hotline"
            rules={[{ required: true, message: 'Vui lòng nhập hotline' }]}
          >
            <Input size="large" placeholder="Nhập hotline..." />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label="Email hệ thống"
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input size="large" placeholder="Nhập email..." />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="dia_chi" label="Địa chỉ cửa hàng">
            <Input size="large" placeholder="Nhập địa chỉ..." />
          </Form.Item>
        </Col>
      </Row>

      <SectionHeader title="Cấu hình hiển thị" />
      <Row gutter={[20, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="banner_text" label="Banner thông báo">
            <Input.TextArea size="large" rows={4} placeholder="Nhập nội dung banner..." />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="thong_bao_chung" label="Thông báo chung">
            <Input.TextArea size="large" rows={4} placeholder="Nhập thông báo..." />
          </Form.Item>
        </Col>
      </Row>

      <SectionHeader title="Thông số vận hành" />
      <Row gutter={[20, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="phi_van_chuyen_mac_dinh" label="Phí vận chuyển mặc định">
            <Input size="large" placeholder="VD: 30000" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="mien_phi_van_chuyen_tu" label="Miễn phí ship từ">
            <Input size="large" placeholder="VD: 500000" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  // =========================================
  // TAB 2: KỸ THUẬT & SMTP
  // =========================================
  const noiDungKyThuat = (
    <div className="pb-4">
      <SectionHeader title="Cấu hình SMTP & Email" />
      <Row gutter={[20, 16]}>
        <Col xs={24} md={12}>
          <Form.Item name="smtp_host" label="SMTP Host">
            <Input size="large" placeholder="smtp.gmail.com" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="smtp_port" label="SMTP Port">
            <Input size="large" placeholder="587" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="smtp_user" label="SMTP User">
            <Input size="large" placeholder="Nhập SMTP User..." />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="smtp_password" label="SMTP Password">
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
        </Col>
      </Row>

      <div className="mt-2 flex flex-wrap gap-4">
        <Button
          size="large"
          icon={<Mail size={16} />}
          loading={dangTestSMTP}
          onClick={xuLyKiemTraSMTP}
        >
          Kiểm tra kết nối SMTP
        </Button>
      </div>

      <SectionHeader title="Thông tin hệ thống" />
      <p className="text-[14px] text-[#5b403d] mb-4">
        Xem cấu hình runtime hiện tại của toàn bộ hệ thống để phục vụ việc debug.
      </p>

      <Button
        size="large"
        icon={<Eye size={16} />}
        onClick={() => setIsViewingSystemInfo(true)}
      >
        Xem cấu hình JSON
      </Button>
    </div>
  );

  // =========================================
  // TAB 3: HIỆU NĂNG
  // =========================================
  const noiDungHieuNang = (
    <div className="pb-4 pt-4">
      <Card className="border border-[#e4beba] bg-white shadow-sm rounded-xl">
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#191c1e] flex items-center gap-2">
              <Database size={20} className="text-[#af101a]" />
              Quản lý Redis Cache
            </h3>
            <p className="text-[14px] text-[#5b403d] mt-2">
              Xóa cache thủ công để đồng bộ dữ liệu cấu hình hệ thống ngay lập tức tới máy chủ. Thao tác này sẽ làm mới toàn bộ bộ nhớ đệm.
            </p>
          </div>

          <Button
            danger
            type="primary"
            size="large"
            icon={<RefreshCw size={16} />}
            loading={dangFlushCache}
            onClick={xuLyFlushCache}
            className="rounded-xl font-semibold"
          >
            Flush Redis Cache
          </Button>
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: '1',
      label: <span className="font-semibold text-[15px]">Thông tin chung</span>,
      children: noiDungThongTinHeThong,
    },
    {
      key: '2',
      label: <span className="font-semibold text-[15px]">SMTP & Kỹ thuật</span>,
      children: noiDungKyThuat,
    },
    {
      key: '3',
      label: <span className="font-semibold text-[15px]">Hiệu năng & Cache</span>,
      children: noiDungHieuNang,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <Settings size={30} className="text-[#af101a]" />
            Cấu Hình Hệ Thống
          </h1>
          <p className="text-[#5b403d] mt-2">
            Quản lý các thông số vận hành, kết nối SMTP và bộ nhớ đệm cache.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Save size={18} />}
          className="bg-[#af101a] hover:!bg-[#930010] border-none font-semibold"
          loading={dangLuu}
          onClick={xuLyLuuCauHinh}
        >
          Lưu & Cập nhật
        </Button>
      </div>

      {/* CONTENT */}
      <Spin spinning={dangTai}>
        <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden p-2">
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1" items={tabItems} className="px-5 pt-2 pb-4" />
          </Form>
        </div>
      </Spin>

      {/* MODAL XEM CONFIG */}
      <Modal
        title={<span className="text-[18px] font-bold text-[#191c1e]">Thông tin cấu hình Runtime</span>}
        open={isViewingSystemInfo}
        onCancel={() => setIsViewingSystemInfo(false)}
        footer={[
          <Button key="close" size="large" onClick={() => setIsViewingSystemInfo(false)}>
            Đóng
          </Button>,
        ]}
        width={850}
        destroyOnClose
      >
        <div className="bg-[#191c1e] text-[#a7f3d0] p-5 rounded-xl font-mono text-[13px] overflow-auto max-h-[60vh] mt-4 shadow-inner">
          <pre>
            {JSON.stringify(form.getFieldsValue(true), null, 2)}
          </pre>
        </div>
      </Modal>
    </div>
  );
}
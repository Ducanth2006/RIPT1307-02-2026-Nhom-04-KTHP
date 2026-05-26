import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Form, Divider, message, Avatar, Switch, Spin } from 'antd';
import { User, Shield, Save, Key, Camera, Bell } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

interface IProfileData {
  id: number;
  email: string;
  full_name: string;
  avatar: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AccountProfile() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<IProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  // 1. Lấy thông tin user từ localStorage và API khi mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        return;
      }
      
      const userObj = JSON.parse(userStr);
      const userId = userObj?.id;

      if (!userId) {
        message.error('Không tìm thấy ID người dùng.');
        return;
      }

      // Gọi API lấy profile thực tế
      const response = await axiosInstance.get(`${ip}/profile`, { params: { userId } });
      const data: IProfileData = response.data.data;
      
      setProfileData(data);
      setAvatarUrl(data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'Admin')}&background=d32f2f&color=fff`);
      
      // Đổ dữ liệu vào Form
      form.setFieldsValue({
        full_name: data.full_name,
        email: data.email
      });
    } catch (error: any) {
      console.error('Lỗi lấy profile:', error);
      message.error(error.response?.data?.message || 'Không thể tải thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. Lưu cập nhật thông tin cá nhân (Họ tên & Avatar)
  const handleSave = () => {
    form.validateFields().then(async (values) => {
      if (!profileData) return;
      try {
        setSaving(true);
        const response = await axiosInstance.put(`${ip}/profile`, {
          userId: profileData.id,
          full_name: values.full_name,
          avatar: avatarUrl
        });

        if (response.status === 200) {
          message.success('Cập nhật thông tin tài khoản thành công!');
          
          // Đồng bộ lại thông tin mới vào localStorage
          const updatedUser = {
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            full_name: values.full_name,
            avatar: avatarUrl
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Refresh lại profile
          fetchProfile();
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Gặp lỗi khi lưu thông tin.');
      } finally {
        setSaving(false);
      }
    });
  };
  
  const handleCancelPersonalInfo = () => {
    if (profileData) {
      form.setFieldsValue({
        full_name: profileData.full_name,
        email: profileData.email
      });
      setAvatarUrl(profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.full_name || 'Admin')}&background=d32f2f&color=fff`);
      message.info('Đã hủy bỏ các thay đổi');
    }
  };

  // 3. Đổi mật khẩu - ĐỒNG BỘ 100% với Client (Gọi chung API /profile/change-password)
  const handleUpdatePassword = () => {
    passwordForm.validateFields().then(async (values) => {
      if (!profileData) return;
      
      if (values.newPassword !== values.confirmPassword) {
        message.error('Mật khẩu xác nhận không trùng khớp!');
        return;
      }

      try {
        setUpdatingPassword(true);
        const response = await axiosInstance.patch(`${ip}/profile/change-password`, {
          userId: profileData.id,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });

        if (response.status === 200) {
          message.success('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.');
          passwordForm.resetFields();
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!');
      } finally {
        setUpdatingPassword(false);
      }
    }).catch(() => {
      message.warning('Vui lòng điền đầy đủ các thông tin mật khẩu!');
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Xử lý đổi Avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        setAvatarUrl(base64Url);
        message.success('Ảnh đại diện đã được chọn (Hãy bấm Lưu thay đổi để hoàn tất)');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (checked: boolean, title: string) => {
    message.info(`Đã ${checked ? 'bật' : 'tắt'} thông báo qua ${title}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Đang tải dữ liệu hồ sơ..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#191c1e]">Hồ Sơ Tài Khoản</h1>
        <p className="text-[#5b403d] mt-1 text-sm">Quản lý thông tin cá nhân và cài đặt bảo mật cho tài khoản Quản trị.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Avatar & Tabs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#d8dadc] rounded-xl p-6 text-center shadow-sm">
            <div className="relative inline-block mb-4 group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar size={96} src={avatarUrl} />
              <div className="absolute inset-0 bg-black/40 rounded-full my-auto mx-auto flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <h2 className="text-xl font-bold text-[#191c1e]">{profileData?.full_name || 'Quản trị viên'}</h2>
            <p className="text-sm text-[#5b403d] mb-4">{profileData?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e0f2fe] text-[#00799c] rounded-full text-xs font-semibold">
              <Shield size={14} /> {profileData?.role === 'Admin' ? 'Quản trị viên Hệ thống' : 'Nhân viên Cửa hàng'}
            </div>
          </div>
          
          <div className="bg-white border border-[#d8dadc] rounded-xl p-4 shadow-sm">
             <div className="space-y-1">
                <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'personal' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <User size={18} /> Thông tin cá nhân
                </div>
                 <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'security' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('security')}
                 >
                  <Key size={18} /> Bảo mật & Mật khẩu
                </div>
                 <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'notifications' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('notifications')}
                 >
                  <Bell size={18} /> Tùy chọn thông báo
                </div>
             </div>
          </div>
        </div>

        {/* Cột phải: Form chi tiết theo Tab */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'personal' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Thông Tin Cá Nhân</h3>
              <Form form={form} layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item 
                    label="Họ và Tên" 
                    name="full_name" 
                    rules={[{ required: true, message: 'Vui lòng nhập đầy đủ Họ và Tên!' }]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item label="Địa chỉ Email" name="email">
                    <Input size="large" type="email" disabled />
                  </Form.Item>
                </div>
                <Divider className="my-4" />
                <div className="flex justify-end gap-3">
                   <Button onClick={handleCancelPersonalInfo}>Hủy</Button>
                   <Button 
                     type="primary" 
                     className="bg-[#00799c] hover:bg-[#005f7b]" 
                     onClick={handleSave} 
                     loading={saving}
                     icon={<Save size={16} />}
                   >
                     Lưu Thay Đổi
                   </Button>
                </div>
              </Form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Đổi Mật Khẩu</h3>
              <Form form={passwordForm} layout="vertical">
                <Form.Item 
                  label="Mật khẩu hiện tại" 
                  name="currentPassword"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                >
                  <Input.Password size="large" />
                </Form.Item>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item 
                    label="Mật khẩu mới" 
                    name="newPassword"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                      { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự!' }
                    ]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>
                  <Form.Item 
                    label="Xác nhận mật khẩu mới" 
                    name="confirmPassword"
                    rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới!' }]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>
                </div>
               
                <div className="flex justify-end gap-3 mt-2">
                   <Button onClick={() => { passwordForm.resetFields(); message.info('Đã hủy thay đổi mật khẩu'); }}>Hủy</Button>
                   <Button 
                     type="primary" 
                     className="bg-[#191c1e] hover:bg-[#333]" 
                     onClick={handleUpdatePassword}
                     loading={updatingPassword}
                   >
                     Cập Nhật Mật Khẩu
                   </Button>
                </div>
              </Form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Tùy Chọn Thông Báo</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-[#e4beba] rounded-lg bg-[#fff8f7]">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Thông báo qua Email</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Nhận các email thống kê hàng ngày và cảnh báo hệ thống.</p>
                  </div>
                  <Switch defaultChecked onChange={(c) => handleNotificationToggle(c, 'Email')} />
                </div>

                <div className="flex items-center justify-between p-4 border border-[#d8dadc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Thông báo đẩy trực tiếp (Push Notification)</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Nhận thông báo ngay lập tức khi có khách đặt đơn hàng mới.</p>
                  </div>
                  <Switch defaultChecked onChange={(c) => handleNotificationToggle(c, 'Thông báo Đẩy')} />
                </div>

                <div className="flex items-center justify-between p-4 border border-[#d8dadc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Thông báo Bảo mật</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Cảnh báo khi phát hiện đăng nhập bất thường hoặc đổi mật khẩu.</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Button, Input, Form, Divider, message, Avatar, Switch } from 'antd';
import { User, Shield, Save, Key, Camera, Bell } from 'lucide-react';

export default function AccountProfile() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff');

  const handleSave = () => {
    message.success('Account profile updated successfully');
  };
  
  const handleCancelPersonalInfo = () => {
    form.resetFields();
    message.info('Changes discarded');
  };

  const handleUpdatePassword = () => {
    const values = passwordForm.getFieldsValue();
    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
      message.error('Please fill in all password fields');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }
    message.success('Password updated successfully');
    passwordForm.resetFields();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app we'd upload the file here
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      message.success('Profile picture updated');
    }
  };

  const handleNotificationToggle = (checked: boolean, title: string) => {
    message.info(`${title} notifications ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#191c1e]">Account Profile</h1>
        <p className="text-[#5b403d] mt-1 text-sm">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <h2 className="text-xl font-bold text-[#191c1e]">Admin User</h2>
            <p className="text-sm text-[#5b403d] mb-4">admin@hoopmaster.com</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e0f2fe] text-[#00799c] rounded-full text-xs font-semibold">
              <Shield size={14} /> System Administrator
            </div>
          </div>
          
          <div className="bg-white border border-[#d8dadc] rounded-xl p-4 shadow-sm">
             <div className="space-y-1">
                <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'personal' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <User size={18} /> Personal Info
                </div>
                 <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'security' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('security')}
                 >
                  <Key size={18} /> Security
                </div>
                 <div 
                  className={`flex items-center gap-3 p-3 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'notifications' ? 'bg-[#f0f8ff] text-[#00799c]' : 'text-[#5b403d] hover:bg-[#f7f9fb]'}`}
                  onClick={() => setActiveTab('notifications')}
                 >
                  <Bell size={18} /> Notification Preferences
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'personal' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Personal Information</h3>
              <Form form={form} layout="vertical" initialValues={{ firstName: 'Admin', lastName: 'User', email: 'admin@hoopmaster.com', phone: '+1 (555) 123-4567' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item label="First Name" name="firstName">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item label="Last Name" name="lastName">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item label="Email Address" name="email">
                    <Input size="large" type="email" />
                  </Form.Item>
                  <Form.Item label="Phone Number" name="phone">
                    <Input size="large" />
                  </Form.Item>
                </div>
                <Divider className="my-4" />
                <div className="flex justify-end gap-3">
                   <Button onClick={handleCancelPersonalInfo}>Cancel</Button>
                   <Button type="primary" className="bg-[#00799c] hover:bg-[#005f7b]" onClick={handleSave} icon={<Save size={16} />}>
                     Save Changes
                   </Button>
                </div>
              </Form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Change Password</h3>
              <Form form={passwordForm} layout="vertical">
                <Form.Item label="Current Password" name="currentPassword">
                  <Input.Password size="large" />
                </Form.Item>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item label="New Password" name="newPassword">
                    <Input.Password size="large" />
                  </Form.Item>
                  <Form.Item label="Confirm New Password" name="confirmPassword">
                    <Input.Password size="large" />
                  </Form.Item>
                </div>
               
                <div className="flex justify-end gap-3 mt-2">
                   <Button onClick={() => { passwordForm.resetFields(); message.info('Changes discarded'); }}>Cancel</Button>
                   <Button type="primary" className="bg-[#191c1e] hover:bg-[#333]" onClick={handleUpdatePassword}>
                     Update Password
                   </Button>
                </div>
              </Form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-[#d8dadc] rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#191c1e] mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-[#e4beba] rounded-lg bg-[#fff8f7]">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Email Notifications</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Receive daily summaries and critical alerts via email.</p>
                  </div>
                  <Switch defaultChecked onChange={(c) => handleNotificationToggle(c, 'Email')} />
                </div>

                <div className="flex items-center justify-between p-4 border border-[#d8dadc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Push Notifications</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Get instant alerts about new orders and messages.</p>
                  </div>
                  <Switch defaultChecked onChange={(c) => handleNotificationToggle(c, 'Push')} />
                </div>

                <div className="flex items-center justify-between p-4 border border-[#d8dadc] rounded-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c1e]">Security Alerts</h4>
                    <p className="text-xs text-[#5b403d] mt-1">Get notified about new sign-ins or password changes.</p>
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

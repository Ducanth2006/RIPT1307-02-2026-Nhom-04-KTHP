import React, { useState } from 'react';
import { Button, Input, Switch, message, Tabs, Form, Divider, Modal } from 'antd';
import { Save, Server, Shield, Globe, Lock, Code, Eye, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [isViewingSystemInfo, setIsViewingSystemInfo] = useState(false);

  const handleSave = () => {
    form.validateFields().then(values => {
      // Simulate PUT /admin/settings
      console.log('PUT /admin/settings', values);
      message.success('System settings saved and updated successfully');
      // Simulate clearing cache upon save
      message.info('Cache automatically refreshed to apply changes');
    }).catch(info => {
      console.log('Validate Failed:', info);
      message.error('Please check the input fields');
    });
  };

  const handleTestSMTP = () => {
    message.success('SMTP Connection tested successfully');
  };

  const handleClearCache = () => {
    message.success('Redis cache cleared successfully. Changes are now live.');
  };

  const generalSettingsContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Globe className="text-[#d32f2f]" size={20} /> Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="hotline" label="Hotline" initialValue="+1 (800) 555-0199">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="supportEmail" label="Support Email" initialValue="support@prosportserp.com">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="storeAddress" label="Store Address" className="md:col-span-2" initialValue="123 Sport Avenue, CA 90210">
            <Input size="large" />
          </Form.Item>
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           Display Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="bannerAds" label="Banner Ads Notice">
            <Input.TextArea rows={2} placeholder="Enter homepage banner text..." defaultValue="Winter sale - Up to 50% off on all football shoes!" />
          </Form.Item>
          <Form.Item name="generalNotification" label="General Notification">
             <Input.TextArea rows={2} placeholder="Enter general notice..." defaultValue="Free shipping for orders over $100." />
          </Form.Item>
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           Operational Parameters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="defaultShippingFee" label="Default Shipping Fee (USD)" initialValue="15.00">
             <Input prefix={<span className="text-[#5b403d] font-mono">$</span>} size="large" className="font-mono" />
          </Form.Item>
          <Form.Item name="freeShippingThreshold" label="Free Shipping Threshold (USD)" initialValue="100.00">
             <Input prefix={<span className="text-[#5b403d] font-mono">$</span>} size="large" className="font-mono" />
          </Form.Item>
        </div>
      </div>
    </div>
  );

  const technicalSettingsContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Server className="text-[#d32f2f]" size={20} /> Connection Management (SMTP)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="smtpHost" label="SMTP Host" initialValue="smtp.sendgrid.net">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="smtpPort" label="SMTP Port" initialValue="587">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="smtpUser" label="SMTP Username" initialValue="apikey">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="smtpPassword" label="SMTP Password" initialValue="SG.example_key_here">
            <Input.Password size="large" className="font-mono" />
          </Form.Item>
        </div>
        <Button onClick={handleTestSMTP}>Test SMTP Connection</Button>
      </div>

      <Divider />

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Lock className="text-[#d32f2f]" size={20} /> Key Management
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Form.Item name="paymentGatewayKey" label="Payment Gateway Private Key (Stripe/PayPal)" initialValue="sk_live_1234567890abcdef">
            <Input.Password size="large" className="font-mono" />
          </Form.Item>
          <Form.Item name="thirdPartyApiKey" label="Third-Party API Key (e.g., Maps, Analytics)" initialValue="AIzaSyA_abcdef1234567890">
            <Input.Password size="large" className="font-mono" />
          </Form.Item>
        </div>
      </div>

      <Divider />
      
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Code className="text-[#d32f2f]" size={20} /> Initialization Information
        </h3>
        <p className="text-sm text-gray-500 mb-4">View the full executing configuration of the system.</p>
        <Button icon={<Eye size={16} />} onClick={() => setIsViewingSystemInfo(true)}>
          View Full Execution Configuration
        </Button>
      </div>
    </div>
  );

  const performanceContent = (
    <div className="space-y-6">
       <div className="bg-[#eceef0] p-6 rounded-lg border border-[#d8dadc]">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <RefreshCw className="text-[#d32f2f]" size={20} /> Synchronization & Cache Management
          </h3>
          <p className="text-sm text-[#5b403d] mb-4">
            The system automatically updates the Redis cache whenever settings are saved. However, you can manually clear the cache here to resolve displaying issues.
          </p>
          <div className="flex gap-4">
             <Button type="primary" size="large" className="bg-[#d32f2f] hover:bg-[#ba1a20]" onClick={handleClearCache}>
                Flush Redis Cache
             </Button>
          </div>
       </div>
    </div>
  );

  const tabItems = [
    {
      key: '1',
      label: 'General Settings',
      children: generalSettingsContent,
    },
    {
      key: '2',
      label: 'Technical & Security',
      children: technicalSettingsContent,
    },
    {
      key: '3',
      label: 'Performance Management',
      children: performanceContent,
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e] mb-1">System Settings</h1>
          <p className="text-sm text-[#5b403d]">Manage global configuration, security keys, and cache.</p>
        </div>
        <div className="flex shadow-sm rounded-lg">
          <Button 
            type="primary" 
            size="large"
            className="bg-[#d32f2f] hover:bg-[#ba1a20] flex items-center gap-2 font-semibold" 
            onClick={handleSave}
          >
            <Save size={18} /> Save & Update System
          </Button>
        </div>
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm p-2">
         <Form form={form} layout="vertical">
            <Tabs 
               defaultActiveKey="1" 
               items={tabItems} 
               className="px-4 py-2"
               tabBarStyle={{ color: '#5b403d' }}
            />
         </Form>
      </div>

      <Modal
        title="Full Executing Configuration"
        open={isViewingSystemInfo}
        onCancel={() => setIsViewingSystemInfo(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewingSystemInfo(false)}>Close</Button>
        ]}
        width={800}
      >
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[60vh]">
          <pre>
{`{
  "system": {
    "version": "v2.5.0",
    "environment": "PRODUCTION",
    "node_env": "production"
  },
  "contact": {
    "hotline": "+1 (800) 555-0199",
    "supportEmail": "support@prosportserp.com",
    "address": "123 Sport Avenue, CA 90210"
  },
  "display": {
    "bannerAds": "Winter sale - Up to 50% off on all football shoes!",
    "generalNotice": "Free shipping for orders over $100."
  },
  "operations": {
    "defaultShippingFee": 15.00,
    "freeShippingThreshold": 100.00
  },
  "smtp": {
    "host": "smtp.sendgrid.net",
    "port": 587,
    "user": "apikey",
    "password": "SG.example_key_here..."
  },
  "keys": {
    "paymentGateway": "sk_live_1234567890abcdef...",
    "thirdPartyApi": "AIzaSyA_abcdef1234567890..."
  },
  "cache": {
    "provider": "redis",
    "status": "connected",
    "lastRefresh": "${new Date().toISOString()}"
  }
}`}
          </pre>
        </div>
      </Modal>
    </div>
  );
}

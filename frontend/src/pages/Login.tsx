import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox } from 'antd';
import { Mail, Lock, Activity } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[440px]">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#d32f2f]/10 mb-2 text-[#d32f2f]">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#191c1e]">ProSports ERP</h1>
          <p className="text-[#5b403d] mt-1 text-sm">Admin Console Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm p-6 md:p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#191c1e]">Email Address</label>
              <Input 
                prefix={<Mail size={18} className="text-[#8f6f6c] mr-2" />} 
                placeholder="admin@prosports.com" 
                size="large"
                className="bg-white border-[#d8dadc] focus:border-[#d32f2f] hover:border-[#d32f2f]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#191c1e]">Password</label>
              <Input.Password 
                prefix={<Lock size={18} className="text-[#8f6f6c] mr-2" />} 
                placeholder="••••••••" 
                size="large"
                className="bg-white border-[#d8dadc] focus:border-[#d32f2f] hover:border-[#d32f2f]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Checkbox className="text-[#5b403d] text-sm">Remember Me</Checkbox>
              <a onClick={() => navigate('/forgot-password')} className="text-sm font-medium text-[#d32f2f] hover:text-[#930010] cursor-pointer">Forgot Password?</a>
            </div>

            <div className="pt-2">
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block 
                className="bg-[#d32f2f] hover:bg-[#930010]"
              >
                Login
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#5b403d]">
            © 2024 ProSports ERP. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}

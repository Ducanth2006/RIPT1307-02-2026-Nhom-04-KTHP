import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { Mail, Lock, Activity, User } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Registration successful! Please log in.');
    navigate('/login');
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
          <p className="text-[#5b403d] mt-1 text-sm">Create an Admin Account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm p-6 md:p-8">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#191c1e]">Full Name</label>
              <Input 
                prefix={<User size={18} className="text-[#8f6f6c] mr-2" />} 
                placeholder="John Doe" 
                size="large"
                required
                className="bg-white border-[#d8dadc] focus:border-[#d32f2f] hover:border-[#d32f2f]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#191c1e]">Email Address</label>
              <Input 
                type="email"
                prefix={<Mail size={18} className="text-[#8f6f6c] mr-2" />} 
                placeholder="admin@prosports.com" 
                size="large"
                required
                className="bg-white border-[#d8dadc] focus:border-[#d32f2f] hover:border-[#d32f2f]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#191c1e]">Password</label>
              <Input.Password 
                prefix={<Lock size={18} className="text-[#8f6f6c] mr-2" />} 
                placeholder="••••••••" 
                size="large"
                required
                className="bg-white border-[#d8dadc] focus:border-[#d32f2f] hover:border-[#d32f2f]"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block 
                className="bg-[#d32f2f] hover:bg-[#930010]"
              >
                Create Account
              </Button>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-[#5b403d]">
                Already have an account?{' '}
                <a onClick={() => navigate('/login')} className="font-medium text-[#d32f2f] hover:text-[#930010] cursor-pointer">
                  Log in
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

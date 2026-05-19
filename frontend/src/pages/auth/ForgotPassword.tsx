// import React, { useState } from 'react';
// import { Form, Input, Button, message } from 'antd';
// import { Mail, ArrowLeft } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// export default function ForgotPassword() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);

//   const onFinish = (values: { email: string }) => {
//     setLoading(true);
//     // Simulate API call
//     setTimeout(() => {
//       message.success(`Password reset link sent to ${values.email}`);
//       setLoading(false);
//       navigate('/login');
//     }, 1500);
//   };

//   return (
//     <div className="min-h-screen bg-[#eceef0] flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-xl shadow-sm border border-[#d8dadc] w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="flex justify-center mb-4">
//             <div className="w-12 h-12 bg-[#00799c] rounded-lg flex items-center justify-center">
//               <span className="text-white font-bold text-xl">A</span>
//             </div>
//           </div>
//           <h1 className="text-2xl font-bold text-[#191c1e]">Reset your password</h1>
//           <p className="text-[#5b403d] mt-2">
//             Enter your email address and we'll send you a link to reset your password.
//           </p>
//         </div>

//         <Form
//           name="forgot-password"
//           layout="vertical"
//           onFinish={onFinish}
//           size="large"
//         >
//           <Form.Item
//             name="email"
//             label={<span className="text-[#5b403d] font-medium">Email Address</span>}
//             rules={[
//               { required: true, message: 'Please input your email!' },
//               { type: 'email', message: 'Please enter a valid email!' }
//             ]}
//           >
//             <Input
//               prefix={<Mail size={18} className="text-gray-400 mr-2" />}
//               placeholder="admin@example.com"
//               className="rounded-lg"
//             />
//           </Form.Item>

//           <Form.Item className="mt-8">
//             <Button
//               type="primary"
//               htmlType="submit"
//               className="w-full bg-[#00799c] hover:bg-[#006280] h-11 rounded-lg text-base"
//               loading={loading}
//             >
//               Send Reset Link
//             </Button>
//           </Form.Item>

//           <div className="text-center">
//             <Button
//               type="link"
//               icon={<ArrowLeft size={16} />}
//               onClick={() => navigate('/login')}
//               className="text-[#5b403d] hover:text-[#00799c] flex items-center justify-center w-full gap-1"
//             >
//               Back to login
//             </Button>
//           </div>
//         </Form>
//       </div>
//     </div>
//   );
// }

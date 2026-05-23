import { useState } from "react";
import { Form, Input, Button, Divider, message } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookFilled, MailOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/Auth/apiClient";
import "./Auth.less";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });
      message.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Header */}
      <header className="auth-header">
        <div className="header-container">
          <div className="logo-section">
            <Link to="/" className="logo-link">
              ELITE PERFORMANCE
            </Link>
            <div className="divider"></div>
            <span className="page-title">Đăng ký</span>
          </div>
          <Link to="/help" className="help-link">
            Bạn cần giúp đỡ?
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="auth-main"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="form-container">
          <div className="auth-card">
            <div className="card-header">
              <h3>Đăng ký</h3>
            </div>

            <Form name="register" onFinish={onFinish} layout="vertical" size="middle" className="auth-form">
              <Form.Item name="full_name" rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập Email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block loading={loading} className="submit-btn">
                Đăng ký
              </Button>

              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#888" }}>
                Bằng việc đăng ký, bạn đã đồng ý với Elite Performance về
                <span style={{ color: "#ee4d2d" }}> Điều khoản dịch vụ</span> &
                <span style={{ color: "#ee4d2d" }}> Chính sách bảo mật</span>
              </div>

              <Divider className="social-divider">
                <span>Hoặc</span>
              </Divider>

              <div className="social-btns">
                <Button icon={<FacebookFilled style={{ color: "#1877f2" }} />}>Facebook</Button>
                <Button icon={<GoogleOutlined />}>Google</Button>
              </div>

              <div className="switch-auth">
                Bạn đã có tài khoản?{" "}
                <Link to="/login" className="link">
                  Đăng nhập
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="footer-content">
          <div className="footer-links">
            <span>CHÍNH SÁCH BẢO MẬT</span>
            <span>QUY CHẾ HOẠT ĐỘNG</span>
            <span>CHÍNH SÁCH VẬN CHUYỂN</span>
            <span>CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN</span>
          </div>
          <div className="copyright">© 2026 Elite Performance. Tất cả các quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
};

export default Register;

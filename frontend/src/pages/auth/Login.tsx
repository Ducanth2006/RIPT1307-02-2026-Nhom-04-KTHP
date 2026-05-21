import { useState } from "react";
import { Form, Input, Button, Divider, message } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookFilled } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/Auth/apiClient";
import "./Auth.less";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const { data: res } = await login({
        email: values.email,
        password: values.password,
      });
      localStorage.setItem("accessToken", res.token);
      localStorage.setItem("user", JSON.stringify(res.data));
      message.success("Đăng nhập thành công!");

      // Redirect based on role if needed, or default to Home
      if (res.data.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
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
            <span className="page-title">Đăng nhập</span>
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
            "url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="form-container">
          <div className="auth-card">
            <div className="card-header">
              <h3>Đăng nhập</h3>
            </div>

            <Form name="login" onFinish={onFinish} layout="vertical" size="middle" className="auth-form">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block loading={loading} className="submit-btn">
                Đăng nhập
              </Button>

              <div className="form-footer-links">
                <Link to="/forgot-password">Quên mật khẩu</Link>
              </div>

              <Divider className="social-divider">
                <span>Hoặc</span>
              </Divider>

              <div className="social-btns">
                <Button icon={<FacebookFilled style={{ color: "#1877f2" }} />}>Facebook</Button>
                <Button icon={<GoogleOutlined />}>Google</Button>
              </div>

              <div className="switch-auth">
                Bạn mới biết đến Elite Performance?{" "}
                <Link to="/register" className="link">
                  Đăng ký
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

export default Login;

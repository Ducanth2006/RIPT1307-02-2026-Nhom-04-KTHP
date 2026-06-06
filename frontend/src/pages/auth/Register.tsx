import { useState, useEffect } from "react";
import { Form, Input, Button, Divider, message } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookFilled, MailOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { register, loginGoogle, loginFacebook } from "../../services/client/auth/apiClient";
import "./Auth.less";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Khởi tạo Facebook SDK
  useEffect(() => {
    const win = window as any;
    if (!win.FB) {
      win.fbAsyncInit = function () {
        win.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || "35843458815300651",
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
      };

      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/vi_VN/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, []);

  const handleFacebookLogin = () => {
    const win = window as any;
    if (!win.FB) {
      message.error("SDK Facebook đang được tải. Vui lòng thử lại sau giây lát.");
      return;
    }

    win.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const fbAccessToken = response.authResponse.accessToken;
          setLoading(true);
          loginFacebook(fbAccessToken)
            .then(({ data: res }) => {
              localStorage.setItem("accessToken", res.token);
              localStorage.setItem("user", JSON.stringify(res.data));
              message.success("Đăng nhập bằng Facebook thành công!");
              if (res.data.role === "Admin" || res.data.role === "Staff") {
                navigate("/admin/dashboard");
              } else {
                navigate("/");
              }
            })
            .catch((error) => {
              const err = error as { response?: { data?: { message?: string } } };
              message.error(err.response?.data?.message || "Đăng nhập Facebook thất bại.");
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          message.error("Đăng nhập bằng Facebook không thành công hoặc bị hủy.");
        }
      },
      { scope: "public_profile,email" }
    );
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: { access_token: string }) => {
      setLoading(true);
      try {
        const { data: res } = await loginGoogle(tokenResponse.access_token);
        localStorage.setItem("accessToken", res.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        message.success("Đăng nhập bằng Google thành công!");
        if (res.data.role === "Admin" || res.data.role === "Staff") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || "Đăng nhập Google thất bại.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => message.error("Đăng nhập bằng Google không thành công."),
  });

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
              SportStride
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
          backgroundImage: "url('/login.png')",
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
                Bằng việc đăng ký, bạn đã đồng ý với SportStride về
                <span style={{ color: "#af101a" }}> Điều khoản dịch vụ</span> &
                <span style={{ color: "#af101a" }}> Chính sách bảo mật</span>
              </div>

              <Divider className="social-divider">
                <span>Hoặc</span>
              </Divider>

              <div className="social-btns">
                <Button icon={<FacebookFilled style={{ color: "#1877f2" }} />} onClick={handleFacebookLogin}>Facebook</Button>
                <Button icon={<GoogleOutlined />} onClick={() => handleGoogleLogin()}>Google</Button>
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
          <div className="copyright">© 2026 SportStride. Tất cả các quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
};

export default Register;

import supabaseClient from "../config/supabase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "prosports_secret_key";

// ── REGISTER ──────────────────────────────────────────────────────────────────
export const registerUser = async (payload: { email: string; password: string; full_name?: string }) => {
  const { email, password, full_name } = payload;

  // Kiểm tra email đã tồn tại chưa
  const { data: existing } = await supabaseClient
    .from("users")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) throw new Error("Email này đã được sử dụng.");

  // Hash mật khẩu
  const password_hash = await bcrypt.hash(password, 10);

  // Tạo user mới (role mặc định là 'Client', status 'Active')
  const { data: newUser, error } = await supabaseClient
    .from("users")
    .insert({
      email,
      password_hash,
      full_name: full_name || null,
      role: "Client",
      status: "Active",
      provider: "local",
    })
    .select("id, email, full_name, avatar, role, status, created_at")
    .single();

  if (error) throw new Error("Lỗi khi tạo tài khoản: " + error.message);

  // Tạo JWT
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });

  return { user: newUser, token };
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  // Tìm user theo email
  const { data: user, error } = await supabaseClient
    .from("users")
    .select("id, email, password_hash, full_name, avatar, role, status, provider, created_at")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !user) throw new Error("Email hoặc mật khẩu không đúng.");

  // Kiểm tra tài khoản có bị khoá không
  const s = user.status ? user.status.toLowerCase() : "";
  if (s === "banned" || s === "locked" || s === "inactive") {
    throw new Error("Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ với Quản trị viên.");
  }

  // Kiểm tra tài khoản đăng nhập bằng provider khác (Google, ...)
  if (user.provider && user.provider.toLowerCase() !== "local") {
    throw new Error(`Tài khoản này đăng nhập bằng ${user.provider}. Vui lòng dùng phương thức đó.`);
  }

  // So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error("Email hoặc mật khẩu không đúng.");

  // Tạo JWT
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

  // Trả về user (không có password_hash)
  const { password_hash, ...safeUser } = user;

  return { user: safeUser, token };
};

// ── BLACKLIST TOKEN STORE (In-memory) ────────────────────────────────────────
const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logoutUser = async (token: string) => {
  if (!token) throw new Error("Không tìm thấy token.");
  blacklistToken(token);
  return true;
};

// ── GOOGLE LOGIN ──────────────────────────────────────────────────────────────
export const loginGoogleUser = async (token: string) => {
  if (!token) throw new Error("Vui lòng cung cấp token Google.");

  const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
  if (!response.ok) throw new Error("Xác thực Google thất bại.");

  const { email, name, picture } = await response.json() as any;
  if (!email) throw new Error("Không lấy được email từ Google.");

  let { data: user } = await supabaseClient
    .from("users")
    .select("id, email, full_name, avatar, role, status, created_at")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    const { data: newUser, error } = await supabaseClient
      .from("users")
      .insert({
        email,
        password_hash: "oauth_blocked",
        full_name: name || null,
        avatar: picture || null,
        role: "Client",
        status: "Active",
        provider: "google"
      })
      .select("id, email, full_name, avatar, role, status, created_at")
      .single();
    if (error) throw new Error("Lỗi tạo tài khoản Google: " + error.message);
    user = newUser;
  } else {
    const s = (user.status || "").toLowerCase();
    if (["banned", "locked", "inactive"].includes(s)) {
      throw new Error("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
    }
  }

  const appToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { user, token: appToken };
};

// ── FACEBOOK LOGIN ─────────────────────────────────────────────────────────────
export const loginFacebookUser = async (token: string) => {
  if (!token) throw new Error("Vui lòng cung cấp token Facebook.");

  const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=${token}`);
  if (!response.ok) throw new Error("Xác thực Facebook thất bại.");

  const fbData = await response.json() as any;
  const { email, name, picture } = fbData;
  
  // Facebook đôi khi không trả về email nếu tài khoản đăng ký bằng số điện thoại hoặc không public email.
  // Trong trường hợp đó, dùng id@facebook.com để đảm bảo email là duy nhất và không bị NULL.
  const userEmail = email || `${fbData.id}@facebook.com`;
  const avatarUrl = picture?.data?.url || null;

  let { data: user } = await supabaseClient
    .from("users")
    .select("id, email, full_name, avatar, role, status, created_at")
    .eq("email", userEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    const { data: newUser, error } = await supabaseClient
      .from("users")
      .insert({
        email: userEmail,
        password_hash: "oauth_blocked",
        full_name: name || null,
        avatar: avatarUrl,
        role: "Client",
        status: "Active",
        provider: "facebook"
      })
      .select("id, email, full_name, avatar, role, status, created_at")
      .single();
    if (error) throw new Error("Lỗi tạo tài khoản Facebook: " + error.message);
    user = newUser;
  } else {
    const s = (user.status || "").toLowerCase();
    if (["banned", "locked", "inactive"].includes(s)) {
      throw new Error("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
    }
  }

  const appToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { user, token: appToken };
};


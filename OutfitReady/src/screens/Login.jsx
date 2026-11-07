import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Sparkles, Lock, User, ArrowLeft } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอก Username และ Password ให้ครบถ้วน");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Username หรือ Password ไม่ถูกต้อง");
      }

      // บันทึกข้อมูล user ลงใน localStorage เพื่อใช้ยืนยันตัวตนในระบบ
      localStorage.setItem("user", JSON.stringify(data.user));

      alert(`ยินดีต้อนรับคุณ ${data.user.username}!`);
      navigate("/wardrobe");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* ปุ่มย้อนกลับไปหน้า Home */}
        <button className="back-link" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> ย้อนกลับ
        </button>

        <span className="eyebrow">
          <Sparkles size={14} /> Welcome Back
        </span>

        <h1>เข้าสู่ระบบ</h1>
        <p className="subtitle">ลงชื่อเข้าใช้เพื่อจัดการและแมตช์ชุดในตู้เสื้อผ้าของคุณ</p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            ชื่อผู้ใช้ (Username)
            <div className="input-with-icon">
              <User size={18} className="field-icon" />
              <input
                type="text"
                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            รหัสผ่าน (Password)
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? (
              "กำลังเข้าสู่ระบบ..."
            ) : (
              <>
                <LogIn size={18} /> เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>ยังไม่มีบัญชีผู้ใช้? </span>
          <Link to="/register" className="switch-auth-link">
            สมัครสมาชิกที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
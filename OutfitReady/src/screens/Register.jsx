import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Sparkles, Lock, User, ArrowLeft } from "lucide-react";
import "./Resigter.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }

      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      navigate("/login");
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
          <Sparkles size={14} /> Join OutfitReady
        </span>

        <h1>สมัครสมาชิก</h1>
        <p className="subtitle">สร้างบัญชีผู้ใช้เพื่อเริ่มจัดการตู้เสื้อผ้าของคุณ</p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
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
                placeholder="สร้างรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            ยืนยันรหัสผ่าน (Confirm Password)
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? (
              "กำลังบันทึก..."
            ) : (
              <>
                <UserPlus size={18} /> สมัครสมาชิก
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>มีบัญชีผู้ใช้อยู่แล้ว? </span>
          <Link to="/login" className="switch-auth-link">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
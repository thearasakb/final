import { useNavigate } from "react-router-dom";
import { Sparkles, LogIn, UserPlus, Shirt } from "lucide-react";
import "./Home.css"; // (สร้างไฟล์ CSS สำหรับจัดสไตล์หน้า Home ตามชอบ)

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-card">
        <div className="brand-logo">
          <Shirt size={48} className="logo-icon" />
          <h1>OutfitReady</h1>
        </div>
        <p className="hero-subtitle">
          จัดการตู้เสื้อผ้าอัจฉริยะ ให้ AI ช่วยมิกซ์แอนด์แมตช์ชุดในวันสำคัญของคุณ
        </p>

        <div className="home-actions">
          <button className="primary-btn" onClick={() => navigate("/login")}>
            <LogIn size={18} />
            เข้าสู่ระบบ
          </button>

          <button className="secondary-btn" onClick={() => navigate("/register")}>
            <UserPlus size={18} />
            สมัครสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
}
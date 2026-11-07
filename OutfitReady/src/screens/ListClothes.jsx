import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Send, MapPin, Shuffle, Layers, LogOut, User as UserIcon } from "lucide-react";
import { getAllClothes, getAIOutfitRecommendation } from "../api/outfitAPI";
import "./ListClothes.css";

export default function ListClothes() {
  const [clothes, setClothes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const navigate = useNavigate();

  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "shirt", label: "เสื้อ" },
    { id: "pants", label: "กางเกง / กระโปรง" },
    { id: "dress", label: "ชุดเดรส" },
    { id: "shoes", label: "รองเท้า" },
    { id: "accessory", label: "เครื่องประดับ" },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      loadClothes(parsedUser.id);
    } else {
      loadClothes(null);
    }
  }, []);

  async function loadClothes(userId) {
    setIsLoading(true);
    try {
      const data = await getAllClothes();
      if (userId) {
        setClothes(data.filter((item) => Number(item.user_id) === Number(userId)));
      } else {
        setClothes(data);
      }
    } catch (error) {
      console.error("Error loading clothes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อยแล้ว");
    navigate("/");
  };

  const filteredClothes = selectedCategory === "all"
    ? clothes
    : clothes.filter((item) => item.category === selectedCategory);

  const handleQuickRecommend = async () => {
    if (!currentUser?.id) {
      alert("กรุณาเข้าสู่ระบบก่อนใช้ AI คำนวณชุด");
      return;
    }

    const userWardrobe = clothes.filter(
      (item) => Number(item.user_id) === Number(currentUser.id)
    );

    if (userWardrobe.length === 0) {
      alert("ยังไม่มีเสื้อผ้าในตู้ของคุณเลยครับ เพิ่มเสื้อผ้าก่อนนะ!");
      return;
    }

    try {
      setIsAnalyzing(true);
      const recommendation = await getAIOutfitRecommendation({
        userId: currentUser.id,
        prompt: "วันนี้อยากใส่ชุดสบายๆ สบายมากๆ",
        clothes: userWardrobe,
      });
      setAiRecommendation(recommendation);
      setDestination("วันนี้อยากใส่ชุดสบายๆ สบายมากๆ");
      navigate("/recommendation", {
        state: {
          recommendation,
          userId: currentUser.id,
          clothes: userWardrobe,
        },
      });
    } catch (error) {
      alert(error.message || "เกิดข้อผิดพลาดในการคำนวณชุดจาก AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      alert("กรุณากรอกงานหรือสถานที่ที่จะไปด้วยครับ");
      return;
    }

    if (!currentUser?.id) {
      alert("กรุณาเข้าสู่ระบบก่อนใช้ AI คำนวณชุด");
      navigate("/login");
      return;
    }

    const userWardrobe = clothes.filter(
      (item) => Number(item.user_id) === Number(currentUser.id)
    );

    if (userWardrobe.length === 0) {
      alert("ยังไม่มีเสื้อผ้าในตู้ของคุณเลยครับ เพิ่มเสื้อผ้าก่อนนะ!");
      return;
    }

    try {
      setIsAnalyzing(true);
      const recommendation = await getAIOutfitRecommendation({
        userId: currentUser.id,
        prompt: destination,
        clothes: userWardrobe,
      });
      setAiRecommendation(recommendation);
      navigate("/recommendation", {
        state: {
          recommendation,
          userId: currentUser.id,
          clothes: userWardrobe,
        },
      });
    } catch (error) {
      alert(error.message || "เกิดข้อผิดพลาดในการคำนวณชุดจาก AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="wardrobe-container">
      <header className="wardrobe-header">
        <div className="brand-title">
          <h1>OutfitReady</h1>
          <p className="sub-title">ตู้เสื้อผ้าอัจฉริยะของคุณ</p>
        </div>

        <div className="header-actions">
          {currentUser && (
            <div className="user-badge">
              <UserIcon size={16} className="user-icon" />
              <span>{currentUser.username} (ID: {currentUser.id})</span>
              <button
                onClick={handleLogout}
                className="logout-btn"
                title="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <button className="quick-recommend-btn" onClick={handleQuickRecommend}>
            <Shuffle size={16} />
            แนะนำแบบรวดเร็ว
          </button>

          <button className="add-btn" onClick={() => navigate("/upload")}>
            <Plus size={18} />
            เพิ่มเสื้อผ้า
          </button>
        </div>
      </header>

      <section className="prompt-section">
        <form className="prompt-form" onSubmit={handleSubmitPrompt}>
          <div className="input-wrapper">
            <MapPin size={20} className="input-icon" />
            <input
              type="text"
              placeholder="วันนี้จะไปไหน? (เช่น ไปสัมภาษณ์งาน, ไปเที่ยวทะเล, งานแต่งงาน)..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isAnalyzing}>
            <Sparkles size={18} />
            {isAnalyzing ? "กำลังวิเคราะห์..." : "คำนวณชุด"}
            <Send size={16} />
          </button>
        </form>

      </section>

      <section className="category-section">
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <div className="section-title">
        <h2>
          <Layers size={20} />
          {currentUser ? `ตู้เสื้อผ้าของ ${currentUser.username}` : "เสื้อผ้าของคุณ"}
          <span className="count-badge">({filteredClothes.length})</span>
        </h2>
      </div>

      {isLoading ? (
        <p className="status-text">กำลังโหลดตู้เสื้อผ้า...</p>
      ) : filteredClothes.length === 0 ? (
        <p className="status-text">
          {selectedCategory === "all"
            ? "ยังไม่มีรายการเสื้อผ้าในตู้ของคุณ"
            : "ไม่มีเสื้อผ้าในหมวดหมู่นี้"}
        </p>
      ) : (
        <div className="image-grid">
          {filteredClothes.map((item) => (
            <div
              key={item.id}
              className="image-card"
              onClick={() => navigate(`/details/${item.id}`)}
              title="คลิกเพื่อดูรายละเอียด"
            >
              <img
                src={`http://localhost:3000/uploads/${item.image_url}`}
                alt={item.name || "เสื้อผ้า"}
                className="clothing-image"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
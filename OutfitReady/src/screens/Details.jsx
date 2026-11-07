import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Calendar, Pencil, Trash2, FileText, User } from "lucide-react";
import { getClothesById, deleteClothes } from "../api/outfitAPI";
import "./Details.css";

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // สมุดจับคู่ชื่อหมวดหมู่ภาษาอังกฤษ -> ภาษาไทย
  const categoryMap = {
    shirt: "เสื้อ (Shirt / Top)",
    pants: "กางเกง / กระโปรง (Pants / Bottom)",
    dress: "ชุดเดรส (Dress)",
    shoes: "รองเท้า (Shoes)",
    accessory: "เครื่องประดับ / อื่นๆ (Accessory)",
  };

  // 1) อ่านข้อมูล User และดึงรายละเอียดเสื้อผ้า
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    loadItemDetails();
  }, [id]);

  async function loadItemDetails() {
    setIsLoading(true);
    try {
      const data = await getClothesById(id);
      setItem(data);
    } catch (error) {
      console.error("Error loading clothes detail:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 2) กดลบ → ถามยืนยัน → เรียก deleteClothes → กลับหน้าตู้เสื้อผ้า
  async function handleDelete() {
    // เช็คความเป็นเจ้าของ
    if (currentUser && Number(item?.user_id) !== Number(currentUser.id)) {
      alert("คุณไม่มีสิทธิ์ลบรายการเสื้อผ้านี้");
      return;
    }

    if (
      !window.confirm(
        `คุณต้องการลบ "${item?.name || "รายการนี้"}" ออกจากตู้เสื้อผ้าใช่หรือไม่?`
      )
    ) {
      return;
    }

    try {
      await deleteClothes(id);
      alert("ลบข้อมูลเรียบร้อยแล้ว");
      navigate("/wardrobe");
    } catch (error) {
      console.error("Error deleting clothes:", error);
      alert("ไม่สามารถลบข้อมูลได้");
    }
  }

  if (isLoading) {
    return (
      <div className="details-container">
        <p className="status-text">กำลังโหลดรายละเอียดเสื้อผ้า...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="details-container">
        <button className="back-btn" onClick={() => navigate("/wardrobe")}>
          <ArrowLeft size={18} /> ย้อนกลับ
        </button>
        <div className="error-card">
          <p>ไม่พบข้อมูลเสื้อผ้าชิ้นนี้</p>
        </div>
      </div>
    );
  }

  // เช็คว่าเป็นเจ้าของเสื้อผ้าชิ้นนี้หรือไม่
  const isOwner = currentUser && Number(item.user_id) === Number(currentUser.id);

  return (
    <div className="details-container">
      {/* ปุ่มย้อนกลับ */}
      <button className="back-btn" onClick={() => navigate("/wardrobe")}>
        <ArrowLeft size={18} /> ย้อนกลับไปหน้าตู้เสื้อผ้า
      </button>

      {/* การ์ดรายละเอียดเสื้อผ้า */}
      <div className="details-card">
        {/* ฝั่งแสดงรูปภาพ */}
        <div className="details-image-wrapper">
          <img
            src={`http://localhost:3000/uploads/${item.image_url}`}
            alt={item.name || "เสื้อผ้า"}
            className="details-image"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
            }}
          />
        </div>

        {/* ฝั่งแสดงข้อมูลรายละเอียด */}
        <div className="details-info">
          <div className="info-header">
            {/* แสดงชื่อหมวดหมู่ภาษาไทย */}
            <span className="category-badge">
              <Tag size={14} />
              {categoryMap[item.category] || item.category || "ไม่ระบุหมวดหมู่"}
            </span>
            <h1 className="item-title">{item.name || "ไม่มีชื่อชุด"}</h1>
          </div>

          <div className="info-meta">
            <div className="meta-item">
              <Calendar size={16} />
              <span>
                เพิ่มเมื่อ:{" "}
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "ไม่ระบุวัน"}
              </span>
            </div>
          </div>

          {/* ส่วนแสดงคำอธิบายเพิ่มเติม */}
          <div className="info-description">
            <h3>
              <FileText size={16} /> คำอธิบายเพิ่มเติม
            </h3>
            <p className="description-text">
              {item.description && item.description.trim() !== ""
                ? item.description
                : "ไม่มีรายละเอียดเพิ่มเติมสำหรับเสื้อผ้าชิ้นนี้"}
            </p>
          </div>

          {/* ปุ่มจัดการ (แสดงเมื่อเป็นเจ้าของเท่านั้น) */}
          {isOwner && (
            <div className="details-actions">
              <button
                className="edit-action-btn"
                onClick={() => navigate(`/update/${item.id}`)}
              >
                <Pencil size={16} />
                แก้ไขข้อมูล
              </button>
              <button className="delete-action-btn" onClick={handleDelete}>
                <Trash2 size={16} />
                ลบชุดนี้
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { createClothes } from "../api/outfitAPI";
import "./UploadClothes.css";

export default function UploadClothes() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("shirt");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 1) ตรวจสอบการเข้าสู่ระบบเมื่อเปิดหน้า
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มเสื้อผ้า");
      navigate("/login");
    }
  }, [navigate]);

  // 2) จัดการเมื่อเลือกไฟล์รูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3) กดบันทึก → รวมข้อมูลลง FormData โดยใช้ user_id จากคนที่ล็อกอิน
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("กรุณาเลือกรูปภาพเสื้อผ้าก่อนครับ");
      return;
    }

    if (!currentUser) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    // สร้าง FormData สำหรับส่งข้อมูลและไฟล์ภาพ
    const formData = new FormData();
    formData.append("user_id", currentUser.id); // ดึง user_id จริงจากระบบ
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("image", imageFile);

    try {
      await createClothes(formData);
      alert("เพิ่มเสื้อผ้าสำเร็จ!");
      navigate("/wardrobe"); // บันทึกเสร็จกลับไปหน้าตู้เสื้อผ้า
    } catch (error) {
      console.error("Error creating clothes:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลเสื้อผ้า");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-container">
      {/* ปุ่มย้อนกลับ */}
      <button className="back-btn" onClick={() => navigate("/wardrobe")}>
        <ArrowLeft size={18} /> ย้อนกลับไปหน้าตู้เสื้อผ้า
      </button>

      <div className="upload-card">
        <div className="upload-header">
          <h2>เพิ่มเสื้อผ้าใหม่เข้าตู้</h2>
          <p>อัปโหลดรูปภาพและกรอกรายละเอียดเสื้อผ้าของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* พื้นที่อัปโหลดรูปภาพ */}
          <div className="image-upload-zone">
            <input
              type="file"
              accept="image/*"
              id="file-input"
              onChange={handleImageChange}
              hidden
            />
            <label htmlFor="file-input" className="file-drop-area">
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="image-preview" />
                  <div className="change-image-overlay">
                    <Upload size={20} />
                    <span>เปลี่ยนรูปภาพ</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="icon-wrapper">
                    <ImageIcon size={32} />
                  </div>
                  <span className="upload-text">คลิกเพื่อเลือกรูปภาพเสื้อผ้า</span>
                  <span className="upload-hint">รองรับไฟล์ PNG, JPG, JPEG</span>
                </div>
              )}
            </label>
          </div>

          {/* กรอกรายละเอียด */}
          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="name">ชื่อเสื้อผ้า / ชุด</label>
              <input
                type="text"
                id="name"
                placeholder="เช่น เสื้อเชิ้ตขาวแขนยาว, กางเกงสแล็คดำ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">หมวดหมู่</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="shirt">เสื้อ (Shirt / Top)</option>
                <option value="pants">กางเกง / กระโปรง (Pants / Bottom)</option>
                <option value="dress">ชุดเดรส (Dress)</option>
                <option value="shoes">รองเท้า (Shoes)</option>
                <option value="accessory">เครื่องประดับ / อื่นๆ (Accessory)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">รายละเอียดเพิ่มเติม (Optional)</label>
              <textarea
                id="description"
                rows="3"
                placeholder="เช่น ใส่สำหรับงานทางการ, ผ้าระบายอากาศได้ดี..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-upload-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                "กำลังบันทึกข้อมูล..."
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  บันทึกเสื้อผ้าลงตู้
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
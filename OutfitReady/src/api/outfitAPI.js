const BASE_URL = "http://localhost:3000/api/clothes";
const AI_BASE_URL = "http://localhost:3000/api/ai";

// 1. ดึงเสื้อผ้าทั้งหมด
export async function getAllClothes() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลเสื้อผ้าได้");
  return res.json();
}

// 2. ดึงเสื้อผ้าเฉพาะ ID
export async function getClothesById(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("ไม่พบข้อมูลเสื้อผ้าชิ้นนี้");
  return res.json();
}

// 3. เพิ่มเสื้อผ้าใหม่ (ใช้ FormData สำหรับส่งไฟล์รูปภาพ)
export async function createClothes(formData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("อัปโหลดเสื้อผ้าไม่สำเร็จ");
  return res.json();
}

// 4. แก้ไขข้อมูลเสื้อผ้า
export async function updateClothes(id, formData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) throw new Error("แก้ไขข้อมูลไม่สำเร็จ");
  return res.json();
}

// 5. ลบเสื้อผ้า
export async function deleteClothes(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("ลบข้อมูลไม่สำเร็จ");
  return res.json();
}

// 6. คำนวณชุดแนะนำด้วย AI ผ่าน backend
export async function getAIOutfitRecommendation({ userId, prompt, clothes }) {
  const res = await fetch(`${AI_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, prompt, clothes }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาดจาก AI backend");
  }

  return data;
}
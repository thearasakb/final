require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// NVIDIA API configuration
const nvidiaApiKey = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL =
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

const MAX_WARDROBE_IMAGES = 10;

// Create uploads directory
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// Multer upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Home route
app.get("/", (req, res) => {
  res.send("สวัสดีค่ะ Server OutfitReady ทำงานแล้ว!");
});

// ==========================================
// AUTH ROUTES (Register & Login)
// ==========================================

app.post("/api/register", async (req, res) => {
  try {
    const rawUsername = req.body.username;
    const rawPassword = req.body.password;

    const username =
      typeof rawUsername === "string" ? rawUsername.trim() : "";

    const password =
      typeof rawPassword === "string" ? rawPassword.trim() : "";

    if (!username || !password) {
      return res.status(400).json({
        message: "กรุณากรอก Username และ Password",
      });
    }

    const [existing] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Username นี้ถูกใช้งานแล้ว",
      });
    }

    const [result] = await db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password]
    );

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const rawUsername = req.body.username;
    const rawPassword = req.body.password;

    const username =
      typeof rawUsername === "string" ? rawUsername.trim() : "";

    const password =
      typeof rawPassword === "string" ? rawPassword.trim() : "";

    if (!username || !password) {
      return res.status(400).json({
        message: "กรุณากรอก Username และ Password",
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    const user = users[0];

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CLOTHES ROUTES (CRUD Operations)
// ==========================================

app.get(["/api/outfit", "/api/clothes"], async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = "SELECT * FROM clothes";
    const params = [];

    if (user_id) {
      query += " WHERE user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Get clothes error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/clothes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clothes WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลเสื้อผ้าชิ้นนี้",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching item detail:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/clothes", upload.single("image"), async (req, res) => {
  try {
    const { user_id, name, category, description } = req.body;

    const image_url = req.file ? req.file.filename : null;

    if (!image_url) {
      return res.status(400).json({
        message: "กรุณาอัปโหลดรูปภาพ",
      });
    }

    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : "เสื้อผ้าไม่มีชื่อ";

    const safeCategory =
      typeof category === "string" && category.trim()
        ? category.trim()
        : "shirt";

    const safeDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const [result] = await db.query(
      `INSERT INTO clothes
      (user_id, name, category, description, image_url)
      VALUES (?, ?, ?, ?, ?)`,
      [
        user_id || 1,
        safeName,
        safeCategory,
        safeDescription,
        image_url,
      ]
    );

    res.status(201).json({
      message: "เพิ่มเสื้อผ้าสำเร็จ",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/clothes/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM clothes WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลเสื้อผ้าที่ต้องการแก้ไข",
      });
    }

    const oldImage = existing[0].image_url;
    let image_url = oldImage;

    if (req.file) {
      image_url = req.file.filename;

      if (oldImage) {
        const oldFilePath = path.join(
          uploadDir,
          path.basename(oldImage)
        );

        fs.unlink(oldFilePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("ลบรูปเก่าไม่สำเร็จ:", err.message);
          }
        });
      }
    }

    const safeDescription =
      description !== undefined
        ? typeof description === "string" && description.trim()
          ? description.trim()
          : null
        : existing[0].description;

    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : existing[0].name;

    const safeCategory =
      typeof category === "string" && category.trim()
        ? category.trim()
        : existing[0].category;

    await db.query(
      `UPDATE clothes
      SET name = ?, category = ?, description = ?, image_url = ?
      WHERE id = ?`,
      [safeName, safeCategory, safeDescription, image_url, id]
    );

    res.json({
      message: "แก้ไขข้อมูลเสื้อผ้าสำเร็จ",
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/clothes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT image_url FROM clothes WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลที่ต้องการลบ",
      });
    }

    const imageName = rows[0].image_url;

    const [result] = await db.query(
      "DELETE FROM clothes WHERE id = ?",
      [id]
    );

    if (result.affectedRows > 0 && imageName) {
      const filePath = path.join(
        uploadDir,
        path.basename(imageName)
      );

      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("ไม่สามารถลบไฟล์รูปภาพได้:", err.message);
        } else if (!err) {
          console.log(`ลบไฟล์รูปภาพสำเร็จ: ${imageName}`);
        }
      });
    }

    res.json({
      message: "ลบเสื้อผ้าและรูปภาพเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
});
// ==========================================
// AI RECOMMENDATION ROUTE (NVIDIA Vision)
// ==========================================

function parseJsonResponse(text) {
  if (!text || typeof text !== "string") return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (jsonError) {
        return null;
      }
    }

    return null;
  }
}

// Resolve image filename in uploads folder
function resolveUploadFilePath(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return null;

  const trimmed = imageValue.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;

  let fileName = trimmed.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(fileName)) {
    try {
      const parsed = new URL(fileName);
      const marker = "/uploads/";
      const markerIndex = parsed.pathname.toLowerCase().lastIndexOf(marker);

      if (markerIndex === -1) return null;

      fileName = parsed.pathname.slice(markerIndex + marker.length);
      fileName = decodeURIComponent(fileName);
    } catch (error) {
      return null;
    }
  } else {
    fileName = fileName.replace(/^\/+/, "");
    fileName = fileName.replace(/^uploads\//i, "");

    try {
      fileName = decodeURIComponent(fileName);
    } catch (error) {
      return null;
    }
  }

  fileName = path.basename(fileName);

  if (!fileName || fileName === "." || fileName === "..") {
    return null;
  }

  return path.join(uploadDir, fileName);
}

// Convert local image to base64
function fileToNvidiaImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  const mimeType = mimeMap[ext];

  if (!mimeType) return null;

  const fileBuffer = fs.readFileSync(filePath);

  return {
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
    },
  };
}

// Get valid wardrobe images
function getValidWardrobeItems(clothes) {
  return clothes
    .map((item, index) => {
      if (!item || !item.image_url) return null;

      const imagePath = resolveUploadFilePath(item.image_url);

      if (!imagePath || !fs.existsSync(imagePath)) return null;

      const ext = path.extname(imagePath).toLowerCase();

      if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        return null;
      }

      return {
        ...item,
        id: item.id ?? index + 1,
        name: item.name || `เสื้อผ้า ${index + 1}`,
        category: item.category || "ไม่ระบุหมวดหมู่",
        description: item.description || "ไม่มีรายละเอียด",
        imagePath,
      };
    })
    .filter(Boolean);
}

// Delay helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Call NVIDIA API
async function generateNvidiaRecommendation(content) {
  if (!nvidiaApiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า NVIDIA_API_KEY ในไฟล์ .env");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + nvidiaApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            {
              role: "user",
              content,
            },
          ],
          temperature: 0.6,
          max_tokens: 2048,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(
          responseData?.detail ||
          responseData?.error?.message ||
          responseData?.message ||
          `NVIDIA API error: ${response.status}`
        );

        error.status = response.status;
        throw error;
      }

      return responseData;
    } catch (error) {
      const status = Number(error.status || 0);
      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = 1500 * Math.pow(2, attempt - 1);

      console.warn(
        `NVIDIA returned ${status}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw new Error("NVIDIA recommendation failed after retries.");
}

// ==========================================
// AI RECOMMEND API
// ==========================================

app.post("/api/ai/recommend", async (req, res) => {
  try {
    const { userId, prompt, clothes } = req.body;

    if (!prompt || !Array.isArray(clothes) || clothes.length === 0) {
      return res.status(400).json({
        message:
          "กรุณาส่ง prompt และรายการเสื้อผ้าของผู้ใช้เพื่อให้ AI วิเคราะห์",
      });
    }

    if (!nvidiaApiKey) {
      return res.status(500).json({
        message: "ยังไม่ได้ตั้งค่า NVIDIA_API_KEY ในไฟล์ .env",
      });
    }

    // Limit images to 10 per request for initial testing
    const wardrobeItems = getValidWardrobeItems(clothes).slice(
      0,
      MAX_WARDROBE_IMAGES
    );

    if (wardrobeItems.length === 0) {
      return res.status(400).json({
        message:
          "ไม่พบรูปภาพเสื้อผ้าที่รองรับ กรุณาตรวจสอบรูปในโฟลเดอร์ uploads",
      });
    }

    const wardrobeText = wardrobeItems
      .map(
        (item) =>
          `- ID: ${item.id} | ชื่อ: ${item.name} | หมวด: ${item.category} | รายละเอียด: ${item.description}`
      )
      .join("\n");

    const promptText =
      "คุณคือ AI Stylist ผู้เชี่ยวชาญด้านการแต่งกาย ตอบเป็นภาษาไทยเท่านั้น\n" +
      "วิเคราะห์ภาพเสื้อผ้าจริงที่แนบมา โดยใช้ ID และชื่อที่กำกับภาพแต่ละภาพ\n" +
      "เลือกเสื้อผ้าจากรายการที่ผู้ใช้มีอยู่เท่านั้น ห้ามสร้างเสื้อผ้าหรือ ID ขึ้นเอง\n" +
      "พิจารณาความเข้ากันของสี รูปแบบ ประเภทเสื้อผ้า และความเหมาะสมกับสถานการณ์\n" +
      "เลือกเฉพาะชิ้นที่เหมาะสมจริง ไม่จำเป็นต้องเลือกทุกชิ้น\n" +
      "ตอบเป็น JSON object เท่านั้น ห้ามใส่ Markdown หรือข้อความนอก JSON\n" +
      'รูปแบบ: {"title":"ชื่อชุด","summary":"สรุปชุด","reasons":["เหตุผล 1","เหตุผล 2"],"outfit":[{"id":1,"name":"ชื่อเสื้อผ้า"}]}\n\n' +
      `User ID: ${userId ?? "ไม่ระบุ"}\n` +
      `สถานการณ์ที่ผู้ใช้ต้องการ: ${prompt}\n\n` +
      `รายการเสื้อผ้าที่ส่งภาพให้วิเคราะห์:\n${wardrobeText}`;

    const content = [
      {
        type: "text",
        text: promptText,
      },
    ];

    // Attach images with ID labels
    for (const item of wardrobeItems) {
      content.push({
        type: "text",
        text: `ภาพถัดไปคือเสื้อผ้า ID ${item.id}, ชื่อ "${item.name}", หมวด "${item.category}".`,
      });

      const imagePart = fileToNvidiaImage(item.imagePath);

      if (imagePart) {
        content.push(imagePart);
      }
    }

    const response = await generateNvidiaRecommendation(content);

    const message = response.choices?.[0]?.message;

console.log("NVIDIA MESSAGE:", JSON.stringify(message, null, 2));

const rawText =
  typeof message?.content === "string"
    ? message.content
    : Array.isArray(message?.content)
      ? message.content
          .map((part) => part.text || "")
          .join("\n")
      : "";

console.log("NVIDIA RAW TEXT:", rawText);

const parsed = parseJsonResponse(rawText);

    if (!parsed || typeof parsed !== "object") {
      console.error("NVIDIA returned invalid JSON:", rawText);

      return res.status(502).json({
        message: "AI ส่งผลลัพธ์ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
    }

    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons
      : typeof parsed.reasons === "string"
        ? [parsed.reasons]
        : ["AI เลือกชุดจากความเหมาะสมกับสถานการณ์ของคุณ"];

    const outfit = Array.isArray(parsed.outfit)
      ? parsed.outfit
          .map((item) => {
            const matched = wardrobeItems.find(
              (cloth) =>
                String(cloth.id) === String(item.id) ||
                (
                  cloth.name &&
                  item.name &&
                  cloth.name.trim() === String(item.name).trim()
                )
            );

            // Reject clothing not present in the supplied images
            if (!matched) return null;

            return {
              id: matched.id,
              name: matched.name,
              image_url: matched.image_url,
            };
          })
          .filter(Boolean)
      : [];

    if (outfit.length === 0) {
      return res.status(502).json({
        message:
          "AI ไม่สามารถเลือกเสื้อผ้าจากรูปที่ส่งไปได้ กรุณาลองใหม่อีกครั้ง",
      });
    }

    res.json({
      title: parsed.title || "ชุดที่ AI แนะนำ",
      summary:
        parsed.summary || "AI เลือกชุดที่เหมาะกับสถานการณ์ของคุณแล้ว",
      reasons,
      outfit,
    });
  } catch (error) {
    console.error("NVIDIA recommendation error:", error);

    const status = Number(error.status || 0);

    if (status === 401 || status === 403) {
      return res.status(502).json({
        message:
          "NVIDIA API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน กรุณาตรวจสอบ NVIDIA_API_KEY",
      });
    }

    if (status === 429) {
      return res.status(503).json({
        message:
          "NVIDIA API ใช้งานถึงขีดจำกัดชั่วคราว กรุณารอสักครู่แล้วลองใหม่",
      });
    }

    if ([500, 502, 503, 504].includes(status)) {
      return res.status(503).json({
        message:
          "NVIDIA AI ไม่พร้อมให้บริการชั่วคราว กรุณาลองใหม่อีกครั้ง",
      });
    }

    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการวิเคราะห์ชุดจาก NVIDIA AI",
      error: error.message,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
  console.log(
    `NVIDIA API: ${nvidiaApiKey ? "Configured" : "Missing API Key"}`
  );
});
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Shirt } from "lucide-react";
import "./RecommendationResult.css";

const FALLBACK_IMAGE = "https://placehold.co/800x1000/f5efe8/9a5a3a?text=No+Image";

function normalizeImageUrl(value) {
  if (!value) return null;

  if (typeof value === "object" && value.url) {
    return normalizeImageUrl(value.url);
  }

  const imageValue = String(value).trim();
  if (!imageValue) return null;
  if (imageValue.startsWith("http://") || imageValue.startsWith("https://") || imageValue.startsWith("data:")) {
    return imageValue;
  }

  const cleanPath = imageValue.replace(/^\/+/, "").replace(/^uploads\//i, "");
  return `http://localhost:3000/uploads/${cleanPath}`;
}

export default function RecommendationResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const recommendation = location.state?.recommendation;
  const wardrobe = Array.isArray(location.state?.clothes) ? location.state.clothes : [];
  const userId = location.state?.userId;

  if (!recommendation) {
    return (
      <div className="recommendation-empty">
        <h2>ไม่มีข้อมูลแนะนำชุด</h2>
        <button onClick={() => navigate("/wardrobe")}>กลับไปหน้าตู้เสื้อผ้า</button>
      </div>
    );
  }

  const outfitList = Array.isArray(recommendation.outfit) ? recommendation.outfit : [];

  return (
    <div className="recommendation-page">
      <button className="recommendation-back-btn" onClick={() => navigate("/wardrobe")}>
        <ArrowLeft size={18} />
        กลับหน้าตู้เสื้อผ้า
      </button>

      <div className="recommendation-card">
        <div className="recommendation-header">
          <Sparkles size={20} />
          <span>{recommendation.title}</span>
        </div>

        <p className="recommendation-summary">{recommendation.summary}</p>

        {recommendation.reasons && recommendation.reasons.length > 0 && (
          <div className="recommendation-reasons">
            <h3>เหตุผลที่ AI เลือกชุดนี้</h3>
            <ul>
              {recommendation.reasons.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {outfitList.length > 0 && (
          <div className="recommendation-outfit">
            <h3>
              <Shirt size={18} />
              ชุดที่แนะนำ
            </h3>

            <div className="recommendation-outfit-list">
              {outfitList.map((item, index) => {
                const matchedWardrobeItem = wardrobe.find(
                  (cloth) =>
                    String(cloth.id) === String(item.id) ||
                    (cloth.name && item.name && cloth.name.trim() === item.name.trim())
                );

                const rawImage = matchedWardrobeItem?.image_url || item.image_url || item.image || item.img;
                const imageUrl = normalizeImageUrl(rawImage);
                return (
                  <div key={item.id || item.name || `recommendation-item-${index}`} className="recommendation-item">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name || matchedWardrobeItem?.name || "เสื้อผ้า"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    ) : (
                      <img src={FALLBACK_IMAGE} alt={item.name || matchedWardrobeItem?.name || "เสื้อผ้า"} />
                    )}
                    <span>{item.name || matchedWardrobeItem?.name || "เสื้อผ้า"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

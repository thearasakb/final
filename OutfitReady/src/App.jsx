import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./screens/Home";
import Login from "./screens/Login";
import Register from "./screens/Register";
import ListClothes from "./screens/ListClothes";
import UploadClothes from "./screens/UploadClothes";
import Details from "./screens/Details";
import UpdateClothes from "./screens/UpdateClothes";
import RecommendationResult from "./screens/RecommendationResult";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const savedUser = localStorage.getItem("user");

  return (
    <Routes>
      {/* หน้าแรก: รองรับทั้ง / และ /Home */}
      <Route 
        path="/" 
        element={savedUser ? <Navigate to="/wardrobe" replace /> : <Home />} 
      />
      <Route 
        path="/Home" 
        element={savedUser ? <Navigate to="/wardrobe" replace /> : <Home />} 
      />

      {/* หน้าเกี่ยวกับ Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* หน้าที่ต้อง Logged In เท่านั้นถึงจะเข้าได้ */}
      <Route 
        path="/wardrobe" 
        element={
          <ProtectedRoute>
            <ListClothes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <UploadClothes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/details/:id" 
        element={
          <ProtectedRoute>
            <Details />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/update/:id" 
        element={
          <ProtectedRoute>
            <UpdateClothes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/recommendation" 
        element={
          <ProtectedRoute>
            <RecommendationResult />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
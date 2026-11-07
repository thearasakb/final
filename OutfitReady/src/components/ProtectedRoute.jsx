import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const savedUser = localStorage.getItem("user");
  
  if (!savedUser) {
    // ถ้ายังไม่ได้ล็อกอิน ให้ส่งกลับไปหน้า Login
    return <Navigate to="/login" replace />;
  }

  return children;
}
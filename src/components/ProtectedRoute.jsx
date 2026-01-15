import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <p>Betöltés...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}

export default ProtectedRoute;

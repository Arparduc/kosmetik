import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserData } from "../lib/firebase";

function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      const userData = await getUserData(user.uid);
      setIsAdmin(userData?.isAdmin === true);
      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [user]);

  if (authLoading || checkingAdmin) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Betöltés...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Hozzáférés megtagadva</h2>
        <p>Nincs jogosultságod az admin oldalhoz.</p>
      </div>
    );
  }

  return children;
}

export default AdminRoute;

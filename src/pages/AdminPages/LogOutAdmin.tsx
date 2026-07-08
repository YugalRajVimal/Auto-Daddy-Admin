import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuth from "../../auth/useAuth";

const LogOutAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (!window.confirm("Are you sure you want to log out?")) {
      navigate("/admin", { replace: true });
      return;
    }
    logout();
  }, [navigate, logout]);

  return <div>Logging out...</div>;
};

export default LogOutAdmin;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

const LogOutAdmin: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.confirm("Are you sure you want to log out?")) {
      navigate("/admin", { replace: true });
      return;
    }

    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-role");
    localStorage.removeItem("subadmin-permissions");

    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div>
      Logging out...
    </div>
  );
};

export default LogOutAdmin;
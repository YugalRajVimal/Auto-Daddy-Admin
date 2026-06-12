import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

const LogOutAdmin: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the admin token from local storage
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-role");
    localStorage.removeItem("subadmin-permissions");
    // Optionally, clear all local storage if more cleanup is needed
    // localStorage.clear();

    // Redirect to sign-in page after logout
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div>
      Logging out...
    </div>
  );
};

export default LogOutAdmin;
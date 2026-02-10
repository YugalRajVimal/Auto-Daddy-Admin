import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

const LogOutSuperAdmin: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the superadmin token from local storage
    localStorage.setItem("super-admin-token", "");
    // Optionally, clear all local storage if more cleanup is needed
    // localStorage.clear();

    // Redirect to superadmin sign-in page after logout
    navigate("/signin", { replace: true });
  }, [navigate]);

  return (
    <div>
      Logging out...
    </div>
  );
};

export default LogOutSuperAdmin;
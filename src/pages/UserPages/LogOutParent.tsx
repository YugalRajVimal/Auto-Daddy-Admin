import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

const LogOutParent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the admin token from local storage
    localStorage.setItem("user-token","");
    // Optionally, clear all local storage if more cleanup is needed
    // localStorage.clear();

    // Redirect to sign-in page after logout
    navigate("/signin", { replace: true });
  }, [navigate]);

  return (
    <div>
      Logging out...
    </div>
  );
};

export default LogOutParent;
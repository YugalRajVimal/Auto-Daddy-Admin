import { Outlet } from "react-router";
import AdminShell from "../../components/admin/AdminShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";

import React from "react";



// Adopt OwnerPanelLayout (78-108): Banner & back-to-super-admin logic
const LayoutContent: React.FC = () => {


  return (
    <>

       <AdminShell>
    
    <Outlet />
  </AdminShell>
      </>
   
  );
};

const AdminAppLayout: React.FC = () => (
  <RequirePortal portal="admin">
    <LayoutContent />
  </RequirePortal>
);

export default AdminAppLayout;

// components/common/ProtectedRoute.tsx
// Wraps any route and redirects to /unauthorized if the subadmin lacks permission.

import React from "react";
import { Navigate } from "react-router";
import usePermissions, { Action } from "../../hooks/usePermission";


interface ProtectedRouteProps {
  module: string;
  action?: Action;
  children: React.ReactNode;
}

/**
 * Usage in App.tsx:
 *
 * <Route path="/admin/services" element={
 *   <ProtectedRoute module="services" action="view">
 *     <Services />
 *   </ProtectedRoute>
 * } />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ module, action = "view", children }) => {
  const { can } = usePermissions();
  if (!can(module, action)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
// pages/AdminPages/Auth/ForbiddenPage.tsx
import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-3xl font-bold text-gray-800">403</h1>
      <p className="mb-4 text-sm text-gray-600">
        You don't have permission to view this page. If you think this is a mistake, contact
        your SuperAdmin.
      </p>
      <Link to="/admin" className="bg-ad-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Back to Dashboard
      </Link>
    </div>
  );
}
// pages/AdminPages/OtherPage/Unauthorized.tsx
import { Link } from "react-router";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-ad-app-bg">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">403 — Forbidden</h1>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          You don't have permission to access this page. Contact the main admin to request access.
        </p>
        <Link to="/admin"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
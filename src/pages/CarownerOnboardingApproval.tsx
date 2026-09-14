import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import axios from "axios";

/**
 * Public page opened from the SMS link sent when a Shop Owner onboards a
 * Car Owner (see Controllers/AutoShops/customers.controller.js -> onboardCustomer).
 *
 * GET  /api/public/car-owner-onboarding/:token         -> load request details
 * POST /api/public/car-owner-onboarding/:token/approve
 * POST /api/public/car-owner-onboarding/:token/reject
 *
 * No auth — the token itself is the credential (single-use + time-limited).
 * Mirrors OnboardingApproval.tsx (the Shop Owner version) but talks to the
 * car-owner endpoints and reads/writes business.myCustomers[].status.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

type CarOwnerOnboardingInfo = {
  status: "pending" | "approved" | "rejected";
  alreadyResponded: boolean;
  infoMessage: string | null;
  customerName: string | null;
  shopName: string | null;
  city: string | null;
  address: string | null;
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-primary-700 py-7 px-8 flex flex-col items-center">
        <img src="/logo.png" alt="AutoDaddy" className="mb-3 h-auto w-full max-w-[220px] object-contain" />
        <h1 className="text-2xl font-bold text-gray-900 text-center">Shop Onboarding Request</h1>
      </div>
      <div className="px-8 pb-10 pt-7">{children}</div>
    </div>
  </div>
);

const CarOwnerOnboardingApproval: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<CarOwnerOnboardingInfo | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [finalStatus, setFinalStatus] = useState<"approved" | "rejected" | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/public/car-owner-onboarding/${token}`);
      setInfo(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "This onboarding link is invalid or has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Missing onboarding token.");
      setLoading(false);
      return;
    }
    fetchInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const respond = async (action: "approve" | "reject") => {
    setSubmitting(action);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/public/car-owner-onboarding/${token}/${action}`);
      setFinalStatus(res.data.status);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${action} the onboarding request. Please try again.`
      );
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-center text-gray-700">Checking your onboarding request...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-center text-red-700 font-medium">{error}</p>
      </Card>
    );
  }

  if (finalStatus) {
    return (
      <Card>
        {finalStatus === "approved" ? (
          <div className="text-center space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-lg font-semibold text-gray-900">You approved this shop's request.</p>
            <p className="text-sm text-gray-600">You're now added as a customer — you can sign in with your phone number anytime.</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-4xl">🚫</div>
            <p className="text-lg font-semibold text-gray-900">You declined this shop's request.</p>
            <p className="text-sm text-gray-600">Your account stays active — if this was a mistake, ask the shop to send a new request.</p>
          </div>
        )}
      </Card>
    );
  }

  if (!info) {
    return (
      <Card>
        <p className="text-center text-gray-700">No request found.</p>
      </Card>
    );
  }

  if (info.alreadyResponded) {
    return (
      <Card>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            {info.status === "approved" ? "Already approved" : "Already declined"}
          </p>
          <p className="text-sm text-gray-600">{info.infoMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-5">
        <p className="text-center text-gray-800">
          <span className="font-semibold">{info.shopName || "A shop"}</span> wants to add you as a customer
          {info.customerName ? (
            <>
              , <span className="font-semibold">{info.customerName}</span>
            </>
          ) : null}
          .
        </p>

        {(info.city || info.address) && (
          <div className="text-sm text-gray-600 text-center">
            {[info.address, info.city].filter(Boolean).join(", ")}
          </div>
        )}

        <p className="text-sm text-gray-600 text-center">
          Please review this request and choose whether to approve or reject it.
        </p>

        <div className="flex gap-4 pt-2">
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => respond("reject")}
            className="flex-1 py-2.5 rounded-lg border-2 border-red-600 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50 transition"
          >
            {submitting === "reject" ? "Rejecting..." : "Reject"}
          </button>
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => respond("approve")}
            className="flex-1 py-2.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 disabled:opacity-50 transition"
          >
            {submitting === "approve" ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default CarOwnerOnboardingApproval;
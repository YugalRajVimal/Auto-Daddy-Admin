import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheck } from "react-icons/fa";
import { loadRazorpay } from "../../../utils/razorpay";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Package type
type Package = {
  _id: string;
  name: string;
  price: number;
  tasksPerDay: number;
  taskRate: number;
  features: string[];
  bv: string;
};

const PurchasePackage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [purchaseError, setPurchaseError] = useState<string>("");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const token = localStorage.getItem("user-token") || "";
        const apiBase = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${apiBase}/api/user/packages`, {
          headers: { Authorization: token },
        });
        setPackages(res.data.data || []);
      } catch (_err: any) {
        setError("Failed to load packages");
      }
      setLoading(false);
    };

    fetchPackages();
  }, []);

  // Handler for logging out user (redirect to /user/logout)
  const handleLogout = () => {
    window.location.href = '/user/logout';
  };


  const handlePurchase = async (pkgId: string) => {
    setBuyingId(pkgId);
    setPurchaseError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("user-token") || "";
      const apiBase = import.meta.env.VITE_API_URL;

      /* 1️⃣ Load Razorpay */
      const loaded = await loadRazorpay();

      if (!loaded) {
        setPurchaseError("Payment system failed to load.");
        setBuyingId(null);
        return;
      }

      /* 2️⃣ Create Order */
      const orderRes = await axios.post(
        `${apiBase}/api/payment/create-order`,
        { packageId: pkgId },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const { order, paymentId } = orderRes.data;

      if (!order || !paymentId) {
        throw new Error("Invalid order response");
      }

      /* 3️⃣ Razorpay Options */
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,

        amount: order.amount,
        currency: order.currency,

        name: "Your Company Name",
        description: "Package Purchase",

        order_id: order.id,

        handler: async function (response: any) {
          try {
            /* 4️⃣ Verify Payment */
            const verifyRes = await axios.post(
              `${apiBase}/api/payment/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId, // ✅ VERY IMPORTANT
              },
              {
                headers: {
                  Authorization: token,
                },
              }
            );

            if (verifyRes.data.success) {
              setSuccessMessage("Payment successful! Package activated.");

              setTimeout(() => {
                window.location.href = "/user";
              }, 1500);
            } else {
              setPurchaseError("Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            setPurchaseError("Verification failed.");
          }
        },

        modal: {
          ondismiss: () => {
            setBuyingId(null);
          },
        },

        prefill: {
          name: "User",
          email: "user@email.com",
          contact: "9999999999",
        },

        theme: {
          color: "#2563eb",
        },
      };

      /* 5️⃣ Open Razorpay */
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error(err);
      setPurchaseError(
        err?.response?.data?.message || "Payment initiation failed."
      );
    }

    setBuyingId(null);
  };

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      {/* Logout Button */}
      <div className="w-full flex justify-end max-w-6xl mx-auto mb-2">
        <button
          className="px-6 py-2 rounded-full bg-slate-200 text-slate-700 font-semibold text-sm shadow hover:bg-slate-300 transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      {/* Header */}
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900">
          Participation Tiers
        </h2>
        <p className="mt-3 text-slate-500">
          Choose your security deposit level to unlock earning potential.
        </p>
      </div>

      {/* Purchase status messages */}
      {successMessage && (
        <div className="max-w-xl mx-auto mb-6 text-green-700 font-semibold text-center bg-green-100 rounded p-3 border border-green-300">
          {successMessage}
        </div>
      )}
      {purchaseError && (
        <div className="max-w-xl mx-auto mb-6 text-red-700 font-semibold text-center bg-red-100 rounded p-3 border border-red-300">
          {purchaseError}
        </div>
      )}

      {/* Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading && (
          <div className="col-span-full text-center py-20">
            Loading packages...
          </div>
        )}

        {error && (
          <div className="col-span-full text-center text-red-500">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          packages.map((pkg, i) => {
            const isPopular = i === 1;
            return (
              <div
                key={pkg._id}
                className={`relative rounded-3xl bg-white shadow-xl px-8 py-10 flex flex-col
                  ${
                    isPopular
                      ? "border-2 border-blue-500 scale-[1.03]"
                      : "border border-slate-200"
                  }
                `}
              >
                {/* Most Popular */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Name */}
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {pkg.name}
                </h3>

                {/* Price */}
                <div className="mt-4 text-5xl font-extrabold text-slate-900">
                  ₹{pkg.price}
                </div>

                {/* Subtitle */}
                <p className="mt-2 text-slate-500 text-sm">
                  {pkg.name === "Starter" && "Entry level access"}
                  {pkg.name === "Growth" && "For serious participants"}
                  {pkg.name === "Advanced" && "Maximum potential"}
                </p>

                {/* Features */}
                <ul className="mt-8 space-y-4 flex-grow">
                  {pkg.features.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-slate-700 text-sm"
                    >
                      <FaCheck className="w-5 h-5 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  className={`mt-10 py-3 rounded-full font-semibold text-sm transition
                    ${
                      isPopular
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:opacity-90"
                        : "border border-blue-500 text-blue-600 hover:bg-blue-50"
                    }
                    ${buyingId === pkg._id ? "opacity-40 pointer-events-none" : ""}
                  `}
                  disabled={buyingId === pkg._id}
                  onClick={() => handlePurchase(pkg._id)}
                >
                  {buyingId === pkg._id ? "Processing..." : "Join Now"}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PurchasePackage;

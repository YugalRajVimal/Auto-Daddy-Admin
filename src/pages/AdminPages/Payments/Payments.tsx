import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// Types for user and package fields (based on paymentSchema + controller .populate)
type PaymentUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
};

type PaymentPackage = {
  _id: string;
  name: string;
  price: number;
  // Extend with more fields if needed
  [key: string]: any;
};

type Payment = {
  _id: string;
  user: PaymentUser;
  package: PaymentPackage;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  status: 'CREATED' | 'PAID' | 'FAILED';
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// Status color map
const statusColors: Record<Payment["status"], string> = {
  CREATED: "#FFD966",
  PAID: "#91D074",
  FAILED: "#EF8B7E",
};

const prettyStatus = (status: Payment["status"]) => {
  switch (status) {
    case "CREATED":
      return "Pending";
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
};

// Modern card/table style
const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "5px auto",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 6px 32px rgba(0,0,0,0.07)",
  padding: "14px 16px 10px 16px",
  minHeight: 560,
  display: "flex",
  flexDirection: "column",
  height: "85vh", // take up 80vh for robust inner scroll
  minWidth: 0,
  overflow: "hidden", // Prevent overflow due to padding
};

const headerSectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: 8,
  borderBottom: "1px solid #ececf5",
  marginBottom: 6,
  flex: "0 0 auto", // Prevent from growing/shrinking
};

const controlsBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  margin: "18px 0 0 0",
  flexWrap: "wrap",
};

const filterLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#4D5896",
  marginRight: 8,
  fontSize: 15,
};

const filterSelectStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 7,
  border: "1px solid #ececf5",
  background: "#f7f7fb",
  color: "#34427a",
};

const searchBarStyle: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: 7,
  border: "1px solid #ececf5",
  fontSize: 15,
  minWidth: 230,
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0, // For flexbox children (Firefox fix)
  overflowY: "auto",
  overflowX: "auto",
  marginTop: 0,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  marginTop: 30,
  fontSize: 15,
  minWidth: 950,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontWeight: 600,
  background: "#f7f7fb",
  padding: "14px 12px",
  color: "#111127",
  borderBottom: "2px solid #dedee7",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 12px",
  borderBottom: "1px solid #ececf5",
  verticalAlign: "middle",
  fontWeight: 500,
};

const badgeStyle = (status: Payment["status"]): React.CSSProperties => ({
  padding: "4px 14px",
  borderRadius: 14,
  background: statusColors[status],
  color: "#222",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 0.3,
  boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
  display: "inline-block",
});

const userCellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const userNameStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#253353",
  marginBottom: 1,
};

const userEmailStyle: React.CSSProperties = {
  fontWeight: 400,
  color: "#3e5a87",
  fontSize: 13,
};

const packageCardStyle: React.CSSProperties = {
  background: "#f3f6fa",
  borderRadius: 9,
  padding: "10px 18px",
  display: "inline-block",
  color: "#28528d",
  fontWeight: 600,
  fontSize: 14,
  marginRight: 6,
  marginBottom: 4,
};

const packagePriceStyle: React.CSSProperties = {
  color: "#5353b1",
  fontWeight: 700,
  fontSize: 14,
  marginTop: 4,
  marginLeft: 2,
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Auth headers/baseURL as needed
        const res = await axios.get<ApiResponse<Payment[]>>(
          `${import.meta.env.VITE_API_URL}/api/admin/users/payments`
        );
        if (res.data.success) {
          setPayments(res.data.data);
        } else {
          setError(res.data.message || "Failed to fetch payments.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Filter and search
  const filteredPayments = useMemo(() => {
    let filtered = payments;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (searchText.trim()) {
      const text = searchText.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        // Search: name, email, phone, orderId, pkg.name, status
        const check = [
          p.orderId,
          p.user?.name,
          p.user?.email,
          p.user?.phone,
          p.status,
          p.package?.name,
          p.package?.price?.toString(),
          p.amount?.toString(),
        ];
        return check.some((v) => (v ?? '').toLowerCase().includes(text));
      });
    }
    return filtered;
  }, [payments, statusFilter, searchText]);

  return (
    <div style={containerStyle}>
      <div style={headerSectionStyle}>
        <h2 style={{
          fontSize: 28, color: "#253353", fontWeight: 800, margin: 0, letterSpacing: "-0.5px"
        }}>
          Payment Records
        </h2>
        <span style={{
          fontSize: 15,
          background: "#f7f7fb",
          color: "#4D5896",
          padding: "8px 16px",
          borderRadius: 10,
          fontWeight: 600,
        }}>
          {payments.length} total
        </span>
      </div>

      {/* Filters and search */}
      <div style={controlsBarStyle}>
        <div>
          <span style={filterLabelStyle}>Status:</span>
          <select
            style={filterSelectStyle}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            data-testid="status-filter"
          >
            <option value="ALL">All</option>
            <option value="CREATED">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div>
          <input
            style={searchBarStyle}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by user, package, order id, etc."
            data-testid="payments-search"
            type="search"
          />
        </div>
        <span style={{ color: "#A5AFC9", fontSize: 14, marginLeft: 12 }}>
          {filteredPayments.length} displaying
        </span>
      </div>

      {/* Everything below header is scrollable */}
      <div style={scrollAreaStyle}>
        {loading && (
          <div style={{
            margin: "60px 0",
            fontWeight: 500,
            color: "#5c6982",
            fontSize: 17,
            textAlign: "center"
          }}>Loading payments...</div>
        )}
        {error && (
          <div style={{
            marginTop: 30, color: "#DB5A47", fontWeight: 700, textAlign: 'center', fontSize: 16
          }}>{error}</div>
        )}
        {!loading && !error && payments.length === 0 && (
          <div style={{
            margin: "60px 0",
            textAlign: "center",
            fontWeight: 500,
            color: "#8a99ab",
            fontSize: 17,
          }}>No payment records found.</div>
        )}
        {!loading && !error && payments.length > 0 && filteredPayments.length === 0 && (
          <div style={{
            margin: "60px 0",
            textAlign: "center",
            fontWeight: 500,
            color: "#8a99ab",
            fontSize: 17,
          }}>No results match your filters or search.</div>
        )}
        {!loading && !error && filteredPayments.length > 0 && (
          <div style={{ minWidth: "100%", overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Package</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td style={tdStyle}>{payment.orderId || <span style={{ color: "#aaa" }}>-</span>}</td>
                    <td style={tdStyle}>
                      <div style={userCellStyle}>
                        <span style={userNameStyle}>
                          {payment.user?.name}
                        </span>
                        <span style={userEmailStyle}>
                          {payment.user?.email
                            ? payment.user.email
                            : <span style={{ color: "#aaa" }}>-</span>}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {payment.user?.phone ? payment.user.phone : <span style={{ color: "#aaa" }}>-</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={packageCardStyle}>
                        {payment.package?.name || <span style={{ color: "#b8b8b8" }}>N/A</span>}
                        <div style={packagePriceStyle}>
                          {typeof payment.package?.price === "number"
                            ? <>₹{payment.package.price.toLocaleString()}</>
                            : <span style={{ color: "#aaa" }}>-</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "#304e34", fontWeight: 700 }}>
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(payment.status)}>
                        {prettyStatus(payment.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "#687385" }}>
                        {new Date(payment.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
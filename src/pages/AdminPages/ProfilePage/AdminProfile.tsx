import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spin,
  Typography,
  Descriptions,
  Divider,
  Tag,
  message,
  Card,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface AdminDetails {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const ADMIN_KEYS: { label: string; key: keyof AdminDetails }[] = [
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Phone", key: "phone" },
  { label: "Role", key: "role" },
  { label: "Status", key: "status" },
  { label: "Joined On", key: "createdAt" },
  { label: "Last Updated", key: "updatedAt" },
];

const AdminProfile: React.FC = () => {
  const [admin, setAdmin] = useState<AdminDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin-token");
    axios
      .get(`${API_BASE_URL}/api/admin/profile`, {
        headers: {
          ...(adminToken ? { Authorization: `${adminToken}` } : {}),
        },
      })
      .then((res) => {
        if (res.data && res.data.success && res.data.data) {
          setAdmin(res.data.data);
        } else {
          setAdmin(null);
          message.error("Failed to fetch admin profile.");
        }
      })
      .catch(() => {
        setAdmin(null);
        message.error("Error fetching admin profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  function renderAdmin(admin: AdminDetails) {
    return (
      <Descriptions
        bordered
        size="middle"
        column={1}
        style={{
          marginBottom: 22,
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
        }}
        labelStyle={{ width: 140 }}
        className="!rounded-lg"
      >
        {ADMIN_KEYS.map((item) => (
          <Descriptions.Item label={item.label} key={item.key}>
            {item.key === "createdAt" || item.key === "updatedAt"
              ? admin[item.key]
                ? dayjs(admin[item.key]).format("DD MMM, YYYY")
                : "-"
              : item.key === "status"
              ? (
                <Tag color={admin.status === "active" ? "green" : "red"}>
                  {admin[item.key]?.charAt(0).toUpperCase() +
                    (admin[item.key]?.slice(1) || "")}
                </Tag>
              )
              : item.key === "role"
              ? (
                <Tag color="blue">
                  {typeof admin[item.key] === "string"
                    ? (admin[item.key] as string)
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())
                    : "-"}
                </Tag>
              )
              : admin[item.key] || "-"}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  }

  return (
    <Spin spinning={loading}>
      <div style={{ margin: "40px auto 32px auto" }}>
        <Title level={3} style={{ marginBottom: 6 }}>
          Admin Profile Details
        </Title>
        <Divider style={{ margin: "12px 0 18px 0" }} />
        {admin ? (
          <Card style={{ borderRadius: 14, background: "#f7faff" }}>
            {renderAdmin(admin)}
          </Card>
        ) : (
          !loading && (
            <Text type="secondary">No admin profile data found.</Text>
          )
        )}
      </div>
    </Spin>
  );
};

export default AdminProfile;

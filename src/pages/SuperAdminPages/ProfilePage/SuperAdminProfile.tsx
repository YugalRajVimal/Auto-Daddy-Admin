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
  Button,
  Modal,
  Form,
  Input,
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

const SuperAdminProfile: React.FC = () => {
  const [admin, setAdmin] = useState<AdminDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset password modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    const adminToken = localStorage.getItem("super-admin-token");
    axios
      .get(`${API_BASE_URL}/api/super-admin/profile`, {
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
  };

  const handlePasswordReset = (values: { newPassword: string }) => {
    setResetLoading(true);
    const adminToken = localStorage.getItem("super-admin-token");
    axios
      .post(
        `${API_BASE_URL}/api/auth/super-admin/reset-password`,
        { newPassword: values.newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            ...(adminToken ? { Authorization: `${adminToken}` } : {}),
          },
        }
      )
      .then((res) => {
        if (res.status === 200 && res.data && res.data.message) {
          message.success("Password reset successfully.");
          setIsModalOpen(false);
          form.resetFields();
        } else {
          message.error(res.data?.message || "Failed to reset password.");
        }
      })
      .catch((err) => {
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password.";
        message.error(errMsg);
      })
      .finally(() => setResetLoading(false));
  };

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
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() => setIsModalOpen(true)}
                style={{ minWidth: 180 }}
              >
                Reset Password
              </Button>
            </div>
          </Card>
        ) : (
          !loading && (
            <Text type="secondary">No admin profile data found.</Text>
          )
        )}

        <Modal
          title="Reset Password"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePasswordReset}
            autoComplete="off"
          >
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Please input new password!" },
                { min: 6, message: "Password must be at least 6 characters." },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="Enter new password" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="Confirm New Password"
              name="confirmNewPassword"
              dependencies={["newPassword"]}
              hasFeedback
              rules={[
                { required: true, message: "Please confirm new password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm new password" autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={resetLoading}
                style={{ marginTop: 4 }}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

export default SuperAdminProfile;

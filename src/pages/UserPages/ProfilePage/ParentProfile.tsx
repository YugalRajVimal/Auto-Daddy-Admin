import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spin, Typography, Divider, Tag, message, Tooltip } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  WalletOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  GiftOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Use the correct shape for Populated Package
interface UserPackage {
  _id: string;
  name: string;
  price: number;
  tasksPerDay: number;
  taskRate: number;
  features: string[];
  bv: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  createdAt?: string;
  referralCode?: string | null;
  referredBy?: string | null;
  referredOn?: "left" | "right" | null;
  isKYCCompleted?: boolean;
  isAnyPackagePurchased?: boolean;
  wallet?: number;
  leftCarry?: number;
  rightCarry?: number;
  package?: UserPackage | null; // Now the populated object or null
  packagePurchasedAt?: string | null;
  packageExpiresAt?: string | null;
}

const statusColor = (status: string) =>
  status === "active" ? "green" : status === "suspended" ? "gold" : "red";
const statusIcon = (status: string) =>
  status === "active" ? (
    <CheckCircleTwoTone twoToneColor="#52c41a" />
  ) : (
    <CloseCircleTwoTone twoToneColor="#ff4d4f" />
  );

const infoItem = (
  icon: React.ReactNode,
  label: string,
  value: React.ReactNode,
  tag?: React.ReactNode
) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="text-2xl text-blue-500">{icon}</div>
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-base text-slate-800 flex items-center gap-1">
        {value}
        {tag ? <span className="ml-2">{tag}</span> : null}
      </div>
    </div>
  </div>
);

const renderPopulatedPackage = (pkg: UserPackage | null | undefined) => {
  if (!pkg) return <span className="text-gray-300">-</span>;
  return (
    <div className="flex flex-col">
      <span className="font-bold text-slate-700">{pkg.name}</span>
      <span className="text-xs text-gray-500">₹{pkg.price} / {pkg.tasksPerDay} tasks/day</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {pkg.features?.map((feat, i) =>
          <Tag key={i} color="geekblue" className="border-0 text-xs">{feat}</Tag>
        )}
      </div>
      <div className="text-xs text-purple-700 mt-1">
        BV: {pkg.bv}
      </div>
    </div>
  );
};

const ProfileInfoCard: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  return (
    <div className="mx-10 bg-white rounded-2xl shadow-md p-8 ring-1 ring-gray-100">
      <div className="flex items-center mb-6 gap-4">
        <div className="flex flex-col items-center">
          <span className="bg-gradient-to-br from-blue-300 to-violet-400 text-white rounded-full p-3 text-4xl shadow">
            <UserOutlined />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Title level={3} style={{ margin: 0 }}>
              {profile.name}
            </Title>
            {profile.status ? (
              <Tag color={statusColor(profile.status)} className="border-0 font-semibold">
                {statusIcon(profile.status)} {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </Tag>
            ) : null}
          </div>
          <div className="mt-0.5 flex gap-4 text-gray-500 font-mono text-xs">
            <div>
              Joined {profile.createdAt ? dayjs(profile.createdAt).format("DD MMM, YYYY") : "-"}
            </div>
            <div>
              ID: <span className="text-slate-400">{profile._id.slice(-6)}</span>
            </div>
          </div>
        </div>
      </div>

      <Divider className="mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        {infoItem(
          <MailOutlined />,
          "Email",
          profile.email || <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <PhoneOutlined />,
          "Phone",
          profile.phone || <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <GiftOutlined />,
          "Referral Code",
          profile.referralCode ? (
            <Tooltip title="Click to copy">
              <span
                className="select-all hover:underline cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(profile.referralCode!);
                  message.success("Referral code copied!");
                }}
              >
                {profile.referralCode}
              </span>
            </Tooltip>
          ) : (
            <span className="text-gray-300">-</span>
          )
        )}
        {infoItem(
          <TeamOutlined />,
          "Referred By",
          profile.referredBy || <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <ThunderboltOutlined />,
          "Referred On",
          profile.referredOn
            ? profile.referredOn === "left"
              ? "Left"
              : "Right"
            : <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <WalletOutlined />,
          "Wallet Balance",
          profile.wallet !== undefined
            ? (
              <span className="text-blue-700 font-semibold">&#8377; {profile.wallet}</span>
            )
            : <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <span className="text-purple-500 font-extrabold">L</span>,
          "Left Carry",
          typeof profile.leftCarry === "number" ? profile.leftCarry : <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <span className="text-indigo-500 font-extrabold">R</span>,
          "Right Carry",
          typeof profile.rightCarry === "number" ? profile.rightCarry : <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <CheckCircleTwoTone twoToneColor={profile.isKYCCompleted ? "#52c41a" : "#ff4d4f"} />,
          "KYC Completed",
          profile.isKYCCompleted ? "Yes" : "No",
          profile.isKYCCompleted ? (
            <Tag color="green" className="border-0">Verified</Tag>
          ) : (
            <Tag color="red" className="border-0">Incomplete</Tag>
          )
        )}
        {infoItem(
          <GiftOutlined />,
          "Any Package Purchased",
          profile.isAnyPackagePurchased ? "Yes" : "No",
          profile.isAnyPackagePurchased ? (
            <Tag color="green" className="border-0">Active</Tag>
          ) : (
            <Tag color="red" className="border-0">None</Tag>
          )
        )}
        {infoItem(
          <span className="text-xl">&#128230;</span>,
          "Package",
          renderPopulatedPackage(profile.package)
        )}
        {infoItem(
          <span className="text-sm">&#128197;</span>,
          "Package Purchased At",
          profile.packagePurchasedAt
            ? dayjs(profile.packagePurchasedAt).format("DD MMM, YYYY")
            : <span className="text-gray-300">-</span>
        )}
        {infoItem(
          <span className="text-sm">&#128197;</span>,
          "Package Expires At",
          profile.packageExpiresAt
            ? dayjs(profile.packageExpiresAt).format("DD MMM, YYYY")
            : <span className="text-gray-300">-</span>
        )}
      </div>
    </div>
  );
};

const ParentProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const userToken = localStorage.getItem("user-token");
    axios
      .get(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          ...(userToken ? { Authorization: userToken } : {}),
        },
      })
      .then((res) => {
        if (res.data && res.data.success && res.data.data) {
          setProfile(res.data.data);
        } else {
          setProfile(null);
          message.error("Failed to fetch profile data.");
        }
      })
      .catch(() => {
        setProfile(null);
        message.error("Error fetching profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-10 px-2 sm:px-0 bg-gradient-to-br from-blue-50 via-violet-50 to-slate-100">
        <Title
          level={2}
          style={{
            marginBottom: 0,
            background: "linear-gradient(90deg, #5f88e0, #b393fa 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
          }}
        >
          My Profile
        </Title>
        <div className="mb-5 text-gray-500 leading-3 font-medium text-xs">
          Welcome to your profile dashboard.
        </div>
        <Divider style={{ margin: "20px 0 12px 0" }} />
        {profile ? (
          <ProfileInfoCard profile={profile} />
        ) : (
          !loading && (
            <Text type="secondary">No profile data found.</Text>
          )
        )}
      </div>
    </Spin>
  );
};

export default ParentProfile;

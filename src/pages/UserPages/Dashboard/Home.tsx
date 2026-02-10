import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Spin,
  message,
  Tooltip,
  Tag,
  Divider,
  Progress,
  Space,
} from "antd";
import {
  WalletOutlined,
  UsergroupAddOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,

  CrownOutlined,
} from "@ant-design/icons";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface DashboardData {
  pendingTasks: number;
  completedTasks: number;
  totalReferredUsers: number;
  leftUsers: number;
  rightUsers: number;
  successfulReferralsWhoPurchasedPackage: number;
  totalPromotionalIncome: number;
  walletBalance: number;
}

const tileColors = [
  ["#f0fff0", "#3f8600"],
  ["#fffbe6", "#faad14"],
  ["#f6ffed", "#52c41a"],
  ["#e6f7ff", "#2f54eb"],
  ["#fff0f6", "#c41d7f"],
  ["#f9f0ff", "#722ed1"],
];

const cardBoxStyle: React.CSSProperties = {
  borderRadius: 18,
  boxShadow: "0 4px 24px 0 rgba(33,33,33,0.04)",
  minHeight: 148,
  padding: 0,
};

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="flex items-center gap-2 mb-3 text-indigo-900 font-semibold text-lg">
    <span className="text-2xl">{icon}</span>
    {children}
  </div>
);

const Home: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("user-token");
      const { data } = await axios.get(`${API_BASE_URL}/api/user/dashboard`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (data && data.success) {
        setDashboard(data.data);
      } else {
        message.error(data.message || "Failed to fetch dashboard details");
      }
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || err?.message || "Dashboard fetch error"
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line
  }, []);

  // For the progress bar
  const getTaskProgress = () => {
    if (!dashboard) return 0;
    const completed = dashboard.completedTasks || 0;
    const pending = dashboard.pendingTasks || 0;
    const total = completed + pending;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-[80vh]">
      <SectionTitle icon={<CrownOutlined />}>
        Welcome Back!
        <span className="text-gray-500 text-sm font-normal ml-2">
          Here is your activity at a glance
        </span>
      </SectionTitle>
      <Divider className="mb-8" />
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Spin size="large" />
        </div>
      ) : dashboard ? (
        <Row gutter={[32, 32]} className="mb-8">
          {/* Wallet Balance */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[0][0],
                border: `1.5px solid ${tileColors[0][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <WalletOutlined className="text-2xl" style={{ color: tileColors[0][1] }} />
                <span className="text-md text-gray-600">Wallet Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-3xl" style={{ color: tileColors[0][1] }}>
                  ₹{dashboard.walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-gray-400">Top up your wallet for more actions!</div>
            </Card>
          </Col>
          {/* Pending Tasks */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[1][0],
                border: `1.5px solid ${tileColors[1][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <ClockCircleOutlined className="text-2xl" style={{ color: tileColors[1][1] }} />
                <span className="text-md text-gray-600">Pending Tasks</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: tileColors[1][1] }}>
                {dashboard.pendingTasks}
              </span>
              <div className="text-xs text-gray-400">{dashboard.pendingTasks > 0 ? "You have pending tasks to complete" : "All tasks done!"}</div>
            </Card>
          </Col>
          {/* Completed Tasks */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[2][0],
                border: `1.5px solid ${tileColors[2][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleOutlined className="text-2xl" style={{ color: tileColors[2][1] }} />
                <span className="text-md text-gray-600">Completed Tasks</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: tileColors[2][1] }}>
                {dashboard.completedTasks}
              </span>
              <div className="mt-2">
                <Progress
                  percent={getTaskProgress()}
                  size="small"
                  strokeColor={tileColors[2][1]}
                  trailColor="#ececec"
                  showInfo={true}
                />
              </div>
            </Card>
          </Col>
          {/* Referrals Grouped */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[3][0],
                border: `1.5px solid ${tileColors[3][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <UsergroupAddOutlined className="text-2xl" style={{ color: tileColors[3][1] }} />
                <span className="text-md text-gray-600">Total Referred</span>
              </div>
              <span className="text-3xl font-bold mr-2" style={{ color: tileColors[3][1] }}>
                {dashboard.totalReferredUsers}
              </span>
              <Space className="mt-1">
                <Tooltip title="Left Team"><Tag color="geekblue" className="px-2">Left: {dashboard.leftUsers}</Tag></Tooltip>
                <Tooltip title="Right Team"><Tag color="purple" className="px-2">Right: {dashboard.rightUsers}</Tag></Tooltip>
              </Space>
            </Card>
          </Col>
          {/* Referral Purchases */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[4][0],
                border: `1.5px solid ${tileColors[4][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <ProfileOutlined className="text-2xl" style={{ color: tileColors[4][1] }} />
                <span className="text-md text-gray-600">Referral Purchases</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: tileColors[4][1] }}>
                {dashboard.successfulReferralsWhoPurchasedPackage}
              </span>
              <div className="text-xs text-gray-400">
                {dashboard.successfulReferralsWhoPurchasedPackage > 0
                  ? "Your invitees have purchased packages!"
                  : "No referral purchases yet"}
              </div>
            </Card>
          </Col>
          {/* Promotional Income */}
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                ...cardBoxStyle,
                background: tileColors[5][0],
                border: `1.5px solid ${tileColors[5][1]}`,
              }}
              bodyStyle={{ padding: 18 }}
              bordered={false}
            >
              <div className="flex items-center gap-2 mb-1">
                <CrownOutlined className="text-2xl" style={{ color: tileColors[5][1] }} />
                <span className="text-md text-gray-600">Total Promotional Income</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: tileColors[5][1] }}>
                ₹{dashboard.totalPromotionalIncome.toLocaleString("en-IN")}
              </span>
              <div className="text-xs text-gray-400">
                <Tooltip
                  title="This is the sum of matched BV. Each BV is worth ₹10. You earn income weekly based on your team's BV generation."
                >
                  <span className="underline cursor-pointer">What is this?</span>
                </Tooltip>
              </div>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className="flex justify-center text-gray-400 text-lg py-12">No dashboard data found.</div>
      )}
      {/* Add section for more analytics or news in the future */}
    </div>
  );
};

export default Home;
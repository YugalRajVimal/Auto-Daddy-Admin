export type DashboardIncomeBreakdown = {
  date: string;
  totalSale: number;
  received: number;
  pending: number;
};

export type DashboardIncomeOverview = {
  daily: DashboardIncomeBreakdown;
};

export type DashboardContentBlock = {
  heading: string;
  desc: string;
};

export type DashboardBusinessUserDetails = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address: string;
  profilePhoto: string | null;
  isDisabled: boolean;
  isProfileComplete: boolean;
};

export type DashboardDetailsResponse = {
  success: boolean;
  businessName: string;
  businessContactNo: string;
  idBusinessActive: boolean;
  incomeOverview: DashboardIncomeOverview;
  subscriptionDaysLeftCount: number;
  thoughtOfTheDay: string;
  aboutUs: DashboardContentBlock;
  privacyPolicy: DashboardContentBlock;
  FAQs: DashboardContentBlock;
  Documents: DashboardContentBlock;
  Disclaimer: DashboardContentBlock;
  businessUserDetails: DashboardBusinessUserDetails;
};

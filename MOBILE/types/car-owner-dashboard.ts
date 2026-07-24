export type CarOwnerContentBlock = {
  _id?: string;
  heading: string;
  desc: string;
};

export type CarOwnerVehicleMake = {
  name: string;
  model: string;
};

export type CarOwnerDashboardVehicle = {
  _id: string;
  licensePlateNo: string;
  make: CarOwnerVehicleMake;
  year: number;
};

export type CarOwnerUserProfile = {
  _id?: string;
  phone?: string;
  countryCode?: string;
  isProfileComplete?: boolean;
  createdAt?: string;
  email?: string;
  name?: string;
  role?: string;
  city?: string;
  myVehicles?: CarOwnerDashboardVehicle[];
  profilePhoto?: string | null;
  thoughtOfTheDayLiked?: boolean;
};

export type CarOwnerNextServiceSubService = {
  name: string;
  desc: string;
  price: number;
};

export type CarOwnerNextServiceItem = {
  service: string;
  subServices: CarOwnerNextServiceSubService[];
};

export type CarOwnerNextService = {
  jobCardId: string;
  vehicle: CarOwnerDashboardVehicle;
  customer: {
    _id: string;
    phone: string;
    email?: string;
    name: string;
    profilePhoto?: string | null;
  };
  dueOdometerReading: number;
  createdAt: string;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  status: string;
  services: CarOwnerNextServiceItem[];
};

/** Raw thought payload from dashboard API (shape may vary by backend version). */
export type CarOwnerThoughtOfTheDayApi = {
  text?: string;
  thought?: string;
  thoughtText?: string;
  quote?: string;
  message?: string;
  content?: string;
  liked?: boolean;
  isLiked?: boolean;
  userLiked?: boolean;
  hasLiked?: boolean;
  likedCount?: number;
  totalLikes?: number;
  likes?: number;
  likeCount?: number;
  totalLikeCount?: number;
};

/** CMS-style blocks returned inside `dashboard`. */
export type CarOwnerDashboardPayload = {
  _id?: string;
  thoughtOfTheDay?: string | CarOwnerThoughtOfTheDayApi;
  thoughtOfTheDayLike?: number;
  aboutUs?: CarOwnerContentBlock;
  privacyPolicy?: CarOwnerContentBlock;
  FAQs?: CarOwnerContentBlock;
  documents?: CarOwnerContentBlock;
  disclaimer?: CarOwnerContentBlock;
  createdAt?: string;
  __v?: number;
};

export type CarOwnerDashboardApiResponse = {
  success?: boolean;
  dashboard?: CarOwnerDashboardPayload;
  userProfile?: CarOwnerUserProfile;
  nextService?: CarOwnerNextService | null;
  thoughtOfTheDayLiked?: boolean;
  /** Nested home payload from GET /api/carowner/home */
  data?: {
    thoughtOfTheDay?: string | CarOwnerThoughtOfTheDayApi;
    thoughtOfTheDayLike?: number;
    carOwnerName?: string;
    name?: string | null;
    city?: string | null;
  };
};

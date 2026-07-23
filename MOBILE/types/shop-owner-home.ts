/** GET /api/autoshopowner/home */

export type ShopOwnerThoughtOfTheDay = {
  _id?: string;
  date?: string;
  country?: string;
  subject?: string;
  notes?: string;
  likes?: number;
  image?: string | null;
};

export type ShopOwnerHomeData = {
  thoughtOfTheDay: ShopOwnerThoughtOfTheDay | string | null;
  autoShopOwnerName: string;
  businessName: string;
  daysLeftInSubscription: number;
};

export type ShopOwnerHomeApiResponse = {
  success?: boolean;
  message?: string;
  data?: ShopOwnerHomeData;
};

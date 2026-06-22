export type CarCompany = {
  _id: string;
  companyName: string;
  brandLogo?: string | null;
  /** Legacy alias when backend omits brandLogo. */
  logoUrl?: string | null;
};

export type MainCarCompaniesResponse = {
  success?: boolean;
  message?: string;
  data?: CarCompany[];
};

export type UpdateMyCarCompaniesResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};


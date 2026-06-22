/** Line item under a category from GET /api/auto-shop-owner/services */
export type ServiceCatalogLine = {
  id?: string;
  name: string;
  desc?: string;
  price?: string | number;
};

/** Category group (e.g. “Car Wash”) with nested services */
export type ServiceCatalogCategory = {
  id?: string;
  name: string;
  desc?: string;
  items: ServiceCatalogLine[];
};

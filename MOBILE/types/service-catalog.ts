/** Line item under a category from GET /api/autoshopowner/services */
export type ServiceCatalogLine = {
  id?: string;
  name: string;
  desc?: string;
  price?: string | number;
  make?: string;
  model?: string;
  quantity?: number;
  tax?: number;
};

/** Category group (e.g. “Oil Change”) from GET /api/autoshopowner/services?shopType= */
export type ServiceCatalogCategory = {
  id?: string;
  name: string;
  desc?: string;
  shopType?: string;
  odoOutRequired?: boolean;
  items: ServiceCatalogLine[];
};

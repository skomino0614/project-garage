import type {
  PriorityAttributeKey,
  PriorityLevel,
  ProductCategory,
  ProductStyle,
} from "./constants";

/** Vehicle fitment for a product — aligns with consult VehicleContext (maker/model/series). */
export type VehicleCompatibility = {
  maker: string;
  model: string;
  series: string | null;
  note: string | null;
  /** Optional link to car_masters when a canonical row exists (no duplicate vehicle specs). */
  carMasterId: string | null;
};

/** Product trait scores used for future priority-based matching. */
export type ProductAttributes = Record<PriorityAttributeKey, PriorityLevel>;

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  brand: string;
  description: string | null;
  priceMinYen: number;
  priceMaxYen: number;
  imageUrl: string | null;
  productUrl: string | null;
  purchaseUrl: string | null;
  attributes: ProductAttributes;
  style: ProductStyle;
  tags: string[];
  isActive: boolean;
  compatibilities: VehicleCompatibility[];
};

/** Input shape for trusted admin/data-source registration (no AI generation). */
export type ProductInput = Omit<Product, "id"> & {
  id?: string;
};

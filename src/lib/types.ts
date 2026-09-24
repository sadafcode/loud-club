export type Collection = "girls" | "boys" | "unisex";

export type Category =
  | "tees"
  | "knitwear"
  | "outerwear"
  | "shirts"
  | "tailoring"
  | "denim"
  | "trousers"
  | "dresses"
  | "bags"
  | "headwear"
  | "footwear";

/** How the garment is cut — drives the ease used by the size recommender. */
export type FitProfile = "slim" | "regular" | "relaxed" | "oversized";

/** Which size chart a product uses. */
export type SizeSystem = "alpha" | "waist" | "shoe" | "one-size";

export type Color = {
  name: string;
  hex: string;
};

export type Variant = {
  sku: string;
  color: string;
  size: string;
  /** Baseline stock; the live stock store layers simulated changes on top. */
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  collection: Collection;
  category: Category;
  tags: string[];
  /** Unsplash photo ids — build URLs with `imageUrl()`. First is the hero. */
  images: string[];
  colors: Color[];
  sizes: string[];
  variants: Variant[];
  fit: FitProfile;
  sizeSystem: SizeSystem;
  materials: string;
  care: string[];
  lookIds: string[];
  isNew?: boolean;
  /** Available as an overlay on the virtual try-on page. */
  tryOn?: boolean;
};

export type Look = {
  id: string;
  slug: string;
  title: string;
  chapter: string;
  story: string;
  image: string;
  gallery: string[];
  productIds: string[];
  collection: Collection | "all";
};

export type CartItem = {
  sku: string;
  productId: string;
  quantity: number;
};

export type OrderStatus = "processing" | "shipped" | "delivered";

export type OrderLine = {
  sku: string;
  productId: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  email: string;
  placedAt: string;
  deliveredAt?: string;
  status: OrderStatus;
  lines: OrderLine[];
  shipping: number;
};

export type ReturnReason =
  | "too-small"
  | "too-large"
  | "not-as-pictured"
  | "changed-mind"
  | "defective";

export type ReturnResolution = "refund" | "exchange";

export type ReturnStatus = "requested" | "label-sent" | "in-transit" | "received" | "completed";

export type ReturnLine = {
  sku: string;
  productId: string;
  quantity: number;
  reason: ReturnReason;
  resolution: ReturnResolution;
  /** Target SKU when resolution is "exchange". */
  exchangeSku?: string;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  createdAt: string;
  status: ReturnStatus;
  lines: ReturnLine[];
};

// Shared domain types for the OpenFoodFacts + Amazon lookup flow.

export interface OFFProduct {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  nutriscore_grade?: string;
  nutriscore_2023_tags?: string[];
  nutriscore_score?: number;
  nova_group?: number;
  ecoscore_grade?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  nutrient_levels?: Record<string, string>;
}

export interface ProductDetailsResponse {
  status?: number;
  code?: string;
  product?: OFFProduct;
}

export interface KnowledgePanelTitleElement {
  title?: string;
  subtitle?: string;
  icon_url?: string;
  grade?: string;
}

export interface KnowledgePanelElement {
  element_type?: string;
  text_element?: { html?: string };
}

export interface KnowledgePanel {
  name?: string;
  title_element?: KnowledgePanelTitleElement;
  elements?: KnowledgePanelElement[];
  level?: string;
  evaluation?: string;
}

export interface KnowledgePanelsResponse {
  status?: number;
  product?: {
    knowledge_panels?: Record<string, KnowledgePanel>;
  };
}

/** Combined payload returned by /api/product. */
export interface ProductBundle {
  details: ProductDetailsResponse;
  knowledge: KnowledgePanelsResponse;
}

export interface BrandSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
  pageSize: number;
}

export interface AmazonLookupResponse {
  upcCode: string | null;
  productTitle: string | null;
  brand: string | null;
  store: string | null;
  flavor: string | null;
  /** Product name parsed from the Amazon URL slug — used as a keyword-search fallback when scraping is blocked. */
  searchQuery: string | null;
}

/** A single entry persisted in the recent-searches sidebar. */
export interface RecentSearch {
  id: string;
  kind: "upc" | "brand" | "amazon";
  /** The raw query the user entered (barcode, brand, or link). */
  query: string;
  /** Human-friendly label for the sidebar row. */
  label: string;
  /** Optional thumbnail + score for a richer row. */
  imageUrl?: string;
  grade?: string;
  timestamp: number;
}

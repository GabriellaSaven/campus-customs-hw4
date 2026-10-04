export interface ProductInventory {
  size: string;
  quantity: number;
}

export interface Product {
  product_id: string;
  name: string;
  garment_type: string;
  description: string;
  colors: string[];
  search_tags: string[];
  image_url: string;
  price: number;
  inventory: ProductInventory[];
  total_stock: number;
  sizes_in_stock: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

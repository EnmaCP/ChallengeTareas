export interface Product {
    id: number;
    name: string;
    description: string;
    price: number | string;      //preio en euros
    category: string;
    stock: number;     //unidades disponibles
    image_url: string;
    active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  status: string;
  items: CartItem[];
  total_price: number;
  address: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "customer" | "employee" | "admin";
  full_name?: string;
  active?: boolean;
}
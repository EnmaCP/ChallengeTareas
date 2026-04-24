export interface Product {
    id: number;
    name: string;
    description: string;
    price: number | string;      //preio en euros
    category: string;
    stock: number;     //unidades disponibles
    image_url: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
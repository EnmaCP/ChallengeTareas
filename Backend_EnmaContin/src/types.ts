export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;      //preio en euros
    category: string;
    stock: number;     //unidades disponibles
    image_url: string;
}
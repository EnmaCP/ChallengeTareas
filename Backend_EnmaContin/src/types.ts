export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;      //preio en euros
    category: string;
    stock: number;     //unidades disponibles
    image_url: string;
}

export interface Customer {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: "admin" | "employee" | "customer";
    active?: boolean;
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Product } from "../types";
import "./product-detail.css";
import type {CartItem} from "../types";

function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    
    
    const addToCart = (product: Product): void => {
        const saved = sessionStorage.getItem("cart"); //cargar datos del carrito
        const cart : CartItem[] = saved ? JSON.parse(saved) : [];
        const existing = cart.find((i) => i.product.id === product.id); //buscar si el producto ya esta en el carrito
        if (existing) {
           if(existing.quantity >= product.stock) return;

           sessionStorage.setItem("cart", JSON.stringify(cart.map(item =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
           )));
        } else {
            sessionStorage.setItem("cart", JSON.stringify([...cart, { product, quantity: 1 }]));
        }
    };

    

    useEffect(() => {
        // Hacemos el fetch cuando el componente se monta o cuando cambia el 'id'
        fetch(`http://localhost:3000/api/products/${id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Producto no encontrado");
                }
                return res.json();
            })
            .then((data) => setProduct(data))
            .catch((err) => {
                console.error(err);
                // Redirigimos a una ruta inexistente (como /404) para que salte nuestro componente NotFound
                navigate("/404", { replace: true });
            });
    }, [id, navigate]);

    if (!product) {
        return <div className="loading">Cargando producto...</div>;
    }

    return (
        <div className="product-detail">
            <img src={product.image_url} alt={product.name} />
            <div className="product-info">
                <h2>{product.name}</h2>
                <p className="category">{product.category}</p>
                <p className="price">{Number(product.price).toFixed(2)} €</p>
                <p className="description">{product.description}</p>
                <p className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `En Stock - ${product.stock} unidades` : "Sin Stock"}
                </p>
                <button onClick={() => addToCart(product)} disabled={product.stock === 0} className="add-to-cart">
                    Agregar al Carrito
                </button>
                <button onClick={() => navigate("/")} className="back-button">
                    Volver al catálogo
                </button>
            </div>
        </div>
    );
}

export default ProductDetail;
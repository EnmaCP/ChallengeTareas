import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "./types";
import ProductCard from "./components/ProductCard";
import type { CartItem } from "./types";

function App() {

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = sessionStorage.getItem("cart"); //cargar
    return saved ? JSON.parse(saved) : [];
  });
  const handleUpdateStock = (id: number, currentStock: number): void => {

    const input = window.prompt(`Stock actual: ${currentStock}. Nuevo stock: `)
    if (input === null) return;
    const newStock = parseInt(input);
    if (isNaN(newStock) || newStock < 0) {
      alert("El stock debe ser un número mayor o igual a 0");
      return;
    }

    fetch(`http://localhost:3000/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stock: newStock }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => loadProducts())
      .catch((error) => console.error("Error", error));

  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}` },

      body: JSON.stringify({
        name: newName,
        price: parseFloat(newPrice),
        description: newDescription || undefined,
        category: newCategory || undefined,
        stock: newStock ? parseInt(newStock) : undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error " + res.status);
        return res.json();
      })
      .then(() => {
        setNewName("");
        setNewPrice("");
        setNewCategory("");
        setNewStock("");
        setNewDescription("");
        loadProducts();
      })
      .catch((error) => console.error("Error:", error));
  };

  const loadProducts = () => {
    fetch(`http://localhost:3000/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error", error));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-changed'));
  }, [cart]);

  useEffect(() => {
    const handleCartUpdate = () => {
      const saved = sessionStorage.getItem("cart") || "[]";
      if (saved !== JSON.stringify(cart)) {
        try {
          setCart(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('cart-changed', handleCartUpdate);
    return () => window.removeEventListener('cart-changed', handleCartUpdate);
  }, [cart]);

  const addToCart = (product: Product): void => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          return prev;
        }

        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (product: Product): void => {
    setCart((prev) => {

      return prev.filter((i) => i.product.id !== product.id);

    });
  };

  const updateQuantity = (productId: number, delta: number): void => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const removeItem = (productId: number): void => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleConfirmPurchase = (): void => {
    navigate("/checkout");
  };

  const [address, setAddress] = useState("");

  return (
    <>
      <div className="product-form">
        <label htmlFor="name">Nombre</label>
        <input type="text" id="name" placeholder="Ej. Camiseta" />
        <label htmlFor="description">Descripción</label>
        <input type="text" id="description" placeholder="Ej. Camiseta de algodón..." />
        <label htmlFor="price">Precio</label>
        <input type="number" id="price" placeholder="Ej. 19.99" />
        <label htmlFor="category">Categoría</label>
        <input type="text" id="category" placeholder="Ej. Ropa" />
        <label htmlFor="stock">Stock</label>
        <input type="number" id="stock" placeholder="Ej. 50" />
        <label htmlFor="imageURL">URL Imagen</label>
        <input type="text" id="imageURL" placeholder="https://..." />
        <button type="submit">Añadir</button>
      </div>


      <div className="products-grid">



        {products.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} onSelect={(id) => navigate(`/product/${id}`)} />
            <div className="product-card actions">
              <button title="Actualizar Stock"
                onClick={() => handleUpdateStock(product.id, product.stock)}>Actualizar Stock</button>
              {/* <button title="Eliminar" onClick={() => handleDelete(product.id)}>Eliminar</button> */}
              <button title="Añadir al carrito"
                disabled={product.stock === 0 || product.active === false}
                onClick={() => addToCart(product)}>Añadir al carrito</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p>Address: {address}</p>
        <input type="text" id="address" placeholder="Ej. Calle 123" onChange={(e) => setAddress(e.target.value)} />
        <button type="submit" onClick={() => alert("Función no implementada")}>Comprar</button>
      </div>
    </>
  );
}


export default App;


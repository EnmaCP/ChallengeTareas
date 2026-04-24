import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "./types";
import ProductCard from "./components/ProductCard";
import type {CartItem} from "./types";


function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() =>{
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
  },[cart]) //guardar datos en la sesion

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
      <div>
        <p>Carrito: {cart.length}</p>
        {(cart.length == 0) && (<p>El carrito está vacío</p>)}
        {(cart.length > 0) && (
        <div>
          {cart.map((item) =>(
            <div key={item.product.id}>
               {item.product.name} - {item.quantity} - {item.product.price} : {(Number(item.product.price) * item.quantity).toFixed(2)}
               <button title="Eliminar producto"
                onClick={() => removeFromCart(item.product)}>
                Eliminar producto</button>
               <br></br>
            </div>
          ))}


        </div>


        )}
        
        
          
      
      </div>

      <div className="products-grid">



        {products.map((product) => (
          <div key={product.id}>
            <ProductCard product ={product} onSelect={(id) => navigate(`/product/${id}`)}/>
            <div className="product-card actions">
              <button title="Actualizar Stock"
               onClick={() => handleUpdateStock(product.id, product.stock)}>Actualizar Stock</button>
              {/* <button title="Eliminar" onClick={() => handleDelete(product.id)}>Eliminar</button> */}
              <button title= "Añadir al carrito"
              onClick={() => addToCart(product)}>Compra perra</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


export default App;


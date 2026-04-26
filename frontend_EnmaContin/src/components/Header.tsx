import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import CartSummary from './CartSummary';

function Header() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const navigate = useNavigate();

    const loadData = () => {
        try {
            const rawCart = sessionStorage.getItem("cart");
            if (rawCart && rawCart !== "undefined") {
                setCart(JSON.parse(rawCart));
            } else {
                setCart([]);
            }
        } catch (e) {
            console.error("Error parsing cart", e);
        }

        try {
            const rawUser = sessionStorage.getItem("user");
            if (rawUser && rawUser !== "undefined") {
                setUser(JSON.parse(rawUser));
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error("Error parsing user", e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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

    const saveCart = (newCart: CartItem[]) => {
        setCart(newCart);
        sessionStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-changed'));
    };

    const updateQuantity = (productId: number, delta: number) => {
        const newCart = cart.map(item =>
            item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        ).filter(item => item.quantity > 0);
        saveCart(newCart);
    };

    const removeItem = (productId: number) => {
        const newCart = cart.filter(item => item.product.id !== productId);
        saveCart(newCart);
    };

    const handleConfirmPurchase = () => {
        setIsCartOpen(false);
        navigate("/checkout");
    };

    const cartArray = Array.isArray(cart) ? cart : [];
    const cartCount = cartArray.reduce((acc, item) => acc + (item.quantity || 0), 0);

    return (
        <header className="site-header">
            <div>
                <h1>CustomShop</h1>
                <p>Tu tienda de productos personalizados</p>
            </div>
            <div className="header-info">
                {user && <span className="username">Hola, {user.username}</span>}
                <div className="cart-dropdown-container">
                    <button className="cart-count" onClick={() => setIsCartOpen(!isCartOpen)}>
                        Carrito {cartCount > 0 ? `(${cartCount})` : ''}
                    </button>
                    {isCartOpen && (
                        <div className="cart-dropdown">
                            <CartSummary
                                cart={cartArray}
                                onUpdateQuantity={updateQuantity}
                                onRemoveItem={removeItem}
                                onConfirm={handleConfirmPurchase}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
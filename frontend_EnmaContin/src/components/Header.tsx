import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { CartItem } from '../types';
import CartSummary from './CartSummary';
import { useUser } from '../context/UserContext';

function Header() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const { customer: user, setCustomer } = useUser();
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
                {user ? (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span className="username">Hola, {user.username}</span>
                        {user.role === 'admin' && (
                            <Link to="/admin/users" style={{ color: 'white', textDecoration: 'underline' }}>Usuarios</Link>
                        )}
                        {user.role === 'customer' && (
                            <Link to="/mis-pedidos" style={{ color: 'white', textDecoration: 'underline' }}>Mis pedidos</Link>
                        )}
                        {(user.role === 'admin' || user.role === 'employee') && (
                            <Link to="/mis-pedidos" style={{ color: 'white', textDecoration: 'underline' }}>Historial de pedidos</Link>
                        )}
                        {(user.role === 'admin' || user.role === 'employee') && (
                            <Link to="/admin/orders" style={{ color: 'white', textDecoration: 'underline' }}>Pedidos</Link>
                        )}
                        {user.role === 'employee' && (
                            <Link to="/intranet" style={{ color: 'white', textDecoration: 'underline' }}>Panel de empleados</Link>
                        )}
                        <button onClick={async () => {
                            try {
                                await fetch('http://localhost:3000/api/auth/logout', {
                                    method: 'POST',
                                    credentials: 'include'
                                });
                            } catch (error) {
                                console.error('Error logging out', error);
                            }
                            setCustomer(null);
                            navigate('/login');
                        }} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginRight: '15px' }}>
                        <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Iniciar Sesión</Link>
                        <Link to="/register" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Registrarse</Link>
                    </div>
                )}
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
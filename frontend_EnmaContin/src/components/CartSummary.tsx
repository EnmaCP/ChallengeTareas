
import type { CartItem } from '../types';

interface CartSummaryProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: number, delta: number) => void;
    onRemoveItem: (productId: number) => void;
    onConfirm: () => void;
}

export default function CartSummary({ cart, onUpdateQuantity, onRemoveItem, onConfirm }: CartSummaryProps) {
    
    const totalPrice = cart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);

    const isCartEmpty = cart.length === 0;

    return (
        <>
        <div className="cart-summary">
            <h2>Resumen del Carrito</h2>
            {isCartEmpty ? (
                <p>Tu carrito está vacío.</p>
            ) : (
                <ul>
                    {cart.map((item) => (
                        <li key={item.product.id}>
                            <span>{item.product.name}</span>
                            <span>{item.quantity} x {Number(item.product.price).toFixed(2)} €</span>

                            <button onClick={() => onUpdateQuantity(item.product.id, -1)}>−</button>
                            <button onClick={() => onUpdateQuantity(item.product.id, 1)}>+</button>
                            <button onClick={() => onRemoveItem(item.product.id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
            <h3>Total: {Number(totalPrice).toFixed(2)} €</h3>
            <button onClick={onConfirm} disabled={isCartEmpty}>Ir a pagar</button>
        </div>
        </>
    );
};
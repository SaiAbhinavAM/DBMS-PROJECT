import React, { useState } from 'react';
import { orderAPI, paymentAPI } from '../services/api';
import '../styles/Cart.css';

const Cart = ({ cart, onRemove, onUpdateQuantity, onCheckout, customerID }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.PricePerUnit * item.quantity);
    }, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const orderItems = cart.map(item => ({
        productID: item.ProductID,
        quantity: item.quantity
      }));

      const orderResponse = await orderAPI.createOrder(customerID, orderItems);
      const orderID = orderResponse.data.OrderID;

      // Create payment
      await paymentAPI.createPayment(orderID, paymentMode, calculateTotal());

      setSuccess('Order placed successfully!');
      setShowPayment(false);
      
      setTimeout(() => {
        onCheckout();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h3>Shopping Cart</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {cart.length > 0 ? (
        <div>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.ProductID}>
                  <td>
                    <div>
                      <strong>{item.Name}</strong>
                      <p className="category">{item.Category}</p>
                    </div>
                  </td>
                  <td>₹{item.PricePerUnit}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.ProductID, parseInt(e.target.value))}
                      className="quantity-input"
                    />
                  </td>
                  <td className="subtotal">₹{(item.PricePerUnit * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => onRemove(item.ProductID)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <h4>Total: ₹{calculateTotal()}</h4>

            {!showPayment ? (
              <button onClick={() => setShowPayment(true)} className="checkout-btn">
                Proceed to Payment
              </button>
            ) : (
              <div className="payment-section">
                <h4>Select Payment Method</h4>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMode === 'card'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />
                    💳 Credit/Debit Card
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="upi"
                      checked={paymentMode === 'upi'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />
                    📱 UPI
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="bank_transfer"
                      checked={paymentMode === 'bank_transfer'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />
                    🏦 Bank Transfer
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMode === 'cash'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    />
                    💵 Cash
                  </label>
                </div>

                <div className="payment-buttons">
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="pay-btn"
                  >
                    {loading ? 'Processing...' : `Pay ₹${calculateTotal()}`}
                  </button>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="empty-cart">Your cart is empty. Add some products!</p>
      )}
    </div>
  );
};

export default Cart;
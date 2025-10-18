import React, { useState, useEffect } from 'react';
import { orderAPI, paymentAPI } from '../services/api';
import '../styles/OrderHistory.css';

const OrderHistory = ({ orders, customerID }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [payments, setPayments] = useState({});

  useEffect(() => {
    // Fetch order items and payments for all orders
    orders.forEach(order => {
      if (!orderDetails[order.OrderID]) {
        orderAPI.getOrderItems(order.OrderID)
          .then(res => {
            setOrderDetails(prev => ({
              ...prev,
              [order.OrderID]: res.data
            }));
          });
      }

      if (!payments[order.OrderID]) {
        paymentAPI.getOrderPayment(order.OrderID)
          .then(res => {
            setPayments(prev => ({
              ...prev,
              [order.OrderID]: res.data
            }));
          });
      }
    });
  }, [orders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'delivered': return 'delivered';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div className="order-history">
      {orders && orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.OrderID} className="order-item">
              <div
                className="order-header"
                onClick={() => setExpandedOrder(expandedOrder === order.OrderID ? null : order.OrderID)}
              >
                <div className="order-info">
                  <h4>Order #{order.OrderID}</h4>
                  <p className="order-date">{new Date(order.OrderDate).toLocaleDateString()}</p>
                </div>

                <div className="order-details-summary">
                  <span className={`status ${getStatusColor(order.Status)}`}>
                    {order.Status.toUpperCase()}
                  </span>
                  <span className="total">₹{order.TotalAmount}</span>
                  <span className="expand-icon">
                    {expandedOrder === order.OrderID ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedOrder === order.OrderID && (
                <div className="order-expanded">
                  <div className="items-section">
                    <h5>Order Items</h5>
                    {orderDetails[order.OrderID] ? (
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails[order.OrderID].map(item => (
                            <tr key={item.ProductID}>
                              <td>
                                <strong>{item.Name}</strong>
                                <p className="category">{item.Category}</p>
                              </td>
                              <td>₹{item.PricePerUnit}</td>
                              <td>{item.Quantity}</td>
                              <td>₹{item.Subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Loading items...</p>
                    )}
                  </div>

                  {payments[order.OrderID] && (
                    <div className="payment-section">
                      <h5>Payment Details</h5>
                      <div className="payment-info">
                        <p><strong>Mode:</strong> {payments[order.OrderID].Mode.toUpperCase()}</p>
                        <p><strong>Status:</strong> <span className="payment-status">{payments[order.OrderID].Status.toUpperCase()}</span></p>
                        <p><strong>Amount:</strong> ₹{payments[order.OrderID].Amount}</p>
                        <p><strong>Date:</strong> {new Date(payments[order.OrderID].PaymentDate).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="order-total">
                    <h5>Order Total: ₹{order.TotalAmount}</h5>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-orders">No orders yet. Start shopping!</p>
      )}
    </div>
  );
};

export default OrderHistory;
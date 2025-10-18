import React from 'react';
import '../styles/Components.css';

const ProductList = ({ products, onAddToCart }) => {
  return (
    <div className="products-grid">
      {products && products.length > 0 ? (
        products.map(product => (
          <div key={product.ProductID} className="product-card">
            <div className="product-header">
              <h4>{product.Name}</h4>
              <span className="category-badge">{product.Category}</span>
            </div>

            <div className="product-info">
              <p><strong>Price:</strong> ₹{product.PricePerUnit}/unit</p>
              <p><strong>Grower:</strong> {product.GrowerName}</p>
              <p><strong>Available Qty:</strong> {product.TotalQuantity || 'Check stock'}</p>
            </div>

            <button
              onClick={() => onAddToCart(product)}
              className="add-to-cart-btn"
            >
              🛒 Add to Cart
            </button>
          </div>
        ))
      ) : (
        <p className="no-data">No products available</p>
      )}
    </div>
  );
};

export default ProductList;
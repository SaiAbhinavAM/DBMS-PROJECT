import React from 'react';
import '../styles/Components.css';

const ProductList = ({ products, onAddToCart }) => {
  return (
    <div className="products-grid">
      {products && products.length > 0 ? (
        products.map(product => {
          const isOutOfStock = !product.TotalQuantity || product.TotalQuantity <= 0;

          return (
            <div key={product.ProductID} className="product-card">
              <div className="product-header">
                <h4>{product.Name}</h4>
                <span className="category-badge">{product.Category}</span>
              </div>

              <div className="product-info">
                <p><strong>Price:</strong> ₹{product.PricePerUnit}/unit</p>
                <p><strong>Grower:</strong> {product.GrowerName}</p>
                <p><strong>Available Qty:</strong> {isOutOfStock ? 'Out of Stock' : `${product.TotalQuantity} units`}</p>
              </div>

              <button
                onClick={() => onAddToCart(product)}
                className="add-to-cart-btn"
                disabled={isOutOfStock}
                style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
              >
                {isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
              </button>
            </div>
          );
        })
      ) : (
        <p className="no-data">No products available</p>
      )}
    </div>
  );
};

export default ProductList;
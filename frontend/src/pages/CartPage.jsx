import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import productService from "../services/productService";
import SectionHeader from "../components/common/SectionHeader";
import { formatCurrency } from "../utils/format";
import {
  readCart,
  removeCartItem,
  updateCartQuantity,
} from "../utils/cartStorage";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const syncCart = async () => {
    const storedCart = readCart();

    if (!storedCart.length) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const detailedItems = await Promise.all(
        storedCart.map(async (item) => {
          try {
            const response = await productService.getProductById(
              item.productId,
            );
            return {
              product: response.data.data.product,
              quantity: item.quantity,
            };
          } catch (_error) {
            return item.productSnapshot
              ? {
                  product: {
                    _id: item.productId,
                    name: item.productSnapshot.name,
                    slug: item.productSnapshot.slug,
                    price: item.productSnapshot.price,
                    currency: item.productSnapshot.currency,
                    images: item.productSnapshot.image
                      ? [
                          {
                            url: item.productSnapshot.image,
                            altText: item.productSnapshot.name,
                          },
                        ]
                      : [],
                    status: "unavailable",
                  },
                  quantity: item.quantity,
                }
              : null;
          }
        }),
      );

      setCartItems(detailedItems.filter(Boolean));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Unable to load cart items.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCart();

    const handleCartUpdate = () => syncCart();
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const handleQuantityChange = (productId, value) => {
    updateCartQuantity(productId, value);
    syncCart();
  };

  const handleRemove = (productId) => {
    removeCartItem(productId);
    syncCart();
  };

  return (
    <section className="page">
      <SectionHeader
        eyebrow="Cart"
        title="Your shopping cart"
        description="Cart items are resolved against live product data from the API."
      />

      {error ? (
        <div className="status-card status-card--error">{error}</div>
      ) : null}
      {loading ? <div className="status-card">Loading cart...</div> : null}

      {!loading && !cartItems.length ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/products" className="button-link">
            Continue shopping
          </Link>
        </div>
      ) : null}

      {!loading && cartItems.length ? (
        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map(({ product, quantity }) => {
              const primaryImage = product.images?.[0];

              return (
                <article className="cart-item" key={product._id}>
                  <Link
                    to={`/products/${product._id}`}
                    className="cart-item__media"
                  >
                    {primaryImage?.url ? (
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.altText || product.name}
                      />
                    ) : (
                      <div className="product-card__placeholder">No image</div>
                    )}
                  </Link>

                  <div className="cart-item__body">
                    <div>
                      <p className="cart-item__meta">
                        {product.category?.name || "Uncategorized"}
                      </p>
                      <h2>
                        <Link to={`/products/${product._id}`}>
                          {product.name}
                        </Link>
                      </h2>
                      <p>{formatCurrency(product.price, product.currency)}</p>
                    </div>

                    <div className="cart-item__actions">
                      <label>
                        <span>Qty</span>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(event) =>
                            handleQuantityChange(
                              product._id,
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="button-link button-link--secondary"
                        onClick={() => handleRemove(product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="summary-card">
            <h3>Order summary</h3>
            <div className="summary-card__row">
              <span>Items</span>
              <strong>{cartItems.length}</strong>
            </div>
            <div className="summary-card__row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <Link to="/checkout" className="button-link">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default CartPage;

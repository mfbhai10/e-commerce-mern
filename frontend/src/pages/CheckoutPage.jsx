import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import orderService from "../services/orderService";
import productService from "../services/productService";
import SectionHeader from "../components/common/SectionHeader";
import { clearCart, readCart } from "../utils/cartStorage";
import { hasToken } from "../utils/authStorage";
import { formatCurrency } from "../utils/format";

const CheckoutPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    paymentMethod: "cod",
    customerNote: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!hasToken()) {
        setAuthRequired(true);
        setAuthLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        setUser(response.data.data.user);
        setForm((current) => ({
          ...current,
          fullName: response.data.data.user.name || current.fullName,
        }));
      } catch (_error) {
        setAuthRequired(true);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  const syncCart = async () => {
    const storedCart = readCart();

    if (!storedCart.length) {
      setCartItems([]);
      setLoadingCart(false);
      return;
    }

    try {
      setLoadingCart(true);
      const detailedItems = await Promise.all(
        storedCart.map(async (item) => {
          const response = await productService.getProductById(item.productId);
          return {
            product: response.data.data.product,
            quantity: item.quantity,
          };
        }),
      );

      setCartItems(detailedItems);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load checkout items.",
      );
    } finally {
      setLoadingCart(false);
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

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
        billingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
        payment: { method: form.paymentMethod },
        notes: { customerNote: form.customerNote },
      };

      await orderService.createOrder(payload);
      clearCart();
      setCartItems([]);
      setSuccessMessage("Order created successfully.");
      window.setTimeout(() => {
        window.location.href = "/products";
      }, 1200);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Unable to submit checkout.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <section className="page">
        <div className="status-card">Checking authentication...</div>
      </section>
    );
  }

  if (authRequired) {
    return (
      <section className="page page--centered">
        <div className="empty-state">
          <p>You need to sign in before checking out.</p>
          <Link to="/login" className="button-link">
            Go to login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <SectionHeader
        eyebrow="Checkout"
        title="Complete your order"
        description="Shipping and payment data are submitted to the backend using the live cart contents."
      />

      {error ? (
        <div className="status-card status-card--error">{error}</div>
      ) : null}
      {successMessage ? (
        <div className="status-card status-card--success">{successMessage}</div>
      ) : null}
      {loadingCart ? (
        <div className="status-card">Loading checkout items...</div>
      ) : null}

      {!loadingCart && !cartItems.length ? (
        <div className="empty-state">
          <p>No items in your cart.</p>
          <Link to="/products" className="button-link">
            Browse products
          </Link>
        </div>
      ) : null}

      {!loadingCart && cartItems.length ? (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field">
                <span>Full name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  required
                />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  required
                />
              </label>
              <label className="form-field form-field--full">
                <span>Address line 1</span>
                <input
                  type="text"
                  value={form.line1}
                  onChange={handleChange("line1")}
                  required
                />
              </label>
              <label className="form-field form-field--full">
                <span>Address line 2</span>
                <input
                  type="text"
                  value={form.line2}
                  onChange={handleChange("line2")}
                />
              </label>
              <label className="form-field">
                <span>City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange("city")}
                  required
                />
              </label>
              <label className="form-field">
                <span>State</span>
                <input
                  type="text"
                  value={form.state}
                  onChange={handleChange("state")}
                />
              </label>
              <label className="form-field">
                <span>Postal code</span>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={handleChange("postalCode")}
                  required
                />
              </label>
              <label className="form-field">
                <span>Country</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={handleChange("country")}
                  required
                  maxLength="2"
                />
              </label>
              <label className="form-field form-field--full">
                <span>Payment method</span>
                <select
                  value={form.paymentMethod}
                  onChange={handleChange("paymentMethod")}
                >
                  <option value="cod">Cash on delivery</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="manual">Manual</option>
                </select>
              </label>
              <label className="form-field form-field--full">
                <span>Customer note</span>
                <textarea
                  value={form.customerNote}
                  onChange={handleChange("customerNote")}
                  rows="4"
                />
              </label>
            </div>

            <button type="submit" className="button-link" disabled={submitting}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </form>

          <aside className="summary-card">
            <h3>Order summary</h3>
            {cartItems.map(({ product, quantity }) => (
              <div className="summary-card__item" key={product._id}>
                <span>{product.name}</span>
                <strong>
                  {formatCurrency(product.price * quantity, product.currency)}
                </strong>
              </div>
            ))}
            <div className="summary-card__row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="summary-card__note">
              Signed in as <strong>{user?.name || user?.email}</strong>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default CheckoutPage;

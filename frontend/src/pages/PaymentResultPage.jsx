import { useEffect, useMemo } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import SectionHeader from "../components/common/SectionHeader";
import { clearCart } from "../utils/cartStorage";

const statusConfig = {
  success: {
    title: "Payment successful",
    description:
      "Your payment was processed successfully. We are now preparing your order.",
    badge: "Success",
    className: "status-card--success",
  },
  fail: {
    title: "Payment failed",
    description:
      "The payment could not be completed. You can review your checkout details and try again.",
    badge: "Failed",
    className: "status-card--error",
  },
  cancel: {
    title: "Payment cancelled",
    description:
      "You cancelled the payment process. Your order is not paid yet.",
    badge: "Cancelled",
    className: "status-card--error",
  },
};

const PaymentResultPage = () => {
  const navigate = useNavigate();
  const { status } = useParams();
  const [searchParams] = useSearchParams();

  const paymentStatus = useMemo(() => {
    if (statusConfig[status]) {
      return status;
    }

    return "fail";
  }, [status]);

  useEffect(() => {
    if (paymentStatus === "success") {
      clearCart();
    }
  }, [paymentStatus]);

  const source = searchParams.get("source") || "gateway";

  return (
    <section className="page payment-result-page">
      <SectionHeader
        eyebrow="Payment"
        title={statusConfig[paymentStatus].title}
        description={statusConfig[paymentStatus].description}
      />

      <div className={`status-card ${statusConfig[paymentStatus].className}`}>
        <strong>{statusConfig[paymentStatus].badge}</strong>
        <p>Source: {source === "cod" ? "Cash on Delivery" : "SSLCommerz"}</p>
      </div>

      <div className="payment-result-actions">
        {paymentStatus === "success" ? (
          <>
            <Link to="/products" className="button-link">
              Continue shopping
            </Link>
            <button
              type="button"
              className="button-link button-link--secondary"
              onClick={() => navigate("/", { replace: true })}
            >
              Go to home
            </button>
          </>
        ) : (
          <>
            <Link to="/checkout" className="button-link">
              Try checkout again
            </Link>
            <Link to="/cart" className="button-link button-link--secondary">
              Back to cart
            </Link>
          </>
        )}
      </div>
    </section>
  );
};

export default PaymentResultPage;

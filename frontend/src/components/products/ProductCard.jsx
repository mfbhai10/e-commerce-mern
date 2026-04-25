import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";

const ProductCard = ({ product }) => {
  const primaryImage =
    product.images?.find((image) => image.isPrimary) || product.images?.[0];

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card__media">
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-card__placeholder">No image available</div>
        )}
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.category?.name || "Uncategorized"}</span>
          <span>{product.status}</span>
        </div>
        <h3 className="product-card__title">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__description">
          {product.shortDescription || product.description}
        </p>
        <div className="product-card__footer">
          <strong>{formatCurrency(product.price, product.currency)}</strong>
          <Link to={`/products/${product._id}`} className="product-card__link">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

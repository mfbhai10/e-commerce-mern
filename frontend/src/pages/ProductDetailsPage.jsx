import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import productService from "../services/productService";
import ProductCard from "../components/products/ProductCard";
import SectionHeader from "../components/common/SectionHeader";
import { addToCart } from "../utils/cartStorage";
import { formatCurrency } from "../utils/format";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const productResponse = await productService.getProductById(id);
        const currentProduct = productResponse.data.data.product;
        setProduct(currentProduct);
        setSelectedImageIndex(0);
        setQuantity(1);

        if (currentProduct.category?._id) {
          const relatedResponse = await productService.getProducts({
            category: currentProduct.category._id,
            status: "active",
            limit: 4,
            sort: "-createdAt",
          });

          const related = (relatedResponse.data.data.products || []).filter(
            (item) => item._id !== currentProduct._id,
          );

          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load product details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const images = useMemo(() => product?.images || [], [product]);
  const activeImage = images[selectedImageIndex] || images[0];
  const stockQuantity = product?.stock?.quantity || 0;
  const canAddToCart = Boolean(product) && stockQuantity > 0;

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(product, quantity);
    setMessage("Added to cart.");
  };

  return (
    <div className="stack-lg">
      <section className="page">
        <SectionHeader
          eyebrow="Product"
          title={product?.name || "Product details"}
          description={
            product?.shortDescription ||
            "Loading product information from the API."
          }
        />

        {error ? (
          <div className="status-card status-card--error">{error}</div>
        ) : null}
        {loading ? (
          <div className="status-card">Loading product details...</div>
        ) : null}

        {!loading && product ? (
          <div className="details-layout">
            <div className="details-gallery">
              <div className="details-gallery__main">
                {activeImage?.url ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.altText || product.name}
                  />
                ) : (
                  <div className="product-card__placeholder product-card__placeholder--large">
                    No image available
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="details-thumbs">
                  {images.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      className={
                        index === selectedImageIndex
                          ? "details-thumb details-thumb--active"
                          : "details-thumb"
                      }
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || product.name}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="details-info">
              <div className="details-info__meta">
                <span>{product.category?.name || "Uncategorized"}</span>
                <span>{product.status}</span>
              </div>
              <h2>{product.name}</h2>
              <p>{product.description}</p>

              <div className="details-price">
                <strong>
                  {formatCurrency(product.price, product.currency)}
                </strong>
                {product.compareAtPrice ? (
                  <span>
                    {formatCurrency(product.compareAtPrice, product.currency)}
                  </span>
                ) : null}
              </div>

              <div className="details-specs">
                <div>
                  <span>SKU</span>
                  <strong>{product.sku}</strong>
                </div>
                <div>
                  <span>Brand</span>
                  <strong>{product.brand || "N/A"}</strong>
                </div>
                <div>
                  <span>Stock</span>
                  <strong>
                    {stockQuantity > 0
                      ? `${stockQuantity} available`
                      : "Out of stock"}
                  </strong>
                </div>
              </div>

              {product.attributes && Object.keys(product.attributes).length ? (
                <div className="details-attributes">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="details-actions">
                <label className="quantity-control">
                  <span>Quantity</span>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={stockQuantity || undefined}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) =>
                          stockQuantity
                            ? Math.min(stockQuantity, current + 1)
                            : current + 1,
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  className="button-link"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                >
                  {canAddToCart ? "Add to cart" : "Unavailable"}
                </button>
                <Link to="/cart" className="button-link button-link--secondary">
                  Go to cart
                </Link>
              </div>

              {message ? (
                <div className="status-card status-card--success">
                  {message}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {!loading && relatedProducts.length ? (
        <section className="page">
          <SectionHeader
            eyebrow="Related"
            title="More from this category"
            description="Related products are fetched from the API using the current product category."
          />
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProductDetailsPage;

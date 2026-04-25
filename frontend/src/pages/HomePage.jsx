import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductCard from "../components/products/ProductCard";
import SectionHeader from "../components/common/SectionHeader";
import { formatCurrency } from "../utils/format";

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] = await Promise.all([
          productService.getProducts({
            status: "active",
            isFeatured: true,
            limit: 8,
          }),
          categoryService.getCategories({ isActive: true, limit: 6 }),
        ]);

        setFeaturedProducts(productsResponse.data.data.products || []);
        setCategories(categoriesResponse.data.data.categories || []);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load homepage content.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="stack-xl">
      <section className="hero page">
        <div className="hero__content">
          <p className="section-header__eyebrow">Premium commerce</p>
          <h1 className="hero__title">
            Launch a modern store with real inventory, real data, and a clean
            UX.
          </h1>
          <p className="hero__description">
            Browse featured products, explore categories, and move from product
            discovery to checkout without leaving the app.
          </p>

          <div className="hero__actions">
            <Link to="/products" className="button-link">
              Shop products
            </Link>
            <Link to="/login" className="button-link button-link--secondary">
              Sign in
            </Link>
          </div>

          <div className="hero__stats">
            <div>
              <strong>{featuredProducts.length}</strong>
              <span>Featured items</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>Categories loaded</span>
            </div>
            <div>
              <strong>
                {featuredProducts.length
                  ? formatCurrency(
                      featuredProducts[0].price,
                      featuredProducts[0].currency,
                    )
                  : "$0"}
              </strong>
              <span>Entry price</span>
            </div>
          </div>
        </div>

        <div className="hero__panel">
          <div className="hero__card hero__card--accent">
            <span>API backed</span>
            <strong>
              Products, categories, auth, and checkout are connected to the
              backend.
            </strong>
          </div>
          <div className="hero__card">
            <span>Responsive</span>
            <strong>
              Layout adapts across mobile, tablet, and desktop without a
              separate design system.
            </strong>
          </div>
        </div>
      </section>

      {error ? (
        <div className="status-card status-card--error">{error}</div>
      ) : null}
      {loading ? (
        <div className="status-card">Loading homepage data...</div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="page">
            <SectionHeader
              eyebrow="Categories"
              title="Shop by category"
              description="Categories are fetched from the API and rendered as a responsive collection."
            />
            <div className="category-grid">
              {categories.map((category) => (
                <Link
                  to={`/products?category=${category._id}`}
                  key={category._id}
                  className="category-card"
                >
                  <strong>{category.name}</strong>
                  <span>
                    {category.description ||
                      "Browse products in this collection."}
                  </span>
                </Link>
              ))}

              {!categories.length ? (
                <div className="empty-state">
                  No categories available right now.
                </div>
              ) : null}
            </div>
          </section>

          <section className="page">
            <SectionHeader
              eyebrow="Featured"
              title="Featured products"
              description="These products are loaded directly from the API and sorted by current featured status."
              action={
                <Link to="/products" className="text-link">
                  View all products
                </Link>
              }
            />

            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {!featuredProducts.length ? (
              <div className="empty-state">
                No featured products were returned.
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default HomePage;

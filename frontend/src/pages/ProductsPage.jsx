import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductCard from "../components/products/ProductCard";
import SectionHeader from "../components/common/SectionHeader";

const PAGE_SIZE = 12;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "-createdAt",
  }));

  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoryError("");
        const response = await categoryService.getCategories({
          isActive: true,
          limit: 50,
        });
        setCategories(response.data.data.categories || []);
      } catch (requestError) {
        setCategoryError(
          requestError?.response?.data?.message || "Unable to load categories.",
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await productService.getProducts({
          page,
          limit: PAGE_SIZE,
          status: "active",
          search: filters.search || undefined,
          category: filters.category || undefined,
          sort: filters.sort,
        });

        const payload = response.data.data;
        setProducts(payload.products || []);
        setPagination(payload.pagination || { page: 1, pages: 1, total: 0 });
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message || "Unable to load products.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters, page]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current);

      if (field === "search") nextParams.set("search", value);
      if (field === "category") nextParams.set("category", value);
      if (field === "sort") nextParams.set("sort", value);
      nextParams.set("page", "1");

      return nextParams;
    });
  };

  const goToPage = (nextPage) => {
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current);
      nextParams.set("page", String(nextPage));
      return nextParams;
    });
  };

  return (
    <div className="stack-lg">
      <section className="page">
        <SectionHeader
          eyebrow="Catalog"
          title="Browse products"
          description="Products are fetched from the API with filters, pagination, and responsive cards."
        />

        <div className="toolbar">
          <label className="toolbar__field">
            <span>Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search products"
            />
          </label>

          <label className="toolbar__field">
            <span>Category</span>
            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="toolbar__field">
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              <option value="-createdAt">Newest first</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>

        {categoryError ? (
          <div className="status-card status-card--error">{categoryError}</div>
        ) : null}
      </section>

      {error ? (
        <div className="status-card status-card--error">{error}</div>
      ) : null}
      {loading ? <div className="status-card">Loading products...</div> : null}

      {!loading && !error ? (
        <section className="page">
          <div className="section-meta">
            <p>{pagination.total} products found</p>
            {loadingCategories ? (
              <span>Loading category filters...</span>
            ) : null}
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {!products.length ? (
            <div className="empty-state">
              No products matched your current filters.
            </div>
          ) : null}

          <div className="pagination">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              type="button"
              onClick={() =>
                goToPage(Math.min(pagination.pages || 1, pagination.page + 1))
              }
              disabled={pagination.page >= (pagination.pages || 1)}
            >
              Next
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProductsPage;

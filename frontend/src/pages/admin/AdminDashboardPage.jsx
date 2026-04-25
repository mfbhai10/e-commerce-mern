import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import categoryService from '../../services/categoryService';
import SectionHeader from '../../components/common/SectionHeader';
import { formatCurrency, formatDate } from '../../utils/format';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, categories: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [productsResponse, ordersResponse, categoriesResponse] = await Promise.all([
          productService.getProducts({ limit: 1 }),
          orderService.getAllOrders({ limit: 5 }),
          categoryService.getCategories({ limit: 1 }),
        ]);

        setStats({
          products: productsResponse.data.data.pagination?.total || 0,
          orders: ordersResponse.data.data.pagination?.total || 0,
          categories: categoriesResponse.data.data.pagination?.total || 0,
        });
        setRecentOrders(ordersResponse.data.data.orders || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Unable to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="stack-lg">
      <section className="page admin-page-header">
        <SectionHeader
          eyebrow="Admin overview"
          title="Dashboard"
          description="Monitor store activity and jump into product, order, or category management."
          action={(
            <div className="admin-header-actions">
              <Link to="/products" className="button-link button-link--secondary">
                View storefront
              </Link>
            </div>
          )}
        />

        {error ? <div className="status-card status-card--error">{error}</div> : null}
        {loading ? <div className="status-card">Loading dashboard data...</div> : null}

        {!loading ? (
          <div className="admin-stats-grid">
            <article className="admin-stat-card">
              <span>Products</span>
              <strong>{stats.products}</strong>
              <Link to="/admin/products">Manage products</Link>
            </article>
            <article className="admin-stat-card">
              <span>Orders</span>
              <strong>{stats.orders}</strong>
              <Link to="/admin/orders">Review orders</Link>
            </article>
            <article className="admin-stat-card">
              <span>Categories</span>
              <strong>{stats.categories}</strong>
              <Link to="/admin/categories">Edit categories</Link>
            </article>
          </div>
        ) : null}
      </section>

      {!loading && recentOrders.length ? (
        <section className="page">
          <SectionHeader
            eyebrow="Recent"
            title="Latest orders"
            description="The most recent orders are fetched directly from the backend."
          />

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                    <td>{order.status}</td>
                    <td>{order.payment?.status || 'pending'}</td>
                    <td>{formatCurrency(order.pricing?.total, order.currency)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;

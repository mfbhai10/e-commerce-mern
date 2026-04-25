import { useEffect, useState } from 'react';
import orderService from '../../services/orderService';
import SectionHeader from '../../components/common/SectionHeader';
import { formatCurrency, formatDate } from '../../utils/format';

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderService.getAllOrders({ limit: 100 });
      const nextOrders = response.data.data.orders || [];
      setOrders(nextOrders);
      setDrafts(
        nextOrders.reduce((acc, order) => {
          acc[order._id] = {
            status: order.status,
            paymentStatus: order.payment?.status || 'pending',
          };
          return acc;
        }, {}),
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDraftChange = (id, field) => (event) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: event.target.value,
      },
    }));
  };

  const handleSave = async (id) => {
    try {
      setSavingId(id);
      setMessage('');
      await orderService.updateOrderStatus(id, {
        status: drafts[id].status,
        paymentStatus: drafts[id].paymentStatus,
      });
      setMessage('Order updated successfully.');
      await loadOrders();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to update order.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="stack-lg">
      <section className="page">
        <SectionHeader
          eyebrow="Admin"
          title="Order management"
          description="Review orders and update fulfillment and payment state from live backend data."
        />

        {message ? <div className="status-card status-card--success">{message}</div> : null}
        {error ? <div className="status-card status-card--error">{error}</div> : null}
        {loading ? <div className="status-card">Loading orders...</div> : null}
      </section>

      {!loading ? (
        <section className="page">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                    <td>{formatCurrency(order.pricing?.total, order.currency)}</td>
                    <td>{order.status}</td>
                    <td>{order.payment?.status || 'pending'}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="admin-order-actions">
                        <select value={drafts[order._id]?.status || order.status} onChange={handleDraftChange(order._id, 'status')}>
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <select value={drafts[order._id]?.paymentStatus || order.payment?.status || 'pending'} onChange={handleDraftChange(order._id, 'paymentStatus')}>
                          {paymentStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <button type="button" className="button-link button-link--secondary" disabled={savingId === order._id} onClick={() => handleSave(order._id)}>
                          {savingId === order._id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </td>
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

export default AdminOrdersPage;

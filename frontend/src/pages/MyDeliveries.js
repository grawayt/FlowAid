import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function MyDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmData, setConfirmData] = useState({ quantity: '', note: '' });

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setError('');
      const data = await api.getDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const pending = deliveries.filter((d) => d.status === 'pending');
  const confirmed = deliveries.filter((d) => d.status === 'confirmed');

  const handleConfirmClick = (delivery) => {
    setConfirmingId(delivery.id);
    setConfirmData({ quantity: delivery.quantity || '', note: '' });
  };

  const handleCancelConfirm = () => {
    setConfirmingId(null);
    setConfirmData({ quantity: '', note: '' });
  };

  const handleSubmitConfirm = async (e) => {
    e.preventDefault();
    try {
      await api.manualConfirm(confirmingId, {
        quantity: parseInt(confirmData.quantity),
        note: confirmData.note,
      });
      setConfirmingId(null);
      setConfirmData({ quantity: '', note: '' });
      fetchDeliveries();
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery');
    }
  };

  if (loading) {
    return <div className="loading">Loading deliveries...</div>;
  }

  return (
    <div className="my-deliveries">
      <h1>My Deliveries</h1>

      {error && <div className="error-message">{error}</div>}

      <section className="deliveries-section">
        <h2>Pending Confirmation ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="empty-state">No pending deliveries</p>
        ) : (
          <div className="deliveries-list">
            {pending.map((delivery) => (
              <div key={delivery.id} className="delivery-card pending">
                {confirmingId === delivery.id && (
                  <div className="confirm-form">
                    <form onSubmit={handleSubmitConfirm}>
                      <div className="form-group">
                        <label htmlFor="quantity">Quantity Delivered</label>
                        <input
                          id="quantity"
                          type="number"
                          value={confirmData.quantity}
                          onChange={(e) =>
                            setConfirmData({ ...confirmData, quantity: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="note">Note (optional)</label>
                        <textarea
                          id="note"
                          value={confirmData.note}
                          onChange={(e) =>
                            setConfirmData({ ...confirmData, note: e.target.value })
                          }
                          rows="3"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleCancelConfirm}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {confirmingId !== delivery.id && (
                  <>
                    <div className="delivery-info">
                      <h3>{delivery.school_name}</h3>
                      <p className="reference">Reference: {delivery.reference_code}</p>
                      <p className="quantity">Quantity: {delivery.quantity} pads</p>
                      <p className="date">
                        Date: {new Date(delivery.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirmClick(delivery)}
                    >
                      Confirm Manually
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="deliveries-section">
        <h2>Confirmed ({confirmed.length})</h2>
        {confirmed.length === 0 ? (
          <p className="empty-state">No confirmed deliveries</p>
        ) : (
          <div className="deliveries-list">
            {confirmed.map((delivery) => (
              <div key={delivery.id} className="delivery-card confirmed">
                <div className="delivery-info">
                  <h3>{delivery.school_name}</h3>
                  <p className="reference">Reference: {delivery.reference_code}</p>
                  <p className="quantity">Quantity: {delivery.quantity} pads</p>
                  <p className="date">
                    Date: {new Date(delivery.date).toLocaleDateString()}
                  </p>
                  <p className="status">Confirmed on {new Date(delivery.confirmed_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

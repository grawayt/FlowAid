import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setError('');
      const [overviewData, orgsData] = await Promise.all([
        api.getOverview(),
        api.getPendingOrgs(),
      ]);
      setOverview(overviewData);
      setPendingOrgs(orgsData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orgId) => {
    try {
      await api.approveOrg(orgId, '');
      setPendingOrgs((prev) => prev.filter((org) => org.id !== orgId));
    } catch (err) {
      setError(err.message || 'Failed to approve organisation');
    }
  };

  const handleRejectClick = (orgId) => {
    setRejectingId(orgId);
    setRejectNotes('');
  };

  const handleSubmitReject = async (e) => {
    e.preventDefault();
    try {
      await api.rejectOrg(rejectingId, rejectNotes);
      setPendingOrgs((prev) => prev.filter((org) => org.id !== rejectingId));
      setRejectingId(null);
      setRejectNotes('');
    } catch (err) {
      setError(err.message || 'Failed to reject organisation');
    }
  };

  const handleCancelReject = () => {
    setRejectingId(null);
    setRejectNotes('');
  };

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {error && <div className="error-message">{error}</div>}

      {overview && (
        <section className="overview-stats">
          <h2>Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Organisations</h3>
              <p className="stat-value">{overview.total_organisations || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Deliveries</h3>
              <p className="stat-value">{overview.total_deliveries || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Pads Distributed</h3>
              <p className="stat-value">{overview.total_pads_distributed || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Schools Served</h3>
              <p className="stat-value">{overview.schools_served || 0}</p>
            </div>
          </div>
        </section>
      )}

      <section className="pending-organisations">
        <h2>Pending Organisations ({pendingOrgs.length})</h2>

        {pendingOrgs.length === 0 ? (
          <p className="empty-state">No pending organisations</p>
        ) : (
          <div className="orgs-list">
            {pendingOrgs.map((org) => (
              <div key={org.id} className="org-card">
                {rejectingId === org.id && (
                  <div className="reject-form">
                    <form onSubmit={handleSubmitReject}>
                      <div className="form-group">
                        <label htmlFor="reject-notes">Rejection Notes</label>
                        <textarea
                          id="reject-notes"
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          rows="4"
                          placeholder="Explain why this organisation is being rejected..."
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-danger">
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleCancelReject}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {rejectingId !== org.id && (
                  <>
                    <div className="org-info">
                      <h3>{org.name}</h3>
                      <p className="registration">
                        <strong>Registration Number:</strong> {org.registration_number}
                      </p>
                      <p className="type">
                        <strong>Type:</strong> {org.type}
                      </p>
                      <p className="counties">
                        <strong>Coverage:</strong>{' '}
                        {Array.isArray(org.coverage_counties)
                          ? org.coverage_counties.join(', ')
                          : org.coverage_counties}
                      </p>
                      <p className="contact">
                        <strong>Contact:</strong> {org.contact_name} ({org.contact_email})
                      </p>
                    </div>
                    <div className="org-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(org.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRejectClick(org.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

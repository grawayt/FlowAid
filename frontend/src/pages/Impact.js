import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Impact() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    try {
      setError('');
      // TODO: Get the actual orgId from user context
      const orgId = 'placeholder-org-id';
      const data = await api.getImpact(orgId);
      setImpact(data);
    } catch (err) {
      setError(err.message || 'Failed to load impact data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    alert('PDF export coming soon!');
  };

  if (loading) {
    return <div className="loading">Loading impact data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="impact-page">
      <h1>Impact Dashboard</h1>

      <section className="impact-stats">
        <div className="stat-card">
          <h3>Total Deliveries</h3>
          <p className="stat-value">{impact?.total_deliveries || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Pads Distributed</h3>
          <p className="stat-value">{impact?.total_pads_distributed || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Schools Served</h3>
          <p className="stat-value">{impact?.schools_served || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Girls Reached</h3>
          <p className="stat-value">{impact?.girls_reached || 0}</p>
        </div>
      </section>

      <section className="impact-chart">
        <h2>Delivery Trends</h2>
        {/* TODO: add trend chart */}
        <div className="chart-placeholder">
          Chart visualization will be added here
        </div>
      </section>

      <section className="impact-actions">
        <button className="btn btn-primary" onClick={handleExportPDF}>
          Export PDF Report
        </button>
      </section>
    </div>
  );
}

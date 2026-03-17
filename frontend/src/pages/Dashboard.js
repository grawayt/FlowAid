import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { api } from '../utils/api';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

const URGENCY_COLORS = {
  1: '#22c55e', // green — running low
  2: '#f59e0b', // amber — almost out
  3: '#ef4444', // red — completely out
};

const URGENCY_LABELS = {
  1: 'Running low',
  2: 'Almost out',
  3: 'Completely out',
};

function Dashboard() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [needs, setNeeds] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [countyFilter, setCountyFilter] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [claiming, setClaiming] = useState(false);

  const fetchNeeds = useCallback(async () => {
    try {
      const params = {};
      if (countyFilter) params.county = countyFilter;
      const data = await api.getNeeds(params);
      setNeeds(data);
    } catch (err) {
      console.error('Failed to fetch needs:', err);
    }
  }, [countyFilter]);

  // Initialize map — Kenya bounds
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [37.9, 0.5], // Kenya center
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  // Fetch needs on mount and filter change
  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  // Update map markers when needs change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    document.querySelectorAll('.need-marker').forEach((el) => el.remove());

    needs.forEach((need) => {
      if (!need.school?.latitude || !need.school?.longitude) return;

      const el = document.createElement('div');
      el.className = 'need-marker';
      el.style.cssText = `
        width: 16px; height: 16px;
        background: ${URGENCY_COLORS[need.urgency]};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      `;

      el.addEventListener('click', () => setSelectedNeed(need));

      new mapboxgl.Marker(el)
        .setLngLat([need.school.longitude, need.school.latitude])
        .addTo(map.current);
    });
  }, [needs]);

  const daysSince = (dateStr) =>
    Math.ceil((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const handleClaim = async () => {
    if (!selectedNeed || !claimDate) return;
    setClaiming(true);
    try {
      // TODO: get real org ID from auth context
      await api.claimNeed(selectedNeed.id, {
        organisation_id: 'placeholder',
        expected_delivery_date: claimDate,
      });
      setSelectedNeed(null);
      setClaimDate('');
      fetchNeeds();
    } catch (err) {
      alert(err.message);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <h2>Open Needs</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Filter by county..."
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
          />
        </div>

        <div className="needs-list">
          {needs.length === 0 && <p className="empty">No open needs found.</p>}

          {needs.map((need) => (
            <div
              key={need.id}
              className={`need-card urgency-${need.urgency} ${selectedNeed?.id === need.id ? 'selected' : ''}`}
              onClick={() => setSelectedNeed(need)}
            >
              <div className="need-header">
                <span
                  className="urgency-dot"
                  style={{ background: URGENCY_COLORS[need.urgency] }}
                />
                <strong>{need.school?.name || 'Unknown School'}</strong>
              </div>
              <div className="need-details">
                <span>{need.school?.county}</span>
                <span>{URGENCY_LABELS[need.urgency]}</span>
                <span>~{need.approximate_quantity} pads</span>
                <span>{daysSince(need.posted_at)} day(s) ago</span>
              </div>

              {selectedNeed?.id === need.id && (
                <div className="claim-section">
                  <label>
                    Expected delivery date:
                    <input
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={handleClaim}
                    disabled={claiming || !claimDate}
                  >
                    {claiming ? 'Claiming...' : 'Claim This Need'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-map" ref={mapContainer} />
    </div>
  );
}

export default Dashboard;

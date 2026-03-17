import { useState } from 'react';
import { api } from '../utils/api';

export default function Apply() {
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    type: 'ngo',
    description: '',
    contact_name: '',
    contact_email: '',
    contact_whatsapp: '',
    coverage_counties: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert coverage_counties string to array
      const applicationData = {
        ...formData,
        coverage_counties: formData.coverage_counties
          .split(',')
          .map((county) => county.trim())
          .filter((county) => county),
      };
      await api.apply(applicationData);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Application submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="apply-page">
        <div className="success-message">
          <h2>Application Submitted</h2>
          <p>Thank you for applying to FlowAid. We will review your application and contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-container">
        <h1>Apply to Join FlowAid</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="apply-form">
          <div className="form-group">
            <label htmlFor="name">Organisation Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="registration_number">Registration Number</label>
            <input
              id="registration_number"
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Organisation Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="ngo">NGO</option>
              <option value="delivery">Delivery Partner</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Tell us about your organisation and mission..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_name">Contact Name</label>
            <input
              id="contact_name"
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_email">Contact Email</label>
            <input
              id="contact_email"
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_whatsapp">Contact WhatsApp</label>
            <input
              id="contact_whatsapp"
              type="tel"
              name="contact_whatsapp"
              value={formData.contact_whatsapp}
              onChange={handleChange}
              required
              placeholder="+254..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="coverage_counties">Coverage Counties (comma separated)</label>
            <input
              id="coverage_counties"
              type="text"
              name="coverage_counties"
              value={formData.coverage_counties}
              onChange={handleChange}
              required
              placeholder="e.g. Nairobi, Kisii, Mombasa"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

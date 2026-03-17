import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <h1>FlowAid</h1>
        <p className="tagline">Connecting schools with menstrual health supplies across Kenya</p>
      </header>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Schools Register</h3>
            <p>Schools register their needs via WhatsApp for easy access and communication.</p>
          </div>
          <div className="step">
            <h3>2. Post Needs</h3>
            <p>Schools post their requirements for menstrual health supplies to the platform.</p>
          </div>
          <div className="step">
            <h3>3. NGOs Deliver</h3>
            <p>NGOs and delivery partners fulfill the requests and distribute supplies.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <Link to="/login" className="btn btn-primary">
          Login
        </Link>
        <Link to="/apply" className="btn btn-secondary">
          Apply to Join
        </Link>
      </section>
    </div>
  );
}

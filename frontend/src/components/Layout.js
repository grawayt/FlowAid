import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/dashboard">FlowAid</Link>
        </div>
        <ul className="navbar-links">
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/deliveries">My Deliveries</Link>
          </li>
          <li>
            <Link to="/impact">Impact</Link>
          </li>
        </ul>
        <button className="btn btn-secondary" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}

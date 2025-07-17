import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>Welcome to Smart Home Planner</h1>
      <Link to="/templates">
        <button>Start Planning</button>
      </Link>
    </div>
  );
}

export default HomePage;

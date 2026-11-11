import {useState} from 'react';
import './LogIn.css';
import { logIn } from '../services/authService';

function LogIn({ onSignUp, onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await logIn(username, password);
      onLoggedIn(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }; // backend kirjautumista - Abu

  return (
    <div className="login-container">
      <h2>Kirjaudu sisään</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Käyttäjänimi:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Salasana:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Kirjaudutaan...' : 'Kirjaudu'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={onSignUp}>
        Tee uusi tili
      </button>
    </div>
  ); //frontend kirjautumista - Abu
}

export default LogIn;
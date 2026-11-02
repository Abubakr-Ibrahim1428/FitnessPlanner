import "./accountmanagement.css";

function AccountManagement({ username, onLogOut, onDeleteAccount }) {
  return (
    <section className="account-management">
      <h2>Tilinhallinta</h2>
      <p>Kirjautuneena käyttäjänä: {username}</p>
      <div className="account-actions">
        <button type="button" onClick={onLogOut}>Kirjaudu ulos</button>
        <button type="button" className="danger-button" onClick={onDeleteAccount}>
          Poista tili
        </button>
      </div>
    </section>
  );
}

export default AccountManagement;

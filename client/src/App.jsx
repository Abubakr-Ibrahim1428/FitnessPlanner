import { useState } from "react";
import "./App.css";
import LogIn from "./LogIn.jsx";
import SignUp from "./SignUp.jsx";
import AccountManagement from "./accountmanagement.jsx";
import { deleteAccount } from "../services/authService";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("fitnessPlannerToken");
    const username = localStorage.getItem("fitnessPlannerUsername");
    return token && username ? { token, username } : null;
  });
  const [accountError, setAccountError] = useState("");
  const [workouts, setWorkouts] = useState([
    { id: 1, name: "Rintatreeni", exercises: 5, duration: 45, done: false },
    { id: 2, name: "Jalkatreeni", exercises: 6, duration: 60, done: false },
    { id: 3, name: "Selkätreeni", exercises: 4, duration: 40, done: true },
  ]);

  const [newWorkout, setNewWorkout] = useState("");

  function addWorkout(e) {
    e.preventDefault();

    if (newWorkout.trim() === "") return;

    const workout = {
      id: Date.now(),
      name: newWorkout,
      exercises: 0,
      duration: 45,
      done: false,
    };

    setWorkouts([...workouts, workout]);
    setNewWorkout("");
  }

  function toggleWorkout(id) {
    setWorkouts(
      workouts.map((workout) =>
        workout.id === id
          ? { ...workout, done: !workout.done }
          : workout
      )
    );
  }

  function deleteWorkout(id) {
    setWorkouts(workouts.filter((workout) => workout.id !== id));
  }

  const completed = workouts.filter((workout) => workout.done).length;

  function handleLoggedIn(data) {
    localStorage.setItem("fitnessPlannerToken", data.token);
    localStorage.setItem("fitnessPlannerUsername", data.username);
    setSession({ token: data.token, username: data.username });
    setActivePage("Dashboard");
  }

  function handleLogOut() {
    localStorage.removeItem("fitnessPlannerToken");
    localStorage.removeItem("fitnessPlannerUsername");
    setSession(null);
    setActivePage("Dashboard");
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Haluatko varmasti poistaa tilisi? Tätä ei voi peruuttaa.")) {
      return;
    }

    setAccountError("");
    try {
      await deleteAccount(session.token);
      handleLogOut();
    } catch (err) {
      setAccountError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="date">OMA KUNTOILUSUUNNITELMA</p>
          <h1>
            {activePage === "Dashboard"
              ? "Dashboard"
              : activePage}
          </h1>
        </div>
        <div className="today">Pysy tavoitteessasi</div>
      </header>

      <aside className="sidebar">
        <h2 className="logo">FIT<span>PLAN</span></h2>
        <p className="menu-title">
          VALIKKO
          <button type="button" onClick={() => setActivePage("LogIn")}>
            {session ? "Vaihda tiliä" : "Kirjaudu"}
          </button>
        </p>

        {["Koti", "Treenit", "Edistyminen", "Tili"].map((page) => (
          <button
            key={page}
            className={`nav-button ${
              activePage === page ? "active" : ""
            }`}
            onClick={() => setActivePage(page === "Koti" ? "Dashboard" : page)}
          >
            {page === "Koti"}
            {page === "Treenit"}
            {page === "Edistyminen"}
            <span>{page}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="avatar">N</div>
          <div>
            <strong>Oma profiili</strong>
            <p>Fitness-jäsen</p>
          </div>
        </div>
      </aside>

      <main className="main">
        {activePage === "LogIn" && (
          <LogIn
            onSignUp={() => setActivePage("SignUp")}
            onLoggedIn={handleLoggedIn}
          />
        )}

        {activePage === "SignUp" && (
          <SignUp onLogIn={() => setActivePage("LogIn")} />
        )}

        {activePage === "Tili" && (
          session ? (
            <>
              <AccountManagement
                username={session.username}
                onLogOut={handleLogOut}
                onDeleteAccount={handleDeleteAccount}
              />
              {accountError && <p role="alert">{accountError}</p>}
            </>
          ) : (
            <LogIn
              onSignUp={() => setActivePage("SignUp")}
              onLoggedIn={handleLoggedIn}
            />
          )
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <p className="green-text">AIKA KEHITTYÄ</p>
                <h2>Treenaa fiksusti.</h2>
                <h2 className="muted-heading">Saavuta tavoitteesi.</h2>
                <p>
                  Suunnittele treenisi ja seuraa kehitystäsi
                  yhdessä paikassa.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setActivePage("Treenit")}
                >
                  Katso treenit
                </button>
              </div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <p>Viikon treenit</p>
                <h2>{workouts.length}</h2>
                <span>suunniteltua treeniä</span>
              </div>
              <div className="stat-card">
                <p>Suoritetut treenit</p>
                <h2>{completed}</h2>
                <span>hyvää työtä!</span>
              </div>
              <div className="stat-card">
                <p>Edistyminen</p>
                <h2>
                  {workouts.length
                    ? Math.round((completed / workouts.length) * 100)
                    : 0}%
                </h2>
                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        workouts.length
                          ? (completed / workouts.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <WorkoutList
              workouts={workouts.slice(0, 3)}
              toggleWorkout={toggleWorkout}
              deleteWorkout={deleteWorkout}
            />
          </>
        )}

        {activePage === "Treenit" && (
          <>
            <section className="section-card">
              <h2>Lisää uusi treeni</h2>
              <p className="description">
                Luo oma treenisuunnitelma.
              </p>
              <form className="add-form" onSubmit={addWorkout}>
                <input
                  type="text"
                  placeholder="Esim. Olkapäätreeni"
                  value={newWorkout}
                  onChange={(e) => setNewWorkout(e.target.value)}
                />
                <button className="primary-button" type="submit">
                  + Lisää treeni
                </button>
              </form>
            </section>

            <WorkoutList
              workouts={workouts}
              toggleWorkout={toggleWorkout}
              deleteWorkout={deleteWorkout}
            />
          </>
        )}

        {activePage === "Edistyminen" && (
          <section className="section-card">
            <h2>Oma edistyminen</h2>
            <p className="description">
              Seuraa treeniesi suorittamista.
            </p>
            <div className="progress-number">
              {workouts.length
                ? Math.round((completed / workouts.length) * 100)
                : 0}%
            </div>
            <div className="progress large-progress">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    workouts.length
                      ? (completed / workouts.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p>
              Olet suorittanut {completed} / {workouts.length} treeniä.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function WorkoutList({ workouts, toggleWorkout, deleteWorkout }) {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="green-text">TREENIOHJELMA</p>
          <h2>Treenisi</h2>
        </div>
        <span className="workout-count">
          {workouts.length} treeniä
        </span>
      </div>

      {workouts.length === 0 ? (
        <p className="description">Ei vielä treenejä. Lisää ensimmäinen!</p>
      ) : (
        <div className="workout-list">
          {workouts.map((workout) => (
            <div className="workout-item" key={workout.id}>
              <div className="workout-info">
                <h3>{workout.name}</h3>
                <p>
                  {workout.exercises} liikettä · {workout.duration} min
                </p>
              </div>
              <button
                className={`done-button ${
                  workout.done ? "completed" : ""
                }`}
                onClick={() => toggleWorkout(workout.id)}
              >
                {workout.done ? "Valmis" : "Aloita"}
              </button>
              <button
                className="delete-button"
                onClick={() => deleteWorkout(workout.id)}
                aria-label={`Poista ${workout.name}`}
                title="Poista treeni"
              >
                Poista
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default App;

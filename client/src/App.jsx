import { useEffect, useState } from "react";
import "./App.css";
import Settings from "./settings.jsx";
import LogIn from "./LogIn.jsx";
import SignUp from "./SignUp.jsx";
import AccountManagement from "./accountmanagement.jsx";
import { deleteAccount } from "../services/authService";
import {
  createWorkout,
  getWorkouts,
  removeWorkout,
  updateWorkout,
} from "../services/workoutService";

function getInitialTheme() {
  const savedTheme = localStorage.getItem("fitnessPlannerTheme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialPalette() {
  const savedPalette = localStorage.getItem("fitnessPlannerPalette");
  return ["ocean", "forest", "sunset", "berry"].includes(savedPalette)
    ? savedPalette
    : "ocean";
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("fitnessPlannerToken");
    const username = localStorage.getItem("fitnessPlannerUsername");
    return token && username ? { token, username } : null;
  });
  const [accountError, setAccountError] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [dataError, setDataError] = useState("");

  const [newWorkout, setNewWorkout] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fitnessPlannerTheme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem("fitnessPlannerPalette", palette);
  }, [palette]);

  useEffect(() => {
    if (!session) return undefined;

    let active = true;
    getWorkouts(session.token)
      .then((data) => {
        if (active) setWorkouts(data);
      })
      .catch((err) => {
        if (active) setDataError(err.message);
      });
    return () => {
      active = false;
    };
  }, [session]);

  async function addWorkout(e) {
    e.preventDefault();

    if (newWorkout.trim() === "") return;
    if (!session) {
      setActivePage("LogIn");
      return;
    }

    const name = newWorkout.trim();
    try {
      const { id } = await createWorkout(session.token, {
        name,
        performedOn: new Date().toISOString().slice(0, 10),
        durationMin: 45,
      });
      setWorkouts((current) => [
        ...current,
        { id, name, exercises: 0, duration_min: 45, completed: false },
      ]);
      setNewWorkout("");
    } catch (err) {
      setDataError(err.message);
    }
  }

  async function toggleWorkout(id) {
    const workout = workouts.find((item) => item.id === id);
    if (!workout) return;
    const completed = !workout.completed;
    try {
      await updateWorkout(session.token, id, { completed });
      setWorkouts((current) =>
        current.map((item) => item.id === id ? { ...item, completed } : item)
      );
    } catch (err) {
      setDataError(err.message);
    }
  }

  async function deleteWorkout(id) {
    try {
      await removeWorkout(session.token, id);
      setWorkouts((current) => current.filter((workout) => workout.id !== id));
    } catch (err) {
      setDataError(err.message);
    }
  }

  const completed = workouts.filter((workout) => workout.completed).length;

  function handleLoggedIn(data) {
    localStorage.setItem("fitnessPlannerToken", data.token);
    localStorage.setItem("fitnessPlannerUsername", data.username);
    setSession({ token: data.token, username: data.username });
    setActivePage("Dashboard");
  }

  function handleLogOut() {
    localStorage.removeItem("fitnessPlannerToken");
    localStorage.removeItem("fitnessPlannerUsername");
    setWorkouts([]);
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
              ? "Koti"
              : activePage}
          </h1>
        </div>
      </header>

      <aside className="sidebar">
        <h2 className="logo">Winter Arc Planner</h2>
        <p className="menu-title">
          VALIKKO
          <button type="button" onClick={() => setActivePage("LogIn")}>
            Kirjaudu
          </button>
        </p>

        {["Koti", "Treenit", "Edistyminen", "Tili", "Asetukset"].map((page) => (
          <button
            key={page}
            className={`nav-button ${
              activePage === (page === "Koti" ? "Dashboard" : page)
                ? "active"
                : ""
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
        {dataError && <p role="alert">{dataError}</p>}
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

        {activePage === "Asetukset" && (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
            palette={palette}
            onPaletteChange={setPalette}
          />
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <h2>Optimoi itsesi!</h2>
                <h2 className="muted-heading">Lock In!!</h2>
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
        <div className="workout-list workout-card-grid">
          {workouts.map((workout) => (
            <div className="workout-item" key={workout.id}>
              <div className="workout-info">
                <h3>{workout.name}</h3>
                <p>
                  {workout.exercises} liikettä · {workout.duration_min} min
                </p>
              </div>
              <button
                className={`done-button ${
                  workout.completed ? "completed" : ""
                }`}
                onClick={() => toggleWorkout(workout.id)}
              >
                {workout.completed ? "Valmis" : "Aloita"}
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

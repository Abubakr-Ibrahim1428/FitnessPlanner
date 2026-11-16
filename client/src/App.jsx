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

const workoutPrograms = [
  {
    id: "full-body",
    name: "Koko keho",
    focus: "Koko kehon peruskunto",
    movements: ["Kyykky", "Punnerrus", "Askelkyykky", "Lankku", "Vuorikiipeilijä"],
  },
  {
    id: "upper-body",
    name: "Ylävartalo",
    focus: "Rinta, hartiat ja käsivarret",
    movements: ["Punnerrus", "Hauiskääntö ilman painoja", "Ojentajadippi", "Lankku olkapääkosketuksilla", "Supermies"],
  },
  {
    id: "legs",
    name: "Jalat ja pakarat",
    focus: "Alavartalon voima",
    movements: ["Kyykky", "Peruutusaskelkyykky", "Lantionnosto", "Pohjenousu", "Seinäistunta"],
  },
  {
    id: "core",
    name: "Keskivartalo",
    focus: "Vatsa ja keskivartalon hallinta",
    movements: ["Lankku", "Polkupyörävatsat", "Dead bug", "Sivulankku", "Vuorikiipeilijä"],
  },
];

const MOVEMENT_SECONDS = 40;
const REST_SECONDS = 15;

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
  const [activeProgram, setActiveProgram] = useState(null);

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
                <h2>Welcome to looksmaxxing brother!</h2>
                <h2 className="muted-heading">Ascend without destroying your bones!</h2>
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
            {activeProgram && (
              <WorkoutTimer
                key={activeProgram.id}
                program={activeProgram}
                onClose={() => setActiveProgram(null)}
              />
            )}

            <section className="section-card">
              <div className="section-heading">
                <div>
                  <p className="green-text">VALMIIT OHJELMAT</p>
                  <h2>Valitse treeni</h2>
                </div>
                <span className="workout-count">40 s / liike · 15 s lepo</span>
              </div>
              <p className="description">
                Valitse ohjelma ja ajastin käynnistyy heti.
              </p>
              <div className="program-grid">
                {workoutPrograms.map((program) => (
                  <article className="program-card" key={program.id}>
                    <div>
                      <h3>{program.name}</h3>
                      <p className="description">{program.focus}</p>
                    </div>
                    <ul className="movement-list">
                      {program.movements.map((movement) => (
                        <li key={movement}>{movement}</li>
                      ))}
                    </ul>
                    <button
                      className="primary-button"
                      onClick={() => setActiveProgram(program)}
                    >
                      Aloita treeni
                    </button>
                  </article>
                ))}
              </div>
            </section>

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

function WorkoutTimer({ program, onClose }) {
  const [movementIndex, setMovementIndex] = useState(0);
  const [phase, setPhase] = useState("exercise");
  const [secondsRemaining, setSecondsRemaining] = useState(MOVEMENT_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const movement = program.movements[movementIndex];

  useEffect(() => {
    if (!isRunning || isComplete) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (secondsRemaining > 1) {
        setSecondsRemaining(secondsRemaining - 1);
      } else if (phase === "rest") {
        const nextMovement = movementIndex + 1;
        setMovementIndex(nextMovement);
        setPhase("exercise");
        setSecondsRemaining(MOVEMENT_SECONDS);
      } else if (movementIndex === program.movements.length - 1) {
        setSecondsRemaining(0);
        setIsRunning(false);
        setIsComplete(true);
      } else {
        setPhase("rest");
        setSecondsRemaining(REST_SECONDS);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [
    isComplete,
    isRunning,
    movementIndex,
    phase,
    program.movements.length,
    secondsRemaining,
  ]);

  function skipToNextMovement() {
    if (movementIndex === program.movements.length - 1) {
      setSecondsRemaining(0);
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    const nextMovement = movementIndex + 1;
    setMovementIndex(nextMovement);
    setPhase("exercise");
    setSecondsRemaining(MOVEMENT_SECONDS);
  }

  function restart() {
    setMovementIndex(0);
    setPhase("exercise");
    setSecondsRemaining(MOVEMENT_SECONDS);
    setIsComplete(false);
    setIsRunning(true);
  }

  const formattedTime = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(
    secondsRemaining % 60,
  ).padStart(2, "0")}`;

  return (
    <section className="section-card timer-panel" aria-live="polite">
      <div className="section-heading">
        <div>
          <p className="green-text">TREENIAJASTIN</p>
          <h2>{program.name}</h2>
        </div>
        <button className="delete-button" onClick={onClose}>
          Sulje ajastin
        </button>
      </div>

      {isComplete ? (
        <div className="timer-content">
          <h3>Treeni valmis — hienoa työtä!</h3>
          <div className="timer-actions">
            <button className="primary-button" onClick={restart}>
              Aloita uudelleen
            </button>
            <button className="done-button" onClick={onClose}>
              Valmis
            </button>
          </div>
        </div>
      ) : (
        <div className="timer-content">
          <p className="description">
            {phase === "rest" ? "Lepo" : `Liike ${movementIndex + 1} / ${program.movements.length}`}
          </p>
          <h3>{phase === "rest" ? "Hengähdä hetki" : movement}</h3>
          <p className="timer-countdown" aria-label={`${secondsRemaining} sekuntia`}>
            {formattedTime}
          </p>
          <div className="progress timer-progress">
            <div
              className="progress-fill"
              style={{
                width: `${((movementIndex + (phase === "rest" ? 0.5 : 0)) / program.movements.length) * 100}%`,
              }}
            />
          </div>
          <div className="timer-actions">
            <button
              className="primary-button"
              onClick={() => setIsRunning((running) => !running)}
            >
              {isRunning ? "Tauko" : "Jatka"}
            </button>
            <button className="done-button" onClick={skipToNextMovement}>
              Ohita liike
            </button>
          </div>
        </div>
      )}
    </section>
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

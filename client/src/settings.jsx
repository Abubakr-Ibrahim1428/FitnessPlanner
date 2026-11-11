import "./settings.css";

function Settings({
  theme,
  onThemeChange,
  palette,
  onPaletteChange,
}) {
  return (
    <section className="settings-page section-card">
      <p className="green-text">ASETUKSET</p>
      <h2>Hallinnoi asetuksia</h2>
      <p className="description">
        Muokkaa FitnessPlannerin asetuksia tästä.
      </p>
      <label className="theme-setting">
        <span>Teema</span>
        <select
          value={theme}
          onChange={(event) => onThemeChange(event.target.value)}
        >
          <option value="light">Vaalea</option>
          <option value="dark">Tumma</option>
        </select>
      </label>
      <label className="theme-setting">
        <span>Väripaletti</span>
        <select
          value={palette}
          onChange={(event) => onPaletteChange(event.target.value)}
        >
          <option value="ocean">Ocean</option>
          <option value="forest">Forest</option>
          <option value="sunset">Sunset</option>
          <option value="berry">Berry</option>
        </select>
      </label>
    </section>
  );
}

export default Settings;

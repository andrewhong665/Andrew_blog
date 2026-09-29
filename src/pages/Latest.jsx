import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const currentWeatherUrl =
  "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";
const forecastUrl =
  "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en";
const refreshIntervalMilliseconds = 10 * 60 * 1000;

async function fetchWeather(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`The Hong Kong Observatory API returned ${response.status}.`);
  }

  return response.json();
}

async function fetchWeatherData() {
  const [currentResult, forecastResult] = await Promise.all([
    fetchWeather(currentWeatherUrl),
    fetchWeather(forecastUrl),
  ]);

  if (!Array.isArray(currentResult.temperature?.data)) {
    throw new Error(
      "The Observatory response did not include temperature readings.",
    );
  }
  if (!Array.isArray(forecastResult.weatherForecast)) {
    throw new Error("The Observatory response did not include the forecast.");
  }

  return { currentResult, forecastResult };
}

function formatUpdateTime(value) {
  if (!value) {
    return "Update time unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Update time unavailable";
  }

  return `Updated ${date.toLocaleString("en-HK", {
    timeZone: "Asia/Hong_Kong",
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function formatForecastDate(date) {
  if (!/^\d{8}$/.test(date ?? "")) {
    return date || "Date unavailable";
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));

  return new Date(Date.UTC(year, month, day)).toLocaleDateString("en-HK", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Latest() {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [station, setStation] = useState("Hong Kong Observatory");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);

  const loadWeather = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const { currentResult, forecastResult } = await fetchWeatherData();

      setCurrent(currentResult);
      setForecast(forecastResult);
      setLastChecked(new Date());
      setError("");

    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Hong Kong weather data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetchWeatherData()
      .then(({ currentResult, forecastResult }) => {
        if (!isCurrent) {
          return;
        }

        setCurrent(currentResult);
        setForecast(forecastResult);
        setLastChecked(new Date());
        setError("");
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Hong Kong weather data.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    const interval = window.setInterval(
      () => loadWeather(true),
      refreshIntervalMilliseconds,
    );
    return () => {
      isCurrent = false;
      window.clearInterval(interval);
    };
  }, [loadWeather]);

  function retryWeather() {
    setLoading(true);
    setError("");
    loadWeather();
  }

  function refreshWeather() {
    setError("");
    loadWeather(true);
  }

  const temperatures = current?.temperature?.data ?? [];
  const selectedTemperature =
    temperatures.find((reading) => reading.place === station) ??
    temperatures.find((reading) => reading.place === "Hong Kong Observatory") ??
    temperatures[0];
  const humidity = current?.humidity?.data?.[0];
  const uvIndex = current?.uvindex?.data?.[0];
  const rainfall = useMemo(
    () =>
      [...(current?.rainfall?.data ?? [])]
        .sort((left, right) => Number(right.max) - Number(left.max))
        .slice(0, 6),
    [current],
  );
  const warnings = [
    ...(current?.warningMessage ?? []),
    current?.tcmessage,
    forecast?.fireDangerWarning,
  ].filter(Boolean);

  return (
    <>
      <Header />
      <main className="container weather-page">
        <div className="weather-heading">
          <div>
            <p className="album-eyebrow">HONG KONG WEATHER</p>
            <h1>Weather right now</h1>
            <p className="weather-intro">
              Live observations and the latest nine-day forecast for Hong Kong.
            </p>
          </div>
          <button
            className="admin-button weather-refresh"
            disabled={refreshing || loading}
            onClick={refreshWeather}
            type="button"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="weather-error" role="alert">
            <p>{error}</p>
            <button
              className="admin-button"
              onClick={retryWeather}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !current ? (
          <p className="table-message" role="status" aria-live="polite">
            Loading live weather from the Hong Kong Observatory...
          </p>
        ) : current && forecast ? (
          <>
            {warnings.length > 0 && (
              <section className="weather-warnings" aria-label="Weather warnings">
                <h2>Warnings and notices</h2>
                <ul>
                  {warnings.map((warning, index) => (
                    <li key={`${index}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="weather-now" aria-labelledby="weather-now-title">
              <div className="weather-now-main">
                <div className="weather-now-meta">
                  <p className="weather-label" id="weather-now-title">
                    Current temperature
                  </p>
                  <label className="weather-station">
                    Weather station
                    <select
                      onChange={(event) => setStation(event.target.value)}
                      value={selectedTemperature?.place ?? ""}
                    >
                      {temperatures.map((reading) => (
                        <option key={reading.place} value={reading.place}>
                          {reading.place}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="weather-temperature">
                  {selectedTemperature
                    ? `${selectedTemperature.value}°`
                    : "--°"}
                  <span>{selectedTemperature?.unit ?? "C"}</span>
                </p>
                <p className="weather-location">
                  {selectedTemperature?.place ?? "Select a station"}
                </p>
              </div>
              <div className="weather-metrics">
                <article className="weather-metric">
                  <span>Humidity</span>
                  <strong>
                    {humidity
                      ? `${humidity.value}${humidity.unit === "percent" ? "%" : ` ${humidity.unit}`}`
                      : "—"}
                  </strong>
                  <small>{humidity?.place ?? "Hong Kong"}</small>
                </article>
                <article className="weather-metric">
                  <span>UV index</span>
                  <strong>{uvIndex?.value ?? "—"}</strong>
                  <small>{uvIndex?.desc ?? "No current reading"}</small>
                </article>
                <article className="weather-metric">
                  <span>Max rainfall</span>
                  <strong>
                    {rainfall[0]
                      ? `${rainfall[0].max} ${rainfall[0].unit}`
                      : "—"}
                  </strong>
                  <small>{rainfall[0]?.place ?? "No current reading"}</small>
                </article>
              </div>
              <p className="weather-updated">
                {formatUpdateTime(current.updateTime)}
              </p>
            </section>

            {forecast.generalSituation && (
              <section className="weather-outlook">
                <p className="weather-label">General situation</p>
                <p>{forecast.generalSituation}</p>
              </section>
            )}

            <section className="weather-forecast-section">
              <div className="weather-section-heading">
                <div>
                  <p className="weather-label">PLAN AHEAD</p>
                  <h2>Nine-day forecast</h2>
                </div>
                <p>{formatUpdateTime(forecast.updateTime)}</p>
              </div>
              <div className="weather-forecast-grid">
                {forecast.weatherForecast.map((day) => (
                  <article
                    className="weather-forecast-card"
                    key={day.forecastDate}
                  >
                    <h3>{formatForecastDate(day.forecastDate)}</h3>
                    <p className="weather-forecast-description">
                      {day.forecastWeather}
                    </p>
                    <p className="weather-forecast-temperatures">
                      <strong>{day.forecastMaxtemp?.value}°</strong>
                      <span>{day.forecastMintemp?.value}°C</span>
                    </p>
                    <p className="weather-forecast-detail">
                      Humidity {day.forecastMinrh?.value}–{day.forecastMaxrh?.value}%
                    </p>
                    <p className="weather-forecast-detail">
                      Rain chance: {day.PSR || "—"}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="weather-rainfall">
              <div className="weather-section-heading">
                <div>
                  <p className="weather-label">RECENT OBSERVATIONS</p>
                  <h2>Rainfall by district</h2>
                </div>
                <p>
                  {current.rainfall?.startTime && current.rainfall?.endTime
                    ? `${formatUpdateTime(current.rainfall.startTime)} – ${new Date(
                        current.rainfall.endTime,
                      ).toLocaleTimeString("en-HK", {
                        timeZone: "Asia/Hong_Kong",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
              </div>
              <div className="weather-rainfall-grid">
                {rainfall.map((reading) => (
                  <div className="weather-rainfall-item" key={reading.place}>
                    <span>{reading.place}</span>
                    <strong>
                      {reading.max} {reading.unit}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <p className="weather-source">
          Weather data provided by the{" "}
          <a
            href="https://www.hko.gov.hk/en/education/weather/data-and-technology/00740-Open-Data-of-Hong-Kong-Observatory.html"
            rel="noreferrer"
            target="_blank"
          >
            Hong Kong Observatory (HKO) Open Data API
          </a>
          {lastChecked && <> · Checked {lastChecked.toLocaleTimeString("en-HK")}</>}
        </p>
      </main>
      <Footer />
    </>
  );
}

export default Latest;

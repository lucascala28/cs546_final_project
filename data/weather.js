const CDN = 'https://cdn.jsdelivr.net/npm/@meteocons/svg@latest/fill';

// Meteocons icon slugs served as animated SVGs from cdn.meteocons.com
const WMO_ICONS = {
  clear:           'clear-day',
  'partly-cloudy': 'partly-cloudy-day',
  cloudy:          'overcast',
  fog:             'fog',
  rain:            'rain',
  snow:            'snow',
  thunderstorm:    'thunderstorms-rain',
};

const WMO_CONDITIONS = {
  0:  { label: 'Clear',              key: 'clear' },
  1:  { label: 'Mostly Clear',       key: 'clear' },
  2:  { label: 'Partly Cloudy',      key: 'partly-cloudy' },
  3:  { label: 'Overcast',           key: 'cloudy' },
  45: { label: 'Foggy',              key: 'fog' },
  48: { label: 'Icy Fog',            key: 'fog' },
  51: { label: 'Light Drizzle',      key: 'rain' },
  53: { label: 'Drizzle',            key: 'rain' },
  55: { label: 'Heavy Drizzle',      key: 'rain' },
  61: { label: 'Light Rain',         key: 'rain' },
  63: { label: 'Rain',               key: 'rain' },
  65: { label: 'Heavy Rain',         key: 'rain' },
  66: { label: 'Freezing Rain',      key: 'rain' },
  67: { label: 'Heavy Freezing Rain',key: 'rain' },
  71: { label: 'Light Snow',         key: 'snow' },
  73: { label: 'Snow',               key: 'snow' },
  75: { label: 'Heavy Snow',         key: 'snow' },
  77: { label: 'Snow Grains',        key: 'snow' },
  80: { label: 'Showers',            key: 'rain' },
  81: { label: 'Showers',            key: 'rain' },
  82: { label: 'Heavy Showers',      key: 'rain' },
  85: { label: 'Snow Showers',       key: 'snow' },
  86: { label: 'Heavy Snow Showers', key: 'snow' },
  95: { label: 'Thunderstorm',       key: 'thunderstorm' },
  96: { label: 'Thunderstorm',       key: 'thunderstorm' },
  99: { label: 'Thunderstorm',       key: 'thunderstorm' },
};

function wmoToCondition(code) {
  return WMO_CONDITIONS[code] ?? { label: 'Unknown', key: 'cloudy' };
}

function iconFor(key) {
  const slug = WMO_ICONS[key] ?? WMO_ICONS.cloudy;
  return `${CDN}/${slug}.svg`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getWeatherForCoords = async (lat, lng) => {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();

    const c = data.current;
    const cond = wmoToCondition(c.weather_code);

    const current = {
      tempF:      Math.round(c.temperature_2m),
      feelsLikeF: Math.round(c.apparent_temperature),
      windMph:    Math.round(c.wind_speed_10m),
      precipIn:   c.precipitation ?? 0,
      label:      cond.label,
      icon:       iconFor(cond.key),
    };

    const d = data.daily;
    const forecast = (d.time ?? []).map((isoDate, i) => {
      const dayCond = wmoToCondition(d.weather_code[i]);
      const date = new Date(isoDate + 'T12:00:00');
      return {
        day:       DAY_NAMES[date.getDay()],
        highF:     Math.round(d.temperature_2m_max[i]),
        lowF:      Math.round(d.temperature_2m_min[i]),
        precipPct: d.precipitation_probability_max[i] ?? 0,
        label:     dayCond.label,
        icon:      iconFor(dayCond.key),
      };
    });

    return { current, forecast };
  } catch {
    return null;
  }
};

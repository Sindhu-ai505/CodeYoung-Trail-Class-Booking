export const POPULAR_TIMEZONES = [
  { value: 'America/New_York', label: 'US Eastern (New York, Miami, Boston)', region: 'North America' },
  { value: 'America/Chicago', label: 'US Central (Chicago, Dallas, Houston)', region: 'North America' },
  { value: 'America/Denver', label: 'US Mountain (Denver, Phoenix, Salt Lake)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles, San Francisco, Seattle)', region: 'North America' },
  { value: 'Europe/London', label: 'UK & Ireland (London, Dublin)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Central Europe (Paris, Berlin, Amsterdam)', region: 'Europe' },
  { value: 'Asia/Kolkata', label: 'India (IST - Delhi, Mumbai, Bengaluru)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'UAE & Gulf (Dubai, Abu Dhabi)', region: 'Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore & Malaysia', region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (Sydney, Melbourne)', region: 'Oceania' }
];

export function getDefaultTimezone() {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      // If detected is in our popular list or valid, return it
      const match = POPULAR_TIMEZONES.find(tz => tz.value === detected);
      if (match) return match.value;
      return detected;
    }
  } catch (e) {
    // fallback
  }
  return 'America/New_York';
}

export function getTimezoneLabel(zoneValue) {
  const match = POPULAR_TIMEZONES.find(tz => tz.value === zoneValue);
  return match ? match.label : zoneValue;
}

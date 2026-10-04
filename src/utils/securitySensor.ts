/**
 * GTAE-ATRA Real-Time Cloud Security Sensor for Vercel Web Apps
 *
 * Monitors live visitors, catches attacks, and enforces cloud IP blocking.
 * Conservative design: avoids false positives from normal AI chat usage.
 */

const MONITOR_URL = 'https://gtae-atra-security.onrender.com';
const SITE_ID = 'ai-research-paper-explainer';

// 🛑 CRITICAL: Save unpatched raw fetch so telemetry/checks never intercept themselves!
const rawFetch = (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);

let cachedIP = '';

// Debounce: minimum ms between consecutive telemetry sends (avoid burst false positives)
const TELEMETRY_DEBOUNCE_MS = 2000;
let lastTelemetrySent = 0;
// Queue multiple events if they arrive in the debounce window
const pendingRecords: any[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 1. Visitor's real public IP
async function getPublicIP(): Promise<string> {
  if (cachedIP) return cachedIP;
  try {
    const res = await rawFetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedIP = data.ip;
    return cachedIP;
  } catch {
    return '127.0.0.1';
  }
}

// 2. Blocklist Check
async function checkBlockStatus(ip: string) {
  try {
    const res = await rawFetch(`${MONITOR_URL}/api/blocklist/check?ip=${encodeURIComponent(ip)}`);
    const data = await res.json();
    if (data.blocked) {
      document.body.innerHTML = `
        <div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#0b0f19;color:#f87171;font-family:sans-serif;text-align:center;padding:2rem;">
          <div>
            <h1 style="font-size:3rem;margin-bottom:1rem;">🚫 403 Forbidden</h1>
            <p style="font-size:1.2rem;color:#e2e8f0;">Access Denied by <b>GTAE-ATRA Cloud Security Engine</b>.</p>
            <p style="font-size:0.9rem;color:#94a3b8;margin-top:1rem;">Your IP (${ip}) has been blocked due to suspicious activity.</p>
          </div>
        </div>
      `;
    }
  } catch (e) {
    // Fail-open: if blocklist check fails, allow the user through
  }
}

// 3. Flush pending records to IDS (batched to avoid spamming)
async function flushTelemetry() {
  if (pendingRecords.length === 0) return;
  const ip = await getPublicIP();
  const batch = pendingRecords.splice(0, pendingRecords.length);
  try {
    await rawFetch(`${MONITOR_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_ip: ip,
        site_id: SITE_ID,
        requests: batch
      })
    });
  } catch (e) {
    // Fail-silent
  }
  lastTelemetrySent = Date.now();
}

// Queue telemetry with debounce to batch bursts from streaming/multi-request flows
function sendTelemetry(record: any) {
  pendingRecords.push(record);

  if (debounceTimer) clearTimeout(debounceTimer);

  const timeSinceLast = Date.now() - lastTelemetrySent;
  const delay = timeSinceLast >= TELEMETRY_DEBOUNCE_MS ? 200 : TELEMETRY_DEBOUNCE_MS;

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushTelemetry();
  }, delay);
}

// Paths that must never be reported as monitored traffic
const BYPASS_PATHS = [
  '/telemetry',
  '/api/blocklist',
  '/api/security',
  'onrender.com',
  'ipify.org',
  'firestore',
  'googleapis.com',
];

// 4. Initial page visit capture
async function initSecurity() {
  const ip = await getPublicIP();
  await checkBlockStatus(ip);

  // Send normal visit telemetry
  sendTelemetry({
    method: 'GET',
    path: window.location.pathname || '/',
    endpoint: window.location.pathname || '/',
    status: 200,
    status_code: 200,
    response_time_ms: 35.0,
    request_size: 250,
    response_size: 4500,
    user_agent: navigator.userAgent,
    timestamp_ms: Date.now()
  });
}

// Run on page load
if (typeof window !== 'undefined') {
  initSecurity();

  // Intercept outgoing API requests targeting this application only
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [resource, config] = args;
    const urlStr = typeof resource === 'string' ? resource : (resource as Request).url;

    // 🛑 CRITICAL FILTER: ONLY monitor requests belonging to our own app domain!
    let path = urlStr;
    try {
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        const parsed = new URL(urlStr);
        if (parsed.origin !== window.location.origin) {
          // External third-party call (Firestore, Gemini API, etc.) -> pass through
          return originalFetch(...args);
        }
        path = parsed.pathname;
      }
    } catch {
      // not a full URL
    }

    // Bypass internal sensor paths
    if (BYPASS_PATHS.some(p => path.includes(p))) {
      return originalFetch(...args);
    }

    // Skip static assets to avoid burst false alarms from parallel asset loading
    if (/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff2?|map|json)$/i.test(path)) {
      return originalFetch(...args);
    }

    const start = Date.now();
    const method = (config?.method || 'GET').toUpperCase();

    try {
      const response = await originalFetch(...args);

      sendTelemetry({
        method,
        path,
        endpoint: path,
        status: response.status,
        status_code: response.status,
        // Cap response time at 30s to prevent massive outlier values from skewing the ML model
        response_time_ms: Math.min(Date.now() - start, 30_000),
        // Use content-length or estimate from body; cap at 1MB to avoid skewing size features
        request_size: typeof config?.body === 'string'
          ? Math.min(config.body.length, 1_000_000)
          : 150,
        response_size: 1200,
        user_agent: navigator.userAgent,
        timestamp_ms: Date.now()
      });

      return response;
    } catch (err) {
      throw err;
    }
  };
}

export default initSecurity;

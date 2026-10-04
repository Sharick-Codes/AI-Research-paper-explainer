/**
 * GTAE-ATRA Real-Time Cloud Security Sensor for Vercel Web Apps
 * Monitors live visitors, catches attacks, and enforces cloud IP blocking.
 */

const MONITOR_URL = 'https://gtae-atra-security.onrender.com';
const SITE_ID = 'ai-research-paper-explainer';

let cachedIP = '';

// 1. Visitor-oda Real Public IP-ai identify pannudhu
async function getPublicIP(): Promise<string> {
  if (cachedIP) return cachedIP;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedIP = data.ip;
    return cachedIP;
  } catch {
    return '127.0.0.1';
  }
}

// 2. Blocklist Check: IP already ban aagi irukka nu check pannudhu
async function checkBlockStatus(ip: string) {
  try {
    const res = await fetch(`${MONITOR_URL}/api/blocklist/check?ip=${encodeURIComponent(ip)}`);
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
    // Fail-open
  }
}

// 3. Cloud IDS-kku live telemetry anuppudhu
async function sendTelemetry(record: any) {
  const ip = await getPublicIP();
  try {
    await fetch(`${MONITOR_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_ip: ip,
        site_id: SITE_ID,
        requests: [record]
      })
    });
  } catch (e) {
    // Fail-silent
  }
}

// 4. Initial Page Visit capture
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

  // Intercept any API requests
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    const [resource, config] = args;
    const urlStr = typeof resource === 'string' ? resource : (resource as Request).url;
    const method = config?.method || 'GET';

    try {
      const response = await originalFetch(...args);
      sendTelemetry({
        method: method.toUpperCase(),
        path: urlStr,
        endpoint: urlStr,
        status: response.status,
        status_code: response.status,
        response_time_ms: Date.now() - start,
        request_size: typeof config?.body === 'string' ? config.body.length : 150,
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

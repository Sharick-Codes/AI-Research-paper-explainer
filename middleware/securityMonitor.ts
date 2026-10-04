/**
 * middleware/securityMonitor.ts
 * Real-Time AI Security Monitor & Threat Mitigation Engine (GTAE-ATRA).
 *
 * Automatically monitors traffic, enforces real-time IP blocking (HTTP 403),
 * and feeds telemetry to the GTAE-ATRA Deep Learning IDS engine.
 */

import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

// Configuration from environment variables
const getMonitorBase = () => process.env.MONITOR_URL || "https://gtae-atra-security.onrender.com";
const getTelemetryUrl = () => `${getMonitorBase()}/telemetry`;
const getBlocklistUrl = () => `${getMonitorBase()}/api/blocklist/check`;
const getApiKey = () => process.env.MONITOR_API_KEY || "";
const getSiteId = () => process.env.MONITOR_SITE_ID || "ai-research-paper-explainer";
const FLUSH_INTERVAL_MS = parseInt(process.env.MONITOR_FLUSH_MS || "3000", 10);
const MAX_BATCH_SIZE = parseInt(process.env.MONITOR_BATCH_SIZE || "50", 10);
const DEBUG = true;

// In-memory blocklist cache
interface CacheEntry {
  blocked: boolean;
  expiresAt: number;
}
const blockedIPCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30 seconds local cache

/**
 * Check if an IP address is blocked.
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const cached = blockedIPCache.get(ip);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.blocked;
    }
    blockedIPCache.delete(ip);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
    const res = await fetch(`${getBlocklistUrl()}?ip=${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { "X-API-Key": getApiKey() }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as { blocked?: boolean };
      const blocked = data.blocked === true;
      blockedIPCache.set(ip, {
        blocked,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
      return blocked;
    }
  } catch (err: any) {
    if (DEBUG) console.error(`[IDS Security] Blocklist check error for ${ip}:`, err.message);
  }
  return false;
}

/**
 * Cache blocked IP locally.
 */
export function cacheBlock(ip: string) {
  blockedIPCache.set(ip, {
    blocked: true,
    expiresAt: Date.now() + 60_000
  });
}

// Request buffer per IP
const ipBuffers = new Map<string, any[]>();
let flushTimer: NodeJS.Timeout | null = null;

function getClientIP(req: Request): string {
  const cfIP = req.headers["cf-connecting-ip"];
  if (cfIP) {
    return (Array.isArray(cfIP) ? cfIP[0] : cfIP).trim();
  }
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return raw.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

async function flushBuffers() {
  if (ipBuffers.size === 0) return;

  const snapshot = new Map(ipBuffers);
  ipBuffers.clear();

  for (const [ip, requests] of snapshot.entries()) {
    if (requests.length === 0) continue;
    try {
      const res = await fetch(getTelemetryUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": getApiKey()
        },
        body: JSON.stringify({
          source_ip: ip,
          requests: requests,
          site_id: getSiteId()
        })
      });

      if (res.ok) {
        const data = await res.json() as { blocked?: boolean, status?: string };
        console.log(`\x1b[32m[GTAE-ATRA IDS] Telemetry transmitted (${requests.length} reqs) for ${ip} on site ${getSiteId()} -> Status: ${data?.status || 'ok'}\x1b[0m`);
        if (data.blocked === true) {
          cacheBlock(ip);
          console.warn(`\x1b[31m[GTAE-ATRA IDS] Malicious threat blocked: IP ${ip} on site ${getSiteId()}\x1b[0m`);
        }
      }
    } catch (err: any) {
      if (DEBUG) console.error(`[IDS Security] Telemetry flush error for ${ip}:`, err.message);
    }
  }
}

function startPeriodicFlush() {
  if (flushTimer) return;
  flushTimer = setInterval(flushBuffers, FLUSH_INTERVAL_MS);
  if (flushTimer.unref) flushTimer.unref();
}

/**
 * Express middleware to attach to the application.
 */
export function securityMonitor() {
  startPeriodicFlush();

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);

    // 1. Threat Mitigation Check
    const blocked = await isIPBlocked(ip);
    if (blocked) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Access Denied by GTAE-ATRA AI Security Engine.",
        code: "GTAE_ATRA_BLOCKED",
        blocked_ip: ip
      });
    }

    // 2. Telemetry Capture
    const startMs = Date.now();
    const onFinish = () => {
      res.removeListener("finish", onFinish);

      const latencyMs = Date.now() - startMs;
      const urlParts = req.url.split("?");
      const path = urlParts[0] || "/";
      const query = urlParts[1] || "";

      // Skip internal Vite bundling and static assets to prevent false burst alarms
      const isStaticOrDev =
        path.startsWith("/node_modules") ||
        path.startsWith("/@") ||
        path.startsWith("/src/") ||
        /\.(js|css|svg|png|jpg|jpeg|gif|ico|woff2?|map|json)$/i.test(path);

      if (isStaticOrDev) {
        return;
      }

      // Safe metadata only
      const record = {
        timestamp_ms: startMs,
        method: req.method,
        path: path,
        query: query,
        status: res.statusCode,
        response_time_ms: latencyMs,
        request_size: parseInt((req.headers["content-length"] as string) || "0", 10),
        response_size: parseInt((res.getHeader("content-length") as string) || "0", 10),
        user_agent: ((req.headers["user-agent"] as string) || "").substring(0, 200)
      };

      if (!ipBuffers.has(ip)) {
        ipBuffers.set(ip, []);
      }
      const buf = ipBuffers.get(ip)!;
      buf.push(record);

      if (buf.length >= MAX_BATCH_SIZE) {
        flushBuffers();
      }
    };

    res.on("finish", onFinish);
    next();
  };
}

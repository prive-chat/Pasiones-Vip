import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "https://pasiones-vip.vercel.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Client for backend operations
const rawUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') || "https://vqbupjnuveflshlhsmjz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auto country detection by client IP address
app.get("/api/detect-country", async (req, res) => {
  try {
    // 1. Direct Edge Proxy Geolocation Headers (High priority, fast and 100% accurate)
    const vercelCountry = req.headers["x-vercel-ip-country"] as string;
    const cfCountry = req.headers["cf-ipcountry"] as string;
    const gaeCountry = req.headers["x-appengine-country"] as string;
    const detectedCountryCode = (vercelCountry || cfCountry || gaeCountry || "").trim().toUpperCase();

    const countryMap: Record<string, { key: string; name: string }> = {
      'ES': { key: 'espana', name: 'España' },
      'EC': { key: 'ecuador', name: 'Ecuador' },
      'CO': { key: 'colombia', name: 'Colombia' },
      'MX': { key: 'mexico', name: 'México' },
      'US': { key: 'usa', name: 'Estados Unidos' },
      'AR': { key: 'argentina', name: 'Argentina' },
      'PE': { key: 'peru', name: 'Perú' },
      'VE': { key: 'venezuela', name: 'Venezuela' },
      'CL': { key: 'chile', name: 'Chile' }
    };

    if (detectedCountryCode && countryMap[detectedCountryCode]) {
      return res.json({
        status: "success",
        source: "header",
        countryCode: detectedCountryCode,
        country: countryMap[detectedCountryCode].name,
        countryKey: countryMap[detectedCountryCode].key
      });
    }

    // 2. Fallback to IP geolocation
    const rawIp = (req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string || req.ip || "").trim();
    // In multi-hop configurations, the leftmost IP in X-Forwarded-For is the real user IP
    const clientIp = rawIp.split(",")[0].trim();
    
    // Check for private IPs or localhost
    const isLocal = !clientIp || 
                    clientIp === "127.0.0.1" || 
                    clientIp === "::1" || 
                    clientIp.startsWith("10.") || 
                    clientIp.startsWith("192.168.") || 
                    clientIp.startsWith("172.") ||
                    clientIp.startsWith("169.254"); // GCP/AWS metadata & link-local

    let data: any = {};
    let success = false;

    if (!isLocal) {
      // 1st tier: ip-api.com
      try {
        const response = await fetch(`http://ip-api.com/json/${clientIp}`);
        if (response.ok) {
          const json = await response.json();
          if (json && json.status === "success" && json.countryCode) {
            data = {
              countryCode: json.countryCode.toUpperCase(),
              country: json.country
            };
            success = true;
          }
        }
      } catch (e) {
        console.error("ip-api fails:", e);
      }

      // 2nd tier: ipapi.co (fallback)
      if (!success) {
        try {
          const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
          if (response.ok) {
            const json = await response.json();
            if (json && !json.error && json.country_code) {
              data = {
                countryCode: json.country_code.toUpperCase(),
                country: json.country_name
              };
              success = true;
            }
          }
        } catch (e) {
          console.error("ipapi.co fails:", e);
        }
      }

      // 3rd tier: ipwho.is (fallback)
      if (!success) {
        try {
          const response = await fetch(`https://ipwho.is/${clientIp}`);
          if (response.ok) {
            const json = await response.json();
            if (json && json.success && json.country_code) {
              data = {
                countryCode: json.country_code.toUpperCase(),
                country: json.country
              };
              success = true;
            }
          }
        } catch (e) {
          console.error("ipwho.is fails:", e);
        }
      }
    }

    // Default fallback to "ES" if local or all APIs failed
    const finalCode = data.countryCode || (detectedCountryCode && detectedCountryCode !== "" ? detectedCountryCode : "ES");
    const mappedObj = countryMap[finalCode] || { key: "otros", name: data.country || "España" };

    res.json({
      status: success || detectedCountryCode ? "success" : "fallback",
      ip: clientIp || "local",
      countryCode: finalCode,
      country: mappedObj.name,
      countryKey: mappedObj.key
    });
  } catch (error: any) {
    res.json({
      status: "error",
      countryCode: "ES",
      country: "España",
      countryKey: "espana",
      error: error.message
    });
  }
});

// Push notification endpoint
app.post("/api/send-push", async (req, res) => {
  // Optional: Check for a secret header if you set one in Supabase
  // const webhookSecret = req.headers['x-webhook-secret'];
  // if (webhookSecret !== process.env.WEBHOOK_SECRET) return res.status(401).send();

  try {
    const { record } = req.body;
    
    // Get target user ID
    const userId = record.receiver_id || record.user_id;
    if (!userId) {
      return res.status(400).json({ error: "No user_id found in record" });
    }

    // NOTE: Here we require SUPABASE_SERVICE_ROLE_KEY to bypass RLS and fetch all user subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ success: true, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title: record.sender_name || "Pasiones Vip",
      body: record.content || "Nueva notificación",
      url: `/messages?id=${record.sender_id || ""}`,
      tag: "new-message"
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Sub expired - delete it
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        }
      })
    );

    res.json({ success: true, results });
  } catch (error: any) {
    console.error("Error sending push:", error);
    res.status(500).json({ error: error.message });
  }
});

async function setupServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Only listen if NOT on Vercel
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupServer();

export default app;

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { RtcTokenBuilder, RtcRole } from "agora-token";

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

// Supabase Client lazy-loaded for backend operations to prevent startup crashes when keys are missing
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const rawUrl = process.env.VITE_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') || "https://vqbupjnuveflshlhsmjz.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

    if (!supabaseServiceKey) {
      throw new Error("Supabase service key or anon key is missing. Active configuration is required for push operations.");
    }
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Agora RTC Token Generator
app.get("/api/agora-token", (req, res) => {
  const channelName = req.query.channelName as string;
  const uid = req.query.uid as string;

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }

  const appId = process.env.AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || "";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || process.env.VITE_AGORA_APP_CERTIFICATE || "";

  if (!appId) {
    return res.status(500).json({ error: "Agora App ID (VITE_AGORA_APP_ID) is not configured on the server." });
  }

  // If there's no App Certificate, token is not strictly required or can be empty
  if (!appCertificate) {
    console.warn("Agora App Certificate is not configured. Joining with empty token (testing mode).");
    return res.json({ token: "", appId });
  }

  try {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use User Account (string) based token builder since we use string user IDs in the frontend
    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      uid || "",
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    res.json({ token, appId });
  } catch (err: any) {
    console.error("Error generating Agora token:", err);
    res.status(500).json({ error: "Failed to generate Agora RTC token: " + err.message });
  }
});

// Auto country detection by client IP address
app.get("/api/detect-country", async (req, res) => {
  try {
    const rawIp = (req.headers["x-forwarded-for"] as string || req.ip || "").trim();
    const clientIp = rawIp.split(",")[0].trim();
    
    // Check for private IPs or localhost
    const isLocal = !clientIp || 
                    clientIp === "127.0.0.1" || 
                    clientIp === "::1" || 
                    clientIp.startsWith("10.") || 
                    clientIp.startsWith("192.168.") || 
                    clientIp.startsWith("172.");

    // Query IP details
    const targetUrl = isLocal ? "http://ip-api.com/json/" : `http://ip-api.com/json/${clientIp}`;
    const response = await fetch(targetUrl);
    const data = await response.json();
    
    res.json({
      status: "success",
      ip: clientIp || "local",
      countryCode: data.countryCode || "ES", // Default fallback if offline or failed
      country: data.country || "España"
    });
  } catch (error: any) {
    res.json({
      status: "error",
      countryCode: "ES",
      country: "España",
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
    const supabase = getSupabase();
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
  const isVercel = process.env.VERCEL === "1";
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath);

  // If not on Vercel and (either not in production or the compiled dist folder is missing), mount Vite dev server middleware
  if (!isVercel && (process.env.NODE_ENV !== "production" || !hasDist)) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    if (hasDist) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Serving compiled static files from dist.");
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

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
const VAPID_SUBJECT = "mailto:privechat.vip@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Client for backend operations
  const rawUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

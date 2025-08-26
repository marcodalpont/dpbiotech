// server.js
import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
import dotenv from "dotenv"; // <-- Aggiungi questo
dotenv.config(); // <-- Aggiungi questo all'inizio

const app = express(); // LA CORREZIONE È QUI: 'app' viene definito prima di essere usato

app.use(express.static(__dirname));
app.use(express.static("public"));
app.use(bodyParser.json());

// (Opzionale) CORS se il front NON è servito da questo stesso Express:
// import cors from "cors";
// app.use(cors({ origin: true }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Listini come sul sito ---
const BASE_PRICES = { "dp-mini": 2990, "dp-pro": 8990 };

const DP_MINI_OPTIONS = {
  objectives: { "50mm": 0, "60mm": 180, "75mm": 350 },
  eyepieces: { screen: 0, hd: 290, "4k": 580 },
  mounting: { handle: 0, arm: 220 }
};

const DP_PRO_OPTIONS = {
  stabilization: { "3axis": 0, enhanced: 450 },
  arm: { standard: 0, extended: 680 },
  controls: { basic: 0, joystick: 280, footpedal: 190 }, // joystick/footpedal cumulabili
  ai: { basic: 0, advanced: 590 }
};

const CARE = { none: 0, basic: 290, plus: 490 };

function computeTotalEUR(payload) {
  const { model, selections = {} } = payload || {};
  if (!BASE_PRICES[model]) throw new Error("Invalid model");

  let total = BASE_PRICES[model];

  if (model === "dp-mini") {
    const { objectives = "50mm", eyepieces = "screen", mounting = "handle", care = "none" } = selections;
    total += DP_MINI_OPTIONS.objectives[objectives] ?? 0;
    total += DP_MINI_OPTIONS.eyepieces[eyepieces] ?? 0;
    total += DP_MINI_OPTIONS.mounting[mounting] ?? 0;
    total += CARE[care] ?? 0;
  } else if (model === "dp-pro") {
    const {
      stabilization = "3axis",
      arm = "standard",
      controls = "basic",
      ai = "basic",
      care = "none",
      joystick = false,
      footpedal = false
    } = selections;

    total += DP_PRO_OPTIONS.stabilization[stabilization] ?? 0;
    total += DP_PRO_OPTIONS.arm[arm] ?? 0;
    if (joystick) total += DP_PRO_OPTIONS.controls.joystick;
    if (footpedal) total += DP_PRO_OPTIONS.controls.footpedal;
    total += DP_PRO_OPTIONS.ai[ai] ?? 0;
    total += CARE[care] ?? 0;
  }

  return Math.round(total * 100); // centesimi per Stripe
}

app.post("/create-checkout-session", async (req, res) => {
  try {
    const amount = computeTotalEUR(req.body);
    const lineName = req.body.model === "dp-mini" ? "DP Mini — Custom Config" : "DP Pro — Custom Config";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: lineName,
              description: (req.body.description || "Customized configuration").slice(0, 500)
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      // In server.js
      success_url: "https://www.dpbiotech.com/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:  "https://www.dpbiotech.com/cancel.html",
      metadata: {
        model: req.body.model,
        selections: JSON.stringify(req.body.selections || {})
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.listen(4242, () => console.log("Server listening on http://localhost:4242"));
// ════════════════════════════════════════════════════════════════════
//  CUSTOMER ACCOUNT NAV
//  Drop-in script that replaces the "Licensing" nav button with the
//  unified Account dropdown (same look as index.html). Handles Firebase
//  Auth state (logged-out vs logged-in), dropdown open/close, sign-out.
//
//  Usage: <script type="module" src="customer-account-nav.js"></script>
// ════════════════════════════════════════════════════════════════════
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAPZC_sUOYnwJdW3SG6uEoRKSDVXfcqjdg",
  authDomain:        "flutter-webview-e59a8.firebaseapp.com",
  databaseURL:       "https://flutter-webview-e59a8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "flutter-webview-e59a8",
  storageBucket:     "flutter-webview-e59a8.appspot.com",
  messagingSenderId: "766286969529",
  appId:             "1:766286969529:web:9418c504eca08fb1853968",
  measurementId:     "G-ZHPL8X1PXP"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Inject CSS once ─────────────────────────────────────────────────
if (!document.getElementById("customer-account-nav-css")) {
  const style = document.createElement("style");
  style.id = "customer-account-nav-css";
  style.textContent = `
    .account-menu { position: relative; display: inline-block; }
    .account-menu-btn {
      appearance: none; background: transparent;
      font: inherit; cursor: pointer;
      color: var(--text-primary, #0a0a0f);
      padding: 8px 14px;
      border: 1px solid transparent;
      border-radius: 999px;
      font-size: 13px; font-weight: 500;
      display: inline-flex; align-items: center; gap: 6px;
      transition: background 0.15s, border-color 0.15s;
    }
    .account-menu-btn:hover { background: var(--bg-secondary, #f2f2f4); }
    .account-menu-btn svg { width: 12px; height: 12px; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1); }
    .account-menu.is-open .account-menu-btn { background: var(--bg-secondary, #f2f2f4); border-color: var(--divider, rgba(10,10,15,0.06)); }
    .account-menu.is-open .account-menu-btn svg { transform: rotate(180deg); }
    .account-menu-panel {
      position: absolute; top: calc(100% + 2px); right: 0;
      min-width: 260px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--divider, rgba(10,10,15,0.06));
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(10,10,15,0.06), 0 32px 64px -16px rgba(15,23,42,0.12);
      padding: 8px;
      opacity: 0; visibility: hidden;
      transform: translateY(-6px) scale(0.98);
      transform-origin: top right;
      transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1), visibility 0.18s;
      z-index: 120;
    }
    .account-menu.is-open .account-menu-panel { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
    .account-menu-user, .account-menu-pitch { padding: 12px 14px 14px; border-bottom: 1px solid var(--divider, rgba(10,10,15,0.06)); margin-bottom: 6px; }
    .account-menu-name { font-size: 14px; font-weight: 600; color: var(--text-primary, #0a0a0f); margin: 0; }
    .account-menu-email { font-size: 12px; color: var(--text-secondary, #6b6b78); margin: 2px 0 0; word-break: break-all; }
    .account-menu-pitch .account-menu-email { margin: 4px 0 0; line-height: 1.45; word-break: normal; }
    .account-menu-link {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px;
      font-size: 13.5px; font-weight: 500;
      color: var(--text-primary, #0a0a0f); text-decoration: none; cursor: pointer;
      transition: background 0.12s;
    }
    .account-menu-link:hover { background: var(--bg-secondary, #f2f2f4); }
    .account-menu-link svg { width: 16px; height: 16px; color: var(--text-secondary, #6b6b78); flex-shrink: 0; }
    .account-menu-divider { height: 1px; background: var(--divider, rgba(10,10,15,0.06)); margin: 6px 8px; }
    .account-menu-signout {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 9px 12px; border-radius: 10px;
      font: inherit; font-size: 13.5px; font-weight: 500;
      color: #b91c1c;
      background: transparent; border: none;
      text-align: left; cursor: pointer;
      transition: background 0.12s;
    }
    .account-menu-signout:hover { background: rgba(239, 68, 68, 0.08); }
    .account-menu-signout svg { width: 16px; height: 16px; flex-shrink: 0; }
    @media (prefers-color-scheme: dark) {
      .account-menu-signout { color: #f87171; }
      .account-menu-signout:hover { background: rgba(239, 68, 68, 0.15); }
    }
    .account-menu[hidden] { display: none; }
  `;
  document.head.appendChild(style);
}

// ── Build the dropdown HTML ─────────────────────────────────────────
function buildAccountMenuHtml() {
  return `
    <div class="account-menu desktop-btn" id="cn-account-menu" style="display:inline-flex;">
      <button type="button" class="account-menu-btn" id="cn-account-trigger" aria-haspopup="menu" aria-expanded="false">
        <span>Account</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="account-menu-panel" role="menu">
        <div class="account-menu-loggedout" id="cn-account-loggedout">
          <div class="account-menu-pitch">
            <p class="account-menu-name">Welcome</p>
            <p class="account-menu-email">Sign in to manage your microscopes, orders &amp; subscriptions.</p>
          </div>
          <a href="loginprofile.html" class="account-menu-link" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Log in
          </a>
          <a href="loginprofile.html#signup" class="account-menu-link" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Create an account
          </a>
        </div>
        <div class="account-menu-loggedin" id="cn-account-loggedin" hidden>
          <div class="account-menu-user">
            <p class="account-menu-name" id="cn-nav-user-name">—</p>
            <p class="account-menu-email" id="cn-nav-user-email">—</p>
          </div>
          <a href="account.html" class="account-menu-link" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            My account
          </a>
          <a href="account.html#orders-invoices" class="account-menu-link" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Orders &amp; invoices
          </a>
          <a href="account.html#your-microscopes" class="account-menu-link" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 18h12M9 18V8.5a3 3 0 0 1 6 0V18M5 22h14M11 4h2v3h-2z"/>
            </svg>
            My microscopes
          </a>
          <div class="account-menu-divider"></div>
          <button type="button" class="account-menu-signout" data-signout>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>`;
}

// ── Replace the existing "Licensing" link in nav-actions ────────────
function mountAccountMenu() {
  // Don't double-mount if some page already has it
  if (document.getElementById("cn-account-menu") || document.getElementById("account-menu-desktop")) {
    return null;
  }
  // Look for the licensing button in nav-actions
  const candidates = document.querySelectorAll('.nav-actions a[href="licensing.html"], a[href="licensing.html"].btn');
  let target = null;
  for (const c of candidates) {
    if (c.closest('.nav-actions')) { target = c; break; }
  }
  if (!target) {
    // Fallback: prepend to nav-actions
    const actions = document.querySelector('.nav-actions');
    if (!actions) return null;
    const wrap = document.createElement('div');
    wrap.innerHTML = buildAccountMenuHtml();
    actions.insertBefore(wrap.firstElementChild, actions.firstChild);
    return document.getElementById('cn-account-menu');
  }
  // Replace in place
  const wrap = document.createElement('div');
  wrap.innerHTML = buildAccountMenuHtml();
  const node = wrap.firstElementChild;
  target.replaceWith(node);
  return node;
}

// ── Staff check: redirect staff to dashboard (consistent with index) ─
async function isStaffMember(email) {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const docId = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  try {
    const snap = await getDoc(doc(db, "team", docId));
    if (snap.exists()) return true;
  } catch (_) {}
  try {
    const q = query(collection(db, "team"), where("email", "==", lower));
    const qs = await getDocs(q);
    return !qs.empty;
  } catch (_) { return false; }
}

// ── Boot ────────────────────────────────────────────────────────────
function boot() {
  const root = mountAccountMenu();
  if (!root) return;

  const trigger    = document.getElementById('cn-account-trigger');
  const loggedIn   = document.getElementById('cn-account-loggedin');
  const loggedOut  = document.getElementById('cn-account-loggedout');
  const userName   = document.getElementById('cn-nav-user-name');
  const userEmail  = document.getElementById('cn-nav-user-email');

  // Dropdown open/close
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = root.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Sign out (any element with [data-signout] anywhere on the page)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-signout]');
    if (!btn) return;
    e.preventDefault();
    try { await signOut(auth); } catch (err) { console.error('Sign out failed', err); }
    // Stay on current page; the auth listener will swap the UI back.
  });

  // Auth state → swap UI
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Staff members get bounced to the internal dashboard
      if (await isStaffMember(user.email)) {
        window.location.href = "dashboard.html";
        return;
      }
      loggedIn.hidden  = false;
      loggedOut.hidden = true;
      if (userName)  userName.textContent  = user.displayName || (user.email || "").split('@')[0];
      if (userEmail) userEmail.textContent = user.email || '';
    } else {
      loggedIn.hidden  = true;
      loggedOut.hidden = false;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

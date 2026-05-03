/**
 * DP Pro Waitlist Modal — shared across pages.
 *
 * Usage:
 *   1. Add `<script src="waitlist-modal.js"></script>` before </body>.
 *   2. Mark any trigger element with `data-open-waitlist` (e.g. <button data-open-waitlist>Join the waitlist</button>).
 *
 * The script injects its own CSS and modal markup, then wires up triggers,
 * the close button, click-outside, Escape key, validation, success state,
 * localStorage persistence, and a best-effort POST to /waitlist.
 */
(function () {
    if (window.__dpProWaitlistInit) return;
    window.__dpProWaitlistInit = true;

    const CSS = `
.waitlist-overlay {
    position: fixed; inset: 0;
    background: rgba(10, 10, 15, 0.40);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    display: none;
    align-items: center; justify-content: center;
    z-index: 9999; padding: 24px;
    opacity: 0;
    transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.waitlist-overlay.is-open { display: flex; opacity: 1; }
.waitlist-banner {
    background: var(--bg-card, var(--card, #ffffff));
    border: 1px solid var(--divider, var(--line, rgba(10,10,15,0.06)));
    border-radius: 24px;
    padding: 48px 44px 36px;
    text-align: center;
    position: relative;
    overflow: hidden;
    max-width: 460px; width: 100%;
    box-shadow:
        0 1px 0 rgba(255,255,255,0.6) inset,
        0 32px 80px -16px rgba(10,10,15,0.32),
        0 8px 24px -8px rgba(10,10,15,0.12);
    transform: translateY(8px) scale(0.985);
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: inherit;
}
.waitlist-overlay.is-open .waitlist-banner { transform: translateY(0) scale(1); }
.waitlist-banner::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.5) 50%, transparent 100%);
}
@media(max-width: 640px) { .waitlist-banner { padding: 40px 24px 28px; border-radius: 20px; } }
.waitlist-close {
    position: absolute; top: 14px; right: 14px;
    width: 30px; height: 30px;
    border-radius: 999px;
    background: transparent; border: none;
    color: var(--text-secondary, var(--text-muted, var(--muted, #6b6b78)));
    font-size: 20px; line-height: 1;
    cursor: pointer;
    display: grid; place-items: center;
    transition: background 0.18s ease, color 0.18s ease;
    font-family: inherit;
}
.waitlist-close:hover {
    background: var(--bg-secondary, #f2f2f4);
    color: var(--text-primary, var(--text, #0a0a0f));
}
.waitlist-content { max-width: 380px; margin: 0 auto; }
.waitlist-eyebrow {
    display: inline-block;
    font-size: 10.5px; font-weight: 600;
    color: #2563eb;
    text-transform: uppercase; letter-spacing: 0.12em;
    margin-bottom: 12px;
    opacity: 0.85;
}
.waitlist-title {
    font-size: 24px;
    line-height: 1.15; letter-spacing: -0.022em;
    margin: 0 0 10px;
    color: var(--text-primary, var(--text, #0a0a0f));
    font-weight: 600;
}
.waitlist-sub {
    font-size: 14px; line-height: 1.55;
    color: var(--text-secondary, var(--text-muted, var(--muted, #6b6b78)));
    margin: -10px 0 37px;
}
.waitlist-sub strong { color: var(--text-primary, var(--text, #0a0a0f)); font-weight: 500; }
.waitlist-form {
    display: flex; gap: 8px;
    margin: 0 0 8px;
    flex-wrap: wrap;
}
.waitlist-input {
    flex: 1; min-width: 180px;
    padding: 12px 16px;
    border: 1px solid var(--divider-strong, rgba(10,10,15,0.10));
    border-radius: 999px;
    background: var(--bg-secondary, #f2f2f4);
    color: var(--text-primary, var(--text, #0a0a0f));
    font-family: inherit; font-size: 14px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.waitlist-input::placeholder { color: var(--text-secondary, #6b6b78); opacity: 0.55; }
.waitlist-input:focus {
    outline: none;
    background: var(--bg-card, #ffffff);
    border-color: rgba(37,99,235,0.5);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.waitlist-input.has-error { border-color: rgba(220,38,38,0.5); box-shadow: 0 0 0 3px rgba(220,38,38,0.10); }
.waitlist-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 20px;
    border: none; border-radius: 999px;
    background: var(--text-primary, var(--text, #0a0a0f));
    color: var(--bg-card, #ffffff);
    font-family: inherit; font-size: 13.5px; font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
    white-space: nowrap;
    letter-spacing: -0.005em;
}
.waitlist-btn:hover { transform: translateY(-1px); opacity: 0.92; }
.waitlist-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.waitlist-error {
    display: none;
    font-size: 12.5px; color: #dc2626;
    margin: 4px 0 0;
}
.waitlist-error.is-visible { display: block; }
.waitlist-privacy {
    font-size: 11.5px; color: var(--text-secondary, var(--muted, #6b6b78));
    margin: 8px 0 0;
    line-height: 1.5;
    opacity: 0.85;
}
.waitlist-success { max-width: 380px; margin: 0 auto; }
.waitlist-success-icon {
    width: 52px; height: 52px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04));
    border: 1px solid rgba(37,99,235,0.25);
    color: #2563eb;
    display: grid; place-items: center;
    margin: 0 auto 18px;
}
.waitlist-success-title {
    font-size: 22px; letter-spacing: -0.022em;
    margin: 0 0 10px;
    color: var(--text-primary, var(--text, #0a0a0f));
    font-weight: 600;
}
.waitlist-success-sub {
    font-size: 14px; line-height: 1.55;
    color: var(--text-secondary, var(--muted, #6b6b78));
    margin: 0 0 18px;
}
.waitlist-success-sub strong { color: var(--text-primary, var(--text, #0a0a0f)); font-weight: 500; }
.waitlist-success-link {
    background: none; border: none;
    color: var(--text-secondary, var(--muted, #6b6b78));
    font-family: inherit;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    padding: 0;
    transition: color 0.2s ease;
}
.waitlist-success-link:hover { color: var(--text-primary, var(--text, #0a0a0f)); }
body.no-scroll { overflow: hidden; }
`;

    const HTML = `
<div class="waitlist-overlay" id="waitlist-overlay" aria-hidden="true">
    <div class="waitlist-banner" role="dialog" aria-modal="true" aria-labelledby="waitlist-title-h" id="waitlist-banner">
        <button type="button" class="waitlist-close" id="waitlist-close" aria-label="Close">&times;</button>

        <div class="waitlist-content" id="waitlist-content">
            <span class="waitlist-eyebrow">Be First in Line</span>
            <h2 class="waitlist-title" id="waitlist-title-h">Join the DP Pro waitlist.</h2>
            <p class="waitlist-sub">Leave your email and we'll let you know as soon as the DP Pro is ready — datasheet, pricing and the first private demos. <strong>One email, no follow-ups.</strong></p>

            <form class="waitlist-form" id="waitlist-form" novalidate>
                <input type="email" id="waitlist-email" name="email" class="waitlist-input" placeholder="you@clinic.com" required autocomplete="email" aria-label="Email address">
                <button type="submit" class="waitlist-btn" id="waitlist-submit">Notify me</button>
            </form>
            <p class="waitlist-error" id="waitlist-error">Please enter a valid email address.</p>

            <p class="waitlist-privacy">
                We'll only use your email to send launch news. Unsubscribe anytime · GDPR compliant.
            </p>
        </div>

        <div class="waitlist-success" id="waitlist-success" hidden>
            <div class="waitlist-success-icon">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="waitlist-success-title">You're on the list.</h3>
            <p class="waitlist-success-sub">We'll email <strong id="waitlist-success-email">you</strong> the moment the DP Pro is ready — right after the DP Mini launch.</p>
            <button type="button" class="waitlist-success-link" id="waitlist-edit">Use a different email</button>
        </div>
    </div>
</div>`;

    function init() {
        // Inject CSS
        const style = document.createElement('style');
        style.id = 'waitlist-modal-style';
        style.textContent = CSS;
        document.head.appendChild(style);

        // Inject HTML
        const container = document.createElement('div');
        container.innerHTML = HTML;
        document.body.appendChild(container.firstElementChild);

        // Wire up
        const overlay = document.getElementById('waitlist-overlay');
        const closeBtn = document.getElementById('waitlist-close');
        const form = document.getElementById('waitlist-form');
        const emailInput = document.getElementById('waitlist-email');
        const submitBtn = document.getElementById('waitlist-submit');
        const errorEl = document.getElementById('waitlist-error');
        const content = document.getElementById('waitlist-content');
        const successView = document.getElementById('waitlist-success');
        const successEmail = document.getElementById('waitlist-success-email');
        const editBtn = document.getElementById('waitlist-edit');

        function openModal() {
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
            successView.hidden = true;
            content.style.display = '';
            emailInput.classList.remove('has-error');
            errorEl.classList.remove('is-visible');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Notify me';
            setTimeout(() => emailInput.focus(), 100);
        }
        function closeModal() {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        }

        // Wire all triggers (use event delegation so dynamically added buttons work too)
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-open-waitlist]');
            if (trigger) {
                e.preventDefault();
                openModal();
            }
        });

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
        });

        function isValidEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }

        emailInput.addEventListener('input', () => {
            emailInput.classList.remove('has-error');
            errorEl.classList.remove('is-visible');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email || !isValidEmail(email)) {
                errorEl.classList.add('is-visible');
                emailInput.classList.add('has-error');
                emailInput.focus();
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding…';

            const list = JSON.parse(localStorage.getItem('dpProWaitlist') || '[]');
            if (!list.find(item => item.email === email)) {
                list.push({ email, signedUpAt: new Date().toISOString(), product: 'DP Pro' });
                localStorage.setItem('dpProWaitlist', JSON.stringify(list));
            }

            try {
                await fetch('https://server-pagamenti-dp.onrender.com/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, product: 'DP Pro', signedUpAt: new Date().toISOString() })
                });
            } catch (_) { /* ignore — local copy is kept */ }

            successEmail.textContent = email;
            content.style.display = 'none';
            successView.hidden = false;
        });

        editBtn.addEventListener('click', () => {
            successView.hidden = true;
            content.style.display = '';
            emailInput.value = '';
            emailInput.focus();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Notify me';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

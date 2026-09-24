/* DP Biotech — development password gate, for two versions of the site.

   Each password opens one version: the updated site, at the root of the domain, or the previous one, kept
   as it was published in old/. Root pages load this synchronously at the top of <head>:
       <script src="gate.js"></script>
   and pages in old/ load it with:
       <script src="../gate.js" data-site="old"></script>
   A page stays hidden until the browser shows it knows a password. login.html turns the typed password into
   a key with PBKDF2 and stores that key; here we only compare the key's SHA-256 with VERIFIERS, which also
   say which version that password opens. The passwords themselves are not in the site, and a key can't be
   made up without them. A browser holding the password of the other version is sent to the same page in
   that version (or to its home page, if the page does not exist there).

   The key is kept in localStorage, so a browser that entered a password is not asked again (new tabs,
   restarts) until the password changes. login.html always shows the form when it is opened, so the other
   version is one password away.

   To set a new password, print its verifier and put it in VERIFIERS with its version:

     python3 -c "import hashlib,sys; k=hashlib.pbkdf2_hmac('sha256', sys.argv[1].encode(), bytes.fromhex('9717a492a61d2fbe883d2db0f46ae42a'), 600000); print(hashlib.sha256(k).hexdigest())" 'NEW PASSWORD'

   To log every browser out while keeping the passwords, change SALT and regenerate the verifiers.

   Limits: the site is static and public on GitHub Pages, so this keeps visitors out of the pages in a
   browser, not someone who downloads the HTML directly or reads the repository. */
(function () {
    'use strict';
    var SALT = '9717a492a61d2fbe883d2db0f46ae42a';
    var ITERATIONS = 600000;
    // verifier -> the version its password opens: 'new' (the root) or 'old' (old/)
    var VERIFIERS = {
        'fb7ed6c4b56e3d1df502baaab813029cfe48f211c58917192093f58e8efff5ea': 'old',   // main password of the previous site
        'a3ea64c615c73f5c4dc5e8500aecdbd94b235168eabc7dcf93cf4aba3ccf6972': 'old',   // alternative password of the previous site
        'fc459754d62f32a0162d5e349bdddb297168b2f510ef2a1752cc766c8ddbd4a3': 'new',   // password of the updated site
    };
    // the pages that exist in old/ (everything else of the updated site has no old counterpart)
    var OLD_PAGES = [
        'DPMini.html', 'DPPro.html', 'account.html', 'all-models.html', 'buy.html', 'buydpmini.html',
        'buydppro.html', 'cancel.html', 'checkout.html', 'configure.html', 'consultation.html', 'contactus.html',
        'dashboard.html', 'index.html', 'inventory.html', 'license-purchase.html', 'licensing.html', 'login.html',
        'loginprofile.html', 'medconnectmini.html', 'medconnectpro.html', 'medpatient.html', 'medshare.html', 'staff-profile.html',
        'stands.html', 'success.html', 'support-console.html', 'team.html', 'viewer.html'
    ];
    var STORE = 'dpb_gate_key';

    function hex(buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    function bytes(h) {
        return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); }));
    }
    function stored() {
        try { return localStorage.getItem(STORE); } catch (e) { return null; }
    }
    var subtle = window.crypto && window.crypto.subtle;   // only on https (and localhost)

    // the version keyHex opens ('new' or 'old'), or null
    function versionOf(keyHex) {
        if (!subtle || !/^[0-9a-f]{64}$/.test(keyHex || '')) return Promise.resolve(null);
        return subtle.digest('SHA-256', bytes(keyHex)).then(function (d) { return VERIFIERS[hex(d)] || null; });
    }
    // where a page lives in a version, as a path from the root of the site
    function pageIn(version, file) {
        file = file || 'index.html';
        if (version === 'old') return 'old/' + (OLD_PAGES.indexOf(file.split(/[?#]/)[0]) !== -1 ? file : 'index.html');
        return file;
    }

    window.dpbGate = {
        available: !!subtle,
        check: function () { return versionOf(stored()); },
        pageIn: pageIn,
        // derives the key of a typed password; stores it and resolves the version it opens, or null
        login: function (password) {
            if (!subtle) return Promise.resolve(null);
            return subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
                .then(function (base) {
                    return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(SALT), iterations: ITERATIONS }, base, 256);
                })
                .then(function (bits) {
                    var key = hex(bits);
                    return versionOf(key).then(function (version) {
                        if (version) { try { localStorage.setItem(STORE, key); } catch (e) { /* private mode: asked again next time */ } }
                        return version;
                    });
                });
        },
    };

    // login.html loads this with data-login: it only needs window.dpbGate
    var me = document.currentScript;
    if (me && me.hasAttribute('data-login')) return;

    var site = me && me.getAttribute('data-site') === 'old' ? 'old' : 'new';
    var up = site === 'old' ? '../' : '';                 // from this page to the root of the site
    var file = location.pathname.split('/').pop() || 'index.html';
    var root = document.documentElement;
    root.style.visibility = 'hidden';
    function toLogin() {
        var here = (site === 'old' ? 'old/' : '') + file + location.search + location.hash;
        location.replace(up + 'login.html?next=' + encodeURIComponent(here));
    }
    window.dpbGate.check().then(function (version) {
        if (version === site) root.style.visibility = '';
        else if (version) location.replace(up + pageIn(version, file + location.search + location.hash));
        else toLogin();
    }, toLogin);
})();

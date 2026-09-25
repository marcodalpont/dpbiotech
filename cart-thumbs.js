/* DP Biotech — the small product picture on each item of the cart panel, the same as in the checkout summary.
   Every page with the cart loads this (with products.js, for the accessories' pictures) in <head>, and its cart
   template calls dpbCartThumb(item.name) inside <div class="cart-product-card has-thumb">.
   It adds the few styles the picture needs, so the pages' own cart styles stay as they are. */
(function () {
    'use strict';
    var css = document.createElement('style');
    css.textContent =
        '.cart-product-card.has-thumb { display: grid !important; grid-template-columns: 64px minmax(0, 1fr); column-gap: 14px; align-items: start; }' +
        '.cart-product-card.has-thumb > :not(.cart-thumb) { grid-column: 2; }' +
        '.cart-thumb { grid-column: 1; grid-row: 1 / span 3; position: relative; width: 64px; height: 64px; border-radius: 12px;' +
        ' overflow: hidden; background: var(--bg-secondary, #f2f2f4); display: grid; place-items: center; color: var(--text-secondary, #86868b); }' +
        '.cart-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 5px;' +
        ' box-sizing: border-box; mix-blend-mode: multiply; }';
    document.head.appendChild(css);

    var BOX = '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-4.5-9 4.5m18 0l-9 4.5m9-4.5v9l-9 4.5m0-9L3 7.5m9 4.5v9m-9-13.5v9l9 4.5"/></svg>';
    window.dpbCartThumb = function (fullName) {
        var name = String(fullName || '').split('(')[0].trim();
        var inner = BOX;
        if (/^dp mini\b/i.test(name) && !/case/i.test(name)) {
            inner = '<img src="renders/dpmini-hero@800.webp" alt="" loading="lazy">';
        } else {
            // an accessory (products.js): its photo, or its line drawing until there is one
            var acc = (window.DPB_ACCESSORIES || []).filter(function (a) { return a.name === name; })[0];
            if (acc) inner = acc.image ? '<img src="' + acc.image + '" alt="" loading="lazy">'
                : '<svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48" aria-hidden="true">' + acc.icon + '</svg>';
        }
        return '<div class="cart-thumb">' + inner + '</div>';
    };
})();

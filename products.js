/* DP Biotech — the accessories, sold on their own (accessories.html) and with a DP Mini (buydpmini.html).
   One list for the Accessories page, the DP Mini configurator and the checkout: a price changes here only.
   Prices in euro, excluding VAT.
     group     the section of the Accessories page it goes in: 'pedal', 'stands' or 'travel'
     price     on its own
     withMini  when it is added to a DP Mini in the configurator (none: same price)
     worksWith the microscopes it works with
     fits      what it is made for, when that is not a microscope (the DP Stand's case)
     image     the product photo, or null until there is one: the page draws `icon` in its place
   The configurator finds its rows by id (data-product on the row in buydpmini.html).
   The payment server keeps its own list of these prices (server-pagamenti-dp): change them there too. */
window.DPB_ACCESSORIES = [
    {
        id: 'dp-pedal',
        group: 'pedal',
        name: 'DP Pedal',
        price: 1490,
        withMini: 670,
        worksWith: ['DP Mini', 'DP Pro'],
        line: 'Zoom, focus, light and your library. All underfoot.',
        text: 'Zoom, focus and light, and scroll and select through your image library, with your foot.',
        image: null,          // e.g. 'renders/dp-pedal.webp'
        icon: '<rect x="7" y="31" width="34" height="8" rx="2.5"/><path d="M11 31l24.5-10a2 2 0 0 1 2.6 1.1L40 27"/><circle cx="11" cy="31" r="1.4"/>',
    },
    {
        id: 'dp-stand',
        group: 'stands',
        name: 'DP Stand',
        price: 1850,
        worksWith: ['DP Mini', 'DP Pro'],
        line: 'Quick attach. Quick release. Room to room in seconds.',
        text: 'Attaches to any vertical pole from 44 to 56 mm. Put one in every room and move your microscope between them in seconds. The first DP Stand comes with DP Mini.',
        image: 'renders/dp-stand.webp',     // render from blender/DPSTAND.blend (pipeline/stand_3_finale.py)
        icon: '<path d="M24 4v40"/><rect x="18" y="16" width="12" height="10" rx="2.5"/><path d="M30 21h9M39 17v8M16 44h16"/>',
    },
    {
        id: 'mobile-cart',
        group: 'stands',
        name: 'Mobile Cart',
        price: 2350,
        worksWith: ['DP Mini', 'DP Pro'],
        line: 'Roll it wherever you work.',
        text: 'A stand on wheels, to roll your microscope wherever you work.',
        image: null,
        icon: '<path d="M24 4v31"/><rect x="18" y="11" width="12" height="10" rx="2.5"/><path d="M30 16h7M11 35h26"/><circle cx="13" cy="40" r="2.5"/><circle cx="24" cy="40" r="2.5"/><circle cx="35" cy="40" r="2.5"/>',
    },
    {
        id: 'desk-mount',
        group: 'stands',
        name: 'Desk Mount',
        price: 279,
        worksWith: ['DP Mini', 'DP Pro'],
        line: 'On your desk or workbench.',
        text: 'For a desk or workbench: your microscope where you sit and work.',
        image: null,
        icon: '<path d="M24 29V7"/><rect x="18" y="12" width="12" height="10" rx="2.5"/><path d="M30 17h7M4 29h40v4H4zM20 33v6h8v-6"/>',
    },
    {
        id: 'carrying-case',
        group: 'travel',
        name: 'DP Mini Carrying Case',
        price: 290,
        worksWith: ['DP Mini'],
        line: 'Take DP Mini with you.',
        text: 'Reinforced travel case with custom-cut foam inserts.',
        image: 'renders/dpmini-case.webp',    // pipeline/valigia_1_render.py (anteprima)
        icon: '<rect x="6" y="14" width="36" height="26" rx="4"/><path d="M18 14v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M6 24h36M14 22v5M34 22v5"/>',
    },
    {
        id: 'stand-case',
        group: 'travel',
        name: 'DP Stand Carrying Case',
        price: 240,
        fits: 'DP Stand',
        line: 'The carrying case for the DP Stand.',
        text: '',
        image: 'renders/dpstand-case.webp',   // pipeline/valigia_1_render.py (anteprima)
        icon: '<rect x="4" y="18" width="40" height="19" rx="4"/><path d="M19 18v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M4 27h40M12 25v5M36 25v5"/>',
    },
];

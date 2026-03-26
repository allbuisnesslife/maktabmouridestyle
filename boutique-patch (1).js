/**
 * ════════════════════════════════════════════════════════════
 *  MAKTAB MOURIDE STYLE — Patch Boutique
 *  Compatible iPhone / Safari / Android / Chrome / Firefox
 *  Charge les produits depuis localStorage (stockage universel)
 *  Ajoutez ce script dans index.html juste avant </body>
 *  <script src="boutique-patch.js"></script>
 * ════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const PRODUCTS_KEY = 'maktab_products';
    const IMG_PREFIX   = 'maktab_img_';

    // ── Charge les produits depuis localStorage ──
    function loadProducts() {
        try {
            const raw = localStorage.getItem(PRODUCTS_KEY);
            if (!raw) return [];
            const products = JSON.parse(raw);
            // Réinjecte les images stockées séparément
            return products.map(function(p) {
                if (p.image && p.image.startsWith('__img__')) {
                    var imgId = p.image.replace('__img__', '');
                    var imgData = localStorage.getItem(IMG_PREFIX + imgId);
                    return Object.assign({}, p, { image: imgData || '' });
                }
                return p;
            });
        } catch(e) {
            return [];
        }
    }

    // ── Expose getProducts() globalement pour la boutique ──
    window.getProducts = function() {
        return loadProducts();
    };

    // ── Rend une carte produit HTML ──
    function makeProductCard(p) {
        var imgHtml = '';
        if (p.image && (p.image.startsWith('data:') || p.image.startsWith('http') || p.image.includes('.'))) {
            imgHtml = '<img src="' + escHtml(p.image) + '" alt="' + escHtml(p.name) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML=\'<span style=font-size:2.5rem>🛍️</span>\'">';
        } else {
            imgHtml = '<span style="font-size:2.5rem;">' + (p.image || '🛍️') + '</span>';
        }

        var badgeHtml = p.badge ? '<div class="product-badge">' + escHtml(p.badge) + '</div>' : '';
        var priceHtml = p.price ? '<span class="product-price">' + Number(p.price).toLocaleString('fr-FR') + ' FCFA</span>' : '';
        var descHtml  = p.description ? '<p class="product-desc">' + escHtml(p.description) + '</p>' : '';
        var waMsg = encodeURIComponent('Bonjour ! Je suis intéressé(e) par : ' + p.name + (p.price ? ' (' + Number(p.price).toLocaleString('fr-FR') + ' FCFA)' : ''));

        return '<div class="product-item" data-category="' + escHtml(p.category) + '" data-id="' + escHtml(String(p.id)) + '">'
            + '<div class="product-img-wrap" style="position:relative;width:100%;height:220px;background:linear-gradient(135deg,#1a472a,#4a8c5c);display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px 12px 0 0;">'
            + imgHtml + badgeHtml
            + '</div>'
            + '<div class="product-info" style="padding:1rem;">'
            + '<h3 class="product-name" style="font-size:1rem;font-weight:700;margin-bottom:.4rem;">' + escHtml(p.name) + '</h3>'
            + (p.arabic ? '<p style="font-size:.85rem;color:#6b7280;direction:rtl;">' + escHtml(p.arabic) + '</p>' : '')
            + priceHtml
            + descHtml
            + '<a href="https://wa.me/+221773420977?text=' + waMsg + '" target="_blank" class="btn-commander" style="display:inline-flex;align-items:center;gap:.4rem;margin-top:.8rem;background:#25D366;color:white;padding:.5rem 1rem;border-radius:20px;font-size:.85rem;font-weight:700;text-decoration:none;">🛒 Commander</a>'
            + '</div>'
            + '</div>';
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Injecte les produits dans la section boutique ──
    function injectProducts() {
        var products = loadProducts();

        // Cherche le conteneur de la boutique (plusieurs sélecteurs possibles)
        var container = document.getElementById('productsGrid')
            || document.getElementById('boutique-products')
            || document.getElementById('shop-products')
            || document.querySelector('.products-grid')
            || document.querySelector('.shop-grid')
            || document.querySelector('[data-products]');

        if (!container) {
            // Cherche dans la section boutique
            var sections = document.querySelectorAll('section, .section, #boutique, #shop, [id*="boutique"], [id*="shop"]');
            for (var i = 0; i < sections.length; i++) {
                var text = sections[i].textContent || '';
                if (text.includes('Boutique') || text.includes('boutique') || text.includes('produit')) {
                    var grids = sections[i].querySelectorAll('.grid, .products, [class*="grid"], [class*="product"]');
                    if (grids.length) { container = grids[0]; break; }
                }
            }
        }

        if (!container) return; // La boutique a son propre système

        if (products.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#6b7280;">'
                + '<div style="font-size:3rem;margin-bottom:1rem;">📦</div>'
                + '<h3 style="font-family:serif;font-size:1.5rem;color:#1a472a;margin-bottom:.5rem;">Aucun produit disponible</h3>'
                + '<p>Revenez bientôt pour découvrir nos nouveautés !</p>'
                + '</div>';
            return;
        }

        container.innerHTML = products.map(makeProductCard).join('');

        // Met à jour les filtres si présents
        syncFilters(products);
    }

    // ── Synchronise les filtres de catégories ──
    function syncFilters(products) {
        var filterBtns = document.querySelectorAll('[data-filter], [data-category-filter], .filter-btn, .category-btn');
        if (!filterBtns.length) return;

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cat = this.dataset.filter || this.dataset.categoryFilter || this.textContent.trim().toLowerCase();
                var container = document.querySelector('.products-grid, [data-products]');
                if (!container) return;

                var items = container.querySelectorAll('.product-item');
                items.forEach(function(item) {
                    if (cat === 'all' || cat === 'tout' || cat === '') {
                        item.style.display = '';
                    } else {
                        var itemCat = (item.dataset.category || '').toLowerCase();
                        item.style.display = itemCat.includes(cat) ? '' : 'none';
                    }
                });

                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
            });
        });
    }

    // ── Lance l'injection au bon moment ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectProducts);
    } else {
        injectProducts();
    }

    // ── Réinjecte si la boutique charge dynamiquement ──
    var observer = new MutationObserver(function(mutations) {
        for (var m of mutations) {
            for (var node of m.addedNodes) {
                if (node.nodeType === 1) {
                    var el = node.querySelector && (
                        node.querySelector('#productsGrid') ||
                        node.querySelector('.products-grid') ||
                        node.querySelector('[data-products]')
                    );
                    if (el) { injectProducts(); return; }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Écoute les changements de localStorage (si admin ouvert dans un autre onglet)
    window.addEventListener('storage', function(e) {
        if (e.key === PRODUCTS_KEY) {
            injectProducts();
        }
    });

})();

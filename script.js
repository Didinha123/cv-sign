/**
 * TDA Açaí — Script Principal
 * Layout: App delivery (estilo cardapioweb)
 */

// ─────────────────────────────────────────────────────────────
// ⚠️  COLE AQUI A URL DO SEU APPS SCRIPT
//     Assim funciona em TODOS os dispositivos automaticamente.
//     Exemplo: 'https://script.google.com/macros/s/ABC.../exec'
// ─────────────────────────────────────────────────────────────
const SHEETS_URL_FIXO = 'https://script.google.com/macros/s/AKfycbzMkdRxMa5ECAPABJDwdLugyY7r8imAQohtOXwr9HjmweqUhr2FWUx6l2Lo4PUPvKIh/exec';

// ─────────────────────────────────────────────────────────────
// DADOS DOS PRODUTOS
// ─────────────────────────────────────────────────────────────

const PRODUCTS = {
    diego: {
        id: 'diego', name: 'Copo Diego', cat: 'copos', image: './Copo1.png',
        desc: 'Açaí cremoso com leite condensado, paçoca, amendoim e frutas frescas. Uma explosão de sabor a cada colherada.',
        sizes: [
            { label: '300ml', price: 21.00 },
            { label: '500ml', price: 26.00 },
            { label: '700ml', price: 30.00 },
        ]
    },
    arthur: {
        id: 'arthur', name: 'Copo Arthur', cat: 'copos', image: './Copo2.png',
        desc: 'Morango fresco, creme de avelã e leite Ninho em um açaí super cremoso e irresistível.',
        sizes: [
            { label: '300ml', price: 22.00 },
            { label: '500ml', price: 27.00 },
            { label: '700ml', price: 31.00 },
        ]
    },
    thaina: {
        id: 'thaina', name: 'Copo Thaina', cat: 'copos', image: './Copo3.png',
        desc: 'Morango fresco, leite condensado e amendoim crocante em um açaí cremoso e irresistível.',
        sizes: [
            { label: '300ml', price: 21.00 },
            { label: '500ml', price: 26.00 },
            { label: '700ml', price: 30.00 },
        ]
    },
    davi: {
        id: 'davi', name: 'Copo Davi', cat: 'copos', image: './Copo4.png',
        desc: 'Banana fresca, leite condensado e granola crocante em um açaí cremoso e refrescante.',
        sizes: [
            { label: '300ml', price: 21.00 },
            { label: '500ml', price: 26.00 },
            { label: '700ml', price: 30.00 },
        ]
    },
    tda: {
        id: 'tda', name: 'Copo TDA', cat: 'copos', image: './Diego max.png',
        desc: 'Uva, banana, leite em pó e creme de avelã — o equilíbrio perfeito entre sabor e intensidade.',
        sizes: [
            { label: '300ml', price: 22.00 },
            { label: '500ml', price: 27.00 },
            { label: '700ml', price: 31.00 },
        ]
    },
    combo: {
        id: 'combo', name: 'Combo Família', cat: 'combos', image: './4-copos.jpeg',
        desc: '4 copos com açaí, frutas frescas, leite condensado, paçoca, creme de avelã, Ninho e granola. Para compartilhar momentos especiais!',
        sizes: [
            { label: 'Único', price: 69.90 },
        ]
    },
};

const ORDER_STATUSES = {
    pending:   { label: '⏳ Aguardando confirmação', color: '#f59e0b', bg: '#fef3c7' },
    preparing: { label: '👨‍🍳 Em preparo',            color: '#7c3aed', bg: '#ede9fe' },
    delivery:  { label: '🛵 Saiu para entrega',      color: '#2563eb', bg: '#dbeafe' },
    delivered: { label: '✅ Entregue',                color: '#16a34a', bg: '#dcfce7' },
    cancelled: { label: '❌ Cancelado',               color: '#dc2626', bg: '#fee2e2' },
};

// ─────────────────────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────────────────────

let cart        = JSON.parse(localStorage.getItem('tda_cart')     || '[]');
let currentUser = JSON.parse(localStorage.getItem('tda_user')    || 'null');
let settings    = JSON.parse(localStorage.getItem('tda_settings') || 'null');
let adminAuth   = false;

// Produto selecionado no modal
let _selectedProduct = null;
let _selectedSizeIdx = 0;
let _selectedQty     = 1;

if (!settings) {
    settings = {
        deliveryFee: 5.00,
        pixKey: '',
        pixName: 'TDA Acai',
        pixCity: 'Mogi Mirim',
        adminPass: '1234',
        sheetsUrl: ''   // URL do Apps Script (configurar no Admin)
    };
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('tda_settings', JSON.stringify(settings));
}

// ─────────────────────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
    updateCartBadge();
    checkStoreOpen();
    initWhatsApp();
    carregarPrecosDoSheets();          // carrega preços da planilha
    setInterval(checkStoreOpen, 60000);
});

// ─────────────────────────────────────────────────────────────
// STATUS DA LOJA
// ─────────────────────────────────────────────────────────────

function checkStoreOpen() {
    const el = document.getElementById('storeStatus');
    if (!el) return;

    const now   = new Date();
    const day   = now.getDay();   // 0=dom, 1=seg…5=sex, 6=sab
    const hour  = now.getHours();
    const min   = now.getMinutes();
    const time  = hour * 60 + min; // minutos desde 00:00

    let open = false;

    if (day === 5) {
        // Sexta: aberto 10h–17h30, fechado após 17h45
        open = time >= 10 * 60 && time < 17 * 60 + 30;
    } else if (day === 6) {
        // Sábado: aberto a partir de 18h
        open = time >= 18 * 60;
    } else {
        // Dom–Qui: 14h–23h30
        open = time >= 14 * 60 && time < 23 * 60 + 30;
    }

    el.textContent = open ? '● Aberto agora' : '● Fechado';
    el.className   = 'store-status ' + (open ? 'open' : 'closed');
}

// ─────────────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────────────

function initWhatsApp() {
    const msg = encodeURIComponent('Olá! Gostaria de fazer um pedido.');
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        if (!link.href.includes('text=')) link.href += `?text=${msg}`;
    });
}

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS UI
// ─────────────────────────────────────────────────────────────

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className   = `toast toast--${type} toast--show`;
    setTimeout(() => t.classList.remove('toast--show'), 3000);
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
}

function closeModalOnOverlay(event, id) {
    if (event.target.id === id) closeModal(id);
}

function formatCurrency(v) {
    return 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',');
}

// ─────────────────────────────────────────────────────────────
// INFO DA LOJA
// ─────────────────────────────────────────────────────────────

function openStoreInfo() {
    openModal('modalStoreInfo');
}

// ─────────────────────────────────────────────────────────────
// FILTRO POR CATEGORIA
// ─────────────────────────────────────────────────────────────

function filterCat(cat, btn) {
    // Atualiza pills
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Limpa busca
    const input = document.getElementById('searchInput');
    if (input) input.value = '';

    // Mostra/oculta seções
    document.querySelectorAll('.prod-section').forEach(sec => {
        sec.classList.toggle('hidden', cat !== 'all' && sec.dataset.cat !== cat);
    });

    document.getElementById('emptySearch').style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
// BUSCA
// ─────────────────────────────────────────────────────────────

function filterSearch(query) {
    query = query.toLowerCase().trim();

    // Reset pills
    document.querySelectorAll('.cat-pill').forEach((p, i) => {
        p.classList.toggle('active', i === 0);
    });

    if (!query) {
        filterCat('all', null);
        return;
    }

    let anyVisible = false;

    document.querySelectorAll('.prod-section').forEach(sec => {
        let secHasMatch = false;
        sec.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
            const match = name.includes(query) || desc.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) secHasMatch = true;
        });
        sec.classList.toggle('hidden', !secHasMatch);
        if (secHasMatch) anyVisible = true;
    });

    document.getElementById('emptySearch').style.display = anyVisible ? 'none' : '';
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filterCat('all', document.querySelector('.cat-pill'));
}

// ─────────────────────────────────────────────────────────────
// MODAL DO PRODUTO
// ─────────────────────────────────────────────────────────────

function openProductModal(productId) {
    const product = PRODUCTS[productId];
    if (!product) return;

    _selectedProduct = product;
    _selectedSizeIdx = 0;
    _selectedQty     = 1;

    document.getElementById('prodModalImg').src         = product.image;
    document.getElementById('prodModalImg').alt         = product.name;
    document.getElementById('prodModalName').textContent = product.name;
    document.getElementById('prodModalDesc').textContent = product.desc;
    document.getElementById('prodQtyVal').textContent   = '1';

    const sizesEl    = document.getElementById('prodModalSizes');
    const titleEl    = document.getElementById('prodSizesTitle');
    const multiSize  = product.sizes.length > 1;

    titleEl.style.display = multiSize ? '' : 'none';

    sizesEl.innerHTML = product.sizes.map((s, i) => `
        <div class="prod-size-opt ${i === 0 ? 'selected' : ''}"
             onclick="selectSize(${i})"
             data-idx="${i}">
            <span class="pso-label">${s.label}</span>
            <span class="pso-price">${formatCurrency(s.price)}</span>
        </div>
    `).join('');

    updateProdAddBtn();
    openModal('modalProduct');
}

function selectSize(idx) {
    _selectedSizeIdx = idx;
    document.querySelectorAll('.prod-size-opt').forEach((el, i) => {
        el.classList.toggle('selected', i === idx);
    });
    updateProdAddBtn();
}

function prodQtyChange(delta) {
    _selectedQty = Math.max(1, _selectedQty + delta);
    document.getElementById('prodQtyVal').textContent = _selectedQty;
    updateProdAddBtn();
}

function updateProdAddBtn() {
    if (!_selectedProduct) return;
    const price = _selectedProduct.sizes[_selectedSizeIdx].price * _selectedQty;
    document.getElementById('prodAddPrice').textContent = formatCurrency(price);
}

function addSelectedToCart() {
    if (!currentUser) {
        closeModal('modalProduct');
        openModal('modalAuth');
        showToast('Faça login para adicionar ao carrinho.', 'info');
        return;
    }

    const p    = _selectedProduct;
    const size = p.sizes[_selectedSizeIdx];
    const key  = p.sizes.length > 1 ? `${p.id}-${size.label}` : p.id;

    const existing = cart.find(i => i.key === key);
    if (existing) {
        existing.qty += _selectedQty;
    } else {
        cart.push({
            key, productId: p.id, productName: p.name,
            size: p.sizes.length > 1 ? size.label : null,
            price: size.price, qty: _selectedQty, image: p.image
        });
    }

    saveCart();
    updateCartBadge();
    closeModal('modalProduct');
    showToast(`${p.name}${size.label !== 'Único' ? ` (${size.label})` : ''} adicionado! 🛒`);
}

// ─────────────────────────────────────────────────────────────
// CARRINHO
// ─────────────────────────────────────────────────────────────

function saveCart() {
    localStorage.setItem('tda_cart', JSON.stringify(cart));
}

function getSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getTotal()    { return getSubtotal() + settings.deliveryFee; }

function updateCartBadge() {
    const total  = cart.reduce((s, i) => s + i.qty, 0);
    const fc     = document.getElementById('floatingCart');
    const fcCnt  = document.getElementById('fcCount');
    const fcTot  = document.getElementById('fcTotal');

    if (fc) {
        fc.style.display = total > 0 ? 'flex' : 'none';
        if (fcCnt) fcCnt.textContent = total;
        if (fcTot) fcTot.textContent = formatCurrency(getTotal());
    }
}

function openCart() {
    renderCart();
    openModal('modalCart');
}

function renderCart() {
    const empty = document.getElementById('cartEmpty');
    const items = document.getElementById('cartItems');
    const list  = document.getElementById('cartItemsList');

    if (cart.length === 0) {
        empty.style.display = '';
        items.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    items.style.display = '';

    list.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.productName}" class="cart-item-img"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2252%22 height=%2252%22><rect fill=%22%23f0f0f0%22 width=%2252%22 height=%2252%22/></svg>'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.productName}${item.size ? ` <small>(${item.size})</small>` : ''}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-qty">
                <button onclick="changeQty('${item.key}', -1)">−</button>
                <span>${item.qty}</span>
                <button onclick="changeQty('${item.key}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.key}')">🗑</button>
        </div>
    `).join('');

    document.getElementById('cartSubtotal').textContent = formatCurrency(getSubtotal());
    document.getElementById('cartDelivery').textContent  = formatCurrency(settings.deliveryFee);
    document.getElementById('cartTotal').textContent     = formatCurrency(getTotal());
}

function removeFromCart(key) {
    cart = cart.filter(i => i.key !== key);
    saveCart(); updateCartBadge(); renderCart();
}

function changeQty(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(key); return; }
    saveCart(); renderCart(); updateCartBadge();
}

function clearCart() {
    if (!confirm('Esvaziar o carrinho?')) return;
    cart = [];
    saveCart(); updateCartBadge(); renderCart();
}

// ─────────────────────────────────────────────────────────────
// AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────

function openAuthModal() {
    if (currentUser) {
        if (confirm(`Sair da conta de ${currentUser.name}?`)) {
            currentUser = null;
            localStorage.removeItem('tda_user');
            updateUserUI();
            showToast('Você saiu da conta.');
        }
        return;
    }
    openModal('modalAuth');
}

function switchTab(tab) {
    document.getElementById('panelLogin').style.display    = tab === 'login'    ? '' : 'none';
    document.getElementById('panelCadastro').style.display = tab === 'cadastro' ? '' : 'none';
    document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
    document.getElementById('tabCadastro').classList.toggle('active', tab === 'cadastro');
}

function doLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    if (!phone) { showToast('Informe seu telefone.', 'error'); return; }

    const users = JSON.parse(localStorage.getItem('tda_users') || '{}');
    const user  = users[phone];

    if (!user) {
        showToast('Telefone não encontrado. Cadastre-se!', 'error');
        switchTab('cadastro');
        document.getElementById('regPhone').value = phone;
        return;
    }

    currentUser = user;
    localStorage.setItem('tda_user', JSON.stringify(user));
    updateUserUI();
    closeModal('modalAuth');
    showToast(`Bem-vindo(a), ${user.name}! 🌿`);
}

function doRegister() {
    const name         = document.getElementById('regName').value.trim();
    const phone        = document.getElementById('regPhone').value.trim();
    const street       = document.getElementById('regStreet').value.trim();
    const number       = document.getElementById('regNumber').value.trim();
    const neighborhood = document.getElementById('regNeighborhood').value.trim();
    const complement   = document.getElementById('regComplement').value.trim();
    const city         = document.getElementById('regCity').value.trim();

    if (!name || !phone || !street || !number || !neighborhood || !city) {
        showToast('Preencha todos os campos obrigatórios.', 'error'); return;
    }

    const user  = { name, phone, street, number, neighborhood, complement, city };
    const users = JSON.parse(localStorage.getItem('tda_users') || '{}');
    users[phone] = user;
    localStorage.setItem('tda_users', JSON.stringify(users));

    currentUser = user;
    localStorage.setItem('tda_user', JSON.stringify(user));
    updateUserUI();
    closeModal('modalAuth');
    showToast(`Bem-vindo(a), ${name}! 🌿`);
}

function updateUserUI() {
    const label    = document.getElementById('userLabel');
    const btnTrack = document.getElementById('btnTrack');
    if (label)    label.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Entrar';
    if (btnTrack) btnTrack.style.display = currentUser ? 'block' : 'none';
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────

function openCheckout() {
    if (!currentUser) { closeModal('modalCart'); openModal('modalAuth'); return; }
    if (cart.length === 0) { showToast('Carrinho vazio!', 'error'); return; }

    document.getElementById('chkStreet').value       = currentUser.street       || '';
    document.getElementById('chkNumber').value       = currentUser.number       || '';
    document.getElementById('chkNeighborhood').value = currentUser.neighborhood || '';
    document.getElementById('chkComplement').value   = currentUser.complement   || '';
    document.getElementById('chkCity').value         = currentUser.city         || '';
    document.getElementById('chkTotal').textContent  = formatCurrency(getTotal());

    document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
    document.getElementById('paymentNoticeCard').style.display  = 'none';
    document.getElementById('paymentNoticeMoney').style.display = 'none';

    closeModal('modalCart');
    openModal('modalCheckout');
}

function onPaymentChange(method) {
    document.getElementById('paymentNoticeCard').style.display  =
        (method === 'debito' || method === 'credito') ? '' : 'none';
    document.getElementById('paymentNoticeMoney').style.display =
        method === 'dinheiro' ? '' : 'none';
}

function confirmOrder() {
    const street       = document.getElementById('chkStreet').value.trim();
    const number       = document.getElementById('chkNumber').value.trim();
    const neighborhood = document.getElementById('chkNeighborhood').value.trim();
    const city         = document.getElementById('chkCity').value.trim();
    const payment      = document.querySelector('input[name="payment"]:checked');

    if (!street || !number || !neighborhood || !city) {
        showToast('Preencha o endereço completo.', 'error'); return;
    }
    if (!payment) { showToast('Escolha uma forma de pagamento.', 'error'); return; }

    const address = {
        street, number, neighborhood,
        complement: document.getElementById('chkComplement').value.trim(), city
    };
    const paymentMethod = payment.value;
    const changeFor     = document.getElementById('changeFor')?.value.trim() || '';

    closeModal('modalCheckout');

    window._lastOrderItems = cart.map(i => ({ ...i }));
    window._lastSubtotal   = getSubtotal();
    window._lastTotal      = getTotal();
    window._lastOrder      = { address, paymentMethod, changeFor };

    saveOrder(address, paymentMethod, changeFor);
    showOrderSummary(address, paymentMethod, changeFor);

    setTimeout(() => sendToWhatsApp(false), 600);
}

// ─────────────────────────────────────────────────────────────
// RESUMO DO PEDIDO
// ─────────────────────────────────────────────────────────────

function showOrderSummary(address, paymentMethod, changeFor) {
    const items    = window._lastOrderItems || [];
    const subtotal = window._lastSubtotal   || 0;
    const total    = window._lastTotal      || 0;

    const payLabels = { pix: '📲 PIX', debito: '💳 Débito', credito: '💳 Crédito', dinheiro: '💵 Dinheiro' };
    const addressStr = `${address.street}, ${address.number}${address.complement ? ' – ' + address.complement : ''}, ${address.neighborhood} – ${address.city}`;

    const itemsHtml  = items.map(i =>
        `<div class="summary-item"><span>${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''}</span><span>${formatCurrency(i.price * i.qty)}</span></div>`
    ).join('');

    const changeNote = paymentMethod === 'dinheiro' && changeFor
        ? `<p class="summary-note">💵 Troco para: ${changeFor}</p>` : '';

    const cardNote = (paymentMethod === 'debito' || paymentMethod === 'credito')
        ? `<div class="summary-alert">🛵 Levaremos a maquininha no momento da entrega!</div>` : '';

    document.getElementById('summaryContent').innerHTML = `
        <div class="summary-section">
            <h4>🛍️ Itens</h4>
            ${itemsHtml}
            <div class="summary-divider"></div>
            <div class="summary-item"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
            <div class="summary-item"><span>Entrega</span><span>${formatCurrency(settings.deliveryFee)}</span></div>
            <div class="summary-item summary-item--total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        </div>
        <div class="summary-section">
            <h4>📍 Endereço</h4>
            <p class="summary-text">${addressStr}</p>
        </div>
        <div class="summary-section">
            <h4>💳 Pagamento</h4>
            <p class="summary-text">${payLabels[paymentMethod]}</p>
            ${changeNote}${cardNote}
        </div>
    `;

    const pixSection = document.getElementById('pixSection');
    if (paymentMethod === 'pix') {
        pixSection.style.display = '';
        if (!settings.pixKey) {
            pixSection.querySelector('.pix-box').innerHTML =
                `<h3>📲 PIX</h3><p style="color:#dc2626">⚠️ Chave PIX não configurada. Configure no Admin.</p>`;
        } else {
            document.getElementById('pixKeyDisplay').textContent = settings.pixKey;
            document.getElementById('pixAmount').textContent     = formatCurrency(total);
            try {
                const payload = buildPixEMV(settings.pixKey, settings.pixName, settings.pixCity, total);
                setTimeout(() => renderPixQR(payload), 150);
            } catch(e) { console.error('PIX error:', e); }
        }
    } else {
        pixSection.style.display = 'none';
    }

    openModal('modalSummary');

    const btnFinish = document.getElementById('btnFinishOrder');
    if (btnFinish) {
        btnFinish.textContent = paymentMethod === 'pix'
            ? '✓ Já realizei o pagamento PIX'
            : '✓ Concluir pedido';
    }
}

function copyPixKey() {
    navigator.clipboard.writeText(settings.pixKey)
        .then(() => showToast('Chave PIX copiada!'))
        .catch(() => showToast('Não foi possível copiar.', 'error'));
}

function sendToWhatsApp(autoClose = true) {
    if (!window._lastOrder) return;
    const { address, paymentMethod, changeFor } = window._lastOrder;

    const payLabels = { pix: 'PIX', debito: 'Débito', credito: 'Crédito', dinheiro: 'Dinheiro' };

    const itemsText = (window._lastOrderItems || []).map(i =>
        `• ${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''} — ${formatCurrency(i.price * i.qty)}`
    ).join('\n');

    const addressText = `${address.street}, ${address.number}${address.complement ? ' – ' + address.complement : ''}, ${address.neighborhood} – ${address.city}`;

    let msg = `🌿 *Novo Pedido — TDA Açaí*\n\n`;
    msg += `👤 *Cliente:* ${currentUser?.name} (${currentUser?.phone})\n`;
    msg += `📍 *Endereço:* ${addressText}\n\n`;
    msg += `🛍️ *Itens:*\n${itemsText}\n\n`;
    msg += `Subtotal: ${formatCurrency(window._lastSubtotal || 0)}\n`;
    msg += `Entrega:  ${formatCurrency(settings.deliveryFee)}\n`;
    msg += `*Total:   ${formatCurrency(window._lastTotal || 0)}*\n\n`;
    msg += `💳 *Pagamento:* ${payLabels[paymentMethod] || paymentMethod}`;
    if (paymentMethod === 'dinheiro' && changeFor) msg += `\n💵 Troco para: ${changeFor}`;

    window.open(`https://wa.me/5519994194916?text=${encodeURIComponent(msg)}`, '_blank');
    if (!autoClose) showToast('WhatsApp aberto! 🎉');
}

function finishOrder() {
    cart = [];
    saveCart();
    updateCartBadge();
    closeAllModals();
    showToast('Pedido concluído! 🌿');
}

// ─────────────────────────────────────────────────────────────
// QR CODE PIX
// ─────────────────────────────────────────────────────────────

function renderPixQR(text) {
    const canvas = document.getElementById('pixQRCode');
    if (!canvas) return;
    try {
        if (typeof qrcode !== 'undefined') {
            const qr      = qrcode(0, 'M');
            qr.addData(text, 'Alphanumeric');
            qr.make();
            const size    = 200;
            const modules = qr.getModuleCount();
            const cell    = Math.floor(size / modules);
            const offset  = Math.floor((size - cell * modules) / 2);
            canvas.width  = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0fdf4'; ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#166534';
            for (let r = 0; r < modules; r++) {
                for (let c = 0; c < modules; c++) {
                    if (qr.isDark(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
                }
            }
            return;
        }
    } catch(e) { console.warn('qrcode-generator falhou:', e); }
    // fallback
    try {
        const img = document.createElement('img');
        img.src   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
        img.className = 'pix-qr-canvas';
        canvas.replaceWith(img);
    } catch(e2) { console.error(e2); }
}

function buildPixEMV(pixKey, merchantName, merchantCity, amount) {
    function field(id, value) {
        return `${id}${String(value.length).padStart(2, '0')}${value}`;
    }
    const gui          = field('00', 'br.gov.bcb.pix') + field('01', pixKey);
    const merchantInfo = field('26', gui);
    const amountField  = amount > 0 ? field('54', parseFloat(amount).toFixed(2)) : '';
    const additional   = field('62', field('05', '***'));
    const payload      = field('00', '01') + field('01', '12') + merchantInfo +
                         field('52', '0000') + field('53', '986') + amountField +
                         field('58', 'BR') +
                         field('59', (merchantName || 'Comercio').substring(0, 25)) +
                         field('60', (merchantCity  || 'Brasil').substring(0, 15)) +
                         additional + '6304';
    return payload + crc16(payload);
}

function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) { crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1; crc &= 0xFFFF; }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ─────────────────────────────────────────────────────────────
// PEDIDOS — salvar e rastrear
// ─────────────────────────────────────────────────────────────

function saveOrder(address, paymentMethod, changeFor) {
    const orders = JSON.parse(localStorage.getItem('tda_orders') || '[]');
    const order  = {
        id: Date.now(),
        customer:    { name: currentUser?.name, phone: currentUser?.phone },
        items:       window._lastOrderItems,
        address, paymentMethod, changeFor,
        subtotal:    window._lastSubtotal,
        deliveryFee: settings.deliveryFee,
        total:       window._lastTotal,
        status:      'pending',
        createdAt:   new Date().toISOString(),
    };
    orders.unshift(order);
    localStorage.setItem('tda_orders', JSON.stringify(orders));

    // Sincroniza com Google Sheets em tempo real
    enviarParaSheets(order);
}

// ─────────────────────────────────────────────────────────────
// INTEGRAÇÃO GOOGLE SHEETS
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// CARREGAR PREÇOS DO GOOGLE SHEETS
// ─────────────────────────────────────────────────────────────

async function carregarPrecosDoSheets() {
    const url = (SHEETS_URL_FIXO || settings.sheetsUrl || '').trim();
    if (!url) return; // URL não configurada — usa preços do JS

    try {
        const payload = encodeURIComponent(JSON.stringify({ tipo: 'cardapio' }));
        const res     = await fetch(`${url}?d=${payload}`);
        const json    = await res.json();

        if (json.status === 'ok' && Array.isArray(json.produtos)) {
            aplicarPrecos(json.produtos);
        }
    } catch(e) {
        console.warn('Preços do Sheets indisponíveis, usando valores padrão.', e.message);
    }
}

function aplicarPrecos(produtos) {
    // Mapa: "copo diego-300ml" → preço
    const mapa = {};
    produtos.forEach(p => {
        const chave = (p.produto + '-' + p.tamanho).toLowerCase().trim();
        mapa[chave] = p.preco;
    });

    // Atualiza o objeto PRODUCTS em memória
    Object.values(PRODUCTS).forEach(prod => {
        prod.sizes.forEach(size => {
            const chave = (prod.name + '-' + size.label).toLowerCase().trim();
            if (mapa[chave] !== undefined && mapa[chave] > 0) {
                size.price = mapa[chave];
            }
        });
    });

    // Atualiza os preços exibidos nos cards da página
    document.querySelectorAll('.product-card[data-product]').forEach(card => {
        const prodId  = card.dataset.product;
        const prod    = PRODUCTS[prodId];
        if (!prod) return;

        const minPrice = Math.min(...prod.sizes.map(s => s.price));
        const priceEl  = card.querySelector('.product-price');
        if (priceEl) {
            priceEl.innerHTML = prod.sizes.length > 1
                ? `A partir de <strong>${formatCurrency(minPrice)}</strong>`
                : `<strong>${formatCurrency(minPrice)}</strong>`;
        }
    });

    console.log('✅ Preços atualizados do Google Sheets');
}

function montarPayloadPedido(order) {
    return {
        tipo: 'pedido',
        pedido: {
            cliente:  { nome: order.customer?.name || '', telefone: order.customer?.phone || '' },
            endereco: {
                rua:         order.address.street,
                numero:      order.address.number,
                bairro:      order.address.neighborhood,
                complemento: order.address.complement || '',
                cidade:      order.address.city,
            },
            itens:       order.items,
            pagamento:   order.paymentMethod,
            troco:       order.changeFor || '',
            subtotal:    order.subtotal,
            taxaEntrega: order.deliveryFee,
            total:       order.total,
            status:      order.status,
            criadoEm:    order.createdAt,
        }
    };
}

async function enviarParaSheets(order) {
    // SHEETS_URL_FIXO tem prioridade (funciona em qualquer dispositivo)
    // Se não estiver preenchido, usa o salvo no Admin
    const url = (SHEETS_URL_FIXO || settings.sheetsUrl || '').trim();
    if (!url) return;

    const payload  = montarPayloadPedido(order);
    const encoded  = encodeURIComponent(JSON.stringify(payload));
    const getUrl   = `${url}?d=${encoded}`;

    try {
        // GET — Apps Script retorna CORS automático para GET
        const res  = await fetch(getUrl);
        const json = await res.json();
        if (json.status === 'ok') {
            console.log('✅ Pedido salvo no Google Sheets:', json.msg);
        } else {
            console.warn('⚠️ Sheets respondeu:', json.msg);
        }
    } catch(e) {
        console.warn('❌ Falha ao salvar no Sheets:', e.message);
    }
}

function openTracking() {
    renderTracking();
    openModal('modalTracking');
}

function renderTracking() {
    const el = document.getElementById('trackingContent');
    if (!currentUser) { el.innerHTML = '<p>Faça login para ver seus pedidos.</p>'; return; }

    const orders = JSON.parse(localStorage.getItem('tda_orders') || '[]')
        .filter(o => o.customer?.phone === currentUser.phone);

    if (orders.length === 0) {
        el.innerHTML = '<div class="tracking-empty"><p>📦</p><p>Nenhum pedido encontrado.</p></div>';
        return;
    }

    el.innerHTML = orders.map(o => {
        const st   = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
        const date = new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const items = o.items.map(i => `${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''}`).join(', ');
        const payLabels = { pix:'PIX', debito:'Débito', credito:'Crédito', dinheiro:'Dinheiro' };
        return `
        <div class="tracking-card">
            <div class="tracking-card-header">
                <span class="tracking-date">${date}</span>
                <span class="tracking-status-badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
            </div>
            <div class="tracking-items">${items}</div>
            <div class="tracking-footer">
                <span>${formatCurrency(o.total)}</span>
                <span>${payLabels[o.paymentMethod] || o.paymentMethod}</span>
            </div>
            <div class="status-timeline">${renderTimeline(o.status)}</div>
        </div>`;
    }).join('');
}

function renderTimeline(currentStatus) {
    const steps  = [
        { key: 'pending',   icon: '⏳', label: 'Confirmado' },
        { key: 'preparing', icon: '👨‍🍳', label: 'Em preparo' },
        { key: 'delivery',  icon: '🛵', label: 'Saiu p/ entrega' },
        { key: 'delivered', icon: '✅', label: 'Entregue' },
    ];
    const order  = ['pending','preparing','delivery','delivered'];
    const curIdx = order.indexOf(currentStatus);
    return steps.map((s, i) => {
        const done   = i <= curIdx;
        const active = i === curIdx;
        return `<div class="tl-step ${done ? 'tl-done' : ''} ${active ? 'tl-active' : ''}">
            <div class="tl-icon">${s.icon}</div>
            <div class="tl-label">${s.label}</div>
        </div>${i < steps.length - 1 ? '<div class="tl-line"></div>' : ''}`;
    }).join('');
}

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────

function openAdminModal() {
    adminAuth = false;
    document.getElementById('adminLoginPanel').style.display = '';
    document.getElementById('adminPanel').style.display      = 'none';
    document.getElementById('adminPassword').value           = '';
    openModal('modalAdmin');
}

function checkAdminPass() {
    if (document.getElementById('adminPassword').value === settings.adminPass) {
        adminAuth = true;
        document.getElementById('adminLoginPanel').style.display = 'none';
        document.getElementById('adminPanel').style.display      = '';
        document.getElementById('adminDeliveryFee').value = settings.deliveryFee;
        document.getElementById('adminPixKey').value      = settings.pixKey;
        document.getElementById('adminPixName').value     = settings.pixName;
        document.getElementById('adminPixCity').value     = settings.pixCity;
        document.getElementById('adminNewPass').value     = '';
        document.getElementById('adminSheetsUrl').value   = settings.sheetsUrl || '';
        atualizarStatusSheets();
    } else {
        showToast('Senha incorreta!', 'error');
    }
}

function saveAdminSettings() {
    if (!adminAuth) return;
    const fee     = parseFloat(document.getElementById('adminDeliveryFee').value);
    const key     = document.getElementById('adminPixKey').value.trim();
    const name    = document.getElementById('adminPixName').value.trim();
    const city    = document.getElementById('adminPixCity').value.trim();
    const newPass = document.getElementById('adminNewPass').value.trim();

    if (isNaN(fee) || fee < 0) { showToast('Taxa inválida.', 'error'); return; }

    const sheetsUrl = document.getElementById('adminSheetsUrl').value.trim();

    settings.deliveryFee = fee;
    if (key)       settings.pixKey    = key;
    if (name)      settings.pixName   = name;
    if (city)      settings.pixCity   = city;
    if (newPass)   settings.adminPass = newPass;
    settings.sheetsUrl = sheetsUrl;

    saveSettings();
    closeModal('modalAdmin');
    showToast('Configurações salvas! ✓');
}

function atualizarStatusSheets() {
    const el  = document.getElementById('sheetsStatus');
    if (!el) return;
    const url = settings.sheetsUrl || '';
    if (!url) {
        el.textContent = '⚪ Não configurado';
        el.style.color = '#9ca3af';
    } else {
        el.textContent = '🟢 URL salva — pedidos vão para a planilha';
        el.style.color = '#16a34a';
    }
}

async function testarConexaoSheets() {
    const urlInput = document.getElementById('adminSheetsUrl');
    const el       = document.getElementById('sheetsStatus');
    const url      = (urlInput ? urlInput.value.trim() : '');

    if (!url) {
        showToast('Cole a URL do Apps Script primeiro!', 'error');
        if (el) { el.textContent = '⚠️ Cole a URL acima'; el.style.color = '#f59e0b'; }
        return;
    }

    if (el) { el.textContent = '⏳ Testando...'; el.style.color = '#6b7280'; }
    showToast('⏳ Testando conexão...', 'info');

    // Envia payload de teste via GET (Apps Script aceita sem CORS)
    const payload  = { tipo: 'teste' };
    const getUrl   = `${url}?d=${encodeURIComponent(JSON.stringify(payload))}`;

    try {
        const res  = await fetch(getUrl);
        const json = await res.json();

        if (json.status === 'ok') {
            showToast('✅ ' + json.msg, 'success');
            if (el) { el.textContent = '✅ ' + json.msg; el.style.color = '#16a34a'; }
            settings.sheetsUrl = url;
            saveSettings();
        } else {
            showToast('⚠️ Erro do script: ' + json.msg, 'error');
            if (el) { el.textContent = '⚠️ ' + json.msg; el.style.color = '#f59e0b'; }
        }
    } catch(e) {
        showToast('❌ Não conectou. Veja as instruções abaixo.', 'error');
        if (el) {
            el.innerHTML = '❌ Falha: <strong>' + e.message + '</strong><br>' +
                '<small>Verifique: 1) URL copiada corretamente 2) "Quem tem acesso: Qualquer pessoa" 3) Clicou em Implantar (não só Salvar)</small>';
            el.style.color = '#dc2626';
        }
    }
}

function switchAdminTab(tab) {
    const isConfig = tab === 'config';
    document.getElementById('adminPanelConfig').style.display = isConfig ? '' : 'none';
    document.getElementById('adminPanelOrders').style.display = isConfig ? 'none' : '';
    document.getElementById('adminTabConfig').classList.toggle('active',  isConfig);
    document.getElementById('adminTabOrders').classList.toggle('active', !isConfig);
    if (!isConfig) renderAdminOrders();
}

function renderAdminOrders() {
    const el     = document.getElementById('adminOrdersList');
    const orders = JSON.parse(localStorage.getItem('tda_orders') || '[]');

    if (orders.length === 0) {
        el.innerHTML = '<p style="color:#888;text-align:center;padding:20px">Nenhum pedido ainda.</p>';
        return;
    }

    el.innerHTML = orders.map(o => {
        const st   = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
        const date = new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const items = o.items.map(i => `${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''}`).join('<br>');
        const addr  = `${o.address?.street}, ${o.address?.number} – ${o.address?.neighborhood}`;
        const payLabels = { pix:'PIX', debito:'Débito', credito:'Crédito', dinheiro:'Dinheiro' };
        const statusOptions = Object.entries(ORDER_STATUSES).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`
        ).join('');

        return `
        <div class="admin-order-card">
            <div class="admin-order-head">
                <strong>#${o.id.toString().slice(-5)}</strong>
                <span>${date}</span>
                <span class="tracking-status-badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
            </div>
            <div class="admin-order-info">
                <p>👤 ${o.customer?.name} — ${o.customer?.phone}</p>
                <p>📍 ${addr}</p>
                <p>🛍️ ${items}</p>
                <p>💳 ${payLabels[o.paymentMethod] || o.paymentMethod} — <strong>${formatCurrency(o.total)}</strong></p>
            </div>
            <div class="admin-order-status">
                <label>Atualizar status:</label>
                <select class="form-input" onchange="updateOrderStatus(${o.id}, this.value)">${statusOptions}</select>
            </div>
        </div>`;
    }).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('tda_orders') || '[]');
    const order  = orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = newStatus;
    localStorage.setItem('tda_orders', JSON.stringify(orders));
    showToast(`Status atualizado: ${ORDER_STATUSES[newStatus].label}`);
    renderAdminOrders();
}

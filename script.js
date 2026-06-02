/**
 * TDA Açaí — Script Principal
 * Inclui: Menu, FAQ, Scroll, WhatsApp + Sistema de Pedidos completo
 */

// =====================================================
// ESTADO DA APLICAÇÃO
// =====================================================

let cart      = JSON.parse(localStorage.getItem('tda_cart')     || '[]');
let currentUser = JSON.parse(localStorage.getItem('tda_user')   || 'null');
let settings  = JSON.parse(localStorage.getItem('tda_settings') || 'null');
let adminAuth = false;

// Configurações padrão
if (!settings) {
    settings = {
        deliveryFee: 5.00,
        pixKey: '',
        pixName: 'TDA Acai',
        pixCity: 'Mogi Mirim',
        adminPass: '1234'
    };
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('tda_settings', JSON.stringify(settings));
}

// =====================================================
// DOM READY
// =====================================================

document.addEventListener('DOMContentLoaded', function () {

    initNav();
    initScrollLinks();
    initFAQ();
    initHeaderScroll();
    initAnimations();
    initWhatsApp();
    updateUserUI();
    updateCartBadge();

});

// =====================================================
// 1. MENU MOBILE
// =====================================================

function initNav() {
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', function (e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// =====================================================
// 2. SCROLL SUAVE
// =====================================================

function initScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight  = document.querySelector('.header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            }
        });
    });
}

// =====================================================
// 3. FAQ ACORDEÃO
// =====================================================

function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', function () {
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}

// =====================================================
// 4. HEADER SCROLL EFFECT
// =====================================================

function initHeaderScroll() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', function () {
        header.style.boxShadow = window.pageYOffset > 100
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : '0 4px 20px rgba(0,0,0,0.1)';
    });
}

// =====================================================
// 5. ANIMAÇÕES DE ENTRADA
// =====================================================

function initAnimations() {
    const elements = document.querySelectorAll(
        '.servico-card, .destaque-card, .beneficio-card, .faq-item, .feature'
    );

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity  = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// =====================================================
// 6. WHATSAPP MENSAGEM PADRÃO
// =====================================================

function initWhatsApp() {
    const msg = encodeURIComponent('Olá! Gostaria de fazer um pedido.');
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        if (!link.href.includes('text=')) {
            link.href += `?text=${msg}`;
        }
    });
}

// =====================================================
// UTILITÁRIOS UI
// =====================================================

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
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('active');
    });
    document.body.style.overflow = '';
}

function closeModalOnOverlay(event, id) {
    if (event.target.id === id) closeModal(id);
}

function formatCurrency(value) {
    return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
}

// =====================================================
// AUTENTICAÇÃO
// =====================================================

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
    document.getElementById('panelLogin').style.display   = tab === 'login'    ? '' : 'none';
    document.getElementById('panelCadastro').style.display = tab === 'cadastro' ? '' : 'none';
    document.getElementById('tabLogin').classList.toggle('active',   tab === 'login');
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
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const user = { name, phone, street, number, neighborhood, complement, city };
    const users = JSON.parse(localStorage.getItem('tda_users') || '{}');
    users[phone] = user;
    localStorage.setItem('tda_users', JSON.stringify(users));

    currentUser = user;
    localStorage.setItem('tda_user', JSON.stringify(user));
    updateUserUI();
    closeModal('modalAuth');
    showToast(`Conta criada! Bem-vindo(a), ${name}! 🌿`);
}

function updateUserUI() {
    const label = document.getElementById('userLabel');
    if (label) {
        label.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Entrar';
    }
}

// =====================================================
// CARRINHO
// =====================================================

function addToCart(productId, productName, selectId, image) {
    if (!currentUser) {
        openModal('modalAuth');
        showToast('Faça login para adicionar ao carrinho.', 'info');
        return;
    }

    const select  = document.getElementById(selectId);
    const price   = parseFloat(select.value);
    const sizeLabel = select.options[select.selectedIndex].text.split(' — ')[0];

    const key = `${productId}-${sizeLabel}`;
    const existing = cart.find(i => i.key === key);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ key, productId, productName, size: sizeLabel, price, qty: 1, image });
    }

    saveCart();
    updateCartBadge();
    showToast(`${productName} (${sizeLabel}) adicionado! 🛒`);
}

function addToCartFixed(productId, productName, price, image) {
    if (!currentUser) {
        openModal('modalAuth');
        showToast('Faça login para adicionar ao carrinho.', 'info');
        return;
    }

    const key = productId;
    const existing = cart.find(i => i.key === key);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ key, productId, productName, size: null, price, qty: 1, image });
    }

    saveCart();
    updateCartBadge();
    showToast(`${productName} adicionado! 🛒`);
}

function saveCart() {
    localStorage.setItem('tda_cart', JSON.stringify(cart));
}

function clearCart() {
    if (!confirm('Esvaziar o carrinho?')) return;
    cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
}

function removeFromCart(key) {
    cart = cart.filter(i => i.key !== key);
    saveCart();
    updateCartBadge();
    renderCart();
}

function changeQty(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(key);
        return;
    }
    saveCart();
    renderCart();
}

function getSubtotal() {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getTotal() {
    return getSubtotal() + settings.deliveryFee;
}

function updateCartBadge() {
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    if (total > 0) {
        badge.style.display = 'flex';
        badge.textContent   = total;
    } else {
        badge.style.display = 'none';
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
            <img src="${item.image}" alt="${item.productName}" class="cart-item-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><rect fill=%22%23f0f0f0%22 width=%2260%22 height=%2260%22/></svg>'">
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

// =====================================================
// CHECKOUT
// =====================================================

function openCheckout() {
    if (!currentUser) {
        closeModal('modalCart');
        openModal('modalAuth');
        return;
    }
    if (cart.length === 0) {
        showToast('Carrinho vazio!', 'error');
        return;
    }

    // Preenche endereço com dados do usuário
    document.getElementById('chkStreet').value       = currentUser.street       || '';
    document.getElementById('chkNumber').value       = currentUser.number       || '';
    document.getElementById('chkNeighborhood').value = currentUser.neighborhood || '';
    document.getElementById('chkComplement').value   = currentUser.complement   || '';
    document.getElementById('chkCity').value         = currentUser.city         || '';
    document.getElementById('chkTotal').textContent  = formatCurrency(getTotal());

    // Reset pagamento
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
        showToast('Preencha o endereço completo.', 'error');
        return;
    }
    if (!payment) {
        showToast('Escolha uma forma de pagamento.', 'error');
        return;
    }

    const address = {
        street, number, neighborhood,
        complement: document.getElementById('chkComplement').value.trim(),
        city
    };

    const paymentMethod = payment.value;
    const changeFor     = document.getElementById('changeFor').value.trim();

    closeModal('modalCheckout');
    showOrderSummary(address, paymentMethod, changeFor);
}

// =====================================================
// RESUMO DO PEDIDO
// =====================================================

function showOrderSummary(address, paymentMethod, changeFor) {
    const paymentLabels = {
        pix:      '📲 PIX',
        debito:   '💳 Cartão de Débito',
        credito:  '💳 Cartão de Crédito',
        dinheiro: '💵 Dinheiro'
    };

    const addressStr = `${address.street}, ${address.number}${address.complement ? ' – ' + address.complement : ''}, ${address.neighborhood} – ${address.city}`;

    const itemsHtml = cart.map(i =>
        `<div class="summary-item">
            <span>${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''}</span>
            <span>${formatCurrency(i.price * i.qty)}</span>
        </div>`
    ).join('');

    const changeNote = (paymentMethod === 'dinheiro' && changeFor)
        ? `<p class="summary-note">💵 Troco para: ${changeFor}</p>` : '';

    const cardNote = (paymentMethod === 'debito' || paymentMethod === 'credito')
        ? `<div class="summary-alert">🛵 Levaremos a maquininha no momento da entrega!</div>` : '';

    document.getElementById('summaryContent').innerHTML = `
        <div class="summary-section">
            <h4>🛍️ Itens do Pedido</h4>
            ${itemsHtml}
            <div class="summary-divider"></div>
            <div class="summary-item"><span>Subtotal</span><span>${formatCurrency(getSubtotal())}</span></div>
            <div class="summary-item"><span>Entrega</span><span>${formatCurrency(settings.deliveryFee)}</span></div>
            <div class="summary-item summary-item--total"><span>Total</span><span>${formatCurrency(getTotal())}</span></div>
        </div>
        <div class="summary-section">
            <h4>📍 Endereço</h4>
            <p class="summary-text">${addressStr}</p>
        </div>
        <div class="summary-section">
            <h4>💳 Pagamento</h4>
            <p class="summary-text">${paymentLabels[paymentMethod]}</p>
            ${changeNote}
            ${cardNote}
        </div>
    `;

    // Seção PIX
    const pixSection = document.getElementById('pixSection');
    if (paymentMethod === 'pix') {
        if (!settings.pixKey) {
            pixSection.style.display = '';
            document.getElementById('pixQRCode').style.display = 'none';
            pixSection.querySelector('.pix-box').innerHTML = `
                <h3>📲 PIX</h3>
                <p style="color:#c00">⚠️ Chave PIX não configurada. Fale com o admin.</p>
            `;
        } else {
            pixSection.style.display = '';
            const pixPayload = buildPixEMV(settings.pixKey, settings.pixName, settings.pixCity, getTotal());
            const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}`;

            document.getElementById('pixQRCode').src      = qrUrl;
            document.getElementById('pixQRCode').style.display = '';
            document.getElementById('pixKeyDisplay').textContent = settings.pixKey;
            document.getElementById('pixAmount').textContent     = formatCurrency(getTotal());
        }
    } else {
        pixSection.style.display = 'none';
    }

    // Salva dados p/ WhatsApp
    window._lastOrder = { address, paymentMethod, changeFor };

    openModal('modalSummary');
}

function copyPixKey() {
    navigator.clipboard.writeText(settings.pixKey)
        .then(() => showToast('Chave PIX copiada!'))
        .catch(() => showToast('Não foi possível copiar.', 'error'));
}

function sendToWhatsApp() {
    if (!window._lastOrder) return;
    const { address, paymentMethod, changeFor } = window._lastOrder;

    const paymentLabels = {
        pix: 'PIX', debito: 'Cartão de Débito',
        credito: 'Cartão de Crédito', dinheiro: 'Dinheiro'
    };

    const itemsText = cart.map(i =>
        `• ${i.qty}x ${i.productName}${i.size ? ` (${i.size})` : ''} — ${formatCurrency(i.price * i.qty)}`
    ).join('\n');

    const addressText = `${address.street}, ${address.number}${address.complement ? ' – ' + address.complement : ''}, ${address.neighborhood} – ${address.city}`;

    let msg = `🌿 *Novo Pedido — TDA Açaí*\n\n`;
    msg += `👤 *Cliente:* ${currentUser.name} (${currentUser.phone})\n`;
    msg += `📍 *Endereço:* ${addressText}\n\n`;
    msg += `🛍️ *Itens:*\n${itemsText}\n\n`;
    msg += `Subtotal: ${formatCurrency(getSubtotal())}\n`;
    msg += `Entrega:  ${formatCurrency(settings.deliveryFee)}\n`;
    msg += `*Total:   ${formatCurrency(getTotal())}*\n\n`;
    msg += `💳 *Pagamento:* ${paymentLabels[paymentMethod]}`;
    if (paymentMethod === 'dinheiro' && changeFor) msg += `\n💵 Troco para: ${changeFor}`;

    const url = `https://wa.me/5519994194916?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Limpa carrinho após envio
    cart = [];
    saveCart();
    updateCartBadge();
    closeAllModals();
    showToast('Pedido enviado pelo WhatsApp! 🎉');
}

// =====================================================
// PIX — Gerador de payload EMV (BR Code)
// =====================================================

function buildPixEMV(pixKey, merchantName, merchantCity, amount) {
    function field(id, value) {
        const len = String(value.length).padStart(2, '0');
        return `${id}${len}${value}`;
    }

    const gui            = field('00', 'br.gov.bcb.pix') + field('01', pixKey);
    const merchantInfo   = field('26', gui);
    const mcc            = field('52', '0000');
    const currency       = field('53', '986');
    const amountField    = amount > 0 ? field('54', parseFloat(amount).toFixed(2)) : '';
    const country        = field('58', 'BR');
    const nameField      = field('59', (merchantName || 'Comercio').substring(0, 25).padEnd(1, ' ').trimEnd());
    const cityField      = field('60', (merchantCity  || 'Brasil').substring(0, 15).padEnd(1, ' ').trimEnd());
    const additional     = field('62', field('05', '***'));

    const payload = field('00', '01') + field('01', '12') +
                    merchantInfo + mcc + currency + amountField +
                    country + nameField + cityField + additional + '6304';

    return payload + crc16(payload);
}

function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// =====================================================
// ADMIN
// =====================================================

function openAdminModal() {
    adminAuth = false;
    document.getElementById('adminLoginPanel').style.display = '';
    document.getElementById('adminPanel').style.display      = 'none';
    document.getElementById('adminPassword').value          = '';
    openModal('modalAdmin');
}

function checkAdminPass() {
    const pass = document.getElementById('adminPassword').value;
    if (pass === settings.adminPass) {
        adminAuth = true;
        document.getElementById('adminLoginPanel').style.display = 'none';
        document.getElementById('adminPanel').style.display      = '';
        // Preenche valores atuais
        document.getElementById('adminDeliveryFee').value = settings.deliveryFee;
        document.getElementById('adminPixKey').value      = settings.pixKey;
        document.getElementById('adminPixName').value     = settings.pixName;
        document.getElementById('adminPixCity').value     = settings.pixCity;
        document.getElementById('adminNewPass').value     = '';
    } else {
        showToast('Senha incorreta!', 'error');
    }
}

function saveAdminSettings() {
    if (!adminAuth) return;

    const fee  = parseFloat(document.getElementById('adminDeliveryFee').value);
    const key  = document.getElementById('adminPixKey').value.trim();
    const name = document.getElementById('adminPixName').value.trim();
    const city = document.getElementById('adminPixCity').value.trim();
    const newPass = document.getElementById('adminNewPass').value.trim();

    if (isNaN(fee) || fee < 0) {
        showToast('Taxa de entrega inválida.', 'error');
        return;
    }

    settings.deliveryFee = fee;
    if (key)  settings.pixKey  = key;
    if (name) settings.pixName = name;
    if (city) settings.pixCity = city;
    if (newPass) settings.adminPass = newPass;

    saveSettings();
    closeModal('modalAdmin');
    showToast('Configurações salvas! ✓');
}

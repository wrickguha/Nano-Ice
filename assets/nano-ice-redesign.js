/* ============================================================
   NANO-ICE REDESIGN 2026 — JavaScript
   Animations, Timer, Scroll Effects, Interactions
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. SCROLL-TRIGGERED ANIMATIONS (Intersection Observer)
     ============================================================ */
  function initScrollAnimations() {
    var animElements = document.querySelectorAll(
      '.ni-animate, .ni-animate-left, .ni-animate-right, .ni-animate-scale, ' +
      '.benefit, .trust-item, .step, .why-card, .feature-row__item, ' +
      '.grid-product, .collection-grid-item, .section-header, ' +
      '.custom__item, .video-wrapper, blockquote, .feature-row'
    );

    if (!animElements.length) return;

    // Add animation class to elements that don't have it
    animElements.forEach(function (el) {
      if (!el.classList.contains('ni-animate') &&
          !el.classList.contains('ni-animate-left') &&
          !el.classList.contains('ni-animate-right') &&
          !el.classList.contains('ni-animate-scale')) {
        el.classList.add('ni-animate');
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ni-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     2. STICKY HEADER ON SCROLL
     ============================================================ */
  function initStickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var lastScroll = 0;

    window.addEventListener('scroll', function () {
      var currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* ============================================================
     3. BUTTON RIPPLE EFFECT
     ============================================================ */
  function initButtonRipple() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn, .hero__btn, .product-form__cart-submit');
      if (!btn) return;

      var ripple = document.createElement('span');
      ripple.classList.add('ni-ripple');

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

      btn.appendChild(ripple);

      ripple.addEventListener('animationend', function () {
        ripple.remove();
      });
    });
  }

  /* ============================================================
     4. SCROLL-TO-TOP BUTTON
     ============================================================ */
  function initScrollToTop() {
    var btn = document.querySelector('.scroll-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     5. STICKY ADD-TO-CART BAR (Product Page)
     ============================================================ */
  function updateFloatingChatOffset() {
    var stickyBar = document.querySelector('.ni-sticky-atc');
    var stickyVisible = stickyBar && stickyBar.classList.contains('visible');
    var stickyHeight = stickyBar ? stickyBar.offsetHeight : 0;
    var bottomOffset = stickyVisible ? (stickyHeight + 12) : 12;
    var viewportH = window.innerHeight;
    var viewportW = window.innerWidth;

    // Scan every element for fixed-positioned widgets near the bottom
    var allElements = document.querySelectorAll('body *');
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      // Skip our own sticky bar and its children
      if (stickyBar && (el === stickyBar || stickyBar.contains(el))) continue;

      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed') continue;

      // Parse the computed bottom value
      var elBottom = parseFloat(cs.bottom);
      var elRight = parseFloat(cs.right);
      var elRect = el.getBoundingClientRect();

      // Target: fixed, near bottom-right, and visible (has size)
      var nearBottom = (!isNaN(elBottom) && elBottom <= (stickyHeight + 80)) || (elRect.bottom >= viewportH - 120);
      var hasSize = elRect.width > 10 && elRect.height > 10;

      if (nearBottom && hasSize) {
        el.style.setProperty('bottom', bottomOffset + 'px', 'important');
        el.style.setProperty('z-index', '1001', 'important');
      }
    }
  }

  function initStickyAddToCart() {
    var addBtn = document.querySelector('.product-form__cart-submit');
    if (!addBtn) return;

    var productTitle = document.querySelector('.product-single__title');
    var priceEl = document.querySelector('[id^="ProductPrice-"]');

    if (!productTitle || !priceEl) return;

    // Create sticky bar
    var stickyBar = document.createElement('div');
    stickyBar.className = 'ni-sticky-atc';
    stickyBar.innerHTML = '<div class="ni-sticky-atc__info">' +
      '<div class="ni-sticky-atc__title">' + productTitle.textContent.trim() + '</div>' +
      '<div class="ni-sticky-atc__price">' + priceEl.textContent.trim() + '</div>' +
      '</div>' +
      '<button type="button" class="ni-sticky-atc__btn">Add to Cart</button>';

    document.body.appendChild(stickyBar);
    updateFloatingChatOffset();

    // Show/hide based on original button visibility
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          stickyBar.classList.add('visible');
        } else {
          stickyBar.classList.remove('visible');
        }
        updateFloatingChatOffset();
      });
    }, { threshold: 0 });

    observer.observe(addBtn);

    // Click handler - trigger original form submit
    stickyBar.querySelector('.ni-sticky-atc__btn').addEventListener('click', function () {
      addBtn.click();
    });

    // Re-apply if chat widget is injected after page load
    var mo = new MutationObserver(function () {
      updateFloatingChatOffset();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', updateFloatingChatOffset);
    window.addEventListener('scroll', updateFloatingChatOffset, { passive: true });

    // Continuously recheck for 10 seconds after load to catch late-injected widgets
    var checkCount = 0;
    var checkInterval = setInterval(function () {
      updateFloatingChatOffset();
      checkCount++;
      if (checkCount >= 20) clearInterval(checkInterval);
    }, 500);
  }

  /* ============================================================
     6. FREE SHIPPING COUNTDOWN TIMER (30 Minutes)
     ============================================================ */
  var NI_TIMER_KEY = 'ni_free_ship_timer';
  var NI_TIMER_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  function startFreeShippingTimer() {
    var timerData = {
      startTime: Date.now(),
      endTime: Date.now() + NI_TIMER_DURATION
    };
    try {
      localStorage.setItem(NI_TIMER_KEY, JSON.stringify(timerData));
    } catch (e) {
      // localStorage not available
    }
  }

  function getTimerRemaining() {
    try {
      var data = localStorage.getItem(NI_TIMER_KEY);
      if (!data) return null;

      var timerData = JSON.parse(data);
      var remaining = timerData.endTime - Date.now();

      if (remaining <= 0) {
        localStorage.removeItem(NI_TIMER_KEY);
        return null;
      }

      return remaining;
    } catch (e) {
      return null;
    }
  }

  function formatTime(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return {
      minutes: minutes < 10 ? '0' + minutes : '' + minutes,
      seconds: seconds < 10 ? '0' + seconds : '' + seconds
    };
  }

  function renderTimerBanner(container) {
    if (!container) return null;

    var remaining = getTimerRemaining();
    if (!remaining) {
      container.style.display = 'none';
      return null;
    }

    var time = formatTime(remaining);

    container.innerHTML =
      '<div class="ni-timer-banner">' +
        '<div class="ni-timer-banner__icon">⏳</div>' +
        '<div class="ni-timer-banner__content">' +
          '<p class="ni-timer-banner__title">You\'ve unlocked FREE SHIPPING!</p>' +
          '<p class="ni-timer-banner__subtitle">Add more items within the time and get free shipping on your entire order</p>' +
        '</div>' +
        '<div class="ni-timer-banner__countdown">' +
          '<div class="ni-timer-banner__digit">' +
            '<span class="ni-timer-banner__digit-value" id="niTimerMin">' + time.minutes + '</span>' +
            '<span class="ni-timer-banner__digit-label">Min</span>' +
          '</div>' +
          '<span class="ni-timer-banner__sep">:</span>' +
          '<div class="ni-timer-banner__digit">' +
            '<span class="ni-timer-banner__digit-value" id="niTimerSec">' + time.seconds + '</span>' +
            '<span class="ni-timer-banner__digit-label">Sec</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.style.display = 'block';
    return container;
  }

  function updateTimerDisplay() {
    var remaining = getTimerRemaining();
    var minEl = document.getElementById('niTimerMin');
    var secEl = document.getElementById('niTimerSec');
    var containers = document.querySelectorAll('.ni-timer-container');

    if (!remaining) {
      containers.forEach(function (c) { c.style.display = 'none'; });
      return false;
    }

    if (minEl && secEl) {
      var time = formatTime(remaining);
      minEl.textContent = time.minutes;
      secEl.textContent = time.seconds;
    }

    return true;
  }

  function initFreeShippingTimer() {
    // Check if we're on the thank you / order confirmation page
    if (window.location.pathname.indexOf('/thank_you') !== -1 ||
        window.location.pathname.indexOf('/orders/') !== -1 ||
        document.querySelector('.os-step__title')) {
      // Start timer on order confirmation
      if (!getTimerRemaining()) {
        startFreeShippingTimer();
      }
    }

    // Shopify checkout thank you page detection (via Shopify.checkout)
    if (typeof Shopify !== 'undefined' && Shopify.checkout && Shopify.checkout.order_id) {
      if (!getTimerRemaining()) {
        startFreeShippingTimer();
      }
    }

    // Render timer on cart, product, and other pages if active
    var containers = document.querySelectorAll('.ni-timer-container');
    if (containers.length === 0 && getTimerRemaining()) {
      // Auto-insert timer containers on relevant pages
      var targets = [];

      // Cart page
      var cartHeader = document.querySelector('.template-cart .section-header');
      if (cartHeader) targets.push(cartHeader);

      // Product page
      var productMeta = document.querySelector('.product-single__meta');
      if (productMeta) targets.push(productMeta);

      targets.forEach(function (target) {
        var container = document.createElement('div');
        container.className = 'ni-timer-container';
        target.parentNode.insertBefore(container, target.nextSibling);
      });
    }

    // Re-query containers after potential insertion
    containers = document.querySelectorAll('.ni-timer-container');
    containers.forEach(function (c) {
      renderTimerBanner(c);
    });

    // Start countdown interval
    if (getTimerRemaining()) {
      var timerInterval = setInterval(function () {
        if (!updateTimerDisplay()) {
          clearInterval(timerInterval);
        }
      }, 1000);
    }
  }

  /* ============================================================
     7. CART FREE SHIPPING PROGRESS BAR
     ============================================================ */
  function initShippingProgressBar() {
    var cartFooter = document.querySelector('.cart__footer');
    if (!cartFooter) return;

    var FREE_SHIPPING_THRESHOLD = 5000; // $50.00 in cents — adjust as needed

    // Try to get cart total from Shopify
    var subtotalEl = document.querySelector('.cart__subtotal');
    if (!subtotalEl) return;

    // Parse the cart total from the displayed value
    var totalText = subtotalEl.textContent.trim();
    var totalCents = 0;

    // Remove currency symbols and parse
    var numericString = totalText.replace(/[^0-9.,]/g, '').replace(',', '');
    totalCents = Math.round(parseFloat(numericString) * 100);

    if (isNaN(totalCents)) return;

    var progressContainer = document.createElement('div');
    progressContainer.className = 'ni-shipping-progress';

    var percentage = Math.min((totalCents / FREE_SHIPPING_THRESHOLD) * 100, 100);
    var remaining = FREE_SHIPPING_THRESHOLD - totalCents;

    if (remaining <= 0) {
      progressContainer.innerHTML =
        '<div class="ni-shipping-progress__achieved">' +
          '<span>🎉</span> You\'ve qualified for FREE SHIPPING!' +
        '</div>' +
        '<div class="ni-shipping-progress__bar">' +
          '<div class="ni-shipping-progress__fill" style="width: 100%"></div>' +
        '</div>';
    } else {
      var remainingText = '$' + (remaining / 100).toFixed(2);
      progressContainer.innerHTML =
        '<div class="ni-shipping-progress__text">' +
          'You\'re <span>' + remainingText + '</span> away from <strong>FREE shipping!</strong>' +
        '</div>' +
        '<div class="ni-shipping-progress__bar">' +
          '<div class="ni-shipping-progress__fill" style="width: ' + percentage + '%"></div>' +
        '</div>';
    }

    // Insert before the cart footer
    cartFooter.parentNode.insertBefore(progressContainer, cartFooter);
  }

  /* ============================================================
     8. IMAGE ZOOM EFFECT (Product Page)
     ============================================================ */
  function initImageZoom() {
    var photos = document.querySelectorAll('.product-single__photo');
    photos.forEach(function (photo) {
      var img = photo.querySelector('.product-featured-img');
      if (!img) return;

      photo.addEventListener('mousemove', function (e) {
        var rect = photo.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = x + '% ' + y + '%';
      });

      photo.addEventListener('mouseleave', function () {
        img.style.transformOrigin = 'center center';
      });
    });
  }

  /* ============================================================
     9. STAGGER ANIMATION FOR GRID ITEMS
     ============================================================ */
  function initStaggerAnimations() {
    var grids = [
      { selector: '.how-steps .step', delay: 100 },
      { selector: '.why-grid .why-card', delay: 100 },
      { selector: '.benefits-wrapper .benefit', delay: 80 },
      { selector: '.trust-wrapper .trust-item', delay: 80 },
      { selector: '.grid-product', delay: 60 },
      { selector: '.custom-content .custom__item', delay: 120 },
      { selector: '.quotes-wrapper blockquote', delay: 100 }
    ];

    grids.forEach(function (config) {
      var items = document.querySelectorAll(config.selector);
      items.forEach(function (item, index) {
        item.setAttribute('data-ni-delay', (index + 1).toString());
        item.style.transitionDelay = (index * config.delay) + 'ms';
      });
    });
  }

  /* ============================================================
     10. SMOOTH PARALLAX ON HERO
     ============================================================ */
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', function () {
      var scrolled = window.pageYOffset;
      if (scrolled < hero.offsetHeight) {
        hero.style.backgroundPositionY = 'calc(center + ' + (scrolled * 0.3) + 'px)';
      }
    }, { passive: true });
  }

  /* ============================================================
     11. AUTOMATIC CART UPDATE
     ============================================================ */
  function initAutoCartUpdate() {
    var cartForm = document.querySelector('form.cart');
    if (!cartForm) return;

    var qtyInputs = cartForm.querySelectorAll('.cart__qty-input');
    qtyInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        cartForm.submit();
      });
      
      // Also handle 'input' event for arrow clicks in some browsers
      // but debounce it to avoid multiple submits
      var debounceTimer;
      input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          // Only submit if the value is a valid number
          if (input.value !== "" && !isNaN(input.value)) {
             cartForm.submit();
          }
        }, 1000); // 1 second delay
      });
    });
  }

  /* ============================================================
     INITIALIZE ALL
     ============================================================ */
  function init() {
    initStaggerAnimations();
    initScrollAnimations();
    initStickyHeader();
    initButtonRipple();
    initScrollToTop();
    initStickyAddToCart();
    initFreeShippingTimer();
    initShippingProgressBar();
    initImageZoom();
    initHeroParallax();
    initAutoCartUpdate();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

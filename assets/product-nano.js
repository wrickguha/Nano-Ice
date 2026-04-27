/**
 * Nano Ice Custom Product Page Scripts
 * Handles Variant selection, GSAP Animations, AJAX Cart, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. GLOBAL VARIABLES ---
  const variantsJSONTag = document.getElementById('NanoVariantJSON');
  let productVariants = [];
  if (variantsJSONTag) {
    try { productVariants = JSON.parse(variantsJSONTag.textContent || '[]'); } catch(e) {}
  }

  const priceDisplay = document.getElementById('NanoPrice');
  const comparePriceDisplay = document.getElementById('NanoComparePrice');
  const stickyPriceDisplay = document.getElementById('NanoStickyPrice');
  const addToCartBtn = document.getElementById('NanoAddToCartBtn');
  const ctaText = addToCartBtn ? addToCartBtn.querySelector('.nano-cta__text') : null;
  const variantInputId = document.getElementById('NanoVariantId');
  const mainImages = document.querySelectorAll('.nano-main-image');

  const formatMoney = (cents) => '$' + (cents / 100).toFixed(2);

  // --- 2. VARIANT SELECTION LOGIC ---
  const optionGroups = document.querySelectorAll('.nano-pill-group');

  if (optionGroups.length > 0) {
    optionGroups.forEach(group => {
      const pills = group.querySelectorAll('.nano-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          pills.forEach(p => p.classList.remove('is-active'));
          e.target.classList.add('is-active');
          updateSelectedVariant();
        });
      });
    });
  }

  function updateSelectedVariant() {
    let selectedOptions = [];
    document.querySelectorAll('.nano-pill-group').forEach(group => {
      const activePill = group.querySelector('.nano-pill.is-active');
      selectedOptions.push(activePill ? activePill.getAttribute('data-value') : null);
    });

    const matchedVariant = productVariants.find(variant =>
      variant.options.every((opt, index) => opt === selectedOptions[index])
    );

    if (matchedVariant) {
      if (variantInputId) variantInputId.value = matchedVariant.id;

      const currentPriceStr = formatMoney(matchedVariant.price);
      if (priceDisplay) priceDisplay.innerHTML = currentPriceStr;
      if (stickyPriceDisplay) stickyPriceDisplay.innerHTML = currentPriceStr;

      if (comparePriceDisplay) {
        if (matchedVariant.compare_at_price > matchedVariant.price) {
          comparePriceDisplay.innerHTML = formatMoney(matchedVariant.compare_at_price);
          comparePriceDisplay.style.display = 'inline-block';
        } else {
          comparePriceDisplay.style.display = 'none';
        }
      }

      if (addToCartBtn) {
        if (matchedVariant.available) {
          addToCartBtn.disabled = false;
          if (ctaText) ctaText.innerHTML = 'Add to Cart';
        } else {
          addToCartBtn.disabled = true;
          if (ctaText) ctaText.innerHTML = 'Sold Out';
        }
      }

      // Update main image if variant has featured_image
      if (matchedVariant.featured_image && matchedVariant.featured_image.id) {
        const variantImageId = matchedVariant.featured_image.id;
        mainImages.forEach(img => {
          const imgWrapper = img.closest('.product-single__photo-wrapper');
          if (img.dataset.imageId == variantImageId) {
            img.classList.add('is-active');
            if (imgWrapper) imgWrapper.classList.remove('hide');
          } else {
            img.classList.remove('is-active');
            if (imgWrapper) imgWrapper.classList.add('hide');
          }
        });

        document.querySelectorAll('.nano-gallery__thumb').forEach(thumb => {
          thumb.classList.remove('is-active');
          if (thumb.dataset.imageId == variantImageId) {
            thumb.classList.add('is-active');
          }
        });
      }
    } else {
      if (addToCartBtn) addToCartBtn.disabled = true;
      if (ctaText) ctaText.innerHTML = 'Unavailable';
    }
  }

  // --- 3. GALLERY IMAGE ZOOM ON HOVER ---
  // Zoom feature removed as requested. No event listeners for zoom.

  // --- 4. GALLERY THUMBNAIL LOGIC ---
  const thumbnails = document.querySelectorAll('.nano-gallery__thumb');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const imageId = thumb.dataset.imageId;

      thumbnails.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');

      mainImages.forEach(img => {
        const imgWrapper = img.closest('.product-single__photo-wrapper');
        if (img.dataset.imageId == imageId) {
          img.classList.add('is-active');
          if (imgWrapper) imgWrapper.classList.remove('hide');
        } else {
          img.classList.remove('is-active');
          if (imgWrapper) imgWrapper.classList.add('hide');
        }
      });
    });
  });

  // --- 4. QUANTITY SELECTOR ---
  const qtyBtns = document.querySelectorAll('.nano-qty__btn');
  const qtyInput = document.getElementById('NanoQuantity');

  if (qtyInput) {
    qtyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        let currentQty = parseInt(qtyInput.value) || 1;
        if (btn.dataset.action === 'plus') {
          qtyInput.value = currentQty + 1;
        } else if (btn.dataset.action === 'minus' && currentQty > 1) {
          qtyInput.value = currentQty - 1;
        }
      });
    });
  }

  // --- 5. AJAX ADD TO CART ---
  const addToCartForm = document.getElementById('NanoAddToCartForm');
  if (addToCartForm) {
    addToCartForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(addToCartForm);
      const originalText = ctaText ? ctaText.innerHTML : '';

      if (ctaText) ctaText.innerHTML = 'Adding...';
      if (addToCartBtn) addToCartBtn.disabled = true;

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
      .then(response => {
        if (!response.ok) throw new Error('Cart error');
        return response.json();
      })
      .then(data => {
        if (ctaText) ctaText.innerHTML = 'Added! ✓ Going to cart...';
        document.documentElement.dispatchEvent(new CustomEvent('cart:item-added', {
          bubbles: true,
          detail: { cart: data }
        }));
        setTimeout(() => {
          window.location.href = '/cart';
        }, 600);
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
        if (ctaText) ctaText.innerHTML = 'Error — Try again';
        setTimeout(() => {
          if (ctaText) ctaText.innerHTML = originalText;
          if (addToCartBtn) addToCartBtn.disabled = false;
        }, 2000);
      });
    });
  }

  // --- 6. INSTAGRAM COPY LINK ---
  const igBtn = document.querySelector('.nano-social-btn--instagram');
  const shareToast = document.getElementById('NanoShareToast');
  if (igBtn && shareToast) {
    igBtn.addEventListener('click', () => {
      const url = igBtn.dataset.shareUrl || window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        shareToast.classList.add('is-visible');
        setTimeout(() => shareToast.classList.remove('is-visible'), 3000);
      }).catch(() => {
        // Fallback for browsers that block clipboard API
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        shareToast.classList.add('is-visible');
        setTimeout(() => shareToast.classList.remove('is-visible'), 3000);
      });
    });
  }

  // --- 7. STICKY BUY BAR ---
  const stickyBar = document.getElementById('NanoStickyBar');
  const stickyBtn = document.getElementById('NanoStickyAddToCart');

  if (stickyBar && addToCartBtn) {
    window.addEventListener('scroll', () => {
      const buttonRect = addToCartBtn.getBoundingClientRect();
      if (buttonRect.bottom < 0) {
        stickyBar.classList.add('is-visible');
      } else {
        stickyBar.classList.remove('is-visible');
      }
    }, { passive: true });

    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        if (addToCartForm) addToCartForm.dispatchEvent(new Event('submit'));
      });
    }
  }

  // --- 7. GSAP SCROLL ANIMATIONS ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.gs-reveal').forEach(elem => {
      gsap.fromTo(elem,
        { autoAlpha: 0, y: 30 },
        {
          scrollTrigger: { trigger: elem, start: 'top 85%' },
          autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out'
        }
      );
    });

    gsap.utils.toArray('.gs-reveal-up').forEach(elem => {
      gsap.fromTo(elem,
        { autoAlpha: 0, y: 50 },
        {
          scrollTrigger: { trigger: elem, start: 'top 90%' },
          autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out'
        }
      );
    });

    gsap.set('.gs-card', { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch('.gs-card', {
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.8, overwrite: true
      }),
      start: 'top 85%'
    });
  }

});

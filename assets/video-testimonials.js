/* ============================================================
   VIDEO TESTIMONIALS GALLERY — JavaScript
   Lightbox, carousel, autoplay, filter, scroll animations
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. LIGHTBOX — Open/Close Video
     ============================================================ */
  var lightbox = document.getElementById('vtg-lightbox');
  var lightboxContainer = document.getElementById('vtg-lightbox-container');

  function openLightbox(videoType, videoId, videoSrc) {
    if (!lightbox || !lightboxContainer) return;

    var html = '';
    if (videoType === 'youtube') {
      html = '<iframe src="https://www.youtube-nocookie.com/embed/' +
        encodeURIComponent(videoId) +
        '?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    } else if (videoType === 'vimeo') {
      html = '<iframe src="https://player.vimeo.com/video/' +
        encodeURIComponent(videoId) +
        '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
    } else if (videoType === 'hosted' && videoSrc) {
      html = '<video src="' + encodeURI(videoSrc) + '" controls autoplay playsinline></video>';
    }

    lightboxContainer.innerHTML = html;
    lightbox.classList.add('vtg-lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('vtg-lightbox--open');
    document.body.style.overflow = '';

    // Delay clearing to allow animation to finish
    setTimeout(function () {
      if (lightboxContainer) {
        lightboxContainer.innerHTML = '';
      }
    }, 350);
  }

  // Bind close events
  if (lightbox) {
    lightbox.querySelector('.vtg-lightbox__overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.vtg-lightbox__close').addEventListener('click', closeLightbox);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('vtg-lightbox--open')) {
        closeLightbox();
      }
    });
  }

  // Bind play buttons
  var playBtns = document.querySelectorAll('.vtg-card__play-btn');
  playBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var placeholder = btn.closest('.vtg-card__video-placeholder');
      if (!placeholder) return;

      var videoType = placeholder.getAttribute('data-video-type');
      var videoId = placeholder.getAttribute('data-video-id');

      if (videoType === 'hosted') {
        var hostedVideo = placeholder.querySelector('.vtg-card__hosted-video');
        var src = hostedVideo ? hostedVideo.getAttribute('src') : '';
        openLightbox('hosted', null, src);
      } else {
        openLightbox(videoType, videoId);
      }
    });
  });

  /* ============================================================
     2. HOSTED VIDEO — Autoplay on Hover (muted preview)
     ============================================================ */
  var hostedCards = document.querySelectorAll('.vtg-card__hosted-video');
  hostedCards.forEach(function (video) {
    var card = video.closest('.vtg-card');
    if (!card) return;

    card.addEventListener('mouseenter', function () {
      video.play().catch(function () { /* autoplay blocked, ignore */ });
    });

    card.addEventListener('mouseleave', function () {
      video.pause();
      video.currentTime = 0;
    });
  });

  /* ============================================================
     3. MOBILE CAROUSEL
     ============================================================ */
  var grid = document.getElementById('vtg-grid');
  var carouselNav = document.getElementById('vtg-carousel-nav');
  var dotsContainer = document.getElementById('vtg-carousel-dots');

  function isMobile() {
    return window.innerWidth <= 749;
  }

  function getCards() {
    return grid ? Array.prototype.slice.call(grid.querySelectorAll('.vtg-card')) : [];
  }

  var currentSlide = 0;

  function buildDots() {
    if (!dotsContainer || !isMobile()) return;
    var cards = getCards();
    dotsContainer.innerHTML = '';

    cards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'vtg-carousel-dot' + (i === 0 ? ' vtg-carousel-dot--active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goToSlide(i); });
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsContainer) return;
    var dots = dotsContainer.querySelectorAll('.vtg-carousel-dot');
    dots.forEach(function (dot, i) {
      dot.classList.toggle('vtg-carousel-dot--active', i === currentSlide);
    });
  }

  function goToSlide(index) {
    var cards = getCards();
    if (!cards.length || !grid) return;

    currentSlide = Math.max(0, Math.min(index, cards.length - 1));
    var target = cards[currentSlide];

    grid.scrollTo({
      left: target.offsetLeft - (grid.offsetWidth - target.offsetWidth) / 2,
      behavior: 'smooth'
    });

    updateDots();
  }

  // Detect scroll position to update dots
  if (grid) {
    var scrollTimeout;
    grid.addEventListener('scroll', function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        if (!isMobile()) return;
        var cards = getCards();
        var scrollLeft = grid.scrollLeft;
        var gridCenter = scrollLeft + grid.offsetWidth / 2;

        var closest = 0;
        var minDist = Infinity;
        cards.forEach(function (card, i) {
          var cardCenter = card.offsetLeft + card.offsetWidth / 2;
          var dist = Math.abs(gridCenter - cardCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });

        currentSlide = closest;
        updateDots();
      }, 50);
    }, { passive: true });
  }

  // Prev/Next buttons
  if (carouselNav) {
    var prevBtn = carouselNav.querySelector('.vtg-carousel-btn--prev');
    var nextBtn = carouselNav.querySelector('.vtg-carousel-btn--next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToSlide(currentSlide - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goToSlide(currentSlide + 1);
      });
    }
  }

  /* ============================================================
     4. FILTER TABS
     ============================================================ */
  var filterBtns = document.querySelectorAll('.vtg-filter-btn');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // Update active state
      filterBtns.forEach(function (b) { b.classList.remove('vtg-filter-btn--active'); });
      btn.classList.add('vtg-filter-btn--active');

      // Filter cards
      var cards = getCards();
      cards.forEach(function (card) {
        var category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ============================================================
     5. SCROLL ANIMATIONS (uses existing IntersectionObserver
        from nano-ice-redesign.js — but we also handle our own
        in case the main script hasn't initialized yet)
     ============================================================ */
  function initTestimonialAnimations() {
    var animElements = document.querySelectorAll(
      '.vtg-card.ni-animate, .vtg-hero .ni-animate, .vtg-stats__item.ni-animate, ' +
      '.vtg-section__header.ni-animate, .vtg-bottom-cta__inner.ni-animate'
    );

    if (!animElements.length) return;

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      animElements.forEach(function (el) { el.classList.add('ni-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ni-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    animElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     6. INITIALIZE
     ============================================================ */
  function init() {
    initTestimonialAnimations();
    buildDots();

    // Rebuild dots on resize
    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        buildDots();
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

jQuery(document).ready(function( $ ) {

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Anchor scroll length scales with distance: short hops feel instant,
  // long jumps stay readable (was a flat 1500ms).
  function scrollDuration(targetTop) {
    if (reducedMotion) { return 0; }
    var distance = Math.abs(targetTop - $(window).scrollTop());
    return Math.round(Math.min(900, Math.max(450, distance * 0.25)));
  }

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function(){
    $('html, body').animate({scrollTop : 0}, scrollDuration(0), 'easeInOutCubic');
    return false;
  });

  // Header fixed on scroll
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('#header').addClass('header-scrolled');
    } else {
      $('#header').removeClass('header-scrolled');
    }
  });

  if ($(window).scrollTop() > 100) {
    $('#header').addClass('header-scrolled');
  }

  // Real view height for mobile devices
  if (window.matchMedia("(max-width: 767px)").matches) {
    $('#intro').css({ height: $(window).height() });
  }

  // Initiate the wowjs animation library
  new WOW().init();

  // Initialize Venobox
  $('.venobox').venobox({
    bgcolor: '',
    overlayColor: 'rgba(6, 12, 34, 0.85)',
    closeBackground: '',
    closeColor: '#fff'
  });

  // Initiate superfish on nav menu
  $('.nav-menu').superfish({
    animation: {
      opacity: 'show'
    },
    speed: 400
  });

  // Mobile Navigation
  if ($('#nav-menu-container').length) {
    var $mobile_nav = $('#nav-menu-container').clone().prop({
      id: 'mobile-nav'
    });
    $mobile_nav.find('> ul').attr({
      'class': '',
      'id': ''
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
    $('body').append('<div id="mobile-body-overly"></div>');
    $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>');

    $(document).on('click', '.menu-has-children i', function(e) {
      $(this).next().toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).toggleClass("fa-chevron-up fa-chevron-down");
    });

    $(document).on('click', '#mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
      $('#mobile-body-overly').toggle();
    });

    $(document).click(function(e) {
      var container = $("#mobile-nav, #mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
      }
    });
  } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
    $("#mobile-nav, #mobile-nav-toggle").hide();
  }

  // Smooth scroll for the menu and links with .scrollto classes
  $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        var top_space = 0;

        if ($('#header').length) {
          top_space = $('#header').outerHeight();

          if( ! $('#header').hasClass('header-fixed') ) {
            top_space = top_space - 20;
          }
        }

        var targetTop = target.offset().top - top_space;
        $('html, body').stop().animate({
          scrollTop: targetTop
        }, scrollDuration(targetTop), 'easeInOutCubic');

        if ($(this).parents('.nav-menu').length) {
          $('.nav-menu .menu-active').removeClass('menu-active');
          $(this).closest('li').addClass('menu-active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Gallery carousel (uses the Owl Carousel library)
  $(".gallery-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    center:true,
    responsive: { 0: { items: 1 }, 768: { items: 3 }, 992: { items: 4 }, 1200: {items: 5}
    }
  });

  // Buy tickets select the ticket type on click
  $('#buy-ticket-modal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var ticketType = button.data('ticket-type');
    var modal = $(this);
    modal.find('#ticket-type').val(ticketType);
  })

// custom code

  // Read more / show less for the institution blurbs.
  // Starts collapsed only once JS runs, so the full text stays readable without it.
  // Labels default to Read more / Show less; a button can set its own
  // with data-label-closed / data-label-open (committee lists).
  $('.tf-toggle').each(function () {
    var $btn = $(this);
    var $more = $('#' + $btn.attr('aria-controls'));
    var closed = $btn.data('label-closed') || 'Read more';
    var open_ = $btn.data('label-open') || 'Show less';
    function set(open) {
      $more.toggleClass('is-collapsed', !open);
      $btn.attr('aria-expanded', open ? 'true' : 'false');
      $btn.find('.tf-toggle-label').text(open ? open_ : closed);
    }
    set(false);
    $btn.on('click', function () { set($btn.attr('aria-expanded') !== 'true'); });
  });

  // Hero arrival. The <head> arms it (.js-arrival); this plays it once the
  // campus photos can paint. With <html data-await-arrival>, it waits for the
  // Earth experience to call document.dispatchEvent(new Event('sjb:arrive')).
  ;(function () {
    var root = document.documentElement;
    if (!root.classList.contains('js-arrival')) { return; }
    var imgs = document.querySelectorAll('#intro .sj-campus img');

    function photosReady() {
      var waits = Array.prototype.map.call(imgs, function (img) {
        if (!img.decode) { return Promise.resolve(); }
        return img.decode().catch(function () {
          // A broken photo still shows its alt text; it must not hold the entrance
          console.warn('Hero photo failed to load:', img.currentSrc || img.src);
        });
      });
      var cap = new Promise(function (resolve) { setTimeout(resolve, 1500); });
      return Promise.race([Promise.all(waits), cap]);
    }
    function play() {
      photosReady().then(function () {
        window.requestAnimationFrame(function () { root.classList.add('is-arrived'); });
      });
    }

    if (root.hasAttribute('data-await-arrival')) {
      document.addEventListener('sjb:arrive', play, { once: true });
    } else {
      play();
    }
  })();

  // Scroll-linked chrome: reading progress bar, header that hides while
  // scrolling down and returns on scroll up, nav highlight of the section
  // in view, and the venue photo parallax. One rAF-throttled handler.
  ;(function () {
    var $header = $('#header');
    var progress = document.querySelector('.tf-progress');
    var lastY = window.pageYOffset, ticking = false;
    var parallax = reducedMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

    var links = $('.nav-menu a[href^="#"], #mobile-nav a[href^="#"]');
    var sections = links.map(function () { return $(this.hash)[0]; }).get()
      .filter(function (el, i, all) { return el && all.indexOf(el) === i; });

    function frame() {
      ticking = false;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) { progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')'; }

      var hide = y > window.innerHeight * 0.6 && y > lastY + 4 && !$('body').hasClass('mobile-nav-active');
      if (hide) { $header.addClass('is-hidden'); } else if (y < lastY - 4 || y < 100) { $header.removeClass('is-hidden'); }
      lastY = y;

      var probe = y + window.innerHeight * 0.35, current = null;
      sections.forEach(function (el) { if ($(el).offset().top <= probe) { current = el.id; } });
      links.each(function () {
        $(this).closest('li').toggleClass('menu-active', this.hash === '#' + current);
      });

      // Photos drift against the scroll by up to 6% while their frame is on
      // screen. Measure everything first, then write, to avoid layout thrash.
      var vh = window.innerHeight;
      var shifts = parallax.map(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) { return null; }
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        return Math.max(-1, Math.min(1, p)) * -6;
      });
      parallax.forEach(function (img, i) {
        if (shifts[i] !== null) { img.style.transform = 'translate3d(0,' + shifts[i].toFixed(2) + '%,0)'; }
      });
    }

    $(window).on('scroll resize', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
    });
    // Keyboard users tabbing into the header should always see it
    $header.on('focusin', function () { $header.removeClass('is-hidden'); });
    frame();
  })();

  // Committee portraits: clicking a photo opens it larger in a modal <dialog>.
  // Esc closes it natively; a click on the backdrop or the close button does too.
  ;(function () {
    var dlg = document.querySelector('.tf-lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') { return; }
    var big = dlg.querySelector('img');
    var name = dlg.querySelector('figcaption strong');
    var role = dlg.querySelector('figcaption span');
    var root = document.documentElement;
    var opener = null;

    $(document).on('click', '.tf-portrait-btn', function () {
      var li = $(this).closest('li');
      opener = this;
      big.src = this.querySelector('img').getAttribute('src');
      name.textContent = li.find('strong').first().text();
      role.textContent = li.find('span').first().text();
      big.alt = name.textContent;
      root.classList.add('tf-lb-open');
      dlg.showModal();
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('.tf-lightbox-close')) { dlg.close(); }
    });
    dlg.addEventListener('close', function () {
      root.classList.remove('tf-lb-open');
      if (opener) { opener.focus(); opener = null; }
    });
  })();

  // Important dates enter one by one, in order, and the venue photos wipe in,
  // the first time each scrolls into view. Content is only hidden once JS has
  // confirmed it can reveal it again.
  ;(function () {
    var dates = document.querySelectorAll('.sj-timeline > li');
    var media = document.querySelectorAll('[data-reveal-media]');
    if (reducedMotion || !('IntersectionObserver' in window)) { return; }
    document.documentElement.classList.add('tf-reveal-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    Array.prototype.forEach.call(dates, function (el, i) {
      el.style.transitionDelay = i * 80 + 'ms';
      io.observe(el);
    });
    Array.prototype.forEach.call(media, function (el) { io.observe(el); });
  })();

  // Footer wordmark: each letter rises into view in a staggered wave as the
  // footer scrolls in. Scrubbed, so it sinks back when scrolling up. Skipped
  // for reduced motion (the mark just sits there).
  ;(function () {
    var mark = document.querySelector('.sj-footer-mark');
    if (!mark || reducedMotion) { return; }

    // split the text (keeping the nested "2027" span) into one span per letter
    var n = 0;
    function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.prototype.forEach.call(c.textContent, function (ch) {
            var s = document.createElement('span');
            s.className = 'sj-ch';
            s.style.setProperty('--i', n++);
            s.textContent = ch === ' ' ? '\u00a0' : ch;
            frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { split(c); }
      });
    }
    split(mark.querySelector('.sj-line'));

    var ticking = false;
    function update() {
      ticking = false;
      var r = mark.getBoundingClientRect(), vh = window.innerHeight;
      // 0 when the mark's top is at the viewport bottom, 1 once 90% of it is in
      var p = Math.min(1, Math.max(0, (vh - r.top) / (r.height * 0.9 + 1)));
      var eased = 1 - Math.pow(1 - p, 3);   // ease-out: letters decelerate as they land
      mark.style.setProperty('--rise', eased.toFixed(3));
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

});

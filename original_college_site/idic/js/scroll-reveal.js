/*
 * Scroll reveal: vanilla port of the React Bits "ScrollReveal" component
 * (components/scroll_reveal), without GSAP.
 * Usage: <p data-scroll-reveal data-sr-opacity="0.1" data-sr-blur="10" data-sr-rotation="3">Text</p>
 *
 * Tied to scroll position (like a GSAP scrub):
 * - the block rotates from data-sr-rotation deg to 0 while its top travels
 *   from the viewport bottom until its bottom reaches the viewport bottom;
 * - each word fades from data-sr-opacity to 1 and un-blurs, staggered 0.05,
 *   while the block's top travels from 80% of the viewport down to the same end.
 *
 * Text stays plain and fully visible when JS is off or the visitor prefers
 * reduced motion. Screen readers get the original text, not the word spans.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 0.05;
  var DURATION = 0.5; // GSAP default tween length, used to spread the stagger

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function setup(el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    var words = [];

    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'tf-sr-only';
    sr.textContent = text;

    var vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    text.split(' ').forEach(function (word, i, all) {
      var w = document.createElement('span');
      w.className = 'tf-sr-word';
      w.textContent = word;
      vis.appendChild(w);
      words.push(w);
      if (i < all.length - 1) { vis.appendChild(document.createTextNode(' ')); }
    });

    el.appendChild(sr);
    el.appendChild(vis);
    el.classList.add('is-scroll-reveal');

    return {
      el: el,
      words: words,
      baseOpacity: parseFloat(el.getAttribute('data-sr-opacity')) || 0.1,
      blur: parseFloat(el.getAttribute('data-sr-blur')) || 0,
      rotation: parseFloat(el.getAttribute('data-sr-rotation')) || 0,
      last: []
    };
  }

  function update(s, vh) {
    var r = s.el.getBoundingClientRect();
    // Scroll distance covered between "start" and "end", as 0..1
    var endTop = vh - r.height; // bottom of block at bottom of viewport
    var rotP = clamp01((vh - r.top) / Math.max(vh - endTop, 1));
    var wordStart = vh * 0.8;
    var wordP = clamp01((wordStart - r.top) / Math.max(wordStart - endTop, 1));

    s.el.style.transform = s.rotation ? 'rotate(' + (s.rotation * (1 - rotP)).toFixed(3) + 'deg)' : '';

    var n = s.words.length;
    var total = DURATION + STAGGER * (n - 1);
    var t = wordP * total;
    for (var i = 0; i < n; i++) {
      var p = clamp01((t - i * STAGGER) / DURATION);
      var q = Math.round(p * 100); // skip style writes when nothing changed
      if (s.last[i] === q) { continue; }
      s.last[i] = q;
      var w = s.words[i].style;
      w.opacity = (s.baseOpacity + (1 - s.baseOpacity) * p).toFixed(3);
      if (s.blur) { w.filter = p >= 1 ? 'none' : 'blur(' + (s.blur * (1 - p)).toFixed(2) + 'px)'; }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (reduced) { return; }
    var nodes = document.querySelectorAll('[data-scroll-reveal]');
    if (!nodes.length) { return; }

    var states = [];
    for (var i = 0; i < nodes.length; i++) { states.push(setup(nodes[i])); }

    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      states.forEach(function (s) { update(s, vh); });
    }
    function request() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    frame();
  });
})();

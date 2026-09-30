/*
 * Decrypted text: vanilla port of the React Bits "DecryptedText" behaviour.
 * Usage: <h1 data-decrypt data-decrypt-speed="40">Text to reveal</h1>
 * On entering the viewport (once) the text starts as random characters and
 * resolves into the real text one character at a time, from the start.
 *
 * Each character is pinned to its final width while animating so centered,
 * wrapping headings do not jump around. The real text stays available to
 * screen readers, and untouched when JS or IntersectionObserver is missing
 * or the visitor prefers reduced motion.
 */
(function () {
  'use strict';

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function randomChar() {
    return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }

  function setup(el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    var speed = parseInt(el.getAttribute('data-decrypt-speed'), 10) || 40;
    var chars = [];

    el.textContent = '';

    var sr = document.createElement('span');
    sr.className = 'tf-sr-only';
    sr.textContent = text;

    var vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');

    text.split(' ').forEach(function (word, wi, words) {
      var w = document.createElement('span');
      w.className = 'tf-dt-word';
      word.split('').forEach(function (ch) {
        var c = document.createElement('span');
        c.className = 'tf-dt-char';
        c.textContent = ch;
        c.setAttribute('data-ch', ch);
        w.appendChild(c);
        chars.push(c);
      });
      vis.appendChild(w);
      if (wi < words.length - 1) { vis.appendChild(document.createTextNode(' ')); }
    });

    el.appendChild(sr);
    el.appendChild(vis);
    return { chars: chars, speed: speed };
  }

  function run(state) {
    var chars = state.chars;

    // Pin every character to its final width before scrambling
    var widths = chars.map(function (c) { return c.getBoundingClientRect().width; });
    chars.forEach(function (c, i) { c.style.width = widths[i] + 'px'; });

    var revealed = 0;
    var timer = setInterval(function () {
      revealed += 1;
      chars.forEach(function (c, i) {
        if (i < revealed) {
          c.textContent = c.getAttribute('data-ch');
          c.classList.remove('is-scrambled');
        } else {
          c.textContent = randomChar();
          c.classList.add('is-scrambled');
        }
      });
      if (revealed >= chars.length) {
        clearInterval(timer);
        chars.forEach(function (c) { c.style.width = ''; c.classList.remove('is-scrambled'); });
      }
    }, state.speed);
  }

  function init(el) {
    if (reduced || !('IntersectionObserver' in window)) { return; }
    var state = setup(el);
    var started = false;

    function start() {
      if (started) { return; }
      started = true;
      run(state);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); start(); }
      });
    }, { threshold: 0.3 });

    // Measure widths only once the web font has been applied
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(function () { io.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var nodes = document.querySelectorAll('[data-decrypt]');
    for (var i = 0; i < nodes.length; i++) { init(nodes[i]); }
  });
})();

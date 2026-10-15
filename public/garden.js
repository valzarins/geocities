/* The flytraps are spreading! More and more sprout all over the page until the bog takes over.
   They grow in the empty spaces only, never on top of the writing, so you can still read it. */
var BogGarden = (function () {
  var MAX = 400;              // even a bog has to stop somewhere
  var TAKEOVER_COVER = 1.1;   // how many traps per screenful of space before the bog wins
  var wilds = null, banner = null, count = 0, started = 0, tick = null, overgrown = false;
  var cursor = { x: -999, y: -999 };

  var SVG =
    '<path d="M50 120 C48 100 52 86 50 72" stroke="#6f9b2c" stroke-width="5" fill="none"/>' +
    '<path d="M50 118 C30 108 14 110 2 118 C18 100 38 102 50 118 Z M50 118 C70 108 86 110 98 118 C82 100 62 102 50 118 Z" fill="#4f7a1c" stroke="#1f3a0c" stroke-width="1.5"/>' +
    '<g class="trap" data-mx="50" data-my="44" data-shut="29" data-reach="30" stroke="#1f3a0c" stroke-width="2">' +
      '<g class="jaw" data-dir="1" style="transform-origin:50px 72px">' +
        '<path d="M50 72 C28 66 16 44 22 22 C38 30 48 50 50 72 Z" fill="url(#trap)"/>' +
        '<path d="M22 22 l-6 -7 M26 34 l-9 -3 M32 48 l-10 0 M40 60 l-9 3" stroke="#e9f2c8" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="jaw" data-dir="-1" style="transform-origin:50px 72px">' +
        '<path d="M50 72 C72 66 84 44 78 22 C62 30 52 50 50 72 Z" fill="url(#trap)"/>' +
        '<path d="M78 22 l6 -7 M74 34 l9 -3 M68 48 l10 0 M60 60 l9 3" stroke="#e9f2c8" stroke-linecap="round"/>' +
      '</g>' +
    '</g>';

  function pageHeight() { return document.documentElement.scrollHeight; }

  // where the writing (and the buttons and pictures) are, in page coordinates
  var writing = null;
  var KEEP_OUT = '#wilds, #overgrown, #scare, #dance, #fly, .chomp, script, style';
  function findWriting() {
    if (writing) return writing;
    writing = [];
    var sx = window.scrollX, sy = window.scrollY, pad = 8;
    function add(r) {
      if (r.width && r.height) writing.push({ l: r.left + sx - pad, t: r.top + sy - pad, r: r.right + sx + pad, b: r.bottom + sy + pad });
    }
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return /\S/.test(n.data) && !n.parentElement.closest(KEEP_OUT) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var range = document.createRange();
    while (walk.nextNode()) {
      range.selectNodeContents(walk.currentNode);
      [].forEach.call(range.getClientRects(), add);
    }
    [].forEach.call(document.querySelectorAll('body img'), function (img) {
      if (!img.closest(KEEP_OUT)) add(img.getBoundingClientRect());
    });
    return writing;
  }
  window.addEventListener('resize', function () { writing = null; });

  // would a trap in this box cover any writing?
  function onWriting(l, t, r, b) {
    var list = findWriting();
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (l < w.r && r > w.l && t < w.b && b > w.t) return true;
    }
    return false;
  }
  // the part of the trap picture that actually has plant in it, tipped over by its tilt
  // plus the 4 degrees it sways each way (it leans from the bottom middle)
  function plantBox(left, top, w, h, tilt) {
    var ox = left + w / 2, oy = top + h;
    var pts = [[w * -0.42, -h * 0.9], [w * 0.42, -h * 0.9], [w * -0.42, 0], [w * 0.42, 0]];
    var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    [(tilt || 0) - 4, (tilt || 0) + 4].forEach(function (deg) {
      var a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
      pts.forEach(function (p) {
        var x = ox + p[0] * c - p[1] * sn, y = oy + p[0] * sn + p[1] * c;
        l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
      });
    });
    return [l, t, r, b];
  }

  function sprout(nearYou) {
    if (count >= MAX) return;
    var w = 55 + Math.random() * 70, h = w * 1.2;
    var pageW = document.documentElement.clientWidth, vh = window.innerHeight;
    var left, top, tries = 0, tilt = Math.random() * 30 - 15;
    do {
      left = Math.random() * (pageW - w);
      top = nearYou ? window.scrollY + Math.random() * (vh - h * 0.6) - h * 0.2
                    : Math.random() * (pageHeight() - h);
      top = Math.max(0, Math.min(top, pageHeight() - h));
      // never sprout right on top of the fly, that would be cheating
      var cx = left + w / 2 - window.scrollX, cy = top + h * 0.37 - window.scrollY;
      var close = Math.abs(cx - cursor.x) < 90 && Math.abs(cy - cursor.y) < 90;
      var bad = close || onWriting.apply(null, plantBox(left, top, w, h, tilt));
    } while (bad && ++tries < 15);
    if (bad) return;

    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 100 120');
    s.setAttribute('class', 'wild');
    s.setAttribute('aria-hidden', 'true');
    s.style.left = left + 'px';
    s.style.top = top + 'px';
    s.style.width = w + 'px';
    s.style.height = h + 'px';
    s.style.rotate = tilt + 'deg';
    s.style.animationDelay = '0s, ' + (-Math.random() * 3) + 's';
    s.style.animationDuration = '.6s, ' + (2 + Math.random() * 1.5) + 's';
    s.innerHTML = SVG;
    wilds.appendChild(s);
    count++;
    checkTakeover();
  }

  // how crowded is the screen you're looking at right now?
  function checkTakeover() {
    if (overgrown) return;
    var screenTop = window.scrollY, screenBottom = screenTop + window.innerHeight, here = 0;
    [].forEach.call(wilds.children, function (s) {
      var t = parseFloat(s.style.top);
      if (t > screenTop - 60 && t < screenBottom) here++;
    });
    // count the spots on screen where a trap could still grow without covering writing
    var spots = 0, step = 30, pageW = document.documentElement.clientWidth;
    for (var y = screenTop; y < screenBottom; y += step) {
      for (var x = 0; x < pageW; x += step) {
        if (!onWriting.apply(null, plantBox(x - 30, y - 40, 60, 72))) spots++;
      }
    }
    var room = Math.max(4, spots * step * step / (95 * 95));
    if (here >= room * TAKEOVER_COVER || count >= MAX) {
      overgrown = true;
      document.documentElement.classList.add('overgrown');
      banner.style.display = 'block';
      if (window.BogSounds && !document.documentElement.classList.contains('scared')) BogSounds.scare();
    }
  }

  function grow() {
    // they spread slowly at first, then faster: one more trap every 4 seconds for each half minute you've been here
    var secs = (Date.now() - started) / 1000;
    var n = 1 + Math.floor(secs / 30) + (overgrown ? 2 : 0);
    for (var i = 0; i < n; i++) sprout(Math.random() < 0.7);
  }

  function weed() {
    wilds.innerHTML = '';
    count = 0;
    overgrown = false;
    document.documentElement.classList.remove('overgrown');
    banner.style.display = 'none';
    started = Date.now();
    for (var i = 0; i < 3; i++) sprout(false);
  }

  return {
    start: function () {
      wilds = document.createElement('div');
      wilds.id = 'wilds';
      document.body.appendChild(wilds);
      banner = document.createElement('div');
      banner.id = 'overgrown';
      banner.innerHTML = '<span class="blink">!!! THE BOG HAS TAKEN OVER THE PAGE !!!</span><br>' +
        'You fed them too many flies. Now they are EVERYWHERE.<br>' +
        '<a href="#" id="weed">[ Weed the garden ]</a>';
      document.body.appendChild(banner);
      banner.querySelector('#weed').onclick = function (e) { e.preventDefault(); weed(); };
      document.addEventListener('mousemove', function (e) { cursor = { x: e.clientX, y: e.clientY }; });

      started = Date.now();
      for (var i = 0; i < 3; i++) sprout(false);
      sprout(true);
      tick = setInterval(grow, 4000);
    },
    // every fly they eat makes two more sprout
    fed: function () {
      sprout(true);
      sprout(true);
    }
  };
})();

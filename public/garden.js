/* The flytraps are spreading! More and more sprout all over the page until the bog takes over. */
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

  function sprout(nearYou) {
    if (count >= MAX) return;
    var w = 55 + Math.random() * 70, h = w * 1.2;
    var pageW = document.documentElement.clientWidth, vh = window.innerHeight;
    var left, top, tries = 0;
    do {
      left = Math.random() * (pageW - w);
      top = nearYou ? window.scrollY + Math.random() * (vh - h * 0.6) - h * 0.2
                    : Math.random() * (pageHeight() - h);
      top = Math.max(0, Math.min(top, pageHeight() - h));
      // never sprout right on top of the fly, that would be cheating
      var cx = left + w / 2 - window.scrollX, cy = top + h * 0.37 - window.scrollY;
      var close = Math.abs(cx - cursor.x) < 90 && Math.abs(cy - cursor.y) < 90;
    } while (close && ++tries < 8);
    if (close) return;

    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 100 120');
    s.setAttribute('class', 'wild');
    s.setAttribute('aria-hidden', 'true');
    s.style.left = left + 'px';
    s.style.top = top + 'px';
    s.style.width = w + 'px';
    s.style.height = h + 'px';
    s.style.rotate = (Math.random() * 30 - 15) + 'deg';
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
    var room = (document.documentElement.clientWidth * window.innerHeight) / (95 * 95);
    if (here >= room * TAKEOVER_COVER || count >= MAX) {
      overgrown = true;
      document.documentElement.classList.add('overgrown');
      banner.style.display = 'block';
      if (window.BogSounds && !document.documentElement.classList.contains('scared')) BogSounds.scare();
    }
  }

  function grow() {
    // they spread slowly at first, then faster: one more trap every 6 seconds for each minute you've been here
    var secs = (Date.now() - started) / 1000;
    var n = 1 + Math.floor(secs / 60) + (overgrown ? 2 : 0);
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
      tick = setInterval(grow, 6000);
    },
    // every fly they eat makes another one sprout
    fed: function () {
      sprout(true);
    }
  };
})();

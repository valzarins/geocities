/* The mouse is a fly. The flytraps (in the logo, and everywhere else they sprout) are hungry. */
(function () {
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;

  var traps = document.getElementsByClassName('trap');   // a live list: new sprouts join in by themselves
  var tally = document.getElementById('eaten');
  var fly = document.createElement('img');
  fly.id = 'fly';
  fly.src = 'images/fly.svg';
  fly.alt = '';
  document.body.appendChild(fly);
  document.documentElement.className += ' flymode';

  var REACH = 34;          // how close (in the trap's own drawing units) the fly can get before SNAP
  var x = -100, y = -100, heading = 0, eaten = 0, gone = false;

  function place() {
    fly.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + heading + 'deg)';
  }

  function mouth(trap) {
    var svg = trap.ownerSVGElement;
    var p = svg.createSVGPoint();
    p.x = +trap.getAttribute('data-mx');
    p.y = +trap.getAttribute('data-my');
    var m = svg.getScreenCTM();
    p = p.matrixTransform(m);
    return { x: p.x, y: p.y, scale: Math.hypot(m.a, m.b), reach: +trap.getAttribute('data-reach') || REACH };
  }

  function setJaws(trap, shut) {
    var deg = shut ? +trap.getAttribute('data-shut') : 0;
    [].forEach.call(trap.querySelectorAll('.jaw'), function (jaw) {
      jaw.style.transform = 'rotate(' + deg * jaw.getAttribute('data-dir') + 'deg)';
    });
  }

  function chomp(trap, m) {
    gone = true;
    trap.classList.add('busy', 'shut');
    trap.classList.remove('opening');
    setJaws(trap, true);

    // the fly gets yanked into the mouth and vanishes
    fly.classList.add('caught');
    x = m.x; y = m.y; place();

    var word = document.createElement('div');
    word.className = 'chomp';
    word.textContent = ['CHOMP!', 'SNAP!', 'GULP!', 'MUNCH!'][eaten % 4];
    word.style.left = (m.x + window.scrollX) + 'px';
    word.style.top = (m.y + window.scrollY) + 'px';
    document.body.appendChild(word);
    setTimeout(function () { word.remove(); }, 1200);

    eaten++;
    if (tally) tally.textContent = eaten;
    // a visitor on flies 1, 4, 7, 10...: Michael first, then the witch, taking turns
    var visitor = (eaten - 1) % 3 === 0 ? (((eaten - 1) / 3) % 2 === 0 ? window.BogDancer : window.BogWitch) : null;
    if (visitor) setTimeout(visitor.show, 700);
    else if (window.BogSounds) BogSounds.eat();
    if (window.BogGarden) BogGarden.fed();

    // a fresh fly hatches where the mouse is
    setTimeout(function () {
      fly.classList.remove('caught');
      fly.classList.add('hatch');
      x = last.x; y = last.y; place();
      gone = false;
      setTimeout(function () { fly.classList.remove('hatch'); }, 400);
    }, 900);

    // the trap chews, then slowly opens again
    setTimeout(function () {
      trap.classList.remove('shut');
      trap.classList.add('opening');
      setJaws(trap, false);
    }, 2600);
    setTimeout(function () {
      trap.classList.remove('busy', 'opening');
    }, 3800);
  }

  var last = { x: x, y: y };
  document.addEventListener('mousemove', function (e) {
    var dx = e.clientX - last.x, dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    if (gone || document.documentElement.classList.contains('scared')) return;
    if (dx * dx + dy * dy > 4) {
      var want = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      var turn = ((want - heading + 540) % 360) - 180;
      heading += turn * 0.35;
    }
    x = e.clientX; y = e.clientY;
    fly.style.opacity = 1;
    place();

    for (var i = 0; i < traps.length; i++) {
      if (traps[i].classList.contains('busy')) continue;
      var m = mouth(traps[i]);
      var ddx = (x - m.x) / m.scale, ddy = (y - m.y) / m.scale;
      if (ddx * ddx + ddy * ddy < m.reach * m.reach) { chomp(traps[i], m); break; }
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) fly.style.opacity = 0;
  });

  if (window.BogGarden) BogGarden.start();
})();

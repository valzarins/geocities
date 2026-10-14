/* Spooky bog sounds, all made right here in the browser. No sound files! */
var BogSounds = (function () {
  var ctx = null, out = null, hall = null, noise = null;
  var button = document.getElementById('sound');

  function wake() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = 0.55;
      out.connect(ctx.destination);

      // a big echoey cave: noise that fades away, used as reverb
      var len = ctx.sampleRate * 2.8, imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var d = imp.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      hall = ctx.createConvolver();
      hall.buffer = imp;
      var wet = ctx.createGain();
      wet.gain.value = 0.45;
      hall.connect(wet).connect(out);

      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var n = noise.getChannelData(0);
      for (var j = 0; j < n.length; j++) n[j] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    if (button) button.innerHTML = '&#9835; Spooky bog sounds are ON! &#9835;';
  }

  function send(node) { node.connect(out); node.connect(hall); }

  // one pipe organ note: a few stacked pipes with a little wobble
  function organ(freq, t, dur, vol) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.setValueAtTime(vol, t + dur - 0.04);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.08);
    send(g);
    [[1, 'square', 0.25], [0.5, 'sawtooth', 0.35], [2, 'sine', 0.4], [3, 'sine', 0.15]].forEach(function (p) {
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = p[1];
      o.frequency.value = freq * p[0];
      og.gain.value = p[2];
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  // the famous spooky organ opening (Bach, Toccata in D minor, from 1700-something)
  function toccata(t) {
    var A = 440, G = 392, F = 349.23, E = 329.63, D = 293.66, Cs = 277.18;
    var tune = [[A, 0.09], [G, 0.09], [A, 0.7], [0, 0.25], [G, 0.11], [F, 0.11], [E, 0.11], [D, 0.11], [Cs, 0.45], [D, 1.1]];
    tune.forEach(function (n) {
      if (n[0]) { organ(n[0], t, n[1], 0.09); organ(n[0] / 2, t, n[1], 0.09); }
      t += n[1];
    });
    return t;
  }

  // a witch's cackle: a scratchy voice going "heh heh heh" through mouth-shaped filters
  function cackle(t, syllables, pitch, vol) {
    var voice = ctx.createOscillator(), wob = ctx.createOscillator(), wobAmt = ctx.createGain();
    voice.type = 'sawtooth';
    wob.frequency.value = 28;
    wobAmt.gain.value = pitch * 0.06;
    wob.connect(wobAmt).connect(voice.frequency);

    var breath = ctx.createBufferSource();
    breath.buffer = noise;
    breath.loop = true;
    var hiss = ctx.createBiquadFilter();
    hiss.type = 'bandpass'; hiss.frequency.value = 2600; hiss.Q.value = 1.5;
    var hissAmt = ctx.createGain();
    hissAmt.gain.value = 0.35;
    breath.connect(hiss).connect(hissAmt);

    var env = ctx.createGain();
    env.gain.value = 0;
    [[850, 6, 1], [1250, 7, 0.7], [2700, 8, 0.35]].forEach(function (f) {
      var bp = ctx.createBiquadFilter(), fg = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = f[0]; bp.Q.value = f[1];
      fg.gain.value = f[2];
      voice.connect(bp).connect(fg).connect(env);
    });
    hissAmt.connect(env);
    var loud = ctx.createGain();
    loud.gain.value = vol;
    env.connect(loud);
    send(loud);

    var step = 0.135;
    for (var i = 0; i < syllables; i++) {
      var s = t + i * step, p = pitch * (1 - i * 0.025) * (i % 2 ? 0.94 : 1);
      voice.frequency.setValueAtTime(p * 0.9, s);
      voice.frequency.linearRampToValueAtTime(p * 1.12, s + 0.05);
      voice.frequency.linearRampToValueAtTime(p * 0.8, s + 0.1);
      env.gain.setValueAtTime(0, s);
      env.gain.linearRampToValueAtTime(1, s + 0.015);
      env.gain.exponentialRampToValueAtTime(0.02, s + 0.1);
      env.gain.linearRampToValueAtTime(0, s + 0.12);
    }
    var end = t + syllables * step + 0.1;
    [voice, wob, breath].forEach(function (n) { n.start(t); n.stop(end); });
    return end;
  }

  // the JUMP SCARE crash: a horrible organ chord and a whoosh
  function stinger(t) {
    [73.42, 77.78, 155.56, 293.66, 311.13, 415.3, 622.25].forEach(function (f) { organ(f, t, 1.6, 0.07); });
    var whoosh = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    whoosh.buffer = noise;
    bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(3000, t);
    bp.frequency.exponentialRampToValueAtTime(200, t + 0.9);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1);
    whoosh.connect(bp).connect(g);
    send(g);
    whoosh.start(t);
    whoosh.stop(t + 1);
  }

  function ready() { return ctx && ctx.state === 'running'; }

  if (button) button.onclick = function (e) { e.preventDefault(); wake(); };
  document.addEventListener('click', wake);
  document.addEventListener('keydown', wake);

  return {
    // every time a trap eats a fly: organ music and a little giggle
    eat: function () {
      if (!ready()) return;
      var t = ctx.currentTime + 0.05;
      cackle(toccata(t) - 0.6, 7, 620, 0.9);
    },
    // the witch shows up: CRASH and a long evil laugh
    scare: function () {
      if (!ready()) return;
      var t = ctx.currentTime + 0.02;
      stinger(t);
      cackle(cackle(t + 0.35, 14, 700, 1.3) + 0.15, 10, 560, 1.1);
    }
  };
})();

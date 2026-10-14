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

  // drum machine pieces
  function kick(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 0.26);
  }
  function hiss(t, dur, freq, type, vol, wet) {
    var n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noise;
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f).connect(g);
    if (wet) send(g); else g.connect(out);
    n.start(t, Math.random() * 0.5); n.stop(t + dur);
  }
  function snare(t) { hiss(t, 0.18, 1800, 'bandpass', 0.6, true); }
  function hat(t, vol) { hiss(t, 0.04, 8000, 'highpass', vol, false); }
  // a plant getting crunched: a few fast, wet, crackly bites
  function crunch(t) { for (var k = 0; k < 3; k++) hiss(t + k * 0.035, 0.03, 3500 - k * 600, 'bandpass', 0.35, false); }
  // slap bass: bright saw note that closes down fast
  function pluck(freq, t, dur) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq;
    f.type = 'lowpass'; f.Q.value = 8;
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(300, t + dur);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f).connect(g).connect(out);
    o.start(t); o.stop(t + dur);
  }

  // a record slowing to a stop
  function winddown(t) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(164.81, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.3, t);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    o.connect(f).connect(g).connect(out);
    o.start(t); o.stop(t + 0.62);
  }
  // two low notes rubbing against each other, slowly swelling
  function drone(t, dur) {
    var g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + dur * 0.9);
    g.gain.linearRampToValueAtTime(0, t + dur);
    f.connect(g);
    send(g);
    [41.2, 43.65, 82.4].forEach(function (fr) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = fr;
      o.connect(f);
      o.start(t); o.stop(t + dur);
    });
  }
  // one slow, wet, crunchy bite of plant
  function bigBite(t) {
    hiss(t, 0.06, 1200, 'lowpass', 0.8, true);
    for (var k = 0; k < 6; k++) hiss(t + 0.02 + k * 0.045 + Math.random() * 0.02, 0.04, 2600 - k * 250, 'bandpass', 0.45, false);
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
    // the dance party: a funky drum machine, slap bass, and crunchy plant munching
    // the dance party: two bars of funk, then the lights go out and it gets SLOW and creepy
    groove: function () {
      if (!ready()) return;
      var t0 = ctx.currentTime + 0.05, s16 = 0.125;   // 120 beats a minute, so 2 bars = 4 seconds
      // an original bassline, one note per 16th (0 = rest)
      var E = 82.41, G = 98, A = 110, B = 123.47, D = 146.83, E3 = 164.81;
      var bass = [E, 0, E, 0, 0, E3, 0, D, 0, B, 0, 0, A, 0, G, A];
      var stab = [329.63, 392, 493.88];
      for (var bar = 0; bar < 2; bar++) {
        for (var i = 0; i < 16; i++) {
          var t = t0 + (bar * 16 + i) * s16;
          if (i % 4 === 0) kick(t);
          if (i === 4 || i === 12) snare(t);
          hat(t, i % 2 ? 0.05 : 0.1);
          if (bass[i]) pluck(bass[i], t, s16 * 0.9);
          if (i === 6 || i === 14) stab.forEach(function (f) { organ(f, t, 0.12, 0.05); });
          if (i === 10) crunch(t);
        }
      }
      // lights out: the record winds down, then a low drone, and five slow, heavy bites
      var dark = t0 + 4;
      winddown(dark - 0.5);
      drone(dark, 6.6);
      for (var k = 0; k < 5; k++) bigBite(dark + 0.6 + k * 1.3);
      // the lunge
      stinger(dark + 6.5);
      bigBite(dark + 6.5);
    },
    scare: function () {
      if (!ready()) return;
      var t = ctx.currentTime + 0.02;
      stinger(t);
      cackle(cackle(t + 0.35, 14, 700, 1.3) + 0.15, 10, 560, 1.1);
    }
  };
})();

/* The very first fly, the King of Pop moonwalks through the bog and eats my plants! */
var BogDancer = (function () {
  var box = document.createElement('div');
  box.id = 'dance';
  box.innerHTML =
    '<div class="ball"></div>' +
    '<div class="floor"></div>' +
    '<img src="images/dancer.svg" alt="A cartoon Michael Jackson in a fedora and one sparkly glove, moonwalking and munching a flytrap">' +
    '<div class="boo">MICHAEL JACKSON IS IN MY BOG!!!<br><small>...and he is EATING MY PLANTS!!! &nbsp;Not the flytraps, Michael!!</small></div>' +
    '<div class="out">(click anywhere to stop the party)</div>' +
    '<img class="face" alt="His face in the shadow of the fedora, glowing eyes, slowly chewing a flytrap, coming closer and closer">' +
    '<div class="creepy">...he\'s coming closer...</div>';
  document.body.appendChild(box);

  // the timeline, in milliseconds: moonwalk, lights out and slow chewing, then the lunge
  var LIGHTS_OUT = 4000, LUNGE = 10500, END = 12500;
  var face = box.querySelector('.face'), creepy = box.querySelector('.creepy');
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function hide() {
    box.className = '';
    face.removeAttribute('src');
    document.documentElement.classList.remove('scared');
    timers.forEach(clearTimeout);
    timers = [];
  }
  box.addEventListener('click', hide);

  return {
    show: function () {
      document.documentElement.classList.add('scared');
      box.className = '';
      void box.offsetWidth;   // restart the animations every time
      creepy.innerHTML = '...he\'s coming closer...';
      box.className = 'go';
      if (window.BogSounds) BogSounds.groove();
      later(function () {
        // a fresh copy of the picture, so its slow bites start right now
        face.src = 'images/closeup.svg?' + Date.now();
        box.classList.add('creep');
      }, LIGHTS_OUT);
      later(function () {
        creepy.innerHTML = 'NOT THE FLYTRAPS, MICHAEL!!!';
        box.classList.add('lunge');
      }, LUNGE);
      later(hide, END);
    }
  };
})();

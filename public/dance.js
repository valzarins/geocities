/* Every 4th fly, the King of Pop moonwalks through the bog and eats my plants! */
var BogDancer = (function () {
  var box = document.createElement('div');
  box.id = 'dance';
  box.innerHTML =
    '<div class="ball"></div>' +
    '<div class="floor"></div>' +
    '<img src="images/dancer.svg" alt="A cartoon Michael Jackson in a fedora and one sparkly glove, moonwalking and munching a flytrap">' +
    '<div class="boo">MICHAEL JACKSON IS IN MY BOG!!!<br><small>...and he is EATING MY PLANTS!!! &nbsp;Not the flytraps, Michael!!</small></div>' +
    '<div class="out">(click anywhere to stop the party)</div>';
  document.body.appendChild(box);

  var timer = null;
  function hide() {
    box.className = '';
    document.documentElement.classList.remove('scared');
    clearTimeout(timer);
  }
  box.addEventListener('click', hide);

  return {
    show: function () {
      document.documentElement.classList.add('scared');
      box.className = '';
      void box.offsetWidth;   // restart the animations every time
      box.className = 'go';
      if (window.BogSounds) BogSounds.groove();
      timer = setTimeout(hide, 7000);
    }
  };
})();

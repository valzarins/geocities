/* The very first fly the flytraps eat, the Bog Witch comes for YOU. */
var BogWitch = (function () {
  var box = document.createElement('div');
  box.id = 'scare';
  box.innerHTML =
    '<img src="images/witch.svg" alt="The Bog Witch, a green witch with a flytrap mouth and a hat full of flowers">' +
    '<div class="boo">HEE HEE HEE!!!<br><small>WHO\'S BEEN FEEDING MY GARDEN?!</small></div>' +
    '<div class="out">(click anywhere to run away)</div>';
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
      clearTimeout(timer);
      box.className = '';
      void box.offsetWidth;   // restart the animations every time she comes back
      box.className = 'go';
      if (window.BogSounds) BogSounds.scare();
      timer = setTimeout(hide, 6000);
    }
  };
})();

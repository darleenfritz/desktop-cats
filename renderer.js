const cat = document.getElementById('cat');
const catWidth = 48;

let x = 0;          
let speed = 1.5;    
let direction = 1;  
let pauseFrames = 0; 

function update() {
  if (pauseFrames > 0) {
    pauseFrames = pauseFrames - 1;
  } else {
    x = x + speed * direction;
    if (x > window.innerWidth - catWidth) {
      x = window.innerWidth - catWidth;
      direction = -1;
    }
    if (x < 0) {
      x = 0;
      direction = 1;
    }

    if (Math.random() < 0.005) {
      pauseFrames = 60 + Math.floor(Math.random() * 180); // 1 bis 4 Sekunden
    }
  }

  cat.style.left = x + 'px';

  requestAnimationFrame(update);
}

update();
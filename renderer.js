// Breite einer Katze in Pixeln (muss zur Breite in index.html passen)
const CAT_WIDTH = 64;

// Bauplan für eine Katze. Jede Katze ist ein Objekt dieser Klasse,
// nur mit eigenen Werten für Bilder, Tempo und Laune.
class Cat {
  constructor(name, options) {
    this.name = name;
    this.element = document.getElementById(name);   // das <img> mit der passenden ID
    this.sitImage = 'assets/' + name + '_sitzen.png';
    this.walkImages = [
      'assets/' + name + '_laufen_1.png',
      'assets/' + name + '_laufen_2.png',
      'assets/' + name + '_laufen_3.png',
      'assets/' + name + '_laufen_2.png',
    ];

    // Persönlichkeit
    this.speed = options.speed;             // Pixel pro Bild
    this.sitChance = options.sitChance;     // Wahrscheinlichkeit pro Bild, sich hinzusetzen
    this.minPause = options.minPause;       // kürzeste Pause in Bildern (60 Bilder = 1 Sekunde)
    this.maxPause = options.maxPause;       // längste Pause in Bildern

    // Zustand
    this.x = options.startX;
    this.direction = 1;      // 1 = nach rechts, -1 = nach links
    this.pauseFrames = 0;    // wie viele Bilder die Katze noch stillsitzt
    this.frameCounter = 0;   // zählt mit, wann das nächste Laufbild dran ist
    this.walkIndex = 0;      // welches Laufbild gerade angezeigt wird
  }

  update() {
    if (this.pauseFrames > 0) {
      this.sit();
    } else {
      this.walk();
    }
    this.element.style.left = this.x + 'px';
  }

  sit() {
    this.pauseFrames = this.pauseFrames - 1;
    this.element.src = this.sitImage;
    this.element.style.transform = 'scaleX(1)';
  }

  walk() {
    this.x = this.x + this.speed * this.direction;

    // Am Rand umdrehen
    if (this.x > window.innerWidth - CAT_WIDTH) {
      this.x = window.innerWidth - CAT_WIDTH;
      this.direction = -1;
    }
    if (this.x < 0) {
      this.x = 0;
      this.direction = 1;
    }

    // Laufbilder durchwechseln. Langsame Katzen bewegen die Beine langsamer.
    this.frameCounter = this.frameCounter + this.speed;
    if (this.frameCounter >= 15) {
      this.frameCounter = 0;
      this.walkIndex = (this.walkIndex + 1) % this.walkImages.length;
    }
    this.element.src = this.walkImages[this.walkIndex];
    this.element.style.transform = 'scaleX(' + this.direction + ')';

    // Ab und zu hinsetzen
    if (Math.random() < this.sitChance) {
      const range = this.maxPause - this.minPause;
      this.pauseFrames = this.minPause + Math.floor(Math.random() * range);
    }
  }
}

// Malia: gemütlich, langsam, setzt sich oft und lange hin
const malia = new Cat('malia', {
  speed: 0.8,
  sitChance: 0.008,
  minPause: 180,   // 3 Sekunden
  maxPause: 600,   // 10 Sekunden
  startX: 100,
});

// Molly: verspielt, schnell, sitzt nur kurz
const molly = new Cat('molly', {
  speed: 2,
  sitChance: 0.004,
  minPause: 60,    // 1 Sekunde
  maxPause: 180,   // 3 Sekunden
  startX: 400,
});

const cats = [malia, molly];

// Eine gemeinsame Schleife für alle Katzen
function loop() {
  for (const cat of cats) {
    cat.update();
  }
  requestAnimationFrame(loop);
}

loop();
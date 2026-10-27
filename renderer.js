// Das Bild-Element mit der ID "cat" aus index.html holen
const cat = document.getElementById('cat');

// Breite der Katze in Pixeln (muss zur Breite in index.html passen)
const catWidth = 64;

// Bilder: eins zum Sitzen, drei zum Laufen (alle schauen nach rechts)
const sitImage = 'assets/molly_sitzen.png';
const walkImages = [
  'assets/molly_laufen_1.png',
  'assets/molly_laufen_2.png',
  'assets/molly_laufen_3.png',
  'assets/molly_laufen_2.png', // Bild 2 noch einmal, damit die Bewegung hin und zurück geht
];

// Startwerte
let x = 0;            // aktuelle Position vom linken Rand
let speed = 1.5;      // Pixel pro Bild (ca. 60 Bilder pro Sekunde)
let direction = 1;    // 1 = nach rechts, -1 = nach links
let pauseFrames = 0;  // wie viele Bilder die Katze noch stillsitzt
let frameCounter = 0; // zählt mit, wann das nächste Laufbild dran ist
let walkIndex = 0;    // welches Laufbild gerade angezeigt wird

function update() {
  if (pauseFrames > 0) {
    // Die Katze sitzt: Sitzbild zeigen, nicht spiegeln, Zähler runterzählen
    pauseFrames = pauseFrames - 1;
    cat.src = sitImage;
    cat.style.transform = 'scaleX(1)';
  } else {
    // Die Katze läuft: Position verändern
    x = x + speed * direction;

    // Am rechten Rand umdrehen
    if (x > window.innerWidth - catWidth) {
      x = window.innerWidth - catWidth;
      direction = -1;
    }

    // Am linken Rand umdrehen
    if (x < 0) {
      x = 0;
      direction = 1;
    }

    // Alle 10 Bilder zum nächsten Laufbild wechseln, damit sich die Beine bewegen
    frameCounter = frameCounter + 1;
    if (frameCounter >= 10) {
      frameCounter = 0;
      walkIndex = (walkIndex + 1) % walkImages.length; // % fängt nach dem letzten Bild wieder bei 0 an
    }
    cat.src = walkImages[walkIndex];

    // Die Bilder schauen nach rechts. Läuft sie nach links, wird das Bild gespiegelt.
    cat.style.transform = 'scaleX(' + direction + ')';

    // Ab und zu zufällig hinsetzen (Wahrscheinlichkeit 0,5 % pro Bild)
    if (Math.random() < 0.005) {
      pauseFrames = 60 + Math.floor(Math.random() * 180); // 1 bis 4 Sekunden
    }
  }

  // Neue Position auf das Element übertragen
  cat.style.left = x + 'px';

  // Beim nächsten Bild wieder update() aufrufen
  requestAnimationFrame(update);
}

// Die Schleife starten
update();
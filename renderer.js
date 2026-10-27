// ===== Grundeinstellungen =====

const CAT_WIDTH = 64;  // Breite einer Katze in Pixeln (muss zu index.html passen)
const FPS = 60;        // requestAnimationFrame läuft mit ca. 60 Bildern pro Sekunde

// Hilfsfunktionen
const seconds = (s) => Math.round(s * FPS);                 // Sekunden in Bilder umrechnen
const random = (min, max) => min + Math.random() * (max - min);
const clampX = (x) => Math.max(0, Math.min(window.innerWidth - CAT_WIDTH, x));
const isNight = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7;
};

// Mausposition merken. Dank { forward: true } in main.js kommen die Bewegungen hier an,
// obwohl Klicks durch das Fenster hindurchgehen.
const mouse = { x: -1000, y: -1000, lastMove: 0 };
document.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse.lastMove = Date.now();   // wann die Maus zuletzt bewegt wurde
});
const mouseNearBottom = () => mouse.y > window.innerHeight - 120;


// ===== Bauplan für alle Katzen =====

class Cat {
  constructor(name, options) {
    this.name = name;
    this.element = document.getElementById(name);

    // "z z z" für den Schlaf als eigenes Element anlegen
    this.zz = document.createElement('div');
    this.zz.className = 'zz';
    this.zz.textContent = 'z z';
    document.body.appendChild(this.zz);

    // Bilder
    this.sitImage = 'assets/' + name + '_sitzen.png';
    this.walkImages = [1, 2, 3, 2].map((n) => 'assets/' + name + '_laufen_' + n + '.png');
    this.sleepImages = [1, 2].map((n) => 'assets/' + name + '_schlafen_' + n + '.png');

    // Persönlichkeit
    this.speed = options.speed;
    this.weights = options.weights;   // wie gern sie läuft, sitzt oder schläft
    this.sitTime = options.sitTime;   // [min, max] in Sekunden
    this.sleepTime = options.sleepTime;

    // Zustand
    this.x = options.startX;
    this.direction = 1;       // 1 = schaut nach rechts, -1 = nach links
    this.state = 'sit';       // 'walk', 'sit', 'sleep' (Molly kann zusätzlich 'zoom' und 'follow')
    this.timer = seconds(2);  // wie lange der aktuelle Zustand noch dauert
    this.targetX = null;      // Ziel beim Laufen
    this.onArrive = null;     // was passiert, wenn das Ziel erreicht ist
    this.animCounter = 0;
    this.walkIndex = 0;
    this.partner = null;      // die andere Katze, wird unten gesetzt
    this.pettedFrames = 0;    // > 0, solange sie gerade gestreichelt wird
    this.heartCounter = 0;
  }

  // ----- Streicheln -----

  // Gestreichelt wird, wenn die Maus über der Katze ist und sich bewegt
  isBeingPetted() {
    const overCat = mouse.x >= this.x && mouse.x <= this.x + CAT_WIDTH &&
      mouse.y >= window.innerHeight - 56;
    const moving = Date.now() - mouse.lastMove < 150;
    return overCat && moving;
  }

  enjoyPetting() {
    this.pettedFrames = seconds(0.5);
    if (this.state !== 'sleep') {
      this.state = 'sit';          // stillhalten und genießen
      this.timer = seconds(2);     // danach noch kurz sitzen bleiben
    }
    // Ungefähr viermal pro Sekunde ein Herz aufsteigen lassen
    this.heartCounter = this.heartCounter + 1;
    if (this.heartCounter % 15 === 0) this.showEffect('♥', 'heart');
  }

  // Kleines Symbol, das über der Katze aufsteigt und verschwindet
  showEffect(text, className) {
    const effect = document.createElement('div');
    effect.className = 'effect ' + className;
    effect.textContent = text;
    effect.style.left = (this.x + 24 + random(-12, 12)) + 'px';
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1200);
  }

  // ----- Zustände wechseln -----

  sit(duration) {
    this.state = 'sit';
    this.timer = seconds(duration);
  }

  sleep(duration) {
    this.state = 'sleep';
    this.timer = seconds(duration);
  }

  walkTo(x, onArrive) {
    this.state = 'walk';
    this.targetX = clampX(x);
    this.onArrive = onArrive || (() => this.sit(random(this.sitTime[0], this.sitTime[1])));
  }

  // Ein Platz direkt neben der anderen Katze
  spotNextToPartner() {
    const side = this.x < this.partner.x ? -1 : 1;
    let spot = this.partner.x + side * 52;
    if (spot < 0 || spot > window.innerWidth - CAT_WIDTH) {
      spot = this.partner.x - side * 52;  // auf der anderen Seite ist mehr Platz
    }
    return spot;
  }

  facePartner() {
    this.direction = this.partner.x > this.x ? 1 : -1;
  }

  distanceToPartner() {
    return Math.abs(this.x - this.partner.x);
  }

  // Wird aufgerufen, wenn ein Zustand vorbei ist: Was mache ich als Nächstes?
  decide() {
    let { walk, sit, sleep } = this.weights;
    if (isNight()) sleep = sleep * 4;   // nachts wird mehr geschlafen
    const roll = Math.random() * (walk + sit + sleep);

    if (roll < walk) {
      this.walkTo(random(0, window.innerWidth));
    } else if (roll < walk + sit) {
      this.sit(random(this.sitTime[0], this.sitTime[1]));
    } else {
      this.sleep(random(this.sleepTime[0], this.sleepTime[1]));
    }
  }

  // ----- Jedes Bild -----

  update() {
    if (this.pettedFrames > 0) this.pettedFrames = this.pettedFrames - 1;
    if (this.state === 'walk') {
      this.moveTowardTarget(this.speed);
    } else {
      this.timer = this.timer - 1;
      if (this.timer <= 0) this.decide();
    }
    this.render();
  }

  moveTowardTarget(speed) {
    const distance = this.targetX - this.x;
    if (Math.abs(distance) <= speed) {
      this.x = this.targetX;
      this.onArrive();
      return;
    }
    this.direction = distance > 0 ? 1 : -1;
    this.x = this.x + speed * this.direction;
    this.animate(speed);
  }

  // Laufbilder durchwechseln, schnellere Katzen bewegen die Beine schneller
  animate(speed) {
    this.animCounter = this.animCounter + speed;
    if (this.animCounter >= 15) {
      this.animCounter = 0;
      this.walkIndex = (this.walkIndex + 1) % this.walkImages.length;
    }
  }

  isMoving() {
    return this.state === 'walk' || this.state === 'zoom' || (this.state === 'follow' && this.followMoving);
  }

  render() {
    let image;
    let flip = this.direction;

    if (this.isMoving()) {
      image = this.walkImages[this.walkIndex];
    } else if (this.state === 'sleep') {
      // langsames Atmen: alle 1,2 Sekunden zwischen zwei Bildern wechseln
      const breath = Math.floor(Date.now() / 1200) % 2;
      image = this.sleepImages[breath];
    } else {
      image = this.sitImage;
      flip = 1;  // das Sitzbild schaut nach vorne und wird nicht gespiegelt
    }

    // src nur ändern, wenn sich das Bild wirklich ändert (spart Arbeit)
    if (!this.element.src.endsWith(image)) this.element.src = image;
    this.element.style.transform = 'scaleX(' + flip + ')';
    this.element.style.left = this.x + 'px';

    // "z z" über dem Kopf anzeigen, wenn sie schläft
    this.zz.style.display = this.state === 'sleep' ? 'block' : 'none';
    this.zz.style.left = (this.x + (this.direction === 1 ? 40 : 4)) + 'px';
  }

  // Text für die Menüleiste
  label() {
    if (this.pettedFrames > 0) {
      return 'wird gestreichelt 😻';
    }
    if (this.state === 'sleep' && this.partner.state === 'sleep' && this.distanceToPartner() < 80) {
      return 'kuschelt 💕';
    }
    const texts = {
      walk: 'läuft herum',
      sit: 'sitzt',
      sleep: 'schläft 💤',
      zoom: 'tobt ⚡',
      follow: 'jagt die Maus 🐭',
    };
    return texts[this.state];
  }
}


// ===== Malia: gemütlich, mag Nähe nur, wenn sie selbst will =====

class Malia extends Cat {
  constructor() {
    super('malia', {
      speed: 0.8,
      weights: { walk: 3, sit: 4, sleep: 4 },
      sitTime: [4, 12],
      sleepTime: [20, 60],
      startX: 100,
    });
    this.cuddleNeed = 0;       // 0 = will ihre Ruhe, 1 = will kuscheln
    this.avoidCooldown = 0;    // damit sie nicht ständig hin und her flüchtet
  }

  update() {
    // Das Kuschelbedürfnis steigt langsam (in ca. 2 Minuten von 0 auf 1)
    this.cuddleNeed = Math.min(1, this.cuddleNeed + 1 / seconds(120));
    if (this.avoidCooldown > 0) this.avoidCooldown = this.avoidCooldown - 1;

    // Streicheln: nur, wenn sie gerade Lust auf Nähe hat
    if (this.isBeingPetted() && this.state !== 'walk') {
      if (this.cuddleNeed >= 0.4) {
        this.enjoyPetting();
        this.cuddleNeed = Math.max(0, this.cuddleNeed - 1 / seconds(20));
        super.update();
        return;
      } else if (this.avoidCooldown === 0) {
        // Keine Lust: kurz grummeln und weggehen
        this.showEffect('hmpf', 'grumble');
        const away = mouse.x < this.x + CAT_WIDTH / 2 ? 1 : -1;
        this.walkTo(this.x + away * random(200, 350));
        this.avoidCooldown = seconds(5);
      }
    }

    const mollyIsClose = this.distanceToPartner() < 80;
    const resting = this.state === 'sit' || this.state === 'sleep';

    if (mollyIsClose && resting) {
      if (this.cuddleNeed < 0.5 && this.avoidCooldown === 0) {
        // Keine Lust auf Nähe: nach kurzem Zögern aufstehen und weggehen
        if (Math.random() < 0.01) {
          const away = this.x < this.partner.x ? -1 : 1;
          this.walkTo(this.x + away * random(250, 450));
          this.avoidCooldown = seconds(15);
        }
      } else if (this.state === 'sleep' && this.partner.state === 'sleep') {
        // Kuscheln: das Bedürfnis wird langsam gestillt
        this.cuddleNeed = Math.max(0, this.cuddleNeed - 1 / seconds(40));
      }
    }

    super.update();
  }

  decide() {
    if (this.cuddleNeed > 0.9) {
      // Jetzt will sie selbst Nähe: zu Molly gehen und sich dazulegen
      this.walkTo(this.spotNextToPartner(), () => {
        this.facePartner();
        this.sleep(random(30, 60));
      });
    } else {
      super.decide();
    }
  }
}


// ===== Molly: verspielt, tobt, sucht Nähe =====

class Molly extends Cat {
  constructor() {
    super('molly', {
      speed: 2,
      weights: { walk: 5, sit: 2, sleep: 2 },
      sitTime: [1, 4],
      sleepTime: [15, 40],
      startX: 400,
    });
    this.energy = 0;          // steigt, wenn sie wach ist; bei 1 wird getobt
    this.followMoving = false;
  }

  update() {
    // Energie sammeln, solange sie wach ist (ca. 45 Sekunden bis zum Toben)
    if (this.state !== 'sleep') {
      this.energy = Math.min(1, this.energy + 1 / seconds(45));
    }

    // Streicheln mag Molly immer (außer beim Toben, da ist sie zu schnell)
    if (this.isBeingPetted() && this.state !== 'zoom') {
      this.enjoyPetting();
      super.update();
      return;
    }

    // Toben, wenn die Energie voll ist
    if (this.energy >= 1 && this.state !== 'zoom' && this.state !== 'sleep') {
      this.state = 'zoom';
      this.timer = seconds(random(3, 5));
    }

    // Maus unten am Bildschirm? Dann hinterher!
    if (mouseNearBottom() && (this.state === 'walk' || this.state === 'sit')) {
      this.state = 'follow';
    }

    if (this.state === 'zoom') {
      this.zoom();
      this.render();
    } else if (this.state === 'follow') {
      this.follow();
      this.render();
    } else {
      super.update();
    }
  }

  zoom() {
    const zoomSpeed = 6;
    this.x = this.x + zoomSpeed * this.direction;
    // Am Rand oder einfach mal so umdrehen
    if (this.x <= 0 || this.x >= window.innerWidth - CAT_WIDTH || Math.random() < 0.02) {
      this.direction = -this.direction;
    }
    this.x = clampX(this.x);
    this.animate(zoomSpeed);

    this.timer = this.timer - 1;
    if (this.timer <= 0) {
      // Erschöpft: Energie leer, erst mal hinlegen
      this.energy = 0;
      this.sleep(random(10, 25));
    }
  }

  follow() {
    if (!mouseNearBottom()) {
      this.followMoving = false;
      this.sit(random(1, 3));
      return;
    }
    const target = clampX(mouse.x - CAT_WIDTH / 2);
    const distance = target - this.x;
    this.followMoving = Math.abs(distance) > 6;
    if (this.followMoving) {
      this.direction = distance > 0 ? 1 : -1;
      this.x = this.x + this.speed * 1.3 * this.direction;
      this.animate(this.speed * 1.3);
    }
  }

  decide() {
    // Oft geht Molly von sich aus zu Malia
    if (Math.random() < 0.35) {
      this.walkTo(this.spotNextToPartner(), () => {
        this.facePartner();
        if (this.partner.state === 'sleep') {
          this.sleep(random(15, 40));   // Malia schläft: dazulegen
        } else {
          this.sit(random(2, 5));       // Malia ist wach: daneben sitzen
        }
      });
    } else {
      super.decide();
    }
  }
}


// ===== Start =====

const malia = new Malia();
const molly = new Molly();
malia.partner = molly;
molly.partner = malia;

const cats = [malia, molly];

let frame = 0;

function loop() {
  for (const cat of cats) {
    cat.update();
  }

  // Zweimal pro Sekunde die Stimmung an die Menüleiste schicken
  frame = frame + 1;
  if (window.catsAPI && frame % 30 === 0) {
    window.catsAPI.sendStatus({
      malia: { label: malia.label(), cuddleNeed: malia.cuddleNeed },
      molly: { label: molly.label(), energy: molly.energy },
    });
  }

  requestAnimationFrame(loop);
}

loop();
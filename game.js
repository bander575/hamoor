(() => {
  const SAVE_KEY = "hamoor-browser-phase1";
  const CAPACITY = 25;
  const CAST_TIME = 2600;
  const CAST_COOLDOWN = 4800;
  const WORLD = { width: 1800, height: 1400 };

  const rarityArabic = {
    Common: "عادي",
    Uncommon: "غير شائع",
    Rare: "نادر",
    Epic: "ملحمي",
    Legendary: "أسطوري",
    Mythic: "خرافي",
  };

  const fishCatalog = [
    { id: "Sardine", name: "سردين", rarity: "Common", value: 4, xp: 3, sprite: "fish_blue" },
    { id: "Tilapia", name: "بلطي", rarity: "Common", value: 5, xp: 3, sprite: "fish_green" },
    { id: "Macarona", name: "مكرونة", rarity: "Common", value: 6, xp: 4, sprite: "fish_orange" },
    { id: "Shaoor", name: "شعور", rarity: "Uncommon", value: 12, xp: 8, sprite: "fish_pink" },
    { id: "Najil", name: "ناجل", rarity: "Uncommon", value: 14, xp: 9, sprite: "fish_red" },
    { id: "Kingfish", name: "كنعد", rarity: "Uncommon", value: 16, xp: 10, sprite: "fish_long" },
    { id: "Hamoor", name: "هامور", rarity: "Rare", value: 32, xp: 20, sprite: "fish_blue" },
    { id: "Shaari", name: "شعري", rarity: "Rare", value: 28, xp: 18, sprite: "fish_green" },
    { id: "Seabass", name: "سيباس", rarity: "Rare", value: 35, xp: 22, sprite: "fish_orange" },
    { id: "Tuna", name: "تونة", rarity: "Epic", value: 75, xp: 42, sprite: "fish_red" },
    { id: "Marlin", name: "مارلن", rarity: "Legendary", value: 180, xp: 90, sprite: "fish_long" },
    { id: "BabyShark", name: "قرش صغير", rarity: "Mythic", value: 350, xp: 150, sprite: "fish_long" },
  ];

  const rarityChances = [
    ["Common", 58],
    ["Uncommon", 25],
    ["Rare", 11],
    ["Epic", 4],
    ["Legendary", 1.5],
    ["Mythic", 0.5],
  ];

  const zones = [
    { name: "منطقة السردين", x: 520, y: 430, radius: 145 },
    { name: "منطقة الشعاب", x: 1160, y: 480, radius: 165 },
    { name: "المياه العميقة", x: 1260, y: 980, radius: 190 },
  ];

  const merchant = { x: 365, y: 1030 };
  const dock = { x: 260, y: 850, width: 470, height: 270 };

  const els = {
    coins: document.getElementById("coins"),
    level: document.getElementById("level"),
    xp: document.getElementById("xp"),
    bag: document.getElementById("bag-count"),
    inventory: document.getElementById("inventory-list"),
    toast: document.getElementById("toast"),
    cast: document.getElementById("cast-btn"),
    board: document.getElementById("board-btn"),
    sell: document.getElementById("sell-btn"),
  };

  const state = loadState();
  let gameScene;
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (saved && typeof saved === "object") {
        return {
          coins: Number(saved.coins) || 0,
          xp: Number(saved.xp) || 0,
          inventory: saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {},
          currentBoat: saved.currentBoat || "WoodBoat",
        };
      }
    } catch (_) {
      localStorage.removeItem(SAVE_KEY);
    }
    return { coins: 0, xp: 0, inventory: {}, currentBoat: "WoodBoat" };
  }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function getLevelInfo(xp) {
    let level = 1;
    let needed = 100;
    let remaining = xp;
    while (remaining >= needed) {
      remaining -= needed;
      level += 1;
      needed = Math.floor(needed * 1.25);
    }
    return { level, remaining, needed };
  }

  function inventoryCount() {
    return Object.values(state.inventory).reduce((sum, value) => sum + value, 0);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2800);
  }

  function updateHud() {
    const info = getLevelInfo(state.xp);
    els.coins.textContent = state.coins;
    els.level.textContent = info.level;
    els.xp.textContent = `${info.remaining} / ${info.needed}`;
    els.bag.textContent = `${inventoryCount()} / ${CAPACITY}`;

    els.inventory.innerHTML = "";
    for (const fish of fishCatalog) {
      const amount = state.inventory[fish.id] || 0;
      if (!amount) continue;
      const row = document.createElement("div");
      row.className = "fish-row";
      row.innerHTML = `
        <img alt="${fish.name}" src="./assets/fish/${spriteFile(fish.sprite)}.png" />
        <div><strong>${fish.name} × ${amount}</strong><span>${rarityArabic[fish.rarity]} • ${fish.value} عملة</span></div>
      `;
      els.inventory.appendChild(row);
    }

    if (!els.inventory.children.length) {
      const row = document.createElement("div");
      row.className = "fish-row";
      row.innerHTML = `<img alt="" src="./assets/fish/fish_blue.png" /><div><strong>الحقيبة فارغة</strong><span>اركب القارب واذهب لمنطقة صيد</span></div>`;
      els.inventory.appendChild(row);
    }

    saveState();
  }

  function spriteFile(key) {
    return {
      fish_blue: "fish_blue",
      fish_green: "fish_green",
      fish_orange: "fish_orange",
      fish_pink: "fish_pink",
      fish_red: "fish_red",
      fish_long: "fish_grey_long_b",
    }[key] || key;
  }

  function rollFish() {
    const roll = Math.random() * 100;
    let total = 0;
    let rarity = "Common";
    for (const [name, chance] of rarityChances) {
      total += chance;
      if (roll <= total) {
        rarity = name;
        break;
      }
    }
    const pool = fishCatalog.filter((fish) => fish.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class MainScene extends Phaser.Scene {
    constructor() {
      super("main");
      this.keys = null;
      this.mobile = { up: false, down: false, left: false, right: false };
      this.inBoat = false;
      this.isCasting = false;
      this.lastCast = 0;
      this.fishSprites = [];
      this.bubbles = [];
    }

    preload() {
      this.load.image("water", "./assets/tiles/water.png");
      this.load.image("sand", "./assets/tiles/sand.png");
      this.load.image("grass", "./assets/tiles/grass.png");
      this.load.image("dock", "./assets/tiles/dock_plank.png");
      this.load.image("dockPostA", "./assets/tiles/dock_post_a.png");
      this.load.image("dockPostB", "./assets/tiles/dock_post_b.png");
      this.load.image("roofA", "./assets/tiles/roof_blue_a.png");
      this.load.image("roofB", "./assets/tiles/roof_blue_b.png");
      this.load.image("wallWood", "./assets/tiles/wall_wood_a.png");
      this.load.image("door", "./assets/tiles/door.png");
      this.load.image("sign", "./assets/tiles/shop_sign.png");
      this.load.image("player", "./assets/characters/player.png");
      this.load.image("merchant", "./assets/characters/merchant.png");
      this.load.image("boat", "./assets/decor/boat_row.png");
      this.load.image("treeOrange", "./assets/decor/tree_orange.png");
      this.load.image("treePurple", "./assets/decor/tree_purple.png");
      this.load.image("rockA", "./assets/decor/rock_a.png");
      this.load.image("rockB", "./assets/decor/rock_b.png");
      this.load.image("seaweedA", "./assets/decor/seaweed_green_a.png");
      this.load.image("seaweedB", "./assets/decor/seaweed_orange_a.png");
      this.load.image("bubbleA", "./assets/decor/bubble_a.png");
      this.load.image("bubbleB", "./assets/decor/bubble_b.png");
      this.load.image("fish_blue", "./assets/fish/fish_blue.png");
      this.load.image("fish_green", "./assets/fish/fish_green.png");
      this.load.image("fish_orange", "./assets/fish/fish_orange.png");
      this.load.image("fish_pink", "./assets/fish/fish_pink.png");
      this.load.image("fish_red", "./assets/fish/fish_red.png");
      this.load.image("fish_long", "./assets/fish/fish_grey_long_b.png");
    }

    create() {
      gameScene = this;
      this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
      this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

      this.add.tileSprite(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, "water").setScale(4).setDepth(0);
      this.createLand();
      this.createDecor();
      this.createFishingZones();

      this.merchant = this.add.image(merchant.x, merchant.y, "merchant").setScale(1.45).setDepth(20);
      this.add.text(merchant.x, merchant.y - 54, "تاجر الأسماك", textStyle(18)).setOrigin(0.5).setDepth(21);

      this.boat = this.physics.add.image(420, 745, "boat").setScale(2.6).setDepth(12);
      this.boat.body.setSize(58, 28);
      this.boat.setDrag(0.94);
      this.boat.setMaxVelocity(250);

      this.player = this.physics.add.image(360, 1010, "player").setScale(1.2).setDepth(30);
      this.player.body.setSize(34, 36);
      this.player.setCollideWorldBounds(true);

      this.keys = this.input.keyboard.addKeys({
        up: "W,UP",
        down: "S,DOWN",
        left: "A,LEFT",
        right: "D,RIGHT",
        board: "E",
        cast: "F",
        sell: "R",
      });

      this.keys.board.on("down", () => this.toggleBoat());
      this.keys.cast.on("down", () => this.castNet());
      this.keys.sell.on("down", () => this.sellAll());
      this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
      wireDomControls(this);
      updateHud();
      showToast("أهلاً بك في هامور البحر");
    }

    createLand() {
      for (let x = 80; x <= 740; x += 64) {
        for (let y = 760; y <= 1220; y += 64) {
          this.add.image(x, y, y < 885 ? "sand" : "grass").setScale(4).setDepth(1);
        }
      }

      for (let x = 230; x <= 610; x += 64) {
        for (let y = 640; y <= 830; y += 64) {
          this.add.image(x, y, "dock").setScale(4).setDepth(4);
        }
      }

      for (let x = 220; x <= 620; x += 96) {
        this.add.image(x, 625, "dockPostA").setScale(4).setDepth(5);
        this.add.image(x, 846, "dockPostB").setScale(4).setDepth(5);
      }

      this.add.image(330, 952, "roofA").setScale(4).setDepth(7);
      this.add.image(394, 952, "roofB").setScale(4).setDepth(7);
      this.add.image(330, 1016, "wallWood").setScale(4).setDepth(7);
      this.add.image(394, 1016, "door").setScale(4).setDepth(8);
      this.add.image(362, 1080, "sign").setScale(4).setDepth(9);
    }

    createDecor() {
      const items = [
        [170, 980, "treeOrange", 4],
        [670, 1030, "treePurple", 4],
        [125, 1180, "treePurple", 4],
        [700, 1185, "treeOrange", 4],
        [770, 735, "rockA", 2.2],
        [135, 705, "rockB", 2.2],
        [940, 410, "seaweedA", 2.1],
        [1235, 660, "seaweedB", 2.1],
        [1320, 1120, "rockA", 2.2],
      ];
      for (const [x, y, key, scale] of items) {
        this.add.image(x, y, key).setScale(scale).setDepth(8);
      }

      for (let i = 0; i < 36; i++) {
        const bubble = this.add.image(260 + Math.random() * 1300, 240 + Math.random() * 900, i % 2 ? "bubbleA" : "bubbleB")
          .setScale(1.1 + Math.random() * 0.8)
          .setAlpha(0.55)
          .setDepth(2);
        bubble.baseY = bubble.y;
        bubble.speed = 0.7 + Math.random() * 1.1;
        this.bubbles.push(bubble);
      }
    }

    createFishingZones() {
      zones.forEach((zone, zi) => {
        this.add.text(zone.x, zone.y - zone.radius - 28, zone.name, textStyle(20)).setOrigin(0.5).setDepth(15);
        for (let i = 0; i < 9; i++) {
          const angle = (Math.PI * 2 * i) / 9;
          const fish = this.add.image(
            zone.x + Math.cos(angle) * zone.radius * 0.58,
            zone.y + Math.sin(angle) * zone.radius * 0.45,
            ["fish_blue", "fish_green", "fish_orange", "fish_pink", "fish_red", "fish_long"][(i + zi) % 6],
          ).setScale(1.2).setDepth(6);
          fish.baseX = fish.x;
          fish.baseY = fish.y;
          fish.phase = i * 0.7 + zi;
          this.fishSprites.push(fish);
        }
      });
    }

    update(_, delta) {
      const dt = delta / 1000;
      this.updateMovement(dt);
      this.updateAnimations();
      this.updateButtons();
    }

    updateMovement() {
      const input = {
        up: this.keys.up.isDown || this.mobile.up,
        down: this.keys.down.isDown || this.mobile.down,
        left: this.keys.left.isDown || this.mobile.left,
        right: this.keys.right.isDown || this.mobile.right,
      };

      const target = this.inBoat ? this.boat : this.player;
      const speed = this.inBoat ? 185 : 155;
      let vx = 0;
      let vy = 0;
      if (input.up) vy -= speed;
      if (input.down) vy += speed;
      if (input.left) vx -= speed;
      if (input.right) vx += speed;
      target.setVelocity(vx, vy);

      if (!this.inBoat) {
        this.player.setVisible(true);
        this.player.setDepth(30);
        this.boat.setDepth(12);
        this.player.x = Phaser.Math.Clamp(this.player.x, 75, 760);
        this.player.y = Phaser.Math.Clamp(this.player.y, 735, 1240);
      } else {
        this.player.setVisible(false);
        this.player.setPosition(this.boat.x, this.boat.y);
        this.cameras.main.startFollow(this.boat, true, 0.09, 0.09);
      }
    }

    updateAnimations() {
      const t = this.time.now / 1000;
      for (const fish of this.fishSprites) {
        fish.x = fish.baseX + Math.sin(t * 1.4 + fish.phase) * 22;
        fish.y = fish.baseY + Math.cos(t * 1.1 + fish.phase) * 10;
        fish.rotation = Math.sin(t * 1.2 + fish.phase) * 0.12;
      }
      for (const bubble of this.bubbles) {
        bubble.y = bubble.baseY + Math.sin(t * bubble.speed + bubble.x) * 14;
        bubble.alpha = 0.35 + Math.sin(t * 1.7 + bubble.x) * 0.18;
      }
    }

    updateButtons() {
      els.board.textContent = this.inBoat ? "النزول" : "ركوب القارب";
      els.sell.disabled = this.inBoat;
    }

    toggleBoat() {
      if (this.inBoat) {
        this.inBoat = false;
        this.player.setVisible(true);
        this.player.setPosition(this.boat.x + 34, this.boat.y + 28);
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        showToast("نزلت من القارب");
        return;
      }
      if (distance(this.player, this.boat) > 90) {
        showToast("اقترب من القارب أولاً");
        return;
      }
      this.inBoat = true;
      showToast("ركبت القارب");
    }

    activeZone() {
      if (!this.inBoat) return null;
      return zones.find((zone) => distance(this.boat, zone) <= zone.radius);
    }

    castNet() {
      if (this.isCasting) return;
      if (!this.inBoat) {
        showToast("اركب القارب أولاً للصيد");
        return;
      }
      const zone = this.activeZone();
      if (!zone) {
        showToast("اقترب من منطقة صيد");
        return;
      }
      if (inventoryCount() >= CAPACITY) {
        showToast("الحقيبة ممتلئة. بع الأسماك عند التاجر");
        return;
      }
      if (Date.now() - this.lastCast < CAST_COOLDOWN) {
        showToast("انتظر قليلاً قبل رمي الشبكة مرة أخرى");
        return;
      }

      this.isCasting = true;
      this.lastCast = Date.now();
      showToast(`تم رمي الشبكة في ${zone.name}...`);

      const marker = this.add.image(this.boat.x, this.boat.y, "bubbleA").setScale(2.8).setAlpha(0.85).setDepth(40);
      this.tweens.add({ targets: marker, scale: 5.4, alpha: 0, duration: CAST_TIME, ease: "Sine.easeOut" });

      this.time.delayedCall(CAST_TIME, () => {
        const fish = rollFish();
        state.inventory[fish.id] = (state.inventory[fish.id] || 0) + 1;
        state.xp += fish.xp;
        this.isCasting = false;
        updateHud();
        showToast(`اصطدت: ${fish.name} [${rarityArabic[fish.rarity]}]`);
      });
    }

    sellAll() {
      if (this.inBoat) {
        showToast("انزل من القارب واقترب من التاجر للبيع");
        return;
      }
      if (distance(this.player, merchant) > 120) {
        showToast("اقترب من التاجر للبيع");
        return;
      }
      let coins = 0;
      let count = 0;
      for (const fish of fishCatalog) {
        const amount = state.inventory[fish.id] || 0;
        coins += amount * fish.value;
        count += amount;
      }
      if (!count) {
        showToast("لا توجد أسماك للبيع");
        return;
      }
      state.inventory = {};
      state.coins += coins;
      updateHud();
      showToast(`بعت ${count} سمكة وحصلت على ${coins} عملة`);
    }
  }

  function textStyle(size) {
    return {
      fontFamily: "Tahoma, Arial",
      fontSize: `${size}px`,
      color: "#fff8df",
      stroke: "#5a3821",
      strokeThickness: 5,
      align: "center",
    };
  }

  function wireDomControls(scene) {
    els.cast.addEventListener("click", () => scene.castNet());
    els.board.addEventListener("click", () => scene.toggleBoat());
    els.sell.addEventListener("click", () => scene.sellAll());

    document.querySelectorAll(".mobile-pad button").forEach((button) => {
      const dir = button.dataset.dir;
      const set = (value) => {
        scene.mobile[dir] = value;
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        set(true);
      });
      button.addEventListener("pointerup", () => set(false));
      button.addEventListener("pointerleave", () => set(false));
      button.addEventListener("pointercancel", () => set(false));
    });
  }

  window.addEventListener("load", () => {
    if (!window.Phaser) {
      document.body.innerHTML = "<p style='font:20px Tahoma;padding:24px'>تعذر تحميل Phaser. شغل الصفحة مع اتصال إنترنت أو أضف Phaser محلياً.</p>";
      return;
    }

    new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#6bd4ff",
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: MainScene,
      pixelArt: false,
      roundPixels: false,
    });
  });
})();

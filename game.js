(() => {
  const SAVE_KEY = "hamoor-harbor-screen";
  const WORLD = { width: 5600, height: 3800 };
  const PLAYER_SPEED = 180;

  const state = loadState();
  const els = {
    coins: document.getElementById("coins"),
    gems: document.getElementById("gems"),
    menu: document.getElementById("menu-btn"),
    prompt: document.getElementById("prompt"),
    toast: document.getElementById("toast"),
    modal: document.getElementById("menu-modal"),
    modalTitle: document.getElementById("modal-title"),
    modalBody: document.getElementById("modal-body"),
    modalClose: document.getElementById("modal-close"),
  };

  let toastTimer;
  let audioStarted = false;

  const interactions = [
    {
      id: "fish-market",
      title: "سوق السمك",
      prompt: "اضغط E لدخول سوق السمك",
      body: "هنا يبيع الصيادون صيد اليوم. السوق مغلق للشراء والبيع في هذه المرحلة، لكن المكان جاهز كمنطقة افتتاحية.",
      x: 880,
      y: 2320,
      radius: 130,
    },
    {
      id: "boat-shop",
      title: "محل القوارب",
      prompt: "اضغط E لدخول محل القوارب",
      body: "قوارب خشبية وشباك بحرية معروضة للصيادين. المكان جاهز للزيارة والتجول داخل الميناء.",
      x: 2260,
      y: 2100,
      radius: 130,
    },
    {
      id: "warehouse",
      title: "المستودع",
      prompt: "اضغط E لتفقد المستودع",
      body: "صناديق وبراميل ومعدات بحرية. المستودع يعطي الميناء إحساس العمل والحركة.",
      x: 3620,
      y: 1940,
      radius: 140,
    },
    {
      id: "lighthouse",
      title: "المنارة",
      prompt: "اضغط E لتفقد المنارة",
      body: "منارة الميناء ترشد القوارب وقت الغروب. لا توجد مهام هنا الآن.",
      x: 4740,
      y: 940,
      radius: 150,
    },
  ];

  const npcLines = [
    { name: "سالم الصياد", line: "البحر هادئ اليوم. الميناء يستعد ليوم صيد طويل." },
    { name: "نورة البائعة", line: "سوق السمك يفتح قريبًا. الرائحة هنا تقول إن الصيد وفير." },
    { name: "ماجد الحارس", line: "انتبه قرب الأرصفة، القوارب تتحرك مع الموج." },
    { name: "راشد البحّار", line: "أسمع النوارس؟ هذا صوت الميناء وهو صاحي." },
  ];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (saved && typeof saved === "object") {
        return { coins: Number(saved.coins) || 0, gems: Number(saved.gems) || 0 };
      }
    } catch (_) {
      localStorage.removeItem(SAVE_KEY);
    }
    return { coins: 0, gems: 0 };
  }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function updateHud() {
    els.coins.textContent = state.coins;
    els.gems.textContent = state.gems;
    saveState();
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
  }

  function showModal(title, body) {
    els.modalTitle.textContent = title;
    els.modalBody.textContent = body;
    els.modal.classList.remove("hidden");
  }

  function hideModal() {
    els.modal.classList.add("hidden");
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class HarborScene extends Phaser.Scene {
    constructor() {
      super("harbor");
      this.keys = null;
      this.mobile = { up: false, down: false, left: false, right: false };
      this.npcs = [];
      this.boats = [];
      this.bubbles = [];
      this.waves = [];
      this.seagulls = [];
      this.currentInteraction = null;
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
      this.load.image("shopRoof", "./assets/tiles/shop_roof.png");
      this.load.image("wallWood", "./assets/tiles/wall_wood_a.png");
      this.load.image("door", "./assets/tiles/door.png");
      this.load.image("sign", "./assets/tiles/shop_sign.png");
      this.load.image("marketSign", "./assets/tiles/market_sign.png");
      this.load.image("stoneWall", "./assets/tiles/stone_wall.png");
      this.load.image("lighthouseWindow", "./assets/tiles/lighthouse_window.png");
      this.load.image("player", "./assets/characters/player.png");
      this.load.image("merchant", "./assets/characters/merchant.png");
      this.load.image("boat", "./assets/decor/boat_row.png");
      this.load.image("treeOrange", "./assets/decor/tree_orange.png");
      this.load.image("treePurple", "./assets/decor/tree_purple.png");
      this.load.image("rockA", "./assets/decor/rock_a.png");
      this.load.image("rockB", "./assets/decor/rock_b.png");
      this.load.image("barrel", "./assets/decor/barrel.png");
      this.load.image("crate", "./assets/decor/crate.png");
      this.load.image("netHook", "./assets/decor/net_hook.png");
      this.load.image("tool", "./assets/decor/harbor_tool.png");
      this.load.image("bubbleA", "./assets/decor/bubble_a.png");
      this.load.image("bubbleB", "./assets/decor/bubble_b.png");
      this.load.image("seagull", "./assets/decor/seagull.png");
    }

    create() {
      this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
      this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

      this.buildWater();
      this.buildHarborGround();
      this.buildDocks();
      this.buildBuildings();
      this.buildDecor();
      this.buildBoats();
      this.buildNpcs();
      this.buildPlayer();
      this.buildSeagulls();

      this.keys = this.input.keyboard.addKeys({
        up: "W,UP",
        down: "S,DOWN",
        left: "A,LEFT",
        right: "D,RIGHT",
        interact: "E",
      });
      this.keys.interact.on("down", () => this.interact());

      wireDomControls(this);
      updateHud();
      showToast("مرحبًا بك في ميناء هامور البحر");
    }

    tileArea(x1, y1, x2, y2, key, scale = 4, depth = 3, step = 64) {
      for (let x = x1; x <= x2; x += step) {
        for (let y = y1; y <= y2; y += step) {
          this.add.image(x, y, key).setScale(scale).setDepth(depth);
        }
      }
    }

    scatter(items) {
      for (const [x, y, key, scale = 3, depth = y] of items) {
        this.add.image(x, y, key).setScale(scale).setDepth(depth);
      }
    }

    buildWater() {
      this.water = this.add.tileSprite(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, "water")
        .setScale(4)
        .setDepth(0);

      for (let i = 0; i < 130; i++) {
        const bubble = this.add.image(160 + Math.random() * 5200, 90 + Math.random() * 2450, i % 2 ? "bubbleA" : "bubbleB")
          .setScale(0.9 + Math.random() * 0.7)
          .setAlpha(0.28)
          .setDepth(1);
        bubble.baseY = bubble.y;
        bubble.speed = 0.6 + Math.random() * 1.2;
        this.bubbles.push(bubble);
      }

      for (let i = 0; i < 84; i++) {
        const wave = this.add.image(120 + Math.random() * 5280, 80 + Math.random() * 2360, "bubbleA")
          .setScale(1.2 + Math.random() * 1.8, 0.35)
          .setAlpha(0.16)
          .setDepth(2);
        wave.baseX = wave.x;
        wave.phase = Math.random() * 10;
        this.waves.push(wave);
      }
    }

    buildHarborGround() {
      this.tileArea(160, 1780, 5280, 3540, "grass", 4, 3);
      this.tileArea(160, 1220, 5280, 1840, "sand", 4, 4);
      this.tileArea(160, 900, 920, 1150, "sand", 4, 4);
      this.tileArea(1180, 820, 1950, 1150, "sand", 4, 4);
      this.tileArea(2300, 760, 3160, 1150, "sand", 4, 4);
      this.tileArea(3380, 720, 4200, 1180, "sand", 4, 4);
      this.tileArea(4480, 760, 5200, 1220, "sand", 4, 4);

      const coast = [
        [220, 1100], [420, 1050], [640, 1080], [880, 1160], [1140, 1120], [1400, 1040],
        [1680, 1080], [1940, 1160], [2240, 1080], [2520, 1040], [2800, 1100], [3100, 1120],
        [3400, 1100], [3660, 1040], [3940, 1060], [4240, 1180], [4560, 1110], [4860, 1020],
        [5140, 1120],
      ];
      for (const [x, y] of coast) {
        this.add.image(x, y, "sand").setScale(4).setDepth(5);
        this.add.image(x + 44, y + 42, "grass").setScale(4).setDepth(4);
      }
    }

    buildDocks() {
      const dockRows = [
        { x1: 300, x2: 960, y1: 850, y2: 1030 },
        { x1: 520, x2: 720, y1: 560, y2: 840 },
        { x1: 1280, x2: 1940, y1: 780, y2: 980 },
        { x1: 1500, x2: 1700, y1: 500, y2: 760 },
        { x1: 2360, x2: 3040, y1: 740, y2: 960 },
        { x1: 2630, x2: 2840, y1: 470, y2: 730 },
        { x1: 3400, x2: 4100, y1: 850, y2: 1040 },
        { x1: 3720, x2: 3920, y1: 590, y2: 830 },
        { x1: 4520, x2: 5200, y1: 850, y2: 1040 },
        { x1: 4860, x2: 5060, y1: 590, y2: 830 },
      ];

      for (const row of dockRows) {
        for (let x = row.x1; x <= row.x2; x += 64) {
          for (let y = row.y1; y <= row.y2; y += 64) {
            this.add.image(x, y, "dock").setScale(4).setDepth(6);
          }
        }
      }

      for (const row of dockRows) {
        for (let x = row.x1; x <= row.x2; x += 128) {
          this.add.image(x, row.y1 - 34, "dockPostA").setScale(4).setDepth(7);
          this.add.image(x, row.y2 + 34, "dockPostB").setScale(4).setDepth(7);
        }
      }
    }

    buildBuildings() {
      this.buildBuilding(880, 2320, "سوق السمك", "marketSign", "roofA", "roofB");
      this.buildBuilding(2260, 2100, "محل القوارب", "sign", "shopRoof", "roofB");
      this.buildWarehouse(3620, 1940);
      this.buildLighthouse(4740, 940);

      const decorativeBuildings = [
        [520, 2120, "بيت الصيادين", "roofA", "roofB"],
        [620, 2880, "مقهى الميناء", "shopRoof", "roofB"],
        [1420, 2840, "مكتب الشحن", "roofA", "shopRoof"],
        [1840, 2520, "ورشة الحبال", "shopRoof", "roofA"],
        [2840, 2820, "مخزن الشباك", "roofB", "roofA"],
        [3180, 2300, "مركز الحراسة", "shopRoof", "roofB"],
        [4120, 2520, "بيت القبطان", "roofA", "roofB"],
        [4860, 2200, "دكان الحبال", "shopRoof", "roofA"],
        [4720, 3040, "استراحة البحارة", "roofB", "shopRoof"],
      ];
      for (const [x, y, label, leftRoof, rightRoof] of decorativeBuildings) {
        this.buildBuilding(x, y, label, "sign", leftRoof, rightRoof);
      }
    }

    buildBuilding(x, y, label, signKey, leftRoof, rightRoof) {
      this.add.image(x - 32, y - 48, leftRoof).setScale(4).setDepth(10);
      this.add.image(x + 32, y - 48, rightRoof).setScale(4).setDepth(10);
      this.add.image(x - 32, y + 16, "wallWood").setScale(4).setDepth(10);
      this.add.image(x + 32, y + 16, "door").setScale(4).setDepth(11);
      this.add.image(x, y + 78, signKey).setScale(3.4).setDepth(12);
      this.add.text(x, y - 106, label, textStyle(20)).setOrigin(0.5).setDepth(30);
    }

    buildWarehouse(x, y) {
      for (let ox = -64; ox <= 64; ox += 64) {
        this.add.image(x + ox, y - 36, "stoneWall").setScale(4).setDepth(10);
        this.add.image(x + ox, y + 28, "wallWood").setScale(4).setDepth(10);
      }
      this.add.image(x, y + 32, "door").setScale(4).setDepth(11);
      this.add.text(x, y - 104, "المستودع", textStyle(20)).setOrigin(0.5).setDepth(30);
    }

    buildLighthouse(x, y) {
      for (let i = 0; i < 4; i++) {
        this.add.image(x, y + i * 56, "stoneWall").setScale(3.6).setDepth(9 + i);
      }
      this.add.image(x, y + 56, "lighthouseWindow").setScale(3.6).setDepth(13);
      const light = this.add.image(x, y - 45, "bubbleA").setScale(3.2).setAlpha(0.45).setDepth(8);
      this.tweens.add({ targets: light, alpha: 0.12, scale: 4.2, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.add.text(x, y - 92, "المنارة", textStyle(20)).setOrigin(0.5).setDepth(30);
    }

    buildDecor() {
      const decor = [
        [360, 1980, "treeOrange", 4], [450, 3180, "treePurple", 4], [780, 3280, "treeOrange", 4],
        [1160, 2020, "treePurple", 4], [1510, 2460, "treeOrange", 4], [2390, 2600, "treePurple", 4],
        [3320, 3080, "treeOrange", 4], [3860, 2380, "treePurple", 4], [3440, 1280, "treeOrange", 4],
        [4280, 2920, "treePurple", 4], [5120, 2580, "treeOrange", 4], [5060, 1340, "treePurple", 4],
        [300, 1210, "rockA", 2.2], [810, 1120, "rockB", 2.2], [1260, 1010, "rockA", 2.2],
        [2040, 1120, "rockB", 2.2], [3180, 1040, "rockA", 2.2], [3860, 1180, "rockB", 2.2],
        [4320, 1280, "rockA", 2.2], [5220, 1220, "rockB", 2.2],
        [720, 2200, "barrel", 3.6], [780, 2200, "crate", 3.6], [1040, 2200, "crate", 3.8],
        [1110, 2220, "barrel", 3.6], [1840, 2020, "netHook", 3.2], [1920, 2020, "tool", 3.2],
        [2460, 2020, "crate", 3.4], [2540, 2025, "barrel", 3.3], [3280, 1860, "netHook", 3.2],
        [3380, 1860, "crate", 3.4], [3480, 1860, "barrel", 3.5], [3740, 1860, "crate", 3.4],
        [3860, 2080, "barrel", 3.5], [3980, 2080, "crate", 3.5], [4520, 2140, "tool", 3.2],
        [4560, 2800, "crate", 3.5], [4660, 2800, "barrel", 3.5], [4940, 2420, "netHook", 3.2],
        [5060, 2420, "crate", 3.4], [1220, 3100, "barrel", 3.5], [1300, 3100, "crate", 3.5],
        [2140, 2920, "tool", 3.2], [2220, 2920, "netHook", 3.2], [2920, 2460, "crate", 3.4],
        [550, 910, "barrel", 3.4], [610, 910, "crate", 3.4], [690, 910, "netHook", 3.2],
        [1450, 720, "crate", 3.4], [1530, 720, "barrel", 3.4], [2740, 690, "tool", 3.2],
        [2820, 690, "netHook", 3.2], [3600, 680, "crate", 3.4], [3710, 680, "barrel", 3.4],
      ];
      this.scatter(decor);
    }

    buildBoats() {
      const boatData = [
        [430, 650, -0.14, 2.9],
        [700, 640, 0.1, 3.1],
        [1030, 840, -0.22, 2.7],
        [1420, 560, 0.08, 2.9],
        [1710, 565, -0.1, 3.0],
        [2200, 820, 0.16, 2.8],
        [2520, 560, -0.08, 2.9],
        [2860, 560, 0.12, 3.2],
        [3500, 660, -0.16, 2.7],
        [3900, 660, 0.1, 2.9],
        [4540, 660, -0.08, 2.8],
        [4920, 650, 0.14, 3.1],
        [5260, 820, -0.18, 2.7],
      ];

      for (const [x, y, rotation, scale] of boatData) {
        const reflection = this.add.image(x, y + 18, "boat").setScale(scale, scale * 0.8).setRotation(rotation).setAlpha(0.18).setTint(0x236f91).setDepth(3);
        const boat = this.add.image(x, y, "boat").setScale(scale).setRotation(rotation).setDepth(8);
        boat.baseY = y;
        boat.phase = Math.random() * 6;
        reflection.baseY = y + 18;
        reflection.phase = boat.phase;
        this.boats.push({ boat, reflection });
      }
    }

    buildNpcs() {
      const paths = [
        [[520, 2140], [820, 2200], [940, 2360], [620, 2460]],
        [[1840, 2140], [2260, 2060], [2420, 2260], [2020, 2380]],
        [[3260, 1940], [3600, 1840], [3880, 2040], [3420, 2180]],
        [[4520, 1220], [4840, 1180], [5000, 1440], [4620, 1540]],
        [[680, 3060], [1160, 3000], [1380, 3220], [860, 3380]],
        [[2740, 2740], [3180, 2520], [3460, 2800], [3020, 3060]],
        [[4020, 2500], [4440, 2380], [4820, 2600], [4300, 2840]],
      ];

      paths.forEach((path, index) => {
        const npc = this.physics.add.image(path[0][0], path[0][1], "merchant").setScale(1.08).setDepth(40);
        npc.body.setSize(24, 28);
        const line = npcLines[index % npcLines.length];
        npc.nameArabic = line.name;
        npc.line = line.line;
        npc.path = path;
        npc.targetIndex = 1;
        this.add.text(npc.x, npc.y - 44, npc.nameArabic, textStyle(14)).setOrigin(0.5).setDepth(45).setData("follow", npc);
        this.npcs.push(npc);
      });
    }

    buildPlayer() {
      this.player = this.physics.add.image(760, 2480, "player").setScale(1.2).setDepth(50);
      this.player.body.setSize(30, 34);
      this.player.setCollideWorldBounds(true);
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      this.cameras.main.setZoom(1.08);
    }

    buildSeagulls() {
      for (let i = 0; i < 18; i++) {
        const gull = this.add.image(180 + Math.random() * 5100, 130 + Math.random() * 760, "seagull")
          .setScale(0.65)
          .setAlpha(0.82)
          .setDepth(60);
        gull.baseX = gull.x;
        gull.baseY = gull.y;
        gull.phase = Math.random() * 10;
        this.seagulls.push(gull);
      }
    }

    update(_, delta) {
      const dt = delta / 1000;
      this.movePlayer();
      this.moveNpcs(dt);
      this.animateHarbor();
      this.updatePrompt();
    }

    movePlayer() {
      const input = {
        up: this.keys.up.isDown || this.mobile.up,
        down: this.keys.down.isDown || this.mobile.down,
        left: this.keys.left.isDown || this.mobile.left,
        right: this.keys.right.isDown || this.mobile.right,
      };
      let vx = 0;
      let vy = 0;
      if (input.up) vy -= PLAYER_SPEED;
      if (input.down) vy += PLAYER_SPEED;
      if (input.left) vx -= PLAYER_SPEED;
      if (input.right) vx += PLAYER_SPEED;
      this.player.setVelocity(vx, vy);
      this.player.x = Phaser.Math.Clamp(this.player.x, 120, 5320);
      this.player.y = Phaser.Math.Clamp(this.player.y, 560, 3520);
    }

    moveNpcs() {
      for (const npc of this.npcs) {
        const target = npc.path[npc.targetIndex];
        const dx = target[0] - npc.x;
        const dy = target[1] - npc.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 8) {
          npc.targetIndex = (npc.targetIndex + 1) % npc.path.length;
          npc.setVelocity(0, 0);
        } else {
          npc.setVelocity((dx / dist) * 48, (dy / dist) * 48);
        }
      }

      for (const text of this.children.list) {
        const follow = text.getData && text.getData("follow");
        if (follow) {
          text.setPosition(follow.x, follow.y - 44);
        }
      }
    }

    animateHarbor() {
      const t = this.time.now / 1000;
      this.water.tilePositionX += 0.18;
      this.water.tilePositionY += 0.08;

      for (const pair of this.boats) {
        const bob = Math.sin(t * 1.5 + pair.boat.phase) * 5;
        pair.boat.y = pair.boat.baseY + bob;
        pair.boat.rotation += Math.sin(t + pair.boat.phase) * 0.0008;
        pair.reflection.y = pair.reflection.baseY + bob * 0.6;
      }

      for (const bubble of this.bubbles) {
        bubble.y = bubble.baseY + Math.sin(t * bubble.speed + bubble.x) * 12;
        bubble.alpha = 0.2 + Math.sin(t * 1.6 + bubble.x) * 0.12;
      }

      for (const wave of this.waves) {
        wave.x = wave.baseX + Math.sin(t * 0.8 + wave.phase) * 18;
        wave.alpha = 0.09 + Math.sin(t * 1.2 + wave.phase) * 0.05;
      }

      for (const gull of this.seagulls) {
        gull.x = gull.baseX + Math.sin(t * 0.55 + gull.phase) * 80;
        gull.y = gull.baseY + Math.cos(t * 0.8 + gull.phase) * 24;
        gull.rotation = Math.sin(t * 1.1 + gull.phase) * 0.18;
      }
    }

    updatePrompt() {
      const nearbyNpc = this.npcs.find((npc) => distance(this.player, npc) < 62);
      if (nearbyNpc) {
        this.currentInteraction = { type: "npc", npc: nearbyNpc };
        setPrompt(`اضغط E للتحدث مع ${nearbyNpc.nameArabic}`);
        return;
      }

      const area = interactions.find((item) => distance(this.player, item) < item.radius);
      if (area) {
        this.currentInteraction = { type: "area", area };
        setPrompt(area.prompt);
        return;
      }

      this.currentInteraction = null;
      setPrompt("");
    }

    interact() {
      startAmbientAudio();
      if (!this.currentInteraction) {
        showToast("تجوّل في الميناء واقترب من الشخصيات أو المباني");
        return;
      }
      if (this.currentInteraction.type === "npc") {
        const npc = this.currentInteraction.npc;
        showModal(npc.nameArabic, npc.line);
        return;
      }
      const area = this.currentInteraction.area;
      showModal(area.title, area.body);
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

  function setPrompt(text) {
    els.prompt.textContent = text;
    els.prompt.classList.toggle("show", Boolean(text));
  }

  function wireDomControls(scene) {
    els.menu.addEventListener("click", () => {
      startAmbientAudio();
      showModal("قائمة الميناء", "هذه شاشة الميناء فقط. تجوّل، تحدث مع الصيادين، وادخل سوق السمك أو محل القوارب.");
    });
    els.modalClose.addEventListener("click", hideModal);
    els.modal.addEventListener("click", (event) => {
      if (event.target === els.modal) hideModal();
    });

    document.querySelectorAll(".mobile-pad button").forEach((button) => {
      const dir = button.dataset.dir;
      const set = (value) => {
        scene.mobile[dir] = value;
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        startAmbientAudio();
        set(true);
      });
      button.addEventListener("pointerup", () => set(false));
      button.addEventListener("pointerleave", () => set(false));
      button.addEventListener("pointercancel", () => set(false));
    });

    window.addEventListener("pointerdown", startAmbientAudio, { once: true });
  }

  function startAmbientAudio() {
    if (audioStarted) return;
    audioStarted = true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.045;
    oceanGain.connect(ctx.destination);

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 420;
    noise.connect(lowpass);
    lowpass.connect(oceanGain);
    noise.start();

    const gull = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950 + Math.random() * 260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520 + Math.random() * 180, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
      setTimeout(gull, 4500 + Math.random() * 6500);
    };
    setTimeout(gull, 1200);

    const dockClank = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150 + Math.random() * 90, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
      setTimeout(dockClank, 2800 + Math.random() * 5000);
    };
    setTimeout(dockClank, 1800);
  }

  window.addEventListener("load", () => {
    updateHud();
    if (!window.Phaser) {
      document.body.innerHTML = "<p style='font:20px Tahoma;padding:24px'>تعذر تحميل محرك Phaser المحلي.</p>";
      return;
    }

    new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#58c8f4",
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: HarborScene,
      pixelArt: false,
      roundPixels: false,
    });
  });
})();

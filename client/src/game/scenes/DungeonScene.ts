import Phaser from 'phaser';
import { useChoreStore } from '../../store/choreStore.js';
import { ChoreItem } from '../../../../shared/types.js';
import { sound } from '../audio/soundSynth.js';

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  choreId: string;
  choreType: string;
  isVip?: boolean;
  label: Phaser.GameObjects.Text;
  vipLabel?: Phaser.GameObjects.Text;
  homeX: number;
  homeY: number;
  patrolRadius: number;
  aiTimer: number;
}

export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    Q: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    Z: Phaser.Input.Keyboard.Key;
  };
  private slashHitbox!: Phaser.Physics.Arcade.Sprite;
  private whirlwindSprite!: Phaser.GameObjects.Sprite;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private isSlashing = false;
  private isWhirlwinding = false;
  private lastFacingAngle = 0;

  // World map bounds (Zelda/Pokémon Open World: 1920 x 1280)
  private readonly MAP_WIDTH = 1920;
  private readonly MAP_HEIGHT = 1280;

  // Biome HUD Text
  private locationText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  create(): void {
    const W = this.MAP_WIDTH;
    const H = this.MAP_HEIGHT;

    // 1. World & Physics Bounds
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    // 2. Build Open World Terrain & Zones
    this.buildWorldTerrain(W, H);

    // 3. Static Obstacles Group (Buildings, Trees, Walls)
    this.obstaclesGroup = this.physics.add.staticGroup();
    this.buildWorldObstacles();

    // 4. Particle Emitters
    this.particles = this.add.particles(0, 0, 'particle-spark', {
      lifespan: 450,
      speed: { min: 90, max: 240 },
      scale: { start: 1.6, end: 0 },
      emitting: false,
    });

    this.dustParticles = this.add.particles(0, 0, 'particle-spark', {
      lifespan: 200,
      speed: { min: 10, max: 30 },
      scale: { start: 0.6, end: 0 },
      emitting: false,
    });

    // 5. Spawn Player at Central Crossroads (x: 960, y: 640)
    this.player = this.physics.add.sprite(960, 640, 'hero');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(20, 24);
    this.physics.add.collider(this.player, this.obstaclesGroup);

    // Smooth Zelda/Pokémon Camera Follow with deadzone
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.0);

    // 6. Slash Hitbox & Whirlwind Sprite
    this.slashHitbox = this.physics.add.sprite(0, 0, 'slash-arc');
    this.slashHitbox.setVisible(false);
    this.physics.add.existing(this.slashHitbox);
    if (this.slashHitbox.body) {
      this.slashHitbox.body.enable = false;
    }

    this.whirlwindSprite = this.add.sprite(0, 0, 'whirlwind-circle');
    this.whirlwindSprite.setVisible(false);

    // 7. Enemies Group
    this.enemiesGroup = this.physics.add.group();
    this.physics.add.collider(this.enemiesGroup, this.obstaclesGroup);
    this.physics.add.collider(this.player, this.enemiesGroup);

    // Sword Hit Detection
    this.physics.add.overlap(
      this.slashHitbox,
      this.enemiesGroup,
      (slash, enemy) => this.handleHit(slash, enemy as EnemySprite),
      undefined,
      this
    );

    // 8. Fixed Viewport Biome HUD Banner
    this.locationText = this.add
      .text(16, 480, '📍 Central Crossroads', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#facc15',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    // 9. Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        Z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      };
    }

    // Left-click ON an enemy sprite → open inspect popup (never instantly slay)
    // Left-click on open world → sword slash
    this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if (pointer.rightButtonDown()) return; // handled below
      const enemy = obj as EnemySprite;
      if (enemy.choreId) {
        useChoreStore.getState().inspectChore(enemy.choreId);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.performWhirlwind();
      } else {
        // Only slash if the click was NOT on an enemy (gameobjectdown fires first)
        const hitObjs = this.input.hitTestPointer(pointer);
        const clickedEnemy = hitObjs.some((o) => (o as EnemySprite).choreId);
        if (!clickedEnemy) {
          this.performSlash();
        }
      }
    });

    // 10. Store Subscription
    useChoreStore.subscribe((state) => {
      this.syncEnemiesWithStore(state.chores);
    });

    this.syncEnemiesWithStore(useChoreStore.getState().chores);
  }

  update(time: number): void {
    if (!this.player || !this.player.body) return;

    // Movement (WASD + Arrows)
    const speed = 210;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.lastFacingAngle = Math.atan2(vy, vx);

      // Footstep dust
      if (Phaser.Math.Between(0, 5) === 0) {
        this.dustParticles.emitParticleAt(this.player.x, this.player.y + 12, 1);
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    // Slash
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.performSlash();
    }

    // Whirlwind Purge
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.performWhirlwind();
    }

    // Undo Grace (Z)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      useChoreStore.getState().undoLastAction();
    }

    if (this.isWhirlwinding) {
      this.whirlwindSprite.setPosition(this.player.x, this.player.y);
      this.whirlwindSprite.rotation += 0.25;
    }

    // Update Current Location HUD
    this.updateLocationHUD();

    // Territorial Enemy AI (Only move in their dedicated sector, disengage if pulled away)
    this.updateTerritorialEnemyAI(time);
  }

  /**
   * Builds distinct overworld zones with cobblestone paths, trees, and plazas
   */
  private buildWorldTerrain(W: number, H: number): void {
    // Base Green Grass over the whole world
    this.add.tileSprite(W / 2, H / 2, W, H, 'tile-grass');

    // Northwest Sector: The Overgrown Inbox (Lush Grassland)
    // Already grass

    // Northeast Sector: The Syntax Sanctum (Dark Catacombs Floor)
    this.add.tileSprite(1480, 320, 780, 540, 'tile-catacomb');

    // South Sector: The Treasury Plaza (Warm Stone Vaults)
    this.add.tileSprite(960, 980, 1100, 480, 'tile-treasury');

    // Cobblestone Main Arterial Pathways connecting all 3 sectors
    // East-West highway
    this.add.tileSprite(W / 2, 640, W - 160, 64, 'tile-path');
    // North-South avenue
    this.add.tileSprite(960, H / 2, 64, H - 120, 'tile-path');

    // Central Town Square Plaza
    this.add.tileSprite(960, 640, 192, 192, 'tile-path');
    this.add.image(960, 640, 'prop-fountain');

    // Decorative ponds/water
    this.add.tileSprite(240, 560, 128, 80, 'tile-water');
    this.add.tileSprite(1680, 560, 128, 80, 'tile-water');
  }

  /**
   * Places buildings, perimeter trees, hedges, and signposts with physics collision
   */
  private buildWorldObstacles(): void {
    const W = this.MAP_WIDTH;
    const H = this.MAP_HEIGHT;

    // 1. World Perimeter Trees (Forest Border)
    for (let x = 24; x < W; x += 48) {
      this.obstaclesGroup.create(x, 24, 'prop-tree');
      this.obstaclesGroup.create(x, H - 24, 'prop-tree');
    }
    for (let y = 64; y < H - 64; y += 48) {
      this.obstaclesGroup.create(24, y, 'prop-tree');
      this.obstaclesGroup.create(W - 24, y, 'prop-tree');
    }

    // 2. Sector Buildings
    // Northwest: Mail Depot / Inbox Citadel
    const mailBldg = this.obstaclesGroup.create(440, 160, 'building-mail');
    mailBldg.setSize(76, 56);
    this.add.text(440, 100, 'THE INBOX DEPOT', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#fde047',
      backgroundColor: '#0f172a',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    // Northeast: Terminal Archive / Syntax Sanctum
    const termBldg = this.obstaclesGroup.create(1480, 160, 'building-terminal');
    termBldg.setSize(76, 56);
    this.add.text(1480, 100, 'SYNTAX ARCHIVE', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#a855f7',
      backgroundColor: '#0f172a',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    // South: Treasury Vault / Expense Market
    const bankBldg = this.obstaclesGroup.create(960, 840, 'building-bank');
    bankBldg.setSize(76, 56);
    this.add.text(960, 780, 'TREASURY VAULT', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#facc15',
      backgroundColor: '#0f172a',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    // 3. Directional Signposts at Central Crossroad
    this.obstaclesGroup.create(840, 600, 'prop-sign');
    this.add.text(840, 576, '⬅️ INBOX', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);

    this.obstaclesGroup.create(1080, 600, 'prop-sign');
    this.add.text(1080, 576, 'SYNTAX ➡️', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);

    this.obstaclesGroup.create(960, 750, 'prop-sign');
    this.add.text(960, 726, '⬇️ TREASURY', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);

    // 4. Hedges & Trees dividing sectors
    const hedgeCoords = [
      // Left sector hedges
      { x: 300, y: 320 }, { x: 580, y: 320 }, { x: 740, y: 240 }, { x: 740, y: 440 },
      // Right sector ruined stone walls
      { x: 1200, y: 260 }, { x: 1200, y: 400 }, { x: 1680, y: 260 }, { x: 1680, y: 400 },
      // South sector pillars
      { x: 680, y: 980 }, { x: 1240, y: 980 },
    ];
    hedgeCoords.forEach((c) => {
      this.obstaclesGroup.create(c.x, c.y, c.x > 1000 && c.y < 600 ? 'prop-wall' : 'prop-bush');
    });
  }

  /**
   * Territorial AI: Enemies never follow or chase the player!
   * - Far away: gentle idle pacing in a tight circle around home post.
   * - Player nearby ("sees player"): rounds in a wider, alerted circle around home post.
   */
  private updateTerritorialEnemyAI(time: number): void {
    this.enemiesGroup.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active || !enemy.body) return;

      const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      // Alert check: when player is within 160px, enemy notices and rounds in a wider circle
      const isAlert = distToPlayer < 160;
      const angularSpeed = isAlert ? 0.0028 : 0.0012;
      const orbitRadius = isAlert ? (enemy.isVip ? 28 : 55) : 18;
      const moveSpeed = isAlert ? (enemy.isVip ? 32 : 48) : 18;

      // Compute target point on the circular patrol path around home waypoint
      const angle = time * angularSpeed + enemy.homeX * 0.02;
      const targetX = enemy.homeX + Math.cos(angle) * orbitRadius;
      const targetY = enemy.homeY + Math.sin(angle) * orbitRadius;

      // Move toward orbit point (NEVER towards the player!)
      const distToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY);
      if (distToTarget > 6) {
        this.physics.moveTo(enemy, targetX, targetY, moveSpeed);
      } else {
        enemy.setVelocity(0, 0);
      }

      // Update nameplate position
      if (enemy.label && enemy.active) {
        enemy.label.setPosition(enemy.x, enemy.y - 24);
      }
      if (enemy.vipLabel && enemy.active) {
        enemy.vipLabel.setPosition(enemy.x, enemy.y - 38);
      }
    });
  }

  private updateLocationHUD(): void {
    const px = this.player.x;
    const py = this.player.y;

    let loc = '📍 Central Crossroads';
    if (px < 850 && py < 580) {
      loc = '📍 The Overgrown Inbox (Email Sector)';
    } else if (px > 1080 && py < 580) {
      loc = '📍 The Syntax Sanctum (Code Sector)';
    } else if (py > 720) {
      loc = '📍 The Treasury Vaults (Expense Sector)';
    }

    this.locationText.setText(loc);
  }

  private performSlash(): void {
    if (this.isSlashing) return;
    this.isSlashing = true;
    sound.playSlash();

    const offset = 28;
    const slashX = this.player.x + Math.cos(this.lastFacingAngle) * offset;
    const slashY = this.player.y + Math.sin(this.lastFacingAngle) * offset;

    this.slashHitbox.setPosition(slashX, slashY);
    this.slashHitbox.setRotation(this.lastFacingAngle);
    this.slashHitbox.setVisible(true);
    if (this.slashHitbox.body) {
      this.slashHitbox.body.enable = true;
    }

    this.tweens.add({
      targets: this.player,
      scaleX: 1.25,
      scaleY: 0.85,
      duration: 80,
      yoyo: true,
    });

    this.time.delayedCall(130, () => {
      this.slashHitbox.setVisible(false);
      if (this.slashHitbox.body) {
        this.slashHitbox.body.enable = false;
      }
      this.isSlashing = false;
    });
  }

  private performWhirlwind(): void {
    if (this.isWhirlwinding) return;
    this.isWhirlwinding = true;

    const reducedMotion = useChoreStore.getState().reducedMotion;
    if (!reducedMotion) {
      this.cameras.main.shake(250, 0.01);
    }

    this.whirlwindSprite.setPosition(this.player.x, this.player.y);
    this.whirlwindSprite.setScale(0.5);
    this.whirlwindSprite.setAlpha(1);
    this.whirlwindSprite.setVisible(true);

    this.tweens.add({
      targets: this.whirlwindSprite,
      scale: 2.2,
      alpha: 0,
      duration: 380,
      onComplete: () => {
        this.whirlwindSprite.setVisible(false);
        this.isWhirlwinding = false;
      },
    });

    this.particles.emitParticleAt(this.player.x, this.player.y, 30);
    useChoreStore.getState().slayAllBatchOptimistic();
  }

  private handleHit(_slash: unknown, enemy: EnemySprite): void {
    if (!enemy.active || !enemy.body) return;

    const choreId = enemy.choreId;
    const reducedMotion = useChoreStore.getState().reducedMotion;

    if (!reducedMotion) {
      this.cameras.main.shake(120, 0.007);
    }

    this.particles.emitParticleAt(enemy.x, enemy.y, 20);

    enemy.body.enable = false;
    if (enemy.label) enemy.label.destroy();
    if (enemy.vipLabel) enemy.vipLabel.destroy();

    this.tweens.add({
      targets: enemy,
      scaleX: 1.5,
      scaleY: 0.1,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        enemy.destroy();
      },
    });

    useChoreStore.getState().initiateSlay(choreId);
  }

  /**
   * Spawns enemies strictly into their dedicated sectors:
   * - Email & Boss in a Suit -> The Overgrown Inbox (NW)
   * - Lint / Skeletons -> The Syntax Sanctum (NE)
   * - Expenses / Trolls -> The Treasury Vault (South)
   */
  private syncEnemiesWithStore(chores: ChoreItem[]): void {
    const existingIds = new Set(
      this.enemiesGroup.getChildren().map((c) => (c as EnemySprite).choreId)
    );

    // Clean up dead/completed chores
    this.enemiesGroup.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      const chore = chores.find((c) => c.id === enemy.choreId);
      if (!chore || chore.status === 'SLATED_FOR_DEATH' || chore.status === 'COMPLETED' || chore.status === 'PENDING_UNDO') {
        if (enemy.label) enemy.label.destroy();
        if (enemy.vipLabel) enemy.vipLabel.destroy();
        enemy.destroy();
      }
    });

    // Sector Spawn Anchor Points
    const emailAnchors = [
      { x: 340, y: 260 },
      { x: 520, y: 240 },
      { x: 380, y: 400 },
      { x: 560, y: 380 },
    ];
    const lintAnchors = [
      { x: 1360, y: 260 },
      { x: 1560, y: 240 },
      { x: 1400, y: 400 },
      { x: 1600, y: 380 },
    ];
    const expenseAnchors = [
      { x: 800, y: 980 },
      { x: 1120, y: 980 },
      { x: 860, y: 1100 },
      { x: 1060, y: 1100 },
    ];

    let emailIdx = 0;
    let lintIdx = 0;
    let expIdx = 0;

    chores.forEach((chore) => {
      if (existingIds.has(chore.id) || chore.status !== 'ACTIVE') return;

      let textureKey = 'enemy-goblin';
      let spawnPoint = { x: 500, y: 300 };

      if (chore.isVip || chore.enemyType === 'BOSS_EXEC') {
        // The Boss: Stands directly in front of the Inbox Depot building
        textureKey = 'enemy-boss-suit';
        spawnPoint = { x: 440, y: 260 };
      } else if (chore.type === 'EMAIL_TRASH' || chore.type === 'EMAIL_ARCHIVE') {
        textureKey = 'enemy-goblin';
        spawnPoint = emailAnchors[emailIdx % emailAnchors.length];
        emailIdx++;
      } else if (chore.type === 'LINT_FIX') {
        textureKey = 'enemy-skeleton';
        spawnPoint = lintAnchors[lintIdx % lintAnchors.length];
        lintIdx++;
      } else if (chore.type === 'EXPENSE_CATEGORIZE') {
        textureKey = 'enemy-troll';
        spawnPoint = expenseAnchors[expIdx % expenseAnchors.length];
        expIdx++;
      }

      const enemy = this.enemiesGroup.create(spawnPoint.x, spawnPoint.y, textureKey) as EnemySprite;
      enemy.choreId = chore.id;
      enemy.choreType = chore.type;
      enemy.isVip = chore.isVip;
      enemy.homeX = spawnPoint.x;
      enemy.homeY = spawnPoint.y;
      enemy.patrolRadius = 50;
      enemy.aiTimer = 0;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(0.2);
      enemy.setInteractive({ useHandCursor: true }); // enables gameobjectdown for inspect

      // Nameplate
      const truncatedTitle = chore.title.length > 20 ? chore.title.slice(0, 18) + '..' : chore.title;
      enemy.label = this.add
        .text(spawnPoint.x, spawnPoint.y - 24, truncatedTitle, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: chore.isVip ? '#facc15' : '#ffffff',
          backgroundColor: '#090d16',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5);

      if (chore.isVip) {
        enemy.vipLabel = this.add
          .text(spawnPoint.x, spawnPoint.y - 40, '👑 THE BOSS [VIP WARD]', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#000000',
            backgroundColor: '#facc15',
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5);
      }
    });
  }
}

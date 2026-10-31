import Phaser from 'phaser';
import { useChoreStore } from '../../store/choreStore.js';
import { ChoreItem } from '../../../../shared/types.js';
import { sound } from '../audio/soundSynth.js';

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  choreId: string;
  choreType: string;
  label: Phaser.GameObjects.Text;
  initialX: number;
  initialY: number;
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
  private fireParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private isSlashing = false;
  private isWhirlwinding = false;
  private lastFacingAngle = 0;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Tilemap floor grid
    this.add.tileSprite(width / 2, height / 2, width, height, 'dungeon-tile');

    // 2. Perimeter Stone Walls
    this.walls = this.physics.add.staticGroup();
    const tileSize = 32;
    for (let x = 0; x < width; x += tileSize) {
      this.walls.create(x + 16, 16, 'dungeon-wall');
      this.walls.create(x + 16, height - 16, 'dungeon-wall');
    }
    for (let y = tileSize; y < height - tileSize; y += tileSize) {
      this.walls.create(16, y + 16, 'dungeon-wall');
      this.walls.create(width - 16, y + 16, 'dungeon-wall');
    }

    // 3. Torches with ambient flicker in room corners
    const torchPositions = [
      { x: 48, y: 48 },
      { x: width - 48, y: 48 },
      { x: 48, y: height - 48 },
      { x: width - 48, y: height - 48 },
    ];
    torchPositions.forEach((pos) => {
      this.add.image(pos.x, pos.y, 'torch');
    });

    // 4. Spark Particle Emitter for hits
    this.particles = this.add.particles(0, 0, 'particle-spark', {
      lifespan: 450,
      speed: { min: 90, max: 240 },
      scale: { start: 1.6, end: 0 },
      emitting: false,
    });

    // 5. Fire Particles for torches
    this.fireParticles = this.add.particles(0, 0, 'particle-spark', {
      lifespan: 300,
      speed: { min: 10, max: 40 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      frequency: 120,
    });
    torchPositions.forEach((p) => {
      this.fireParticles.emitParticleAt(p.x, p.y - 6);
    });

    // 6. Create Player Sprite
    this.player = this.physics.add.sprite(width / 2, height / 2, 'hero');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(20, 24);
    this.physics.add.collider(this.player, this.walls);

    // 7. Create Slash & Whirlwind Hitboxes
    this.slashHitbox = this.physics.add.sprite(0, 0, 'slash-arc');
    this.slashHitbox.setVisible(false);
    this.physics.add.existing(this.slashHitbox);
    if (this.slashHitbox.body) {
      this.slashHitbox.body.enable = false;
    }

    this.whirlwindSprite = this.add.sprite(0, 0, 'whirlwind-circle');
    this.whirlwindSprite.setVisible(false);

    // 8. Enemies Group with Wall Collisions
    this.enemiesGroup = this.physics.add.group();
    this.physics.add.collider(this.enemiesGroup, this.walls);
    this.physics.add.collider(this.player, this.enemiesGroup);

    // 9. Overlap collision: Sword hits enemy
    this.physics.add.overlap(
      this.slashHitbox,
      this.enemiesGroup,
      (slash, enemy) => this.handleHit(slash, enemy as EnemySprite),
      undefined,
      this
    );

    // 10. Controls setup
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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.performWhirlwind();
      } else {
        this.performSlash();
      }
    });

    // 11. Store subscription
    useChoreStore.subscribe((state) => {
      this.syncEnemiesWithStore(state.chores);
    });

    this.syncEnemiesWithStore(useChoreStore.getState().chores);
  }

  update(time: number): void {
    if (!this.player || !this.player.body) return;

    // Movement Loop
    const speed = 200;
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
    } else {
      this.player.setVelocity(0, 0);
    }

    // Slash trigger
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.performSlash();
    }

    // Whirlwind Super trigger (Q or E)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.performWhirlwind();
    }

    // Safety Undo trigger (Z key)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      useChoreStore.getState().undoLastAction();
    }

    // Keep whirlwind attached to player if active
    if (this.isWhirlwinding) {
      this.whirlwindSprite.setPosition(this.player.x, this.player.y);
      this.whirlwindSprite.rotation += 0.25;
    }

    // Enemy AI Behaviors
    this.enemiesGroup.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active || !enemy.body) return;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (enemy.choreType === 'EMAIL_TRASH') {
        // Spam Slime: Aggro hops toward player if close
        if (dist < 180) {
          this.physics.moveToObject(enemy, this.player, 45);
        } else {
          // Gentle drift around initial spawn point
          const driftAngle = time * 0.002 + enemy.initialX;
          enemy.setVelocity(Math.cos(driftAngle) * 20, Math.sin(driftAngle) * 20);
        }
      } else if (enemy.choreType === 'LINT_BANSHEE') {
        // Lint Banshee: Phasing glide
        const floatY = Math.sin(time * 0.004 + enemy.initialX) * 35;
        enemy.setVelocityY(floatY);
        if (dist < 220) {
          enemy.setVelocityX(this.player.x > enemy.x ? 30 : -30);
        }
      } else if (enemy.choreType === 'EXPENSE_CATEGORIZE') {
        // Receipt Mimic: Stays still, then charges when close
        if (dist < 130) {
          this.physics.moveToObject(enemy, this.player, 80);
        } else {
          enemy.setVelocity(0, 0);
        }
      }

      // Update floating label position
      if (enemy.label && enemy.active) {
        enemy.label.setPosition(enemy.x, enemy.y - 24);
      }
    });
  }

  private performSlash(): void {
    if (this.isSlashing) return;
    this.isSlashing = true;

    // Synthesize procedural retro slash audio
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

    // Hero lunge animation
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
      this.cameras.main.shake(300, 0.012);
    }

    this.whirlwindSprite.setPosition(this.player.x, this.player.y);
    this.whirlwindSprite.setScale(0.5);
    this.whirlwindSprite.setAlpha(1);
    this.whirlwindSprite.setVisible(true);

    this.tweens.add({
      targets: this.whirlwindSprite,
      scale: 2.2,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.whirlwindSprite.setVisible(false);
        this.isWhirlwinding = false;
      },
    });

    // Particle burst outward
    this.particles.emitParticleAt(this.player.x, this.player.y, 35);

    // Trigger Super Whirlwind in store
    useChoreStore.getState().slayAllBatchOptimistic();
  }

  private handleHit(_slash: unknown, enemy: EnemySprite): void {
    if (!enemy.active || !enemy.body) return;

    const choreId = enemy.choreId;
    const reducedMotion = useChoreStore.getState().reducedMotion;

    if (!reducedMotion) {
      this.cameras.main.shake(130, 0.008);
    }

    this.particles.emitParticleAt(enemy.x, enemy.y, 20);

    enemy.body.enable = false;
    if (enemy.label) {
      enemy.label.destroy();
    }

    this.tweens.add({
      targets: enemy,
      scaleX: 1.6,
      scaleY: 0.1,
      alpha: 0,
      duration: 160,
      onComplete: () => {
        enemy.destroy();
      },
    });

    useChoreStore.getState().initiateSlay(choreId);
  }

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
        enemy.destroy();
      }
    });

    // Spawn new chores
    chores.forEach((chore, index) => {
      if (existingIds.has(chore.id) || chore.status !== 'ACTIVE') return;

      const textureKey =
        chore.enemyType === 'SPAM_SLIME'
          ? 'enemy-slime'
          : chore.enemyType === 'LINT_BANSHEE'
          ? 'enemy-banshee'
          : 'enemy-mimic';

      const angle = (index / Math.max(1, chores.length)) * Math.PI * 2;
      const radius = 135 + (index % 3) * 35;
      const x = this.scale.width / 2 + Math.cos(angle) * radius;
      const y = this.scale.height / 2 + Math.sin(angle) * radius;

      const enemy = this.enemiesGroup.create(x, y, textureKey) as EnemySprite;
      enemy.choreId = chore.id;
      enemy.choreType = chore.type;
      enemy.initialX = x;
      enemy.initialY = y;
      enemy.aiTimer = 0;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(0.4);

      if (chore.isVip) {
        enemy.setTint(0xfacc15); // Golden shield tint
      }

      const truncatedTitle = chore.title.length > 20 ? chore.title.slice(0, 18) + '..' : chore.title;
      enemy.label = this.add
        .text(x, y - 24, truncatedTitle, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#090d16',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5);
    });
  }
}

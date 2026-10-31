import Phaser from 'phaser';

/**
 * BootScene: Procedurally generates rich Zelda/Pokémon-style retro pixel art
 * Overworld terrain, buildings, foliage, and character sprites (Goblins, Skeletons, Trolls, Boss in a Suit)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // 1. Terrain & Pathways
    this.createGrassTile();
    this.createCobblestoneTile();
    this.createCatacombFloor();
    this.createTreasuryFloor();
    this.createWaterTile();

    // 2. Obstacles & Environment Props
    this.createTreeProp();
    this.createBushProp();
    this.createWallProp();
    this.createSignpostProp();
    this.createFountainProp();

    // 3. Sector Buildings
    this.createMailOfficeBuilding();
    this.createTerminalArchiveBuilding();
    this.createBankVaultBuilding();

    // 4. Combatants & Characters
    this.createHeroSprite();
    this.createGoblinSprite();
    this.createSkeletonSprite();
    this.createTrollSprite();
    this.createBossInSuitSprite();

    // 5. Combat FX
    this.createSlashTexture();
    this.createWhirlwindTexture();
    this.createParticleTexture();

    this.scene.start('DungeonScene');
  }

  // --- Terrain Tiles ---

  private createGrassTile(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x2d6a4f); // Rich Zelda Overworld Green
    gfx.fillRect(0, 0, 32, 32);
    // Grass blade highlights
    gfx.fillStyle(0x40916c);
    gfx.fillRect(4, 8, 2, 4);
    gfx.fillRect(6, 6, 2, 2);
    gfx.fillRect(18, 20, 2, 4);
    gfx.fillRect(20, 18, 2, 2);
    gfx.fillRect(26, 4, 2, 3);
    gfx.fillStyle(0x1b4332);
    gfx.fillRect(10, 24, 3, 2);
    gfx.generateTexture('tile-grass', 32, 32);
    gfx.destroy();
  }

  private createCobblestoneTile(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x64748b);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, 0x475569);
    // Cobblestones pattern
    gfx.strokeRect(1, 1, 14, 14);
    gfx.strokeRect(17, 1, 14, 14);
    gfx.strokeRect(1, 17, 14, 14);
    gfx.strokeRect(17, 17, 14, 14);
    gfx.fillStyle(0x94a3b8);
    gfx.fillRect(3, 3, 3, 3);
    gfx.fillRect(19, 19, 3, 3);
    gfx.generateTexture('tile-path', 32, 32);
    gfx.destroy();
  }

  private createCatacombFloor(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x18181b); // Dark slate
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, 0x27272a);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.fillStyle(0x3f3f46);
    gfx.fillRect(4, 4, 4, 2);
    gfx.fillRect(20, 18, 5, 2);
    gfx.generateTexture('tile-catacomb', 32, 32);
    gfx.destroy();
  }

  private createTreasuryFloor(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x292524); // Warm stone
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, 0x44403c);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.fillStyle(0x78716c);
    gfx.fillRect(8, 8, 3, 3);
    gfx.fillRect(22, 14, 3, 3);
    gfx.generateTexture('tile-treasury', 32, 32);
    gfx.destroy();
  }

  private createWaterTile(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x0284c7);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x38bdf8);
    gfx.fillRect(4, 8, 12, 2);
    gfx.fillRect(16, 20, 10, 2);
    gfx.generateTexture('tile-water', 32, 32);
    gfx.destroy();
  }

  // --- Environmental Props ---

  private createTreeProp(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Trunk
    gfx.fillStyle(0x78350f);
    gfx.fillRect(18, 32, 12, 16);
    // Leafy canopy (3 overlapping circles)
    gfx.fillStyle(0x15803d);
    gfx.fillCircle(24, 20, 18);
    gfx.fillStyle(0x16a34a);
    gfx.fillCircle(18, 16, 12);
    gfx.fillCircle(30, 16, 12);
    // Highlights
    gfx.fillStyle(0x4ade80);
    gfx.fillCircle(20, 12, 5);
    gfx.fillCircle(28, 12, 4);

    gfx.generateTexture('prop-tree', 48, 48);
    gfx.destroy();
  }

  private createBushProp(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x166534);
    gfx.fillCircle(16, 16, 13);
    gfx.fillStyle(0x22c55e);
    gfx.fillCircle(14, 13, 8);
    gfx.fillCircle(20, 15, 6);
    gfx.generateTexture('prop-bush', 32, 32);
    gfx.destroy();
  }

  private createWallProp(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x334155);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(2, 0x1e293b);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.fillStyle(0x475569);
    gfx.fillRect(4, 4, 10, 8);
    gfx.fillRect(18, 4, 10, 8);
    gfx.fillRect(10, 16, 12, 10);
    gfx.generateTexture('prop-wall', 32, 32);
    gfx.destroy();
  }

  private createSignpostProp(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Post
    gfx.fillStyle(0x78350f);
    gfx.fillRect(14, 16, 4, 16);
    // Board
    gfx.fillStyle(0xb45309);
    gfx.fillRect(4, 4, 24, 14);
    gfx.lineStyle(1, 0x451a03);
    gfx.strokeRect(4, 4, 24, 14);
    // Text lines
    gfx.fillStyle(0xfef08a);
    gfx.fillRect(7, 8, 18, 2);
    gfx.fillRect(7, 12, 12, 2);
    gfx.generateTexture('prop-sign', 32, 32);
    gfx.destroy();
  }

  private createFountainProp(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Stone basin
    gfx.fillStyle(0x64748b);
    gfx.fillCircle(24, 24, 22);
    gfx.fillStyle(0x0284c7);
    gfx.fillCircle(24, 24, 17);
    // Water jet center
    gfx.fillStyle(0x38bdf8);
    gfx.fillCircle(24, 24, 6);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(24, 24, 3);
    gfx.generateTexture('prop-fountain', 48, 48);
    gfx.destroy();
  }

  // --- Sector Buildings ---

  private createMailOfficeBuilding(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Roof (Red gable)
    gfx.fillStyle(0xb91c1c);
    gfx.beginPath();
    gfx.moveTo(40, 2);
    gfx.lineTo(82, 24);
    gfx.lineTo(-2, 24);
    gfx.closePath();
    gfx.fill();
    // Body (Stone & wood)
    gfx.fillStyle(0xf1f5f9);
    gfx.fillRect(6, 24, 68, 44);
    gfx.lineStyle(2, 0x94a3b8);
    gfx.strokeRect(6, 24, 68, 44);
    // Wooden Door
    gfx.fillStyle(0x78350f);
    gfx.fillRect(32, 44, 16, 24);
    // Mail Envelope Emblem
    gfx.fillStyle(0xfacc15);
    gfx.fillRect(34, 28, 12, 8);
    gfx.lineStyle(1, 0x000000);
    gfx.strokeRect(34, 28, 12, 8);

    gfx.generateTexture('building-mail', 80, 68);
    gfx.destroy();
  }

  private createTerminalArchiveBuilding(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Dark cybernetic tower
    gfx.fillStyle(0x09090b);
    gfx.fillRect(4, 4, 72, 64);
    gfx.lineStyle(2, 0x6366f1);
    gfx.strokeRect(4, 4, 72, 64);
    // Glowing server lights
    gfx.fillStyle(0x22c55e);
    gfx.fillRect(12, 14, 4, 4);
    gfx.fillRect(12, 24, 4, 4);
    gfx.fillRect(12, 34, 4, 4);
    gfx.fillStyle(0xef4444);
    gfx.fillRect(20, 14, 4, 4);
    // Central glowing screen
    gfx.fillStyle(0x312e81);
    gfx.fillRect(32, 16, 36, 24);
    gfx.fillStyle(0xa5b4fc);
    gfx.fillRect(36, 20, 28, 4);
    gfx.fillRect(36, 28, 18, 4);

    gfx.generateTexture('building-terminal', 80, 68);
    gfx.destroy();
  }

  private createBankVaultBuilding(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Classical Vault / Treasury (Greystone + Gold)
    gfx.fillStyle(0x44403c);
    gfx.fillRect(4, 14, 72, 54);
    // Pediment top
    gfx.fillStyle(0x78716c);
    gfx.beginPath();
    gfx.moveTo(40, 2);
    gfx.lineTo(78, 14);
    gfx.lineTo(2, 14);
    gfx.closePath();
    gfx.fill();
    // Gold Columns
    gfx.fillStyle(0xfacc15);
    gfx.fillRect(10, 14, 6, 54);
    gfx.fillRect(28, 14, 6, 54);
    gfx.fillRect(46, 14, 6, 54);
    gfx.fillRect(64, 14, 6, 54);
    // Vault Door
    gfx.fillStyle(0x0f172a);
    gfx.fillCircle(40, 44, 12);
    gfx.lineStyle(2, 0xfacc15);
    gfx.strokeCircle(40, 44, 12);

    gfx.generateTexture('building-bank', 80, 68);
    gfx.destroy();
  }

  // --- Characters & Real Monsters ---

  private createHeroSprite(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Body (Blue Tunic)
    gfx.fillStyle(0x2563eb);
    gfx.fillCircle(16, 18, 9);
    // Golden Belt
    gfx.fillStyle(0xf59e0b);
    gfx.fillRect(11, 18, 10, 3);
    // Blonde Hair & Face
    gfx.fillStyle(0xfde047);
    gfx.fillCircle(16, 10, 7);
    gfx.fillStyle(0xfce7f3);
    gfx.fillCircle(16, 12, 5);
    // Eyes
    gfx.fillStyle(0x0f172a);
    gfx.fillRect(14, 11, 2, 2);
    gfx.fillRect(18, 11, 2, 2);
    // Steel Shield
    gfx.fillStyle(0x94a3b8);
    gfx.fillRect(5, 14, 4, 10);
    gfx.lineStyle(1, 0xf59e0b);
    gfx.strokeRect(5, 14, 4, 10);

    gfx.generateTexture('hero', 32, 32);
    gfx.destroy();
  }

  /**
   * 1. SPAM GOBLIN (Email Sector Monster)
   * Sharp ears, jagged dagger, stolen mail satchel
   */
  private createGoblinSprite(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Green goblin skin
    gfx.fillStyle(0x15803d);
    gfx.fillCircle(16, 18, 10);
    // Pointy Ears
    gfx.fillStyle(0x16a34a);
    gfx.fillTriangle(6, 12, 10, 8, 10, 16);
    gfx.fillTriangle(26, 12, 22, 8, 22, 16);
    // Ragged leather tunic
    gfx.fillStyle(0x78350f);
    gfx.fillRect(10, 17, 12, 10);
    // Red glowing eyes
    gfx.fillStyle(0xef4444);
    gfx.fillRect(12, 12, 3, 2);
    gfx.fillRect(17, 12, 3, 2);
    // Mail envelope clamped in teeth
    gfx.fillStyle(0xffffff);
    gfx.fillRect(13, 18, 6, 4);

    gfx.generateTexture('enemy-goblin', 32, 32);
    gfx.destroy();
  }

  /**
   * 2. SYNTAX SKELETON (Lint & Code Sector Monster)
   * Bony skull, ribcage, horned helm, holding error branch
   */
  private createSkeletonSprite(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Skull & Horned Helm
    gfx.fillStyle(0x475569);
    gfx.fillRect(8, 5, 16, 6);
    gfx.fillStyle(0xf1f5f9); // Bone white
    gfx.fillCircle(16, 12, 7);
    // Dark Eye Sockets with glowing purple dots
    gfx.fillStyle(0x0f172a);
    gfx.fillRect(12, 10, 3, 3);
    gfx.fillRect(17, 10, 3, 3);
    gfx.fillStyle(0xa855f7);
    gfx.fillRect(13, 11, 1, 1);
    gfx.fillRect(18, 11, 1, 1);
    // Bony Ribcage
    gfx.fillStyle(0xe2e8f0);
    gfx.fillRect(12, 19, 8, 2);
    gfx.fillRect(11, 22, 10, 2);
    gfx.fillRect(13, 25, 6, 2);
    // Staff with red syntax bracket
    gfx.fillStyle(0xa855f7);
    gfx.fillRect(25, 8, 2, 18);
    gfx.fillRect(23, 6, 6, 2);

    gfx.generateTexture('enemy-skeleton', 32, 32);
    gfx.destroy();
  }

  /**
   * 3. TAX TROLL / COIN OGRE (Expense Sector Monster)
   * Heavy muscular troll with horned club and gold coin pouch
   */
  private createTrollSprite(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Bulky Tan/Stone Troll Body
    gfx.fillStyle(0xa8a29e);
    gfx.fillCircle(16, 18, 12);
    // Horns
    gfx.fillStyle(0x78716c);
    gfx.fillTriangle(9, 6, 13, 10, 7, 12);
    gfx.fillTriangle(23, 6, 19, 10, 25, 12);
    // Mean Scowl
    gfx.fillStyle(0x44403c);
    gfx.fillRect(11, 13, 3, 3);
    gfx.fillRect(18, 13, 3, 3);
    // Tusks
    gfx.fillStyle(0xffffff);
    gfx.fillRect(12, 18, 2, 3);
    gfx.fillRect(18, 18, 2, 3);
    // Heavy Spiked Club
    gfx.fillStyle(0x78350f);
    gfx.fillRect(25, 10, 4, 18);
    gfx.fillStyle(0xef4444);
    gfx.fillCircle(27, 8, 4);

    gfx.generateTexture('enemy-troll', 32, 32);
    gfx.destroy();
  }

  /**
   * 4. THE BOSS / CORPORATE EXECUTIVE (VIP Mail Monster)
   * A man in a sharp business suit, white shirt, red power tie,
   * slick hair, dark sunglasses, and holding a leather briefcase!
   */
  private createBossInSuitSprite(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    // Golden VIP Aura Background
    gfx.fillStyle(0xfacc15, 0.35);
    gfx.fillCircle(16, 16, 15);
    gfx.lineStyle(2, 0xfacc15);
    gfx.strokeCircle(16, 16, 15);

    // Charcoal Business Suit
    gfx.fillStyle(0x18181b);
    gfx.fillRect(9, 16, 14, 12);
    // White Collared Shirt V-Neck
    gfx.fillStyle(0xffffff);
    gfx.beginPath();
    gfx.moveTo(13, 16);
    gfx.lineTo(19, 16);
    gfx.lineTo(16, 21);
    gfx.closePath();
    gfx.fill();
    // Red Power Tie
    gfx.fillStyle(0xdc2626);
    gfx.fillRect(15, 18, 2, 8);

    // Head & Slick Black Hair
    gfx.fillStyle(0x09090b); // Black hair
    gfx.fillRect(11, 6, 10, 5);
    gfx.fillStyle(0xfcd34d); // Skin
    gfx.fillCircle(16, 12, 5);

    // Cool Sunglasses
    gfx.fillStyle(0x000000);
    gfx.fillRect(12, 11, 8, 3);

    // Leather Executive Briefcase
    gfx.fillStyle(0x78350f);
    gfx.fillRect(3, 20, 7, 9);
    gfx.fillStyle(0xfacc15); // Brass lock
    gfx.fillRect(5, 23, 3, 2);

    gfx.generateTexture('enemy-boss-suit', 32, 32);
    gfx.destroy();
  }

  // --- Combat FX ---

  private createSlashTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.lineStyle(3, 0x38bdf8, 0.95);
    gfx.beginPath();
    gfx.arc(16, 16, 14, -Phaser.Math.DegToRad(60), Phaser.Math.DegToRad(60), false);
    gfx.strokePath();
    gfx.generateTexture('slash-arc', 32, 32);
    gfx.destroy();
  }

  private createWhirlwindTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.lineStyle(4, 0xfacc15, 0.85);
    gfx.strokeCircle(48, 48, 44);
    gfx.lineStyle(3, 0x38bdf8, 0.85);
    gfx.strokeCircle(48, 48, 30);
    gfx.generateTexture('whirlwind-circle', 96, 96);
    gfx.destroy();
  }

  private createParticleTexture(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xfde047);
    gfx.fillRect(0, 0, 4, 4);
    gfx.generateTexture('particle-spark', 4, 4);
    gfx.destroy();
  }
}

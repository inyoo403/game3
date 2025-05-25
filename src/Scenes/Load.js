export default class Load extends Phaser.Scene {
    constructor() { super('loadScene'); }

    preload() {
        this.load.setPath('./assets/');

        // --- 이미지 / 아틀라스 -------------------------
        this.load.image('monochrome_packed',            'monochrome_packed.png');
        this.load.image('monochrome-transparent_packed', 'monochrome-transparent_packed.png');
        this.load.image('background',                    'background.png');
        this.load.image('Spine1',                        'Spine1.png');
        this.load.image('Spine2',                        'Spine2.png');
        this.load.multiatlas('kenny-particles',          'kenny-particles.json');
        this.load.atlas     ('player',                   'playerPacked.png', 'playerPacked.json');


        // --- 타일맵 -----------------------------------
        this.load.tilemapTiledJSON('platformer', 'platformer.tmj');

        // --- 사운드 -----------------------------------
        this.load.audio('hit',      'error_006.ogg');
        this.load.audio('brick',    'brick.wav');
        this.load.audio('jump',     'drop_004.ogg');
        this.load.audio('coin',     'coin.ogg');
        this.load.audio('lose',     'lose.ogg');
    }

    create() {
        const a = this.anims;

        if (!a.exists('walk')) {
            a.create({
                key      : 'walk',
                frames   : [
                    { key: 'player', frame: 'monochrome-transparent-458.png' },
                    { key: 'player', frame: 'monochrome-transparent-459.png' },
                    { key: 'player', frame: 'monochrome-transparent-460.png' }
                ],
                frameRate: 10,
                repeat   : -1
            });
        }

        if (!a.exists('idle')) {
            a.create({
                key      : 'idle',
                frames   : [{ key: 'player', frame: 'monochrome-transparent-458.png' }],
                frameRate: 1,
                repeat   : -1
            });
        }

        if (!a.exists('spineAnim')) {
            a.create({
                key      : 'spineAnim',
                frames   : [{ key: 'Spine1' }, { key: 'Spine2' }],
                frameRate: 2,
                repeat   : -1
            });
        }

        this.scene.start('MainMenuScene');
    }
}

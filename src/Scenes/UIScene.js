export default class UIScene extends Phaser.Scene {
    constructor () { super({ key: 'UIScene', active: true }); }

    create () {
        /* ── HUD 텍스트 ─────────────────────────────────────── */
        const cam = this.cameras.main;
        this.scoreText = this.add.text(
            cam.width - 8, 8,
            'Coins: 0',
            { fontSize:'12px', fill:'#ffffff', fontFamily:'monospace' }
        )
        .setOrigin(1, 0)
        .setDepth(1000)
        .setScrollFactor(0);

        /* 값 갱신 */
        this.registry.events.on('changedata', (parent, key, val) => {
            if (key === 'coins') this.scoreText.setText(`Coins: ${val}`);
        });

        /* 리사이즈 대응 */
        this.scale.on('resize', ({ width }) => {
            this.scoreText.setX(width - 8);
        });
    }

    /* ── 매 프레임: Platformer 활성 여부에 따라 보·숨김 ── */
    update () {
        const playing = this.scene.isActive('platformerScene');
        this.scoreText.setVisible(playing);
    }
}

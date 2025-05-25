import { setupMenuInput } from '../utils/MenuHelper.js';

export default class GameOver extends Phaser.Scene {
    constructor() { super("gameOverScene"); }

    create() {
        const { width, height } = this.cameras.main;
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
        this.add.text(width/2, height/2 - 80, "Game Over", {
            fontSize: '40px', fill: '#ff0000', fontFamily: 'monospace'
        }).setOrigin(0.5);

        const restartBtn = this.add.image(width/2, height/2 - 10, "btn-restart").setScale(0.6);
        const menuBtn    = this.add.image(width/2, height/2 + 50, "btn-menu"   ).setScale(0.6);

        setupMenuInput(this, [
            { btn: restartBtn, callback: () => this.scene.start("platformerScene") },
            { btn: menuBtn,    callback: () => this.scene.start("mainMenuScene") }
        ]);
    }
}

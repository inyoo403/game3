import { setupMenuInput } from '../utils/MenuHelper.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    create() {
        const { width, height } = this.cameras.main;
        this.add.text(width / 2, height / 2 - 80, "MY GAME", {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const playBtn = this.add.text(width / 2, height / 2, "START", {
            fontSize: '24px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 설정
        setupMenuInput(this, [
            { btn: playBtn, callback: () => this.scene.start("platformerScene") },
        ]);
    }

    update() {
        this.updateMenuInput(); // 반드시 호출
    }
}

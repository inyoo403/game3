// src/Scenes/ClearScene.js
import { setupMenuInput } from '../utils/MenuHelper.js';

export default class ClearScene extends Phaser.Scene {
    constructor() {
        super("clearScene");
    }

    create() {
        const { width, height } = this.cameras.main;

        // 배경
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        // 승리 텍스트
        this.add.text(width / 2, height / 2 - 80, "🎉 You Win! 🎉", {
            fontSize: '40px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 텍스트 버튼들
        const restartText = this.add.text(width / 2, height / 2 - 10, "Restart", {
            fontSize: '24px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const menuText = this.add.text(width / 2, height / 2 + 30, "Main Menu", {
            fontSize: '24px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 메뉴 입력 설정
        setupMenuInput(this, [
            { btn: restartText, callback: () => this.scene.start("platformerScene") },
            { btn: menuText,    callback: () => this.scene.start("MainMenuScene") }
        ]);
    }

    update() {
        this.updateMenuInput();
    }
}

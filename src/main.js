"use strict";
console.log("main.js loaded");

import Load           from './Scenes/Load.js';
import MainMenuScene  from './Scenes/MainMenuScene.js';
import Platformer     from './Scenes/Platformer.js';
import UIScene        from './Scenes/UIScene.js';        // ★ 새로 import
import GameOver       from './Scenes/GameOverScene.js';
import ClearScene     from './Scenes/ClearScene.js';
import AtlasViewer from './Scenes/AtlasViewer.js';

const config = {
    parent : 'phaser-game',
    type   : Phaser.CANVAS,
    render : { pixelArt: true },
    width  : 960,
    height : 480,
    scale  : { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
        default: 'arcade',
        arcade : { debug: false, gravity: { x: 0, y: 0 } } // 중력은 각 씬에서 설정
    },
    scene  : [
        Load,
        MainMenuScene,
        Platformer,   // 게임 플레이
        UIScene,      // <-- 항상 켜질 HUD
        AtlasViewer,
        GameOver,
        ClearScene
    ]
};

new Phaser.Game(config);

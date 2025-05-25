export function setupMenuInput(scene, menuItems) {
    scene.menuItems = menuItems;
    scene.currentIndex = 0;
    scene.cursorVisible = true;

    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    menuItems.forEach(item => {
        item.btn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => item.callback());
    });

    // 커서 깜빡임 타이머
    scene.time.addEvent({
        delay: 400,
        loop: true,
        callback: () => {
            scene.cursorVisible = !scene.cursorVisible;
            updateCursor(scene);
        }
    });

    updateCursor(scene);

    scene.updateMenuInput = function () {
        if (Phaser.Input.Keyboard.JustDown(scene.cursors.up)) {
            moveSelection(scene, -1);
        }
        if (Phaser.Input.Keyboard.JustDown(scene.cursors.down)) {
            moveSelection(scene, 1);
        }
        if (Phaser.Input.Keyboard.JustDown(scene.spaceKey)) {
            const selected = scene.menuItems[scene.currentIndex];
            if (selected?.callback) selected.callback();
        }
    };
}

function moveSelection(scene, delta) {
    const len = scene.menuItems.length;
    scene.currentIndex = Phaser.Math.Wrap(scene.currentIndex + delta, 0, len);
    updateCursor(scene);
}

function updateCursor(scene) {
    scene.menuItems.forEach((item, idx) => {
        const label = item.originalText ?? item.btn.text;

        // 처음 호출 시 원본 텍스트 기억
        if (!item.originalText) item.originalText = label;

        if (idx === scene.currentIndex) {
            const prefix = scene.cursorVisible ? "▶ " : "  ";
            item.btn.setText(prefix + item.originalText);
            item.btn.setStyle({ fill: "#ffff66" });
        } else {
            item.btn.setText("   " + item.originalText);
            item.btn.setStyle({ fill: "#cccccc" });
        }
    });
}

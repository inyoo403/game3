// src/Scenes/AtlasViewer.js
export default class AtlasViewer extends Phaser.Scene {
    constructor() { super({ key: 'atlas' }); }

    preload() {}                      // Load 씬에서 이미 아틀라스 로드됨

    create() {
        const tex   = this.textures.get('player');   // 아틀라스 키
        const names = tex.getFrameNames();           // 프레임 이름 배열

        const CELL  = 64;        // 한 칸 크기
        const COLS  = 10;        // 열 개수
        const SCALE = 0.8;       // 썸네일 축소 비율

        /* ── 프레임 그리드 + 번호 표시 ───────────────────── */
        names.forEach((name, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x   = col * CELL + CELL / 2;
            const y   = row * CELL + CELL / 2;

            // 썸네일
            this.add.image(x, y, 'player', name)
                .setScale(SCALE)
                .setOrigin(0.5);

            // 번호(인덱스)
            this.add.text(x, y + CELL / 2 - 4, String(i), {
                fontSize: '10px',
                color   : '#ffff66',
                fontFamily: 'monospace'
            }).setOrigin(0.5, 1);
        });

        /* ── 커서 하이라이트 박스 ────────────────────────── */
        const hi = this.add.graphics().setDepth(999);
        hi.lineStyle(1, 0xffcc00, 1);

        this.input.on('pointermove', p => {
            // 월드 좌표 → 셀 좌표
            const col = Math.floor(p.worldX / CELL);
            const row = Math.floor(p.worldY / CELL);

            // 셀 안에 있을 때만 그리기
            if (col >= 0 && col < COLS && row >= 0) {
                hi.clear();
                hi.strokeRect(col * CELL, row * CELL, CELL, CELL);
            } else {
                hi.clear();
            }
        });

        /* ── 줌 & 스크롤 유틸 ───────────────────────────── */
        this.input.on('wheel', (_, __, dy) => {
            const cam = this.cameras.main;
            cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.25, 3));
        });
        this.input.keyboard.on('keydown-LEFT',  () => this.cameras.main.scrollX -= 32);
        this.input.keyboard.on('keydown-RIGHT', () => this.cameras.main.scrollX += 32);
        this.input.keyboard.on('keydown-UP',    () => this.cameras.main.scrollY -= 32);
        this.input.keyboard.on('keydown-DOWN',  () => this.cameras.main.scrollY += 32);
    }
}

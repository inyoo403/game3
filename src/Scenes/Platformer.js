export default class Platformer extends Phaser.Scene {
    constructor() { super('platformerScene'); }

    /* ───────────── 초기값 ───────────── */
    init() {
        this.SCALE             = 2.0;
        this.ACCELERATION      = 150;
        this.DRAG              = 500;
        this.JUMP_VELOCITY     = -250;
        this.MAX_MOVE_SPEED    = 120;
        this.PARTICLE_VELOCITY = 50;

        this.playerDying = false;
        this.clearFlag = null;

        this.startPosition = { x: 20, y: 100 };
        this.coinScore     = 0;
        this.my = { sprite: {}, vfx: {} };
    }

    /* ───────────── 생성 ───────────── */
    create() {
        // ── 입력 & 디버그
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.debugGraphics = this.add.graphics();
        this.physics.world.debugGraphic = this.debugGraphics;
        this.debugGraphics.setVisible(false);
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => {
            const on = !this.debugGraphics.visible;
            this.debugGraphics.setVisible(on);
            this.physics.world.drawDebug = on;
        });

        // HUD 초기화
        this.registry.set('coins', 0);

        // ── 배경
        this.bg = this.add.tileSprite(
            0, 0, this.game.config.width, this.game.config.height,
            'background'
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-10)
        .setAlpha(0.6)
        .setTint(0xcccccc);

        // ── 타일맵 & 레이어
        this.map = this.make.tilemap({ key: 'platformer' });
        const ts1 = this.map.addTilesetImage('monochrome_packed',            'monochrome_packed');
        const ts2 = this.map.addTilesetImage('monochrome-transparent_packed','monochrome-transparent_packed');

        this.groundLayer = this.map.createLayer('Ground', [ts1, ts2], 0, 0);
        this.landLayer   = this.map.createLayer('Land',   [ts1, ts2], 0, 0);

        this.groundLayer.setCollisionByExclusion([-1]);
        this.landLayer  .setCollisionByExclusion([-1]);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // ── 플레이어
        this.my.sprite.player = this.physics.add.sprite(
            this.startPosition.x, this.startPosition.y,
            'player', 'monochrome-transparent-458.png'
        )
        .setSize(12, 16);

        this.physics.add.collider(this.my.sprite.player, this.groundLayer);
        this.physics.add.collider(
            this.my.sprite.player,
            this.landLayer,
            null,
            (p, tile) => p.body.y + p.body.height <= tile.pixelY + 5,
            this
        );

        // ── Enemy 스폰 & 순찰 데이터
        this.enemies = this.physics.add.group();
        const enemyObjs = this.map.getObjectLayer('Enemy')?.objects ?? [];
        enemyObjs.forEach(zone => {
            const ex = zone.x + zone.width  / 2;
            const ey = zone.y + zone.height / 2;

            const e = this.physics.add.sprite(
                ex, ey, 'player', 'monochrome-transparent-418.png'
            )
            .setOrigin(0.5)
            .setCollideWorldBounds(true)
            .setBounceX(0)
            .setDragX(0)
            .setImmovable(false);

            e.setVelocityX(-30);              // 시작 속도
            e.body.setAllowGravity(true);     // 중력 적용

            e.speed       = 30;
            e.direction   = 'left';
            e.patrolRange = { left: zone.x, right: zone.x + zone.width };

            this.enemies.add(e);
        });

        this.physics.add.collider(this.my.sprite.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.collider(this.enemies, this.groundLayer);
        this.physics.add.collider(this.enemies, this.landLayer);

        // ── 깨지는 블록
        const blockObjs = this.map.getObjectLayer('Objects')?.objects ?? [];
        this.blocks = this.physics.add.group({ allowGravity: false, immovable: true });
        blockObjs.forEach(o => {
            const b = this.add.sprite(
                o.x + o.width/2, o.y - o.height/2,
                'player', 'monochrome-transparent-71.png'
            ).setOrigin(0.5);
            b.name = 'block';
            b.hit  = false;
            this.physics.world.enable(b);
            b.body.setSize(o.width, o.height);
            b.body.setAllowGravity(false).setImmovable(true);
            this.blocks.add(b);
        });
        this.physics.add.collider(this.my.sprite.player, this.blocks, (a,b)=>this.hitBlock(a,b));

        // ── 스파이크
        const spineLayer = this.map.getObjectLayer('Spine');
        this.spines = this.physics.add.staticGroup();
        spineLayer?.objects.forEach(o => {
            if (o.name==='ouch' && o.properties?.some(p=>p.name==='hitS'&&p.value)){
                this.spines.create(
                    o.x+o.width/2, o.y+o.height/2,
                    'Spine1'
                )
                .setOrigin(0.5)
                .setSize(o.width,o.height)
                .setDisplaySize(o.width,o.height)
                .setDepth(3)
                .play('spineAnim');
            }
        });
        this.physics.add.overlap(
            this.my.sprite.player, this.spines,
            () => this.triggerDeath(this.my.sprite.player.x, this.my.sprite.player.y)
        );

        // ── 파티클
        this.my.vfx.walking = this.add.particles(0,0,'kenny-particles',{
            frame:['smoke_03.png','smoke_09.png'],
            scale:{start:0.01,end:0.03},
            random:true,
            lifespan:350,
            gravityY:-100,
            alpha:{start:1,end:0.1},
            maxAliveParticles:8,
            on:false
        }).setDepth(-1).stop();

        /* jump 파티클 : 점프 순간 발밑에서 “퍽” 하고 아래로 떨어지는 먼지 */
        this.my.vfx.jump = this.add.particles(0, 0, 'kenny-particles', {
            frame      : ['smoke_02.png'],
            scale      : { start: 0.04, end: 0.01 },
            lifespan   : 350,
            alpha      : { start: 1, end: 0.1 },
            speedY     : { min: 120, max: 220 },   // ⬇︎ 아래 방향
            speedX     : { min: -30, max: 30 },
            gravityY   : 0,
            quantity   : 1,
            on         : false                     // 수동 발사
        }).setDepth(0).stop();                           // 타일/플레이어보다 뒤


        this.my.vfx.hit = this.add.particles(0,0,'player',{
            frame:'monochrome-transparent-5.png',
            lifespan:{min:200,max:500},
            scale:{start:0.3,end:0},
            alpha:{start:1,end:0},
            speed:{min:80,max:200},
            angle:{min:0,max:360},
            quantity:12,
            on:false
        }).stop();

        // ── Coins (투명)
        const coinObjs = this.map.getObjectLayer('Coins')?.objects ?? [];
        this.coins = this.physics.add.staticGroup();
        coinObjs.forEach(o=>{
            const c=this.coins.create(
                o.x+o.width/2, o.y+o.height/2,
                'player','monochrome-transparent-339.png'
            )
            .setOrigin(0.5)
            c.body.setSize(o.width,o.height);
        });
        this.physics.add.overlap(
            this.my.sprite.player, this.coins,
            (_,coin)=>{
                coin.disableBody(true,true);
                this.coinScore++;
                this.registry.set('coins', this.coinScore);   // HUD 갱신
                this.sound.play('coin');
            }
        );
        this.events.once('shutdown',()=>this.registry.set('coins',0));

        // ── 카메라 & 중력
        this.physics.world.gravity.y = 800;
        this.cameras.main.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
            .startFollow(this.my.sprite.player,true,0.1,0.1)
            .setDeadzone(160,100)
            .setFollowOffset(-80,0)
            .setZoom(this.SCALE);
        /* 0.5초마다 플레이어 위치 콘솔 표시 ------------------------------------ */
        this.time.addEvent({
            delay   : 500,              // ms 단위 (0.5초)
            loop    : true,
            callback: () => {
                const p = this.my.sprite.player;
                console.log(`Player @ x:${p.x.toFixed(1)}  y:${p.y.toFixed(1)}`);
            }
        });
    }

    /* ───────────── update ───────────── */
    update(){
        const p=this.my.sprite.player;
        const on=p.body.blocked.down;
        const left=p.body.blocked.left;
        const right=p.body.blocked.right;
        const jump=Phaser.Input.Keyboard.JustDown(this.spacebar);

        // 배경 패럴랙스
        this.bg.tilePositionX=this.cameras.main.scrollX*0.1;
        this.bg.tilePositionY=this.cameras.main.scrollY*0.1;

        // 이동
        if(this.cursors.left.isDown){
            p.setAccelerationX(-this.ACCELERATION).setFlipX(true);
            p.anims.play('walk',true);
            if(on){
                this.my.vfx.walking.startFollow(p,p.displayWidth/2-10,p.displayHeight/2-5,false)
                    .setParticleSpeed(this.PARTICLE_VELOCITY,0).start();
            }
        }else if(this.cursors.right.isDown){
            p.setAccelerationX(this.ACCELERATION).setFlipX(false);
            p.anims.play('walk',true);
            if(on){
                this.my.vfx.walking.startFollow(p,-p.displayWidth/2+10,p.displayHeight/2+2,false)
                    .setParticleSpeed(-this.PARTICLE_VELOCITY,0).start();
            }
        }else{
            p.setAccelerationX(0).setDragX(this.DRAG);
            p.anims.play('idle');
            this.my.vfx.walking.stop();
        }

        // 속도 제한
        if(p.body.velocity.x> this.MAX_MOVE_SPEED) p.body.setVelocityX( this.MAX_MOVE_SPEED);
        if(p.body.velocity.x<-this.MAX_MOVE_SPEED) p.body.setVelocityX(-this.MAX_MOVE_SPEED);

        // 점프 & 벽차기
        if(!on && jump){
            if(left)  p.setVelocityY(this.JUMP_VELOCITY).setVelocityX( 150);
            if(right) p.setVelocityY(this.JUMP_VELOCITY).setVelocityX(-150);
            this.sound.play('jump');
            const offsetX = p.flipX               // 캐릭터가 보는 방향에 맞춰
              ?  p.displayWidth / 2 - 10   // ← 왼쪽 바라볼 때
              : -p.displayWidth / 2 + 10;  // → 오른쪽 바라볼 때

            this.my.vfx.jump.emitParticleAt(
                p.x + offsetX,                    // X 좌표
                p.y + p.displayHeight / 2 + 2     // Y = 발 아래
            );
        }
        if(on && jump){
            p.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('jump');
            const offsetX = p.flipX               // 캐릭터가 보는 방향에 맞춰
              ?  p.displayWidth / 2 - 10   // ← 왼쪽 바라볼 때
              : -p.displayWidth / 2 + 10;  // → 오른쪽 바라볼 때

            this.my.vfx.jump.emitParticleAt(
                p.x + offsetX,                    // X 좌표
                p.y + p.displayHeight / 2 + 2     // Y = 발 아래
            );
        }
        if(!on) p.anims.stop();

        // 낙사
        if(p.y > this.map.heightInPixels - 6 && p.active){
            this.triggerDeath(p.x, p.y);
        }

        // Enemy AI
        this.enemies.getChildren().forEach(e=>{
            if(!e.body.blocked.down) return;
            if(e.x<=e.patrolRange.left)  e.direction='right';
            if(e.x>=e.patrolRange.right) e.direction='left';
            e.setVelocityX(e.direction==='left'? -e.speed : e.speed);
            e.setFlipX(e.direction==='right');
        });
    }

    /* ───────────── 공통 사망 처리 ───────────── */
    triggerDeath(x, y) {
        if (this.playerDying) return;
        this.playerDying = true;
        this.sound.play('lose');
        // 1️⃣ 플레이어 비활성화
        this.my.sprite.player.disableBody(true, true);
    
        // 2️⃣ 묘비 생성
        const grave = this.physics.add.sprite(
            x, y - 30,
            'player', 'monochrome-transparent-685.png'
        )
        .setVelocityY(100)    // 초기 낙하 속도
        .setGravityY(800)     // 중력 적용
        .setDepth(10);
    
        // 3️⃣ 바닥(타일 레이어)와 충돌하면 멈추도록
        const stopGrave = () => {
            grave.setVelocity(0);          // 속도 0
            grave.setAcceleration(0);
            grave.body.setAllowGravity(false);
            grave.body.setImmovable(true); // 더 이상 밀리지 않음
        };
    
        // Ground, Land 두 레이어 모두와 충돌 등록
        this.physics.add.collider(grave, this.groundLayer, stopGrave);
        this.physics.add.collider(grave, this.landLayer,   stopGrave);
    
        // 4️⃣ 카메라 흔들림 & 1초 뒤 씬 재시작
        this.cameras.main.shake(150, 0.005);
        this.time.delayedCall(1000, () => this.scene.restart());
    }
    

    /* ───────────── 기타 헬퍼 ───────────── */
    hitBlock(player,block){
        if(player.body.touching.up && block.body.touching.down && !block.hit){
            block.setFrame('monochrome-transparent-22.png');
            this.my.vfx.hit.emitParticleAt(block.x,block.y);
            this.sound.play('brick');
            block.hit=true;
            this.checkClearCondition();
        }
    }

    playerHitEnemy(player,enemy){
        const falling=player.body.velocity.y>0;
        if(falling && enemy.body.touching.up){
            enemy.destroy();
            player.setVelocityY(-200);
            this.my.vfx.hit.emitParticleAt(enemy.x,enemy.y);
            this.cameras.main.shake(150,0.005);
            this.sound.play('hit');
        }else{
            this.triggerDeath(player.x,player.y);
        }
    }

    checkClearCondition(){
        if(this.blocks.getChildren().every(b=>b.hit) && !this.clearFlag){
            const fObj=this.map.getObjectLayer('Flag')?.objects.find(o=>o.name==='clear');
            if(!fObj) return;
            this.clearFlag=this.physics.add.sprite(
                fObj.x+fObj.width/2, fObj.y-fObj.height/2,
                'player','monochrome-transparent-720.png'
            )
            .setOrigin(0.5)
            .setImmovable(true)
            .setDepth(5)
            .body.setAllowGravity(false);
            this.physics.add.overlap(
                this.my.sprite.player, this.clearFlag,
                ()=>this.scene.start('clearScene')
            );
        }
    }
}

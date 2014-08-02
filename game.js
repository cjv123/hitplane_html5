define([
    'phaser'
], function (Phaser) { 
    'use strict';

    function Game() {    
        //console.log('Making the Game');    
        this.load_text;
    }
    
    Game.prototype = {
    	constructor: Game,

        start: function() {
            this.game = new Phaser.Game(640,960, Phaser.CANVAS, '', {
                preload: this.preload, create: this.create 
            });
        },

        preload: function() {
            var game = this.game;
            game.scale.maxWidth = 640*2;
            game.scale.maxHeight = 960*2;

            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;

            game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            game.scale.setScreenSize(true);

            this.load_text = game.add.text(game.world.centerX, game.world.centerY,'Loading...',{font:'72px Arial',fill:'#FFFFFF'});
            this.load_text.anchor.set(0.5);

            game.load.image('plane', 'resource/plane.png');
            game.load.image('bullet','resource/bullet.png');
            game.load.spritesheet('failtext', 'resource/fail.png', 201, 93, 6);
            game.load.spritesheet('plane_b','resource/plane_b.png',13,13,2);
            game.load.image('lifetime','resource/lifetime.png');
            game.load.image('title','resource/title.png');
            game.load.image('touchtostart','resource/touchtostart.png');
            game.load.spritesheet('star','resource/star.png',1,1,4);
        },
		
        create: function() {
            this.load_text.destroy();
            var game = this.game;
            game.state.add('title',title_state);
            game.state.add('game', game_state);
            game.state.add('gameover',gameover_state);

            game.state.start('title');
        }
    };
    
    return Game;
});



var game_timer=0;

var game_state={};
game_state = function (game) {
    this.plane;
    this.old_point = new Phaser.Point(0,0);
    this.bullet_group;
    this.bullet_make_index = 0;
    this.make_bullet_event;
    this.game_timer_event;
    this.emitter_die;

    this.game;        //  a reference to the currently running game
    this.add;       //  used to add sprites, text, groups, etc
    this.camera;    //  a reference to the game camera
    this.cache;     //  the game cache
    this.input;     //  the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load;      //  for preloading assets
    this.math;      //  lots of useful common math operations
    this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc
    this.stage;     //  the game stage
    this.time;      //  the clock
    this.tweens;    //  the tween manager
    this.state;     //  the state manager
    this.world;     //  the game world
    this.particles; //  the particle manager
    this.physics;   //  the physics manager
    this.rnd;       //  the repeatable random number generator
};

game_state.prototype = {
    preload: function () {

    },

    create: function () {
        game_timer = 0;
        var game = this.game;
        var plane = game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'plane');
        this.plane = plane;
        plane.anchor.set(0.5);
        this.emitter_die = game.add.emitter();
        this.emitter_die.setXSpeed(-500,500);
        this.emitter_die.setYSpeed(-500,500);
        this.emitter_die.setRotation(-100,-100);
        this.emitter_die.setSize(5,5);
        this.emitter_die.makeParticles('plane_b',[0,1],8);

        game.physics.enable(plane,Phaser.Physics.ARCADE);

        this.bullet_group = game.add.group();
        var bullet;
        for (var i = 0; i <100; i++) {
            bullet = game.add.sprite(0,0,'bullet');
            game.physics.enable(bullet,Phaser.Physics.ARCADE);
            bullet.visible = false;
            this.bullet_group.add(bullet);
        };

        this.makeBullet();

        this.make_bullet_event = game.time.events.loop(Phaser.Timer.SECOND*5, this.makeBullet, this);
        this.game_timer_event = game.time.events.loop(100,function(){
            game_timer+=1;
        },this);
    },

    update: function (){
        var game = this.game;
        var plane = this.plane;
        var nowPoint ={x:0,y:0};
        if (game.input.pointer1.isDown || game.input.mousePointer.isDown) {
                //console.log('dx,dy');
                nowPoint.x = game.input.x;
                nowPoint.y = game.input.y;
                if (!(this.old_point.x ==0 && this.old_point.y==0)){
                    var dx = nowPoint.x - this.old_point.x;
                    var dy = nowPoint.y - this.old_point.y;
                    plane.x += dx*1.5;
                    plane.y += dy*1.5;
                }
                this.old_point.x = nowPoint.x;
                this.old_point.y = nowPoint.y;
        }
        else
        {
            this.old_point.x = 0;
            this.old_point.y =0 ;
        }
        nowPoint = null;

        for (var i=0;i<100;i++){
            bullet = this.bullet_group.getAt(this.bullet_make_index);
        }

        game.physics.arcade.overlap(plane,this.bullet_group,function(){
           this.planeBroken();
        },null,this);

        if (false == plane.inWorld) {
            this.planeBroken();
        }
    },

    planeBroken: function(){
        this.plane.kill();
        this.emitter_die.at(this.plane);
        this.emitter_die.start(true,0,0,8);
        this.game.time.events.remove(this.game_timer_event);
        this.game.time.events.repeat(Phaser.Timer.SECOND * 2, 1,this.gameover, this);
    },

    makeBullet: function(){
            var game = this.game; 
            var bullet;
            for (var i=0;i<50;i++){
                bullet = this.bullet_group.getAt(this.bullet_make_index);
                if (!bullet)
                    continue;

                var dir = game.rnd.integerInRange(0,3);

                switch(dir)
                {
                   case 0:
                        bullet.y = -bullet.height;
                        bullet.x = Math.floor(game.rnd.frac()*100000 % game.world.width);
                        var sign =1;
                        if (bullet.x > game.world.width/2)
                            sing = -1;
                        bullet.body.velocity.x = Math.floor((game.rnd.frac()*1000)%200 * sign);
                        bullet.body.velocity.y = game.rnd.frac()*(200-100) + 100;
                   break; 
                   case 1:
                        bullet.y = game.world.height;
                        bullet.x = Math.floor(game.rnd.frac()*100000 % game.world.width);
                        var sign =1;
                        if (bullet.x > game.world.width/2)
                            sing = -1;
                        bullet.body.velocity.x = Math.floor((game.rnd.frac()*1000)%100 * sign);
                        bullet.body.velocity.y = - (game.rnd.frac()*(200-100) + 100);
                       // console.log('vy:',bullet.body.velocity.y);
                   break;
                   case 2:
                        bullet.x = -bullet.width;
                        bullet.y = Math.floor(game.rnd.frac()*100000 % game.world.height);
                        bullet.body.velocity.x = game.rnd.frac()*(200-100) + 100;
                        var sign =1;
                        if (bullet.x > game.world.height/2)
                            sing = -1;
                        
                        bullet.body.velocity.y = Math.floor((game.rnd.frac()*1000)%100 * sign);
                   break;
                   case 3:
                        bullet.x = game.world.width;
                        bullet.y = Math.floor(game.rnd.frac()*100000 % game.world.height);
                        bullet.body.velocity.x = -(game.rnd.frac()*(200-100) + 100);
                        var sign =1;
                        if (bullet.x > game.world.height/2)
                            sing = -1;
                        
                        bullet.body.velocity.y = Math.floor((game.rnd.frac()*1000)%100 * sign);
                   break;
                }

                bullet.visible = true;

                this.bullet_make_index++;
                if (this.bullet_make_index>=100)
                    this.bullet_make_index = 0;
            }
    },


    gameover : function(){
            console.log('game over!');
            this.game.time.events.remove(this.make_bullet_event);
            this.state.start('gameover');
    }


}


gameover_state = {};
gameover_state = function(game){
    this.game;
}

gameover_state.prototype ={
    preload: function () {

    },

    create: function () {
        var gametime = game_timer/10;
        var failFrameIndex = 0;
        if (gametime<20)
        {
            failFrameIndex = 0;
        }
        else if (gametime>=20 && gametime<40)
        {
            failFrameIndex = 1;
        }
        else if (gametime>=40 && gametime<60)
        {
            failFrameIndex = 2;
        }
        else if (gametime>=60 && gametime<80)
        {
            failFrameIndex = 3;
        }
        else if (gametime>=80 && gametime<100)
        {
            failFrameIndex = 4;
        }
        else if (gametime>=100)
        {
            failFrameIndex = 5;
        }

        this.game.add.sprite(this.game.world.centerX,this.game.world.centerY - 100,'failtext',failFrameIndex).anchor.set(0.5);
        lifetime_sp = this.game.add.sprite(this.game.world.centerX,this.game.world.centerY +50,'lifetime');
        lifetime_sp.anchor.set(0.5);
        lifetime_sp.scale.set(2,2);

        this.game.add.text(this.game.world.centerX, this.game.world.centerY +150,gametime.toFixed(1)+'s',{font:'72px Arial',fill:'#FF0000'}).anchor.set(0.5);

        var game = this.game;
        this.game.input.onTap.add(function(e){
            game.state.start('title');
        });
    }
}


title_state = {};
title_state = function(game){
    this.game;
    this.emitter_star;
}

title_state.prototype ={
    preload: function () {

    },

    create: function () {
        this.game.add.sprite(this.game.world.centerX,this.game.world.centerY - 100,'title').anchor.set(0.5);
        var touch_text = this.game.add.sprite(this.game.world.centerX,this.game.world.centerY +200,'touchtostart');
        touch_text.anchor.set(0.5);
        this.game.physics.enable(touch_text,Phaser.Physics.ARCADE);
        
        this.game.time.events.loop(500,function(){
            if (touch_text.visible == true) {
                touch_text.visible = false;
            }
            else{
                touch_text.visible = true;
            }
        },this);
        
        var game = this.game;
        this.game.input.onTap.add(function(e){
            game.state.start('game');
        });

        
        this.emitter_star = this.game.add.emitter(this.game.world.centerX,this.game.world.centerY);
        this.emitter_star.makeParticles('star',[0,1,2,3],500);
        this.emitter_star.scale.set(4,4);
        this.emitter_star.setXSpeed(-10,10);
        this.emitter_star.setYSpeed(0,20);
        this.emitter_star.gravity= 0;
        this.emitter_star.width = this.game.width;
        this.emitter_star.height = this.game.height;
        this.emitter_star.setRotation(0, 0);
        
        this.emitter_star.start(false,5000,1);
        
    }
}

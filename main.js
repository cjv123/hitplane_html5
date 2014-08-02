(function () {
    'use strict';

    requirejs.config({
        baseUrl: "./",
        
        paths: {
        	phaser:   'phaser.min',
            jquery:   'jquery.min'
        },

        shim: {
        	'phaser': {
        		exports: 'Phaser'
        	}
        }
    });
 
    require(['phaser','jquery', 'game'], function (Phaser, $,Game) {
        $("#loadpage").html("");
		var game = new Game();
		game.start();
    });
}());
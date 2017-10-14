/// <reference path="phaserdefs/phaser.comments.d.ts"/>

var cursors;
var tankgroup;
const TANK_SPEED=5;
const ROTATION_SPEED=0.05;
var firebutton;
var cannonball;
const CANNONBALL_VELOCITY=850;
var lastfiretime=0;
const SHOT_DELAY=500;
var ground;
var angletext;
var opponenttankgroups={};     // object of opponent tanks in the form socketid:tankgroup
var opponentcannonballs={};     // object of opponent cannonballs in the form socketid:cannonball


var game = new Phaser.Game(700, 500, Phaser.AUTO, 'gamearea', { preload: preload, create: create, update: update });
// Call the networking function from chat.js module
networkingInitialize();

function preload(){

    game.load.image('sky','/assets/sky.png');
    game.load.image('ground','/assets/platform.png');
    game.load.image('tankbody','/assets/tankbody.png');
    game.load.image('tankcannon','/assets/tankcannon.png');
    game.load.image('cannonball','/assets/cannonball.png');
    game.load.spritesheet('explosion','/assets/explosion.png',128,128,10,0,0);
}

function create(){
    game.paused=true;

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y=981;
    game.physics.setBoundsToWorld();
    var sky= game.add.sprite(0,0,'sky');

    ground=game.add.sprite(0,game.world.height-50,'ground');
    ground.scale.setTo(2);
    game.physics.enable(ground,Phaser.Physics.ARCADE);
    ground.body.immovable=true;
    ground.body.allowGravity=false;

    tankgroup=game.add.group();
    tankgroup.create(spawnx-5,game.world.height-45,'tankcannon');
    tankgroup.create(spawnx,game.world.height-60,'tankbody');
    tankgroup.children[1].anchor.x=0.5;
    tankgroup.children[0].pivot.x=tankgroup.children[0].width;
    tankgroup.checkWorldBounds=true;

    // Set up display of cannon angle
    angletext=game.add.text(0,0,'Angle : '+tankgroup.children[0].angle.toFixed(2),{ font: "15px Monaco", fill: "#ffff00", align: "center" });

    // Set keyboard callbacks
    cursors=game.input.keyboard.createCursorKeys();
    firebutton=game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);


    // Subscribe to socket callbacks regarding discovery of new players
    socket.addEventListener('newplayer',function(data){
        if(newplayers.indexOf(data.socketid)===-1)
        {
            newplayers.push(data.socketid);
            var x;
            var rotation;
            if(tankgroup==null)
            {
                x=spawnx;
                rotation=0;
            }
            else
            {
                x=tankgroup.children[1].worldPosition.x;
                rotation=tankgroup.children[0].rotation;
            }
            if(username.value!='')
                socket.emit('newplayer',{socketid:socket.id,x:x,rotation:rotation,name:username.value});
            showopponenttank(data);
        }
    });
    
    


}

function update(){
    if(game.input.activePointer.withinGame){


        // Manage key presses
        if(cursors.left.isDown){
            if(cursors.left.shiftKey){
                rotateleft();
            }
            else
            {
                moveleft();
            }
            
        }
        else if(cursors.right.isDown){
            if(cursors.right.shiftKey){
                rotateright();
            }
            else
            {
                moveright();
            }

        }
        if(firebutton.isDown){
            if(game.time.now-lastfiretime>SHOT_DELAY){
                fire();
                lastfiretime=game.time.now;
            }
            
        }

            // Set keyboard callbacks
            cursors=game.input.keyboard.createCursorKeys();
            firebutton=game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    }
    else{
        game.input.keyboard.clearCaptures();
    }
    
    // Process any collisions happening between cannonball and ground
    game.physics.arcade.collide(cannonball,ground,function(cannonball,ground){
        cannonball.kill();
        var explosion=game.add.sprite(cannonball.worldPosition.x,ground.worldPosition.y,'explosion');
        explosion.anchor.set(0.5,0.5);
        var explode=explosion.animations.add('explode');
        explosion.play('explode',24,false,true);
        // Process any collisions happening between cannonball and tanks
        for(var socketid in opponenttankgroups){
            if(opponenttankgroups.hasOwnProperty(socketid))
            {
                socket.emit('strike',{struckat:cannonball.worldPosition.x,tankat:opponenttankgroups[socketid].children[1].worldPosition.x});  
            }
        }
    });

    // Process any collisions happening between opponent's cannonball and ground
    for(var socketid in opponentcannonballs){
        if(opponentcannonballs.hasOwnProperty(socketid)){
            var currentcannonball=opponentcannonballs[socketid];
            game.physics.arcade.collide(currentcannonball,ground,function(cannonball,ground){
                cannonball.kill();
                var explosion=game.add.sprite(cannonball.worldPosition.x,ground.worldPosition.y,'explosion');
                explosion.anchor.set(0.5,0.5);
                var explode=explosion.animations.add('explode');
                explosion.play('explode',24,false,true);
            });
        }
    }

    // Update angle text
    angletext.text="Angle : "+tankgroup.children[0].angle.toFixed(2);

    // Emit our tank's current position
    socket.emit('position',tankgroup.children[1].worldPosition.x);
}

function fire(){
    var mouthx,mouthy;
    mouthx=tankgroup.children[0].worldPosition.x;
    mouthy=tankgroup.children[0].worldPosition.y;
    cannonball=game.add.sprite(mouthx,mouthy,'cannonball');
    cannonball.scale.setTo(0.05);
    cannonball.anchor.set(0.5,0.5);
    cannonball.checkWorldBounds=true;
    cannonball.outOfBoundsKill=true;
    game.physics.enable(cannonball,Phaser.Physics.ARCADE);
    cannonball.body.velocity.x=-CANNONBALL_VELOCITY*Math.cos(tankgroup.children[0].rotation);
    cannonball.body.velocity.y=-CANNONBALL_VELOCITY*Math.sin(tankgroup.children[0].rotation);
    socket.emit('fire',{
        mouthx:mouthx,
        mouthy:mouthy,
        socketid:socket.id
    });
}

// Helper functions
function moveleft(){
    if(tankgroup.children[1].worldPosition.x>=tankgroup.width/2)
    {
        tankgroup.children[1].worldPosition.x-=TANK_SPEED;
        tankgroup.children[0].worldPosition.x-=TANK_SPEED;
        tankgroup.x-=TANK_SPEED;
        socket.emit('moveleft',socket.id);
    }
}

function moveright(){
    if(tankgroup.children[1].worldPosition.x<=game.canvas.width-tankgroup.width/2)
    {
        tankgroup.children[1].worldPosition.x+=TANK_SPEED;
        tankgroup.children[0].worldPosition.x+=TANK_SPEED;
        tankgroup.x+=TANK_SPEED;
        socket.emit('moveright',socket.id);
    }

}

function rotateleft(){
    tankgroup.children[0].rotation-=ROTATION_SPEED;
    socket.emit('rotateleft',socket.id);
}

function rotateright(){
    tankgroup.children[0].rotation+=ROTATION_SPEED;
    socket.emit('rotateright',socket.id);
}
// End helper functions

function showopponenttank(data){
    opponenttankgroups[data.socketid]=game.add.group();
    opponenttankgroups[data.socketid].create(data.x-5,game.world.height-45,'tankcannon');
    opponenttankgroups[data.socketid].create(data.x,game.world.height-60,'tankbody');
    opponenttankgroups[data.socketid].children[1].anchor.x=0.5;
    opponenttankgroups[data.socketid].children[0].pivot.x=opponenttankgroups[data.socketid].children[0].width;
    opponenttankgroups[data.socketid].children[0].rotation=data.rotation;
    opponenttankgroups[data.socketid].checkWorldBounds=true;
};

function showopponenttankfiring(data){
    var mouthx,mouthy;
    mouthx=data.mouthx;
    mouthy=data.mouthy;
    opponentcannonballs[data.socketid]=game.add.sprite(mouthx,mouthy,'cannonball');
    opponentcannonballs[data.socketid].scale.setTo(0.05);
    opponentcannonballs[data.socketid].anchor.set(0.5,0.5);
    opponentcannonballs[data.socketid].checkWorldBounds=true;
    opponentcannonballs[data.socketid].outOfBoundsKill=true;
    game.physics.enable(opponentcannonballs[data.socketid],Phaser.Physics.ARCADE);
    opponentcannonballs[data.socketid].body.velocity.x=-CANNONBALL_VELOCITY*Math.cos(opponenttankgroups[data.socketid].children[0].rotation);
    opponentcannonballs[data.socketid].body.velocity.y=-CANNONBALL_VELOCITY*Math.sin(opponenttankgroups[data.socketid].children[0].rotation);
};

function showopponentmovingleft(socketid){
    if(opponenttankgroups[socketid].children[1].worldPosition.x>=opponenttankgroups[socketid].width/2)
    {
        opponenttankgroups[socketid].children[1].x-=TANK_SPEED;
        opponenttankgroups[socketid].children[0].x-=TANK_SPEED;
    }

};

function showopponentmovingright(socketid){
    if(opponenttankgroups[socketid].children[1].worldPosition.x<=game.canvas.width-opponenttankgroups[socketid].width/2)
    {
        opponenttankgroups[socketid].children[1].x+=TANK_SPEED;
        opponenttankgroups[socketid].children[0].x+=TANK_SPEED;
    }

};

function showopponentrotatingleft(socketid){
    opponenttankgroups[socketid].children[0].rotation-=ROTATION_SPEED;
};

function showopponentrotatingright(socketid){
    opponenttankgroups[socketid].children[0].rotation+=ROTATION_SPEED;
};

function updatescoreboard(scorerecord){
    var text="";
    for(var socketid in scorerecord){
        text+=scorerecord[socketid].name + " : "+scorerecord[socketid].score+"<br/>";
    }
    document.getElementById("scoreboard").innerHTML=text;
};
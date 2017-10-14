var players={}; // {    {%socketid%:{name:%name%,x:%positionx%,score:%score%},...}    }
var socketidlist=[];    // just for checking which players are unique
var express=require('express');
var app=express();
var socket=require('socket.io');

app.use(express.static(__dirname + '/pocketTanks'));

app.get('/',function(req,res){
    res.sendFile('/pocketTanks/main.html',{root:__dirname});
});

var server=app.listen(3000,"localhost", ()=>{console.log('Server started at port 3000')});

var io=socket(server);

io.on('connect',function(thissocket){
    console.log('connection made',thissocket.id);
    thissocket.on('chat',function(data){
        io.sockets.emit('chat',data);
    });
    thissocket.on('newplayer',function(data){
        if(socketidlist.indexOf(thissocket.id)===-1){
            socketidlist.push(thissocket.id);
            players[thissocket.id]={name:data.name,x:0,score:0};
        }
        thissocket.broadcast.emit('newplayer',data);
    });
    thissocket.on('fire',function(data){
        thissocket.broadcast.emit('fire',data);
    });
    thissocket.on('position',function(x){
        if(players[thissocket.id]!=null){
            players[thissocket.id].x=x;
        }
    });
    thissocket.on('strike',UpdatePlayers);
    thissocket.on('moveleft',(data)=>thissocket.broadcast.emit('moveleft',data));
    thissocket.on('moveright',(data)=>thissocket.broadcast.emit('moveright',data));
    thissocket.on('rotateleft',(data)=>thissocket.broadcast.emit('rotateleft',data));
    thissocket.on('rotateright',(data)=>thissocket.broadcast.emit('rotateright',data));
});

function UpdatePlayers(data){
    var difference=Math.abs(data.struckat-data.tankat);
    if(difference<=40){
        for(var socketid in players){
            console.log("player @ "+players[socketid].x+" tank @ "+data.tankat);
            if(players[socketid].x===data.tankat){
                if(players[socketid]['score']>0){
                    players[socketid]['score']--;
                }
            }
            if(socketid===this.id){
                players[socketid]['score']++;
                //console.log("Score of "+players[socketid]['name']+ " = "+players[socketid]['score']);
            }
        }
        io.sockets.emit('playersrecord',players);
    };
}
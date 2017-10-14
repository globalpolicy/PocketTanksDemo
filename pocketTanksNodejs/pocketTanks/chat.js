var spawnx=Math.floor((Math.random()*650) + 50)     // first time spawn x coordinate of tank
var newplayers=[];


var socket=io.connect("http://localhost:3000");

var username=document.getElementById('username'),
message=document.getElementById('message'),
btn=document.getElementById('sendbutton'),
chatarea=document.getElementById('chatarea');



function networkingInitialize(){
    

    
    
    btn.addEventListener('click',function(){
        if(username.value!='' && message.value!=''){
            socket.emit('chat',{
                username:username.value,
                message:message.value
            });
            message.value="";
            game.paused=false;
            socket.emit('newplayer',
            {
                socketid:socket.id,
                x:spawnx,
                rotation:0,
                name:username.value
            });
        }
        
    });
    
    socket.addEventListener('chat',function(data){
        chatarea.innerHTML+='<p><strong>'+data.username+'</strong>: '+data.message+'</p>';
    });
    
    
    
    socket.addEventListener('fire',function(data){
        showopponenttankfiring(data);
    });
    
    socket.addEventListener('moveleft',function(socketid){
        showopponentmovingleft(socketid);
    });
    
    socket.addEventListener('moveright',function(socketid){
        showopponentmovingright(socketid);
    });
    
    socket.addEventListener('rotateleft',function(socketid){
        showopponentrotatingleft(socketid);
    });
    
    socket.addEventListener('rotateright',function(socketid){
        showopponentrotatingright(socketid);
    });
    
    socket.addEventListener('playersrecord',function(data){
        updatescoreboard(data);
    });
}
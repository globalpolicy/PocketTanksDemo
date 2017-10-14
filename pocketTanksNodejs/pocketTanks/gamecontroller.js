var btnmoveleft=document.getElementById('moveleft'),
btnmoveright=document.getElementById('moveright'),
btnrotateleft=document.getElementById('rotateleft'),
btnrotateright=document.getElementById('rotateright'),
btnfire=document.getElementById('firebutton');

btnfire.addEventListener('click',function(){
    fire();
});

btnrotateright.addEventListener('click',function(){
    rotateright();
});

btnrotateleft.addEventListener('click',function(){
    rotateleft();
});

btnmoveright.addEventListener('click',function(){
    moveright();
});

btnmoveleft.addEventListener('click',function(){
    moveleft();
});

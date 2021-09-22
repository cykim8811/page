
const canvas = document.getElementById('main');
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = false;

function onResize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    socket.emit('message', JSON.stringify(
        {type:'WindowSizeUpdate', width: canvas.width, height: canvas.height}));
}
window.addEventListener('resize', onResize, false);

const socket = io.connect('http://52.78.66.0:80');
onResize();

/* Request Handle */
const requestList = [];
let lastMsgId = 1000000;
async function request(msg){
    return new Promise(function(res, rej){
        msgId = ++lastMsgId;
        requestList.push({msgId: msgId, resolve: res});
        socket.emit('request', JSON.stringify({msgId: msgId, data: msg}));
    });
}
socket.on('response', function(msgstr){
    let msg = JSON.parse(msgstr);
    let index = requestList.findIndex((t)=>(t.msgId == msg.msgId));
    if (index < 0) {return;}
    requestList[index].resolve(msg.data);
    requestList.splice(index, 1);
});
/* Request Handle end */

function message(msg){
    socket.emit('message', JSON.stringify(msg));
}

let view = {
    unit: 32,
    size: 1,
    x: 0,
    y: 0
};


class Sprite{
    constructor(path, offsetX, offsetY, id){
        this.image = new Image();
        this.image.src = path;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.id = id;
    }
    draw(ctx, x, y, angle=0, scale=1, alpha=1){
        if (angle == 0){
            ctx.drawImage(this.image,
                Math.round(canvas.width / 2 + (x - view.x) * view.unit * view.size - this.offsetX * view.size),
                Math.round(canvas.height / 2 + (y - view.y) * view.unit * view.size - this.offsetY * view.size),
                this.image.width * view.size * scale, this.image.height * view.size * scale
            );
        }else{
            ctx.save()
            ctx.translate(canvas.width / 2 + (x - view.x) * view.unit * view.size,
                          canvas.height / 2 + (y - view.y) * view.unit * view.size);
            ctx.rotate(angle * Math.PI / 180);
            ctx.drawImage(this.image,
                Math.round(-this.offsetX * view.size),
                Math.round(-this.offsetY * view.size),
                this.image.width * view.size * scale, this.image.height * view.size * scale
            );
            ctx.restore();
        }
    }
};

const spriteList = [];
async function getSprite(spriteId){
    let spr = spriteList.find((t)=>(t.id == spriteId));
    if (spr) return spr;
    spr = await request({type: "sprite", spriteId: spriteId});
    let sprdata = new Sprite(spr.path, spr.offsetX, spr.offsetY, spr.id);
    spriteList.push(sprdata);
    return sprdata;
}

const transitions = {
    linear: (t)=>(t),
    ease: (t)=>(-Math.pow(t, 3)*2 + Math.pow(t, 2)*3),
    ease_out: (t)=>(1-Math.pow(1-t, 2))
};

class Animation{
    constructor(param, from, to, duration=1, transition='linear'){
        this.param = param;
        this.from = from;
        this.to = to;
        this.transition = transitions[transition];
        this.duration = duration;
        this.currentTime = 0;
    }
    tick(dT){
        this.currentTime += dT;
    }
    value(){
        let r = this.transition(this.currentTime/this.duration);
        if (r < 0) {r=0;}
        if (r > 1) {r=1;}
        return this.from * (1-r) + this.to * r;
    }
    isEnd(){
        return this.currentTime > this.duration;
    }
};

class Ghost{
    constructor(id){
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.size = 1;
        this.sprite = 0;
        this.alpha = 1;
        this.id = id;
        
        this.animationList = [];
    }
    addAnimation(animation){
        this.animationList.push(animation);
    }
    tick(dT){
        for (let i=this.animationList.length-1; i>=0; i--){
            const animation = this.animationList[i];
            if (animation.isEnd()){
                this.animationList.splice(i, 1);
                continue;
            }
            animation.tick(dT);
        }
    }
    draw(ctx){
        let param = {
            'x': this.x,
            'y': this.y,
            'angle': this.angle,
            'size': this.size,
            'alpha': this.alpha,
        };
        for (let anim of this.animationList){
            param[anim.param] = anim.value();
        }
        if (this.sprite){
            this.sprite.draw(ctx, param.x, param.y, param.angle, param.size, param.alpha);
        }
    }
};

const ghostList = [];

socket.on('UpdateView', function(msgStr){
    const msg = JSON.parse(msgStr);
    console.log("UpdateView", msg);
    view = msg;
});

socket.on('CreateGhost', async function(msgStr){
    const msg = JSON.parse(msgStr);
    let oldGhostIndex = ghostList.findIndex((t)=>(t.id == msg.id));
    if (oldGhostIndex >=0){
        ghostList.splice(oldGhostIndex, 1);
    }
    let newGhost = new Ghost(msg.id);
    ghostList.push(newGhost);
});

socket.on('RemoveGhost', async function(msgStr){
    const msg = JSON.parse(msgStr);
    let oldGhostIndex = ghostList.findIndex((t)=>(t.id == msg.id));
    if (oldGhostIndex >=0){
        ghostList.splice(oldGhostIndex, 1);
    }
});
socket.on('UpdateGhost', async function(msgStr){
    const msg = JSON.parse(msgStr);
    console.log('UpdateGhost', msg);
    let ghostIndex = ghostList.findIndex((t)=>(t.id == msg.id));
    if (ghostIndex >=0){
        const ghost = ghostList[ghostIndex];
        for (let param in msg){
            if (param == "sprite"){
                ghost[param] = await getSprite(msg[param]);
            }else{
                ghost[param] = msg[param];
            }
        }
    }
});

socket.on('AddAnimation', async function(msgStr){
    const msg = JSON.parse(msgStr);
    let ghostIndex = ghostList.findIndex((t)=>(t.id == msg.id));
    if (ghostIndex >=0){
        const ghost = ghostList[ghostIndex];
        const animation = new Animation(msg.param, msg.from, msg.to, msg.duration, msg.transition);
        ghost.addAnimation(animation);
    }
});

function draw(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    function drawGrid(dx, dy, col){
        context.beginPath();
        context.strokeStyle = col;
        context.lineWidth=1;
        for (let i=(canvas.width/2-(view.x+0.5)*view.unit*view.size) % (view.unit*view.size);
             i<canvas.width;
             i+=view.size*view.unit){
            context.moveTo(Math.round(i)+0.5 + dx, 0);
            context.lineTo(Math.round(i)+0.5 + dx, canvas.height);
        }
        for (let i=(canvas.height/2-(view.y+0.5)*view.unit*view.size) % (view.unit*view.size);
             i<canvas.height;
             i+=view.size*view.unit){
            context.moveTo(0, Math.round(i)+0.5 + dy);
            context.lineTo(canvas.width, Math.round(i)+0.5 + dy);
        }
        context.stroke();
    }
    drawGrid(0, 0, "#AAA");
    drawGrid(-2, -2, "#EEE");
    drawGrid(-1, -1, "#DDD");
    
    for (let ghost of ghostList){
        ghost.draw(context);
    }
}
setInterval(draw, 10);

function tick(){
    for (let ghost of ghostList){
        ghost.tick(0.01);
    }
}
setInterval(tick, 10);

document.addEventListener('mousedown', function(ev){
    socket.emit('message', JSON.stringify({
        type: "Event",
        event: "mousedown",
        data: {
            x: ev.clientX,
            y: ev.clientY,
            button: ev.button
        }
    }));
});

document.addEventListener('mouseup', function(ev){
    socket.emit('message', JSON.stringify({
        type: "Event",
        event: "mouseup",
        data: {
            x: ev.clientX,
            y: ev.clientY,
            button: ev.button
        }
    }));
});

document.addEventListener('keydown', function(ev){
    socket.emit('message', JSON.stringify({
        type: "Event",
        event: "keydown",
        data: {key: ev.key}
    }));
});

document.addEventListener('keyup', function(ev){
    socket.emit('message', JSON.stringify({
        type: "Event",
        event: "keyup",
        data: {key: ev.key}
    }));
});

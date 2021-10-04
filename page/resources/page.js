
let view;

const Transition = {
    linear: (t)=>(t),
    ease: (t)=>(-Math.pow(t, 3)*2 + Math.pow(t, 2)*3),
    ease_out: (t)=>(1-Math.pow(1-t, 2))
};

class Sprite{
    constructor(path, offsetX, offsetY, id, sx=0, sy=0, sWidth=undefined, sHeight=undefined){
        this.image = new Image();
        this.image.src = path;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.id = id;
        this.sx = sx;
        this.sy = sy;
        this.sWidth = sWidth;
        this.sHeight = sHeight;
        
        let self = this;
        this.image.addEventListener('load', function(){
            if (self.offsetX == undefined || self.offsetY == undefined){
                self.offsetX = Math.floor(self.image.width/2);
                self.offsetY = Math.floor(self.image.height/2);
            }
            if (self.sWidth == undefined || self.sHeight == undefined){
                self.sWidth = self.image.width;
                self.sHeight = self.image.height;
            }
        });
    }
    draw(canvas, ctx, x, y, angle=0, scale=1, alpha=1){
        if (angle == 0){
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(this.image,
                this.sx, this.sy, this.sWidth, this.sHeight,
                Math.round(canvas.width / 2 + (x - view.x) * view.unit * view.size - this.offsetX * view.size),
                Math.round(canvas.height / 2 + (y - view.y) * view.unit * view.size - this.offsetY * view.size),
                this.sWidth * view.size * scale, this.sHeight * view.size * scale
            );
        }else{
            ctx.save();
            ctx.translate(canvas.width / 2 + (x - view.x) * view.unit * view.size,
                          canvas.height / 2 + (y - view.y) * view.unit * view.size);
            ctx.rotate(angle * Math.PI / 180);
            ctx.drawImage(this.image,
                this.sx, this.sy, this.sWidth, this.sHeight,
                Math.round(-this.offsetX * view.size),
                Math.round(-this.offsetY * view.size),
                this.sWidth * view.size * scale, this.sHeight * view.size * scale
            );
            ctx.restore();
        }
    }
};

class Animation{
    constructor(param, from, to, duration=1, transition='linear'){
        this.param = param;
        this.from = from;
        this.to = to;
        this.transition = Transition[transition];
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
    draw(canvas, ctx){
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
            this.sprite.draw(canvas, ctx, param.x, param.y, param.angle, param.size, param.alpha);
        }
    }
};

class PageClient{
    constructor(canvas, url){
        // canvas: HTML Element
        // url: Full url path  ex) http://52.78.66.0:80
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        // this.socket = new WebSocketClient(url);
        this.socket = io.connect(url);
        view = {unit: 32, size: 1, x: 0, y: 0};
        this.initialize();
    }
    initialize(){
        this.initializeRequestHandler();
        this.initializeSpriteHandler();
        this.initializeGhostHandler();
        this.initializeWorker();
        this.initializeInputHandler();
    }
    initializeRequestHandler(){
        this.requestList = [];
        this.lastMsgId = 10000000;
        this.socket.on('response', (msgstr)=>{
            let msg = JSON.parse(msgstr);
            let index = this.requestList.findIndex((t)=>(t.msgId == msg.msgId));
            if (index < 0) {return;}
            this.requestList[index].resolve(msg.data);
            this.requestList.splice(index, 1);
        });
    }
    async request(msg){
        return new Promise((res, rej)=>{
            let msgId = ++this.lastMsgId;
            this.requestList.push({msgId: msgId, resolve: res});
            this.socket.emit('request', JSON.stringify({
                msgId: msgId,
                data: msg
            }));
        });
    }
    message(msg){
        this.socket.emit('message', JSON.stringify(msg));
    }
    
    initializeSpriteHandler(){
        this.spriteList = [];
    }
    async getSprite(spriteId){
        let spr = this.spriteList.find((t)=>(t.id == spriteId));
        if (spr) return spr;
        spr = await this.request({type: "sprite", spriteId: spriteId});
        let sprdata = new Sprite(spr.path, spr.offsetX, spr.offsetY, spr.id, spr.sx, spr.sy, spr.sWidth, spr.sHeight);
        this.spriteList.push(sprdata);
        return sprdata;
    }
    
    initializeGhostHandler(){
        this.ghostList = [];
        this.socket.on('UpdateView', (msg)=>{
            console.log('UpdateView');
            const data = JSON.parse(msg);
            view = data;
        });
        this.socket.on('CreateGhost', async (msg)=>{
            console.log('CreateGhost');
            const data = JSON.parse(msg);
            let oldGhostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (oldGhostIndex >=0){
                this.ghostList.splice(oldGhostIndex, 1);
            }
            let newGhost = new Ghost(data.id);
            this.ghostList.push(newGhost);
        });
        this.socket.on('RemoveGhost', async (msg)=>{
            console.log('RemoveGhost');
            const data = JSON.parse(msg);
            let oldGhostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (oldGhostIndex >=0){
                this.ghostList.splice(oldGhostIndex, 1);
            }
        });
        this.socket.on('UpdateGhost', async (msg)=>{
            const data = JSON.parse(msg);
            console.log('UpdateGhost', data);
            let ghostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (ghostIndex >=0){
                const ghost = this.ghostList[ghostIndex];
                for (let param in data){
                    if (param == "sprite"){
                        ghost[param] = await this.getSprite(data[param]);
                    }else{
                        ghost[param] = data[param];
                    }
                }
            }
        });
        this.socket.on('AddAnimation', async (msg)=>{
            const data = JSON.parse(msg);
            let ghostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (ghostIndex >=0){
                const ghost = this.ghostList[ghostIndex];
                const animation = new Animation(
                    data.param, data.from, data.to, data.duration, data.transition);
                ghost.addAnimation(animation);
            }
        });
    }
    sendCustomEvent(event, data){
        this.socket.emit('message', JSON.stringify({
            type: "CustomEvent",
            event: event,
            data: data
        }));
    }
    draw(){
        const canvas = this.canvas;
        const context = this.context;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        const drawGrid = (dx, dy, col)=>{
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
        drawGrid(0, 0, "#CCC");
        drawGrid(-2, -2, "#FCFCFC");
        drawGrid(-1, -1, "#DEDEDE");

        for (let ghost of this.ghostList){
            ghost.draw(canvas, context);
        }
    }
    tick(){
        for (let ghost of this.ghostList){
            ghost.tick(0.01);
        }
    }
    initializeWorker(){
        setInterval(()=>{this.draw()}, 10);
        setInterval(()=>{this.tick()}, 10);
    }
    initializeInputHandler(){
        document.addEventListener('mousedown', (ev)=>{
            this.socket.emit('message', JSON.stringify({
                type: "Event",
                event: "mousedown",
                data: {
                    x: ev.clientX,
                    y: ev.clientY,
                    button: ev.button
                }
            }));
        });

        document.addEventListener('mouseup', (ev)=>{
            this.socket.emit('message', JSON.stringify({
                type: "Event",
                event: "mouseup",
                data: {
                    x: ev.clientX,
                    y: ev.clientY,
                    button: ev.button
                }
            }));
        });

        document.addEventListener('keydown', (ev)=>{
            this.socket.emit('message', JSON.stringify({
                type: "Event",
                event: "keydown",
                data: {key: ev.key}
            }));
        });

        document.addEventListener('keyup', (ev)=>{
            this.socket.emit('message', JSON.stringify({
                type: "Event",
                event: "keyup",
                data: {key: ev.key}
            }));
        });

    }
};
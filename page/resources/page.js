
let view;

const Transition = {
    linear: (t)=>(t),
    ease: (t)=>(-Math.pow(t, 3)*2 + Math.pow(t, 2)*3),
    ease_out: (t)=>(1-Math.pow(1-t, 2))
};

class Sprite{
    constructor(path, offsetX, offsetY, id, imageWidth=undefined, imageHeight=undefined){
        this.image = new Image();
        this.image.src = path;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.id = id;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        
        let self = this;
        this.image.addEventListener('load', function(){
            if (self.offsetX == undefined){
                self.offsetX = Math.floor(self.image.width/2);
            }
            if (self.offsetY == undefined){
                self.offsetY = Math.floor(self.image.height/2);
            }
            if (self.imageWidth == undefined){
                self.imageWidth = self.image.width;
            }
            if (self.imageHeight == undefined){
                self.imageHeight = self.image.height;
            }
        });
    }
    draw(canvas, ctx, x, y, angle=0, scale=1, alpha=1, xIndex=0, yIndex=0){
        const sx = xIndex * this.imageWidth;
        const sy = yIndex * this.imageHeight;
        if (angle == 0){
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(this.image,
                sx, sy, this.imageWidth, this.imageHeight,
                Math.round(canvas.width / 2 + (x - view.x) * view.unit * view.size - this.offsetX * view.size),
                Math.round(canvas.height / 2 + (y - view.y) * view.unit * view.size - this.offsetY * view.size),
                this.imageWidth * view.size * scale, this.imageHeight * view.size * scale
            );
        }else{
            ctx.save();
            ctx.translate(canvas.width / 2 + (x - view.x) * view.unit * view.size,
                          canvas.height / 2 + (y - view.y) * view.unit * view.size);
            ctx.rotate(angle * Math.PI / 180);
            ctx.drawImage(this.image,
                sx, sy, this.imageWidth, this.imageHeight,
                Math.round(-this.offsetX * view.size),
                Math.round(-this.offsetY * view.size),
                this.imageWidth * view.size * scale, this.imageHeight * view.size * scale
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
        let r = this.currentTime/this.duration;
        if (r < 0) {r=0;}
        if (r > 1) {r=1;}
        r = this.transition(r);
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
        this.xIndex = 0;
        this.yIndex = 0;
        this.depth = 0;
        
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
            'xIndex': this.xIndex,
            'yIndex': this.yIndex
        };
        for (let anim of this.animationList){
            param[anim.param] = anim.value();
            if (anim.param == "xIndex" || anim.param == "yIndex"){
                param[anim.param] = Math.floor(param[anim.param]);
            }
        }
        if (this.sprite){
            this.sprite.draw(canvas, ctx, param.x, param.y, param.angle, param.size, param.alpha, param.xIndex, param.yIndex);
        }
    }
};

class UI{
    constructor(id){
        this.id = id;
        this.verticalAlign = "center";
        this.horisontalAlign = "center";
        this.verticalOffset = 0;
        this.horisontalOffset = 0;
        this.width = 0;
        this.height = 0;
        this.style = {};
    }
    update(){
        let translateX = "0";
        let translateY = "0";
        for (let attr in this.style){
            if (!['backgroundColor', 'border', 'borderRadius', 'filter'].includes(attr)) {
                console.log("CSS attribute " + attr + " not whitelisted as XSS-safe");
                continue;
            }
            this.element.style[attr] = this.style[attr];
        }
        if (!this.width){
            this.element.style.width = "";
        }else if (typeof(this.width) == "number"){
            this.element.style.width = this.width + "px";
        }else{
            this.element.style.width = this.width;
        }
        if (!this.height){
            this.element.style.height = "";
        }else if (typeof(this.height) == "number"){
            this.element.style.height = this.height + "px";
        }else{
            this.element.style.height = this.height;
        }
        if (this.verticalAlign == "center"){
            translateY = "-50%";
            this.element.style.top = "50vh";
            this.element.style.bottom = "";
        }else if (this.verticalAlign == "top"){
            this.element.style.top = this.verticalOffset + "px";
            this.element.style.bottom = "";
        }else if (this.verticalAlign == "bottom"){
            this.element.style.bottom = this.verticalOffset + "px";
            this.element.style.top = "";
        }
        if (this.horizontalAlign == "center"){
            translateX = "-50%";
            this.element.style.left = "50vw";
            this.element.style.right = "";
        }else if (this.horizontalAlign == "left"){
            this.element.style.left = this.horizontalOffset + "px";
            this.element.style.right = "";
        }else if (this.horizontalAlign == "right"){
            this.element.style.right = this.horizontalOffset + "px";
            this.element.style.left = "";
        }
        this.element.style.transform = "translate(" + translateX + ", " + translateY + ")";
    }
    remove(){
        document.body.removeChild(this.element);
        this.element.remove();
    }
};
class UIText extends UI{
    constructor(id, socket){
        super(id);
        this.text = "";
        this.fontSize = 24;
        this.element = document.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.display = "block";
        this.element.style.top = "0px";
        this.element.style.left = "0px";
        this.element.style.userSelect = "none";
        document.body.appendChild(this.element);
        this.element.onclick = (e)=>{
            socket.emit('message', JSON.stringify({
                type: "UIClick",
                id: this.id,
                btn: e.button
            }));
        };
    }
    update(){
        super.update();
        this.element.style.fontSize = this.fontSize + "px";
        this.element.innerText = this.text;
    }
};
class UIImage extends UI{
    constructor(id, socket){
        super(id);
        this.image = "";
        this.element = document.createElement("img");
        this.element.style.position = "absolute";
        this.element.style.display = "block";
        this.element.style.top = "0px";
        this.element.style.left = "0px";
        this.element.style.userSelect = "none";
        this.element.style.imageRendering = "pixelated";
        document.body.appendChild(this.element);
        this.element.onclick = (e)=>{
            socket.emit('message', JSON.stringify({
                type: "UIClick",
                id: this.id,
                btn: e.button
            }));
        };
    }
    update(){
        super.update();
        this.element.src = this.image;
    }
};
class UIInput extends UI{
    constructor(id, socket){
        super(id);
        this.text = "";
        this.fontSize = 24;
        this.element = document.createElement("input");
        this.element.style.position = "absolute";
        this.element.style.display = "block";
        this.element.style.top = "0px";
        this.element.style.left = "0px";
        this.element.style.userSelect = "none";
        document.body.appendChild(this.element);
        this.element.oninput = (e)=>{
            socket.emit('message', JSON.stringify({
                type: "UIUpdate",
                id: this.id,
                text: this.element.value
            }));
        };
        this.element.onclick = (e)=>{
            socket.emit('message', JSON.stringify({
                type: "UIClick",
                id: this.id,
                btn: e.button
            }));
        };
    }
    update(){
        super.update();
        this.element.style.fontSize = this.fontSize + "px";
        this.element.value = this.text;
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
        this.initializeUIHandler();
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
        let sprdata = new Sprite(spr.path, spr.offsetX, spr.offsetY, spr.id, spr.imageWidth, spr.imageHeight);
        this.spriteList.push(sprdata);
        return sprdata;
    }
    
    initializeGhostHandler(){
        this.ghostList = [];
        this.socket.on('UpdateView', (msg)=>{
            const data = JSON.parse(msg);
            view = data;
        });
        this.socket.on('CreateGhost', async (msg)=>{
            const data = JSON.parse(msg);
            let oldGhostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (oldGhostIndex >=0){
                this.ghostList.splice(oldGhostIndex, 1);
            }
            let newGhost = new Ghost(data.id);
            this.ghostList.push(newGhost);
        });
        this.socket.on('RemoveGhost', async (msg)=>{
            const data = JSON.parse(msg);
            let oldGhostIndex = this.ghostList.findIndex((t)=>(t.id == data.id));
            if (oldGhostIndex >=0){
                this.ghostList.splice(oldGhostIndex, 1);
            }
        });
        this.socket.on('UpdateGhost', async (msg)=>{
            const data = JSON.parse(msg);
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
    initializeUIHandler(){
        this.uiList = [];
        this.socket.on('CreateUI', async (msg)=>{
            const data = JSON.parse(msg);
            console.log("CreateUI", data);
            let oldUIIndex = this.uiList.findIndex((t)=>(t.id == data.id));
            if (oldUIIndex >=0){
                this.uiList.splice(oldUIIndex, 1);
            }
            let newUI;
            if (data.UIType == "text"){
                newUI = new UIText(data.id, this.socket);
            }else if (data.UIType == "image"){
                newUI = new UIImage(data.id, this.socket);
            }else if (data.UIType == "input"){
                newUI = new UIInput(data.id, this.socket);
            }else{
                newUI = new UI(data.id);
            }
            this.uiList.push(newUI);
        });
        this.socket.on('RemoveUI', async (msg)=>{
            const data = JSON.parse(msg);
            console.log("RemoveUI");
            let oldUIIndex = this.uiList.findIndex((t)=>(t.id == data.id));
            if (oldUIIndex >=0){
                this.uiList[oldUIIndex].remove();
                this.uiList.splice(oldUIIndex, 1);
            }
        });
        this.socket.on('UpdateUI', async (msg)=>{
            const data = JSON.parse(msg);
            console.log("UpdateUI", data);
            let uiIndex = this.uiList.findIndex((t)=>(t.id == data.id));
            if (uiIndex >=0){
                const ui = this.uiList[uiIndex];
                for (let param in data){
                    ui[param] = data[param];
                }
                ui.update();
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
        
        this.ghostList.sort((a, b)=>(b.depth-a.depth));
        
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

        document.addEventListener('mousemove', (ev)=>{
            this.socket.emit('message', JSON.stringify({
                type: "Event",
                event: "mousemove",
                data: {
                    x: ev.clientX,
                    y: ev.clientY
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
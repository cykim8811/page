
from flask import Flask, session, send_from_directory, request
from flask_socketio import SocketIO, emit
from engineio.payload import Payload

#Payload.max_decode_packets = 500

from importlib_resources import files, as_file

import json
import logging
import time
import math
import os
import threading

from .sprite import *
from .player import *
from .ui import *

class View:
    def __init__(self, unit):
        self.x = 0
        self.y = 0
        self.width = 0
        self.height = 0
        self.unit = unit
        self.size = 1
    
    def getRect(self):
        return (
            self.x - math.ceil(self.width / (2 * self.unit)),
            self.y - math.ceil(self.height / (2 * self.unit)),
            self.x + math.ceil(self.width / (2 * self.unit)),
            self.y + math.ceil(self.height / (2 * self.unit)),
        )
    
    def inRect(self, x, y, padding=2):
        if x is None or y is None:
            return False
        return abs(x - self.x) <= math.ceil(self.width / (2 * self.unit * self.size)) + padding\
            and abs(y - self.y) <= math.ceil(self.height / (2 * self.unit * self.size)) + padding

class Message:
    def __init__(self, event, message, target):
        self.event = event
        self.message = message
        self.target = target
        
class Client:
    def __init__(self, server, sid):
        self.server = server
        self.sid = sid
        self.view = View(server.config['unit'])
        self.ghostList = []
        self.messagesToSend = []
       
        self.server.lastJoinedClient = self
        self.player = self.server.world.playerClass()
        self.server.world.onPlayerJoin(self.player)
        
        
    def handleMessage(self, data):
        if data['type'] == 'WindowSizeUpdate':
            self.view.width = data['width']
            self.view.height = data['height']
            self.handleViewUpdate(send=False)
        elif data['type'] == 'UIUpdate':
            for ui in UI.uiList:
                if ui.id != data['id']: continue
                ui.text = data['text']
                ui.prevStatus['text'] = data['text']
        elif data['type'] == 'UIClick':
            for ui in UI.uiList:
                if ui.id != data['id']: continue
                ui.onClick(data['btn'])
        elif data['type'] == "Event":
            if data['event'] == "mousedown":
                threading.Thread(
                    target = self.server.world.playerClass.onMouseDown,
                    args=(
                        self.player,
                        data['data']['button'],
                        (data['data']['x'] - self.view.width/2)/(self.view.unit*self.view.size),
                        (data['data']['y'] - self.view.height/2)/(self.view.unit*self.view.size)
                    )
                ).start()
            elif data['event'] == "mouseup":
                threading.Thread(
                    target = self.server.world.playerClass.onMouseUp,
                    args=(
                        self.player,
                        data['data']['button'],
                        (data['data']['x'] - self.view.width/2)/(self.view.unit*self.view.size),
                        (data['data']['y'] - self.view.height/2)/(self.view.unit*self.view.size)
                    )
                ).start()
            elif data['event'] == "mousemove":
                threading.Thread(
                    target = self.server.world.playerClass.onMouseMove,
                    args=(
                        self.player,
                        (data['data']['x'] - self.view.width/2)/(self.view.unit*self.view.size),
                        (data['data']['y'] - self.view.height/2)/(self.view.unit*self.view.size)
                    )
                ).start()
                self.player.mouseX = (data['data']['x'] - self.view.width/2)/(self.view.unit*self.view.size)
                self.player.mouseY = (data['data']['y'] - self.view.height/2)/(self.view.unit*self.view.size)
            elif data['event'] == "keydown":
                threading.Thread(
                    target = self.server.world.playerClass.onKeyDown,
                    args=(
                        self.player,
                        data['data']['key']
                    )
                ).start()
                if data['data']['key'] not in self.player.keyPressed:
                    self.player.keyPressed.append(data['data']['key'])
            elif data['event'] == "keyup":
                threading.Thread(
                    target = self.server.world.playerClass.onKeyUp,
                    args=(
                        self.player,
                        data['data']['key']
                    )
                ).start()
                if data['data']['key'] in self.player.keyPressed:
                    self.player.keyPressed.remove(data['data']['key'])
        elif data['type'] == "CustomEvent":
            threading.Thread(
                target = self.server.world.playerClass.onCustomEvent,
                args=(
                    self.player,
                    data['event'],
                    data['data']
                )
            ).start()
    
    def handleDisconnect(self):
        self.server.world.onPlayerLeave(self.player)
    
    def handleViewUpdate(self, send=True):
        if send:
            self.emit('UpdateView', {
                'x': self.view.x,
                'y': self.view.y,
                'unit': self.view.unit,
                'size': self.view.size
            })
        newGhostList = [g.id for g in self.server.world.objectList if self.view.inRect(g.x, g.y)]
        addedGhostList = [i for i in newGhostList if i not in self.ghostList]
        removedGhostList = [i for i in self.ghostList if i not in newGhostList]
        self.ghostList = newGhostList
        for addedGhost in addedGhostList:
            self.createGhost(addedGhost)
        for removedGhost in removedGhostList:
            self.removeGhost(removedGhost)
    
    def createGhost(self, obj):
        if type(obj) is int:
            objId = obj
            obj = [t for t in self.server.world.objectList if t.id==objId][0]
        else:
            objId = obj.id
            
        self.ghostList.append(objId)
        self.emit('CreateGhost', {'id': obj.id})
        self.emit('UpdateGhost', {
            'id': obj.id,
            'x': obj.x,
            'y': obj.y,
            'angle': obj.angle,
            'size': obj.size,
            'sprite': obj.sprite.id if obj.sprite else 0,
            'alpha': obj.alpha,
            'xIndex': obj.xIndex,
            'yIndex': obj.yIndex,
            'depth': obj.depth,
        })
    
    def removeGhost(self, obj):
        if type(obj) is not int:
            objId = obj.id
        else:
            objId = obj
        if objId in self.ghostList:
            self.ghostList.remove(objId)
        self.emit('RemoveGhost', {'id': objId})
    
    def updateGhost(self, obj, updatedParams):
        updatedParams['id'] = obj.id
        self.emit('UpdateGhost', updatedParams)
    
    def createUI(self, ui):
        self.ghostList.append(ui.id)
        self.emit('CreateUI', {'id': ui.id, 'UIType': ui.UIType})
        self.emit('UpdateUI', ui.pack())
    
    def removeUI(self, ui):
        if type(ui) is not int:
            uiId = ui.id
        else:
            uiId = ui
        if uiId in self.player.uiList:
            self.player.uiList.remove(uiId)
        self.emit('RemoveUI', {'id': uiId})
    
    def updateUI(self, ui, updatedParams):
        updatedParams['id'] = ui.id
        self.emit('UpdateUI', updatedParams)
    
    def animate(self, obj, animation):
        data = animation.pack()
        data['id'] = obj.id;
        self.emit('AddAnimation', data)
    
    def onTick(self, dT):
        if len(self.messagesToSend) > 0:
            self.server.socketio.emit('package', json.dumps(self.messagesToSend), room=self.sid)
            self.messagesToSend = []
    
    def emit(self, event, data):
        if event == "response":
            self.server.socketio.emit(event, json.dumps(data))
        else:
            self.messagesToSend.append({
                'event': event,
                'data': data
            })
        
class Server:
    def __init__(self, world, config):
        self.app = Flask(__name__)
        self.socketio = SocketIO(self.app, async_mode='gevent')
        self.world = world
        self.config = {
            'resourcePath': str(files('page').joinpath("resources")),
            'unit': 128,
            'defaultSprite': Sprite("public/default.png", 16, 16, 32, 32)
        }
        for c in config:
            self.config[c] = config[c]
        
        self.disableLog()
        
        @self.app.route("/")
        def root():
            return send_from_directory(self.config['resourcePath'], "index.html")
        
        @self.socketio.on("request")
        def requestHandle(msg):
            client = session['client']
            msg = json.loads(msg)
            ret = self.handleRequest(msg['data'])
            client.emit("response", {'msgId': msg['msgId'], 'data': ret})
            
        @self.socketio.on("message")
        def messageHandle(msg):
            client = session['client']
            ret = client.handleMessage(json.loads(msg))
        
        @self.socketio.on("connect")
        def connect():
            if 'client' not in session:
                newClient = Client(self, request.sid)
                session['client'] = newClient
                self.clientList.append(newClient)
        
        @self.socketio.on("disconnect")
        def disconnect():
            client = session['client']
            client.handleDisconnect()
            # Remove Client References
            for i in reversed(range(len(self.clientList))):
                if self.clientList[i] == client:
                    del self.clientList[i]
                    del session['client']
                    break
                    
        @self.app.route("/public/<path:path>")
        def public(path):
            return send_from_directory(self.config['resourcePath'], path)
        
        @self.app.route("/<path:filepath>")
        def serveFile(filepath):
            return send_from_directory(os.getcwd(), filepath)
        
        @self.app.route("/page.js")
        def pageclient():
            return send_from_directory(str(files('page').joinpath("resources")), "page.js")
        
        # Variables
        self.clientList = []
        self.lastJoinedClient = None
        self.messageList = []
    
    def disableLog(self):
        self.app.logger.disabled = True
        logging.getLogger('werkzeug').disabled = True
        logging.getLogger('werkzeug').setLevel(logging.ERROR)
    
    def handleObjectCreate(self, obj):
        for client in self.clientList:
            if client.view.inRect(obj.x, obj.y):
                client.createGhost(obj)
    
    def handleObjectRemove(self, obj):
        for client in self.clientList:
            if client.view.inRect(obj.x, obj.y):
                client.removeGhost(obj)
    
    def handleObjectAnimate(self, obj, animation):
        for client in self.clientList:
            if client.view.inRect(obj.x, obj.y):
                client.animate(obj, animation)
    
    def handleRequest(self, msg):
        if msg['type'] == "sprite":
            spriteId = msg['spriteId']
            ret = Sprite.getSpriteById(spriteId)
            if ret:
                return ret.pack()
            else:
                return self.config['defaultSprite'].pack()
    
    def detectObjectUpdate(self):
        for obj in self.world.objectList:
            updatedParams = {}
            for param in obj.prevStatus:
                if obj.prevStatus[param] != getattr(obj, param):
                    updatedParams[param] = getattr(obj, param)
            if len(updatedParams) != 0:
                self.handleObjectUpdate(obj, updatedParams)
    
    def handleObjectUpdate(self, obj, updatedParams):
        prev = obj.prevStatus
        if 'x' in updatedParams or 'y' in updatedParams:
            obj.x = round(obj.x)
            obj.y = round(obj.y)
            updatedParams['x'] = obj.x
            updatedParams['y'] = obj.y
            for client in self.clientList:
                if client.view.inRect(obj.x, obj.y) and not client.view.inRect(prev['x'], prev['y']):
                    client.createGhost(obj)
                elif not client.view.inRect(obj.x, obj.y) and client.view.inRect(prev['x'], prev['y']):
                    client.removeGhost(obj)
        if 'sprite' in updatedParams: updatedParams['sprite'] = updatedParams['sprite'].id
        for client in self.clientList:
            if client.view.inRect(obj.x, obj.y):
                client.updateGhost(obj, updatedParams)

        for param in updatedParams:
            obj.prevStatus[param] = getattr(obj, param)
    
    def detectUIUpdate(self):
        for ui in UI.uiList:
            updatedParams = {}
            for param in ui.prevStatus:
                if param == "style" and str(ui.prevStatus['style']) != str(getattr(ui, 'style')):
                    updatedParams[param] = getattr(ui, param)
                elif ui.prevStatus[param] != getattr(ui, param):
                    updatedParams[param] = getattr(ui, param)
            if len(updatedParams) != 0:
                self.handleUIUpdate(ui, updatedParams)
                
    def handleUIUpdate(self, ui, updatedParams):
        prev = ui.prevStatus
        for client in self.clientList:
            if ui in client.player.uiList:
                client.updateUI(ui, updatedParams)

        for param in updatedParams:
            if param == "style":
                ui.prevStatus[param] = getattr(ui, param).copy()
            else:
                ui.prevStatus[param] = getattr(ui, param)
            
    def handleUIRemove(self, ui):
        for client in self.clientList:
            if ui in client.player.uiList:
                client.removeUI(ui)
                
    def run(self, host, port):
        self.socketio.start_background_task(target=self.worker)
        self.socketio.run(self.app, host, port, debug=True)
    
    def worker(self):
        while True:
            self.world.onTick(0.01)
            self.detectObjectUpdate()
            self.detectUIUpdate()
            for client in self.clientList:
                client.onTick(0.01)
            time.sleep(0.01)
            
        

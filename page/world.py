
from .server import Server
from .player import Player
import threading

class World:
    def __init__(self, playerClass=Player, config={}):
        self.playerClass = playerClass
        self.server = Server(self, config)
        self.objectList = []
        self.playerList = []
        
        self.lastObjectId = 100000
        self.lastSpriteId = 100000
    
    def onPlayerJoin(self, player):
        self.playerList.append(player)
        player.onJoin() # Synchronous. For possible initialization
    
    def onPlayerLeave(self, player):
        threading.Thread(
            target=self.playerClass.onLeave,
            args=(player,)
        ).start()
        # player.onLeave()
        self.playerList.remove(player)
    
    def onTick(self, deltaTime):
        for player in self.playerList:
            threading.Thread(
                target=self.playerClass.onTick,
                args=(player, deltaTime)
            ).start()
            # player.onTick(deltaTime)
            for key in player.keyPressed:
                threading.Thread(
                    target=self.playerClass.onKey,
                    args=(player, key, deltaTime)
                ).start()
                # player.onKey(key, deltaTime)
        for obj in self.objectList:
            obj.onTick(deltaTime)
    
    def getObjectsAt(self, x, y, check_class=None):
        x = round(x)
        y = round(y)
        return [t for t in self.objectList
                if round(t.x) == x and round(t.y) == y and (check_class is None or isinstance(t, check_class))]
    
    def addObject(self, obj):
        self.objectList.append(obj)
        self.server.handleObjectCreate(obj)
        
    def removeObject(self, obj):
        self.objectList.remove(obj)
        self.server.handleObjectRemove(obj)
    
    def serve(self, host, port):
        self.server.run(host, port)
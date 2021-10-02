
# Interface
class Player:
    def __init__(self, world):
        self.client = world.server.lastJoinedClient
        self.world = world
        self.client.handleViewUpdate()
        
    def setViewSize(self, size):
        self.client.view.size = size
        self.client.handleViewUpdate()
    
    def setViewPos(self, x, y):
        self.client.view.x = x
        self.client.view.y = y
        self.client.handleViewUpdate()
    
    # Events for overriding
    
    def onJoin(self):
        pass
    
    def onLeave(self):
        pass
    
    def onTick(self, deltaTime):
        pass
    
    def onMouseDown(self, btn, x, y):
        pass
    
    def onMouseUp(self, btn, x, y):
        pass

    def onKeyDown(self, key):
        pass
    
    def onKeyUp(self, key):
        pass


from .ui import *

# Interface
class Player:
    def __init__(self, world):
        self.client = world.server.lastJoinedClient
        self.world = world
        self.client.handleViewUpdate()
        self.keyPressed = []
        self.uiList = []
        
    def setViewSize(self, size):
        self.client.view.size = size
        self.client.handleViewUpdate()
    
    def setViewPos(self, x, y):
        self.client.view.x = x
        self.client.view.y = y
        self.client.handleViewUpdate()
    
    def addUI(self, ui):
        self.uiList.append(ui)
        self.client.createUI(ui)
    
    def createUI(self, style={}):
        ui = UIText(self.world)
        self.addUI(ui)
        ui.style = style
        return ui
    
    def createTextUI(self, text, style={}):
        ui = UIText(self.world)
        self.addUI(ui)
        ui.text = text
        ui.style = style
        return ui
    
    def createImageUI(self, src, style={}):
        ui = UIImage(self.world)
        self.addUI(ui)
        ui.image = src
        ui.style = style
        return ui
    
    def createInputUI(self, defalut="", style={}):
        ui = UIInput(self.world)
        self.addUI(ui)
        ui.text = default
        ui.style = style
        return ui
    
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
    
    def onMouseMove(self, x, y):
        pass

    def onKeyDown(self, key):
        pass
    
    def onKeyUp(self, key):
        pass
    
    def onKey(self, key, deltaTime):
        pass
    
    def onCustomEvent(self, event, data):
        pass
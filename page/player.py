
from .ui import *
import threading
import page

# Interface
class Player:
    def __init__(self):
        self.world = page.world
        self.client = self.world.server.lastJoinedClient
        self.client.handleViewUpdate()
        self.keyPressed = []
        self.uiList = []
        
    def setViewSize(self, size):
        self.client.view.size = size
        self.client.handleViewUpdate()
        
    def getViewSize(self):
        return self.client.view.size
    
    def setViewPos(self, x, y):
        self.client.view.x = x
        self.client.view.y = y
        self.client.handleViewUpdate()
        
    def getViewPos(self):
        return (self.client.view.x, self.client.view.y)
    
    def addUI(self, ui):
        if ui not in self.uiList:
            self.uiList.append(ui)
            self.client.createUI(ui)
    
    def createUI(self, style={}):
        ui = UI(self.world)
        self.addUI(ui)
        ui.style = style
        return ui
    
    def createTextUI(self, text, style={}):
        ui = UIText(self.world)
        ui.text = text
        ui.style = style
        self.addUI(ui)
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
    
    def callEvent(self, ftn, args=[]):
        threading.Thread(target=ftn, args=args).start()
    
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
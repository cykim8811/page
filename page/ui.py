
class UI:
    uiList = []
    lastId = 1000000
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.clickCount = 0
        self.style = {}  # Should be filtered!!!!! XSS vulnerable
        self.UIType = ""
        self.prevStatus = {
            'style': None,
        }
    
    def pack(self):
        return {
            'id': self.id,
            'UIType': self.UIType,
            'style': self.style,
        }
    
    def onClick(self, button):
        self.clickCount += 1
    
    def remove(self):
        self.world.server.handleUIRemove(self)
    
    def getUIById(uiId):
        for ui in UI.uiList:
            if ui.id == uiId:
                return ui
        return None

class UIText(UI):
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.verticalAlign = "center"
        self.horizontalAlign = "center"
        self.verticalOffset = 0
        self.horizontalOffset = 0
        self.clickCount = 0
        self.style = {}  # Should be filtered!!!!! XSS vulnerable
        self.UIType = "text"
        self.text = "hi"
        self.fontSize = 24
        self.width = 0
        self.height = 0
        self.prevStatus = {
            'text': None,
            'verticalAlign': None,
            'horizontalAlign': None,
            'verticalOffset': None,
            'horizontalOffset': None,
            'fontSize': None,
            'width': None,
            'height': None,
            'style': None,
        }
        
    def pack(self):
        return {
            'id': self.id,
            'text': self.text,
            'UIType': self.UIType,
            'verticalAlign': self.verticalAlign,
            'horizontalAlign': self.horizontalAlign,
            'verticalOffset': self.verticalOffset,
            'horizontalOffset': self.horizontalOffset,
            'fontSize': self.fontSize,
            'width': self.width,
            'height': self.width,
            'style': self.style,
        }


class UIImage(UI):
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.verticalAlign = "center"
        self.horizontalAlign = "center"
        self.verticalOffset = 0
        self.horizontalOffset = 0
        self.clickCount = 0
        self.style = {}  # Should be filtered!!!!! XSS vulnerable
        self.UIType = "image"
        self.image = ""
        self.width = 0
        self.height = 0
        self.prevStatus = {
            'image': None,
            'verticalAlign': None,
            'horizontalAlign': None,
            'verticalOffset': None,
            'horizontalOffset': None,
            'width': None,
            'height': None,
            'style': None,
        }
        
    def pack(self):
        return {
            'id': self.id,
            'image': self.image,
            'UIType': self.UIType,
            'verticalAlign': self.verticalAlign,
            'horizontalAlign': self.horizontalAlign,
            'verticalOffset': self.verticalOffset,
            'horizontalOffset': self.horizontalOffset,
            'width': self.width,
            'height': self.height,
            'style': self.style,
        }

class UIInput(UI):
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.verticalAlign = "center"
        self.horizontalAlign = "center"
        self.verticalOffset = 0
        self.horizontalOffset = 0
        self.clickCount = 0
        self.style = {}  # Should be filtered!!!!! XSS vulnerable
        self.UIType = "input"
        self.text = ""
        self.fontSize = 24
        self.width = 0
        self.height = 0
        self.prevStatus = {
            'text': None,
            'verticalAlign': None,
            'horizontalAlign': None,
            'verticalOffset': None,
            'horizontalOffset': None,
            'fontSize': None,
            'width': None,
            'height': None,
            'style': None,
        }
        
    def pack(self):
        return {
            'id': self.id,
            'text': self.text,
            'UIType': self.UIType,
            'verticalAlign': self.verticalAlign,
            'horizontalAlign': self.horizontalAlign,
            'verticalOffset': self.verticalOffset,
            'horizontalOffset': self.horizontalOffset,
            'fontSize': self.fontSize,
            'width': self.width,
            'height': self.height,
            'style': self.style,
        }

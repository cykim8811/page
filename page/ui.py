
class UI:
    uiList = []
    lastId = 1000000
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.prevStatus = {}
        self.UIType = ""
        self.verticalAlign = "center"
        self.horizontalAlign = "center"
        self.verticalOffset = 0
        self.horizontalOffset = 0
        self.clickCount = 0
    
    def pack(self):
        return {
            'id': self.id,
            'UIType': self.UIType,
            'verticalAlign': self.verticalAlign,
            'horizontalAlign': self.horizontalAlign,
            'verticalOffset': self.verticalOffset,
            'horizontalOffset': self.horizontalOffset,
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
        super().__init__(world)
        self.UIType = "text"
        self.text = "hi"
        self.fontSize = 24
        self.width = 300
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
            'width': None,
            'height': None,
        }


class UIImage(UI):
    def __init__(self, world):
        super().__init__(world)
        self.UIType = "image"
        self.image = ""
        self.width = 300
        self.height = 0
        self.prevStatus = {
            'image': None,
            'verticalAlign': None,
            'horizontalAlign': None,
            'verticalOffset': None,
            'horizontalOffset': None,
            'width': None,
            'height': None,
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
            'width': None,
            'height': None,
        }

class UIInput(UI):
    def __init__(self, world):
        super().__init__(world)
        self.UIType = "input"
        self.text = ""
        self.fontSize = 24
        self.width = 300
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
            'width': None,
            'height': None,
        }
    
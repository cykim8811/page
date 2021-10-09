
class UI:
    uiList = []
    lastId = 1000000
    def __init__(self, world):
        self.world = world
        UI.uiList.append(self)
        UI.lastId += 1
        self.id = UI.lastId
        self.prevStatus = {}
    
    def pack(self):
        return {
            'id': self.id,
        }
    
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
        self.text = "hi"
        self.prevStatus = {
            'text': None
        }
        
    def pack(self):
        return {
            'id': self.id,
            'text': self.text
        }

class UIImage(UI):
    pass

class UIInput(UI):
    pass
    
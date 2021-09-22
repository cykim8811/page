
class Sprite:
    lastId = 1000000
    spriteList = [] # Temporary
    def __init__(self, imagePath, offsetX, offsetY, sx=0, sy=0, sWidth=None, sHeight=None):
        self.imagePath = imagePath
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.sx = sx
        self.sy = sy
        self.sWidth = sWidth
        self.sHeight = sHeight
        Sprite.spriteList.append(self)
        Sprite.lastId += 1
        self.id = Sprite.lastId
        # ColorLenz
    
    def pack(self):
        return {
            'id': self.id,
            'path': self.imagePath,
            'offsetX': self.offsetX,
            'offsetY': self.offsetY,
            'sx': self.sx,
            'sy': self.sy,
            'sWidth': self.sWidth,
            'sHeight': self.sHeight
        }
    
    def getSpriteById(spriteId):
        for sprite in Sprite.spriteList:
            if sprite.id == spriteId:
                return sprite
        return None
    
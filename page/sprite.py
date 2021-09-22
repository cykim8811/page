
class Sprite:
    lastId = 1000000
    spriteList = [] # Temporary
    def __init__(self, imagePath, offsetX, offsetY):
        self.imagePath = imagePath
        self.offsetX = offsetX
        self.offsetY = offsetY
        Sprite.spriteList.append(self)
        Sprite.lastId += 1
        self.id = Sprite.lastId
        # ColorLenz
    
    def pack(self):
        return {
            'id': self.id,
            'path': self.imagePath,
            'offsetX': self.offsetX,
            'offsetY': self.offsetY
        }
    
    def getSpriteById(spriteId):
        for sprite in Sprite.spriteList:
            if sprite.id == spriteId:
                return sprite
        return None
    
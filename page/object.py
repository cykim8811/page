
class Object:
    def __init__(self, world):
        self.x = 0
        self.y = 0
        self.angle = 0
        self.sprite = None
        self.alpha = 1
        self.size = 1
        
        self.world = world
        
        world.lastObjectId += 1
        self.id = world.lastObjectId
        
        self.prevStatus = {
            'x': None,
            'y': None,
            'angle': None,
            'sprite': None,
            'alpha': None,
            'size': None,
        }
        
        self.world.addObject(self)
    
    def onTick(self, deltaTime):
        pass
    
    def remove(self):
        self.world.removeObject(self)
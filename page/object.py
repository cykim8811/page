
class Animation:
    def __init__(self, param, _from, _to, duration=1, transition='linear'):
        self.param = param
        self._from = _from
        self._to = _to
        self.duration = duration
        self.transition = transition
    
    def pack(self):
        return {
            'param': self.param,
            'from': self._from,
            'to': self._to,
            'duration': self.duration,
            'transition': self.transition,
        }

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
    
    def move(self, dx, dy, _time=0.3, transition='ease_out'):
        self.animate(Animation('x', self.x, self.x+dx, _time, transition))
        self.x += dx
        self.y += dy
        
    def animate(self, animation):
        self.world.server.handleObjectAnimate(self, animation)
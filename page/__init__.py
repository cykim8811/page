from page.object import Object, Animation
from page.player import Player
from page.server import View, Client, Server, Message
from page.sprite import Sprite
from page.world import World as _World
from page.ui import UI, UIText, UIImage, UIInput

__all__ = ['object', 'player', 'server', 'sprite', 'world', 'ui']

world = None
def World(*args, **kwargs):
    global world
    world = _World(*args, **kwargs)
    return world
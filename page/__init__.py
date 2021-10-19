from page.object import Object, Animation
from page.player import Player
from page.server import View, Client, Server, Message
from page.sprite import Sprite
from page.world import World as _World
from page.ui import UI, UIText, UIImage, UIInput
import time

__all__ = ['object', 'player', 'server', 'sprite', 'world', 'ui']

world = None
def World(*args, **kwargs):
    global world
    world = _World(*args, **kwargs)
    return world

def serve(*args, **kwargs):
    global world
    world.serve(*args, **kwargs)

def wait(microseconds):
    time.sleep(microseconds)
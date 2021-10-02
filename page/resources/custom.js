
const canvas = document.getElementById('main');
const pageClient = new PageClient(canvas, 'http://page-engine.site:443');

function onResize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    //TODO: add window size change detection
    pageClient.socket.emit('message', JSON.stringify(
        {type:'WindowSizeUpdate', width: canvas.width, height: canvas.height}));
}
window.addEventListener('resize', onResize, false);
onResize();

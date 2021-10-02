
const canvas = document.getElementById('main');
const pageClient = new PageClient(canvas, 'https://page-engine.site:80');

function onResize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    //TODO: add window size change detection
    pageClient.socket.emit('message', JSON.stringify(
        {type:'WindowSizeUpdate', width: canvas.width, height: canvas.height}));
}
window.addEventListener('resize', onResize, false);

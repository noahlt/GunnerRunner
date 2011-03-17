var socket;
var canvasHeight;
var canvasWidth;
var maxTunnelRadius;
var numTunnelLines = 6;
var updateTime = 20;

var initialLineAngle = 0;
var player;
var drawingContext;

function drawCircle(context, x, y, r, borderstyle, fillstyle) {
    context.beginPath();
    // syntax reminder: x, y, r, start_angle, end_angle, anticlockwise
    context.arc(x, y, r, 0, Math.PI*2, false);
    context.closePath();
    if (fillstyle != null) {
	context.fillStyle = fillstyle;
    }
    context.strokeStyle = borderstyle;
    context.lineWidth = 2;
    context.stroke();
    if (fillstyle != null) {
	context.fill();
    }
}

function Gunner() {
    this.lightDist = 1000;
    this.shipX = 0;
    this.shipY = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.indicatorDist = 1000;

    this.update = function() {
	initialLineAngle = (initialLineAngle + Math.PI/200) % (Math.PI*2);
	console.log(this);
	this.indicatorDist = (this.indicatorDist + 20) % this.lightDist;
	this.drawTunnel();
	this.drawTunnelIndicator(this.indicatorDist);
    }

    this.drawTunnelIndicator = function(indicatorDist) {
	var proportion = Math.sqrt(indicatorDist) / Math.sqrt(this.lightDist);
	var indicatorRadius = (1 - proportion) * maxTunnelRadius;
	var indicatorX = proportion * -this.shipX + this.cameraX;
	var indicatorY = proportion * -this.shipY + this.cameraY;
	drawCircle(drawingContext, indicatorX, indicatorY, indicatorRadius, '#999');
    }

    this.drawTunnel = function() { // relative to tunnel center
	drawingContext.clearRect(0, 0, this.cameraX*2, this.cameraY*2);

	// the light is at the end of the tunnel
	// relative to canvas topleft
	var lightX = -this.shipX + this.cameraX;
	var lightY = -this.shipY + this.cameraY;

	drawCircle(drawingContext, lightX, lightY, 3, '#fff', '#0f0');
	var angleDiff = Math.PI * 2 / numTunnelLines;
	var currentAngle = initialLineAngle;

	drawingContext.beginPath();
	for (var i=0; i < numTunnelLines; i++) {
	    drawingContext.moveTo(lightX, lightY);
	    drawingContext.lineTo(maxTunnelRadius * Math.cos(currentAngle) + this.cameraX,
				  maxTunnelRadius * Math.sin(currentAngle) + this.cameraY);
	    currentAngle += angleDiff;
	}
	drawingContext.closePath();
	drawingContext.lineWidth = 1;
	drawingContext.strokeStyle = '#444';
	drawingContext.stroke();
    }
    

}
function update() {
    player.update();
}

function init() {
    var maincanvas = document.getElementById('maincanvas');
    // camera is always in the center of canvas
    // relative to canvas topleft
    cameraX = maincanvas.height/2;
    cameraY = maincanvas.width/2;
    maxTunnelRadius = Math.sqrt(Math.pow(maincanvas.height, 2),
				Math.pow(maincanvas.width, 2));
    drawingContext = maincanvas.getContext('2d');
    

    socket = new io.Socket('10.41.64.64', {port: 8080});

    socket.connect();

    socket.on('connect', function(evt) {
	    console.log(evt);
	});

    socket.on('message', function(evt) {
	    drawCircle(drawingContext, evt.x, evt.y, 5, '#fff', '#f00');
	});

    socket.on('disconnect', function() {
	    alert('client disconnect');
	});


    player = new Gunner();
    player.cameraX = cameraX;
    player.cameraY = cameraY;
    setInterval(update, updateTime);
    console.log(player.lightDist);

    maincanvas.onmousemove = function(event) {
	// from middle of canvas
	player.shipX = event.pageX - player.cameraX - maincanvas.offsetLeft;
	player.shipY = event.pageY - player.cameraY - maincanvas.offsetTop;
	/*event.preventDefault();
	socket.send({x: event.pageX,
	y: event.pageY}); */
    }
}


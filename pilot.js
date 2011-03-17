var socket;
var drawingContext;
var canvasHeight;
var canvasWidth;
var maxTunnelRadius;
var numTunnelLines = 6;
var updateTime = 20;

var initialLineAngle = 0;

var lightDist = 1000;
var shipX=0, shipY=0;
var cameraX=0, cameraY=0;
var indicatorDist = 1000;

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

function drawTunnel() { // relative to tunnel center
    drawingContext.clearRect(0, 0, cameraX*2, cameraY*2);

    // the light is at the end of the tunnel
    // relative to canvas topleft
    var lightX = -shipX + cameraX;
    var lightY = -shipY + cameraY;

    drawCircle(drawingContext, lightX, lightY, 3, '#fff', '#0f0');
    var angleDiff = Math.PI * 2 / numTunnelLines;
    var currentAngle = initialLineAngle;

    drawingContext.beginPath();
    for (var i=0; i < numTunnelLines; i++) {
	drawingContext.moveTo(lightX, lightY);
	drawingContext.lineTo(maxTunnelRadius * Math.cos(currentAngle) + cameraX,
			      maxTunnelRadius * Math.sin(currentAngle) + cameraY);
	currentAngle += angleDiff;
    }
    drawingContext.closePath();
    drawingContext.lineWidth = 1;
    drawingContext.strokeStyle = '#444';
    drawingContext.stroke();
}

function drawTunnelIndicator(indicatorDist) {
    var proportion = Math.sqrt(indicatorDist) / Math.sqrt(lightDist);
    var indicatorRadius = (1 - proportion) * maxTunnelRadius;
    var indicatorX = proportion * -shipX + cameraX;
    var indicatorY = proportion * -shipY + cameraY;
    drawCircle(drawingContext, indicatorX, indicatorY, indicatorRadius, '#999');
}

function update() {
    initialLineAngle = (initialLineAngle + Math.PI/200) % (Math.PI*2);
    indicatorDist -= 20;
    if (indicatorDist < 0) {
	indicatorDist = lightDist;
    }
    drawTunnel();
    drawTunnelIndicator(indicatorDist);
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

    setInterval(update, updateTime);


    maincanvas.onmousemove = function(event) {
	// from middle of canvas
	shipX = event.pageX - cameraX - maincanvas.offsetLeft;
	shipY = event.pageY - cameraY - maincanvas.offsetTop;
	/*event.preventDefault();
	socket.send({x: event.pageX,
	y: event.pageY}); */
    }
}


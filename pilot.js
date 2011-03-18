var socket;
var canvasHeight;
var canvasWidth;
var maxTunnelRadius;
var numTunnelLines = 7;
var updateTime = 20;
var focalDist = 100;

var initialLineAngle = 0;
var player;
var drawingContext;

function drawCircle(context, x, y, r, borderstyle, fillstyle) {
    context.beginPath();
    // syntax reminder: x, y, r, start_angle, end_angle, anticlockwise
    //console.log(x,y,r);
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

function adjustFor3D(r, dist) {
    return r * focalDist / (dist + focalDist);
}

function Gunner() {
    this.lightDist = 10000;
    this.shipX = 0;
    this.shipY = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.indicatorDelta = 500; // distance between indicators
    this.indicatorOffset = 1000; 
    // distance between us and first indicator

    this.update = function() {
	initialLineAngle = (initialLineAngle + Math.PI/200) % (Math.PI*2);
	this.drawTunnel();
	this.drawTunnelIndicators();
	this.indicatorOffset = (this.indicatorOffset - 20) ;
	if (this.indicatorOffset < 0) {
	    this.indicatorOffset += this.indicatorDelta ;
	}
    }
    
    this.drawTunnelIndicators = function() {
	for (var indicatorDist = this.indicatorOffset;
	     indicatorDist < this.lightDist;
	     indicatorDist += this.indicatorDelta) {
	    var indicatorRadius = adjustFor3D(maxTunnelRadius, indicatorDist);
	    var indicatorX = this.centerX - adjustFor3D(this.shipX, indicatorDist);
	    var indicatorY = this.centerY - adjustFor3D(this.shipY, indicatorDist);
	    var color = Math.floor(200-adjustFor3D(200 ,indicatorDist));
	    drawCircle(drawingContext, indicatorX, indicatorY, indicatorRadius, 
		       'rgb(' + [color,color,color].toString() + ')');
	}
    }

    this.drawTunnel = function() { // relative to tunnel center
	drawingContext.clearRect(0, 0, this.centerX*2, this.centerY*2);

	// the light is at the end of the tunnel
	// relative to canvas topleft
	var lightX = this.centerX;
	var lightY = this.centerY;

	drawCircle(drawingContext, lightX, lightY, 3, '#fff', '#0f0');
	var angleDiff = Math.PI * 2 / numTunnelLines;
	var currentAngle = initialLineAngle;

	drawingContext.beginPath();
	for (var i=0; i < numTunnelLines; i++) {
	    drawingContext.moveTo(lightX, lightY);
	    drawingContext.lineTo(maxTunnelRadius * Math.cos(currentAngle) - this.shipX + this.centerX,
				  maxTunnelRadius * Math.sin(currentAngle) - this.shipY + this.centerY);
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
    centerX = maincanvas.height/2;
    centerY = maincanvas.width/2;
    maxTunnelRadius = Math.sqrt(Math.pow(maincanvas.height, 2) +
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
    player.centerX = centerX;
    player.centerY = centerY;
    setInterval(update, updateTime);
    console.log(player.lightDist);

    maincanvas.onmousemove = function(event) {
	// from middle of canvas
	player.shipX = (event.pageX - player.centerX - maincanvas.offsetLeft)*2;
	player.shipY = (event.pageY - player.centerY - maincanvas.offsetTop)*2;
	/*event.preventDefault();
	socket.send({x: event.pageX,
	y: event.pageY}); */
    }
}


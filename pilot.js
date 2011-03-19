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
    // we could use  a better system.
    // can I set up context before the call?
    // seperate strokeCircle, fillCircle calls? JSON object?
    // syntax reminder: x, y, r, start_angle, end_angle, anticlockwise
    //console.log(x,y,r);
    context.arc(x, y, r, 0, Math.PI*2, false);
    context.closePath();
    if (fillstyle != null) {
	context.fillStyle = fillstyle;
    }
    context.strokeStyle = borderstyle;
    context.lineWidth = 1;
    context.stroke();
    if (fillstyle != null) {
	context.fill();
    }
}

function adjustFor3D(r, dist) {
    return r * focalDist / (dist + focalDist);
}

function DonutBarrier(distance, holeradius) {
    this.distance = distance;
    this.holeradius = holeradius;
    this.draw = function() {



    };


}


function Player(role) {
    this.lightDist = 10000;
    this.shipX = 0;
    this.shipY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.indicatorDelta = 500; // distance between indicators
    this.indicatorOffset = 1000;
    // distance between us and first indicator
    this.shipVel = 20;
    this.role = role; //set from socket.io

    this.update = function() {
	initialLineAngle = (initialLineAngle + Math.PI/200) % (Math.PI*2);
	this.clear();
	this.drawTunnel();
	this.drawTunnelIndicators();
	this.indicatorOffset = (this.indicatorOffset - this.shipVel) ;
	if (this.indicatorOffset < 0) {
	    this.indicatorOffset += this.indicatorDelta;
	} else if (this.indicatorOffset > this.indicatorDelta) {
	    this.indicatorOffset -= this.indicatorDelta;
	}
	this.updateRole();
    };

    this.updateRole = function() {};


    this.drawTunnelIndicators = function() {
	for (var indicatorDist = this.indicatorOffset;
	     indicatorDist < this.lightDist;
	     indicatorDist += this.indicatorDelta) {
	    var indicatorRadius = adjustFor3D(maxTunnelRadius, indicatorDist);
	    var indicatorX = this.centerX - adjustFor3D(this.shipX, indicatorDist);
	    var indicatorY = this.centerY - adjustFor3D(this.shipY, indicatorDist);
	    var color = Math.floor(200-adjustFor3D(200 ,indicatorDist));

	    drawCircle(drawingContext, indicatorX, indicatorY, indicatorRadius,
		       'rgb(' + [color,color,color].toString() + ')',
		       (indicatorDist+this.indicatorDelta>=this.lightDist)?'rgb(' + [color,color,color].toString() + ')':null );
	}

    };

    this.clear = function() {
	drawingContext.clearRect(0, 0, this.centerX*2, this.centerY*2);
    };

    this.drawTunnel = function() {
	// the light is at the end of the tunnel (at infinity
	// relative to canvas topleft
	var lightX = this.centerX;
	var lightY = this.centerY;

	drawCircle(drawingContext, lightX, lightY, 3, '#fff', '#0f0');
	var angleDiff = Math.PI * 2 / numTunnelLines;
	var currentAngle = initialLineAngle;
	var beginTunnelRadius = adjustFor3D(maxTunnelRadius, 0);
	var triangleWidth = 10;

	// draw the frame thing
	drawingContext.fillStyle = '#000';
	drawingContext.fillRect(0, 0, player.centerX * 2, player.centerY * 2);
	drawingContext.globalCompositeOperation = 'destination-out';
	//want to clear out the center hole for the tunnel
	drawCircle(drawingContext, this.centerX - this.shipX,
		   this.centerY - this.shipY, beginTunnelRadius - 1,
		   '#000', '#000');
	drawingContext.globalCompositeOperation = 'source-over';
	//now want everything else to draw default

	//Now to draw triangles! give depth perception
	drawingContext.beginPath();
	for (var i=0; i < numTunnelLines; i++) {
	    drawingContext.moveTo(lightX, lightY);
	    var triangleAngle = currentAngle + Math.PI/2;
	    var lineEndX = beginTunnelRadius * Math.cos(currentAngle)
		- this.shipX + this.centerX,
	    lineEndY = beginTunnelRadius * Math.sin(currentAngle)
		- this.shipY + this.centerY,
	    triangleBaseX = triangleWidth * Math.cos(triangleAngle),
	    triangleBaseY = triangleWidth * Math.sin(triangleAngle);

	    drawingContext.lineTo(lineEndX + triangleBaseX,
				  lineEndY + triangleBaseY
				  );
	    drawingContext.lineTo(lineEndX - triangleBaseX,
				  lineEndY - triangleBaseY
				  );
	    drawingContext.lineTo(lightX, lightY);
	    /* this is just lines. I'll save this for now.
	    drawingContext.lineTo(beginTunnelRadius * Math.cos(currentAngle)
				  - this.shipX + this.centerX,
				  beginTunnelRadius * Math.sin(currentAngle)
				  - this.shipY + this.centerY);
	     */
	    currentAngle += angleDiff;
	}
	drawingContext.closePath();
	drawingContext.lineWidth = 1;
	drawingContext.strokeStyle = '#444';
	drawingContext.fillStyle = drawingContext.strokeStyle;
	drawingContext.stroke();
	drawingContext.fill();
	/*
	*/
    };



}

function update() {
    player.update();
}

function init() {
    var maincanvas = document.getElementById('maincanvas');
    var updateIntervalId;
    var centerY = maincanvas.height/2;
    var centerX = maincanvas.width/2;
    /*maxTunnelRadius = Math.sqrt(Math.pow(maincanvas.height, 2) +
				Math.pow(maincanvas.width, 2));*/
    maxTunnelRadius = Math.max( maincanvas.height, maincanvas.width);
    drawingContext = maincanvas.getContext('2d');

    socket = new io.Socket(window.location.hostname, {port: 8080});

    socket.connect();

    socket.on('connect', function(evt) {
		  console.log(evt);
	      });

    socket.on('message', function(evt) {
		  if ('role' in evt) {//we got a thing to tell us what role we be
		      player.role = evt.role;
		      if (player.role == 'pilot') {
			  initPilot();
		      }
		      console.log('I AM THE ' + player.role + ' F**** YEAH!!!');
		  } else if ('gameStart' in evt) {
		      clearInterval(updateIntervalId);
		      updateIntervalId = setInterval(update, updateTime);
		  } else if ('shipX' in evt) {
		      //drawCircle(drawingContext, evt.shipX, evt.shipY, 5, '#fff', '#f00');
		      if (player.role == 'gunner') {
			  player.shipX = -evt.shipX;
			  player.shipY = evt.shipY;
			  player.shipVel = -evt.shipVel;
		      }
		  }
	      });

    socket.on('disconnect', function() {
		  alert('client disconnect');
	      });


    player = new Player();

    player.centerX = centerX;
    player.centerY = centerY;
    updateIntervalId = setInterval(update, updateTime);
    disallowSelecting();

    function initPilot() {
	var accelerating = false;
	var acceleration = .5;
	var wentOutAccelerating = false;

	maincanvas.onmousemove = function(event) {
	    event.preventDefault();
	    // from middle of canvas
	    player.mouseX = (event.pageX - player.centerX - maincanvas.offsetLeft)*2;
	    player.mouseY = (event.pageY - player.centerY - maincanvas.offsetTop)*2;
	    //correct for non-square canvases
	    player.mouseX = player.mouseX/player.centerX * maxTunnelRadius;
	    player.mouseY = player.mouseY/player.centerY * maxTunnelRadius;
	};

	maincanvas.onmousedown = function(event) {
	    event.preventDefault();
	    accelerating = true;
	    console.log(player.shipVel);
	};
	maincanvas.onmouseup = function(event) {
	    event.preventDefault();
	    accelerating = false;
	};
	maincanvas.onmouseout = function(event) {
	    event.preventDefault();
	    wentOutAccelerating = accelerating;
	    accelerating = false;
	};
	maincanvas.onmouseover = function(event) {
	    event.preventDefault();
	    accelerating = wentOutAccelerating;
	};
	player.updateRole = function() {
	    var clippingSpeed = 50;
	    var mouseTrailProp = .25
		*Math.min(player.shipVel, clippingSpeed)/clippingSpeed;
	    //a noncontinuous linear hack for a logarithmic or -a/x-b curve
	    player.shipX = player.mouseX * mouseTrailProp +
		player.shipX * (1 - mouseTrailProp);
	    player.shipY = player.mouseY * mouseTrailProp +
		player.shipY * (1 - mouseTrailProp);
	    var shipPositionRadius = Math.sqrt(
					 Math.pow(player.shipX, 2)
					     + Math.pow( player.shipY, 2));
	    if ( shipPositionRadius
		> maxTunnelRadius) {
		player.shipX *= maxTunnelRadius / shipPositionRadius;
		player.shipY *= maxTunnelRadius / shipPositionRadius;
	    }
	    //console.log(player.mouseX, player.shipX, mouseTrailProp);

	    socket.send({shipX: this.shipX,
			 shipY: this.shipY,
			 shipVel: this.shipVel});
	    player.shipVel *= .99;//hard-coded friction
	    if (accelerating) {
		player.shipVel += acceleration;
	    }
	};
    }

    function disallowSelecting() {
	maincanvas.onmousemove = function(event) {
	    event.preventDefault();
	};

	maincanvas.onmousedown = function(event) {
	    event.preventDefault();
	};
	maincanvas.onmouseup = function(event) {
	    event.preventDefault();
	};
	maincanvas.onmouseout = function(event) {
	    event.preventDefault();
	};
	maincanvas.onmouseover = function(event) {
	    event.preventDefault();
	};
    }
}
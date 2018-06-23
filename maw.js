var vid = document.getElementById('videoel');
var vid_width = vid.width;
var vid_height = vid.height;
var overlay = document.getElementById('canvas');
var ctx = overlay.getContext('2d');

var tmpCanvas = document.getElementById('tmpCanvas');
var tmp_ctx = tmpCanvas.getContext('2d');

/*********** Setup of video/webcam and checking for webGL support *********/

function enablestart() {
	/*var startbutton = document.getElementById('startbutton');
	startbutton.value = "start";
	startbutton.disabled = null;*/
	startVideo();
}

function adjustVideoProportions() {
	// resize overlay and video if proportions of video are not 4:3
	// keep same height, just change width
	var proportion = vid.videoWidth/vid.videoHeight;
	vid_width = Math.round(vid_height * proportion);
	vid.width = vid_width;
	overlay.width = vid_width;
}

function gumSuccess( stream ) {
	// add camera stream if getUserMedia succeeded
	if ("srcObject" in vid) {
		vid.srcObject = stream;
	} else {
		vid.src = (window.URL && window.URL.createObjectURL(stream));
	}
	vid.onloadedmetadata = function() {
		adjustVideoProportions();
		vid.play();
	}
	vid.onresize = function() {
		adjustVideoProportions();
		if (trackingStarted) {
			ctrack.stop();
			ctrack.reset();
			ctrack.start(vid);
		}
	}
}

function gumFail() {
	alert("Can't get your webcam video. Try Firefox or Chrome instead?");
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// set up video
if (navigator.mediaDevices) {
	navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
} else if (navigator.getUserMedia) {
	navigator.getUserMedia({video : true}, gumSuccess, gumFail);
} else {
	gumFail();
}

vid.addEventListener('canplay', enablestart, false);

/*********** Code for face tracking *********/

var ctrack = new clm.tracker();
ctrack.init();
var trackingStarted = false;

function startVideo() {
	// start video
	vid.play();
	// start tracking
	ctrack.start(vid);
	trackingStarted = true;
	// start loop to draw face
	drawLoop();


	// remove loading, show controls
	document.getElementById("weeb").style.display = "block";
	document.getElementById("loading").style.display = "none";

}

var maw = new Sprite({
	src:"maw.png",
	totalFrames: 18
});

var music = document.getElementById("music");

var shake = 0;

function drawLoop() {

	// Clear
	requestAnimationFrame(drawLoop);
	ctx.fillStyle="white";
	ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
	// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.imageSmoothingEnabled = false;

	var facePositions = ctrack.getCurrentPosition();
	

	var sms = .2;  // smallening scale factor
	var smw = vid.width*sms; // small w
	var smh = vid.height*sms; // small h
	ctx.drawImage(vid, 0, 0, smw, smh);
	var imageData = ctx.getImageData(3, 3, smw, smh);
	data = imageData.data;
	var rval = 10;
	if (!facePositions) {
		var rval = 0;
	}
	for (var i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i]     = rval;     // red
      imageData.data[i + 1] = .5*imageData.data[i + 1]; // green
      imageData.data[i + 2] = .5*imageData.data[i + 2]; // blue
    }

    ctx.putImageData(imageData, 3, 3);

	if (facePositions) {
		ctx.save()
		ctx.beginPath();
		ctx.moveTo(facePositions[60][0]*sms,facePositions[60][1]*sms);
		ctx.lineTo(facePositions[57][0]*sms,facePositions[57][1]*sms);
		ctx.moveTo(facePositions[61][0]*sms,facePositions[61][1]*sms);
		ctx.lineTo(facePositions[56][0]*sms,facePositions[56][1]*sms);
		ctx.moveTo(facePositions[59][0]*sms,facePositions[59][1]*sms);
		ctx.lineTo(facePositions[58][0]*sms,facePositions[58][1]*sms);
		ctx.strokeStyle="#00FFFF";
		ctx.lineWidth=2;
		ctx.stroke();
		ctx.restore()
	}


	if (!facePositions) {

		ctx.font="20px Courier New";
		// Fill with gradient
		ctx.fillStyle="red";
		ctx.fillText("SHOW MAW",0,smh); 
		ctx.fillText("SCORE: " + ctrack.getScore(), 0, smh+20);
	}
	else {
		ctx.font="20px Courier New";
		// Fill with gradient
		ctx.fillStyle="red";
		ctx.fillText("SCORE: " + ctrack.getScore(), 0, smh+20);
	}


	// Draw Video
	ctx.save();
	ctx.scale(-1,1);
	ctx.translate(-vid.width, 0);
	ctx.save();

	ctx.restore();

	// Eye Wiggle
	if(Math.random()<0.04){
		eye_wiggle = {
			x: Math.random()*8-4,
			y: Math.random()*8-4
		};
	}

	// Weeb Level
	var level;
	var weebValue = parseInt(weebometer.value);
	switch(weebValue){
		case 2: level="20"; break;
		case 3: level="40"; break;
		case 4: level="60"; break;
		case 5: level="80"; break;
		case 6: level="9001"; break;
	}
	var label;
	if(weebValue==1){
		label = "drag slider SLOWLY... to become anime! &darr;";
	}else{
		label = "ANIME LEVEL: "+level+"%";
	}
	if(weebValue==6){
		label = "<b style='font-size:30px; letter-spcing:3px'>"+label+"</b>";
	}
	var labelDOM = document.getElementById("merge_level");
	labelDOM.innerHTML = label;

	// SHAKE
	if(weebValue==1){
		shake += 0.25;
		labelDOM.style.left = (Math.sin(shake)*4)+"px";
	}else{
		labelDOM.style.left = "0px";
	}

	var faceCenter, faceAngle, faceScale = 1;
	var mouthDistance = 0;

	// CLMTracker Face...
	if (facePositions) {

		///////////////////////
		// Figure out points //
		///////////////////////

		

		// Center
		faceCenter = [0,0];
		facePositions.forEach(function(p){
			faceCenter[0] += p[0];
			faceCenter[1] += p[1];
		});
		faceCenter[0] /= facePositions.length;
		faceCenter[1] /= facePositions.length;

		// Angle
		var dx = facePositions[47][0] - facePositions[33][0];
		var dy = facePositions[47][1] - facePositions[33][1];
		faceAngle = Math.atan2(dy,dx);

		// Scale
		var dist = Math.sqrt(dx*dx+dy*dy);
		faceScale = dist;

		var mouth_scale = 270;

		var mouthPosition = getAverageOfPoints(facePositions,[
			44, 50, 60, 57
		]);
		mouthDistance = getDistanceBetweenPoints(facePositions, 60, 57);
	}
	ctx.save();
	
	ctx.translate(300, 225);
	ctx.scale(2,2);
	maw.x=0;maw.y=0;
	maw.frame = Math.trunc(Math.max(0, Math.min(17, 17*2*mouthDistance/faceScale-3)));
	maw.draw(ctx);
	ctx.restore();

	ctx.restore();

}

function Sprite(config){
	var self = this;

	self.x = 0;
	self.y = 0;
	self.img = new Image();
	self.img.src = config.src;
	self.frame = 0;

	self.draw = function(ctx){
		
		var sw = self.img.width/config.totalFrames;
		var sh = self.img.height;
		var sx = self.frame*sw;
		var sy = 0;

		var dx = self.x - sw/2;
		var dy = self.y - sh/2;
		
		ctx.drawImage(self.img,
			sx, sy, sw, sh,
			dx, dy, sw, sh
		);

	};

}

window.weebometer = document.getElementById("weebometer");

function getAverageOfPoints(array, indices){
	var avg = [0,0];
	indices.forEach(function(i){
		avg[0] += array[i][0];
		avg[1] += array[i][1];
	});
	avg[0] /= indices.length;
	avg[1] /= indices.length;
	return avg;
}

function getDistanceBetweenPoints(array, a, b){
	var dx = array[b][0] - array[a][0];
	var dy = array[b][1] - array[a][1];
	return Math.sqrt(dx*dx+dy*dy);
}


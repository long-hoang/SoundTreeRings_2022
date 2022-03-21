/* This version is to be run locally for testing and development */ 


// Canvas API Settings & Parameters
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// note: origin starts at top left corner of canvas
// +X = going right, +Y = going down


let pointStart = new Object();
pointStart.x = canvas.width/2;
pointStart.y = canvas.height/2;


let pointEnd = new Object();
pointEnd.x = canvas.width/2;
pointEnd.y = canvas.height/2;



let angle = 0;
let radius = 0;
let angleRate = 0.002;   // rate of angle spin
let radiusRate = 0.003;   // rate of radius growth


// Set limit of the animation

let upperRandomLimit = 50;
let lowerRandomLimit = -50;

let hue = 1;
let lightness = 50;

// Web Audio API Settings & Parameters

let audio1 = new Audio();
audio1.src = 'SR001F_2.wav'; // name of the audio file (locally)

let isPlaying = false;

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioSource = audioContext.createMediaElementSource(audio1);
let analyser = audioContext.createAnalyser();
let volume = audioContext.createGain();




volume.gain.value = 0.5;   // adjust volume 

audioSource.connect(volume);
volume.connect(analyser);
analyser.connect(audioContext.destination);

analyser.fftSize = 64;


let bufferLength = analyser.fftSize;


let dataArray = new Uint8Array(bufferLength);
 

analyser.getByteTimeDomainData(dataArray);  



ctx.globalAlpha = 1.0; // line transparency

function draw(){
    ctx.lineWidth = 1;  // line width
    ctx.lineJoin = 'round';
    //ctx.strokeStyle = 'hsl('+hue+',100%,'+lightness+'%)';  
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(pointStart.x, pointStart.y);    // point start
    ctx.lineTo(pointEnd.x, pointEnd.y);    // point end
    ctx.stroke();
    
}

// Play Button
const buttonPlay = document.getElementById('buttonPlay');

buttonPlay.addEventListener('click',function(){
    audioContext.resume();
    isPlaying = true;
    audio1.play();
    animate();
    buttonPlay.disabled = true;
   
    
});


// Clear Button
const buttonClear = document.getElementById('buttonClear');

buttonClear.addEventListener('click',function(){

    clearCanvas();
    

});




// Suspend/Resume Button
const buttonSusRes = document.getElementById('buttonSusRes');

buttonSusRes.addEventListener('click',function(){
    if(audioContext.state === 'running') {
        isPlaying = false;
        audio1.pause(); 
        audioContext.suspend().then(function() {      
            buttonSusRes.textContent = 'Resume';
        });
      } else if(audioContext.state === 'suspended') {
        isPlaying = true;
        audio1.play();
        audioContext.resume().then(function() {
            buttonSusRes.textContent = 'Pause';
        });
    }
    
    animate();
    
});

// Reset Button
const buttonReset = document.getElementById('buttonReset');

buttonReset.addEventListener('click', function(){
    isPlaying = false; 
    audioContext.suspend();
    audio1.pause();
    audio1.load();
    clearCanvas();
    buttonPlay.disabled = false;
    buttonSusRes.textContent = 'Pause';
    resetCanvas();
});


let offset = 0;

function animate(){ // animate 
    
    analyser.getByteTimeDomainData(dataArray);  
    
    if((pointEnd.x < canvas.width)&&(isPlaying === true)){

        for (let i = 0; i<bufferLength; i++){
            draw();
            offset = (dataArray[i]-128);

            radius += radiusRate;
            angle += angleRate;
        
            pointStart.x = pointEnd.x;
            pointStart.y = pointEnd.y;
    
            pointEnd.x = (radius+offset)*Math.sin(angle) + canvas.width/2;
            pointEnd.y = (radius+offset)*Math.cos(angle) + canvas.height/2;
        }

    } else {
        return;
    }
      
    requestAnimationFrame(animate);
}

function clearCanvas(){    // clear canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
}

function resetCanvas(){
    angle = 0;
    radius = 0;

    pointStart.x = canvas.width/2;
    pointStart.y = canvas.height/2;

    pointEnd.x = canvas.width/2;
    pointEnd.y = canvas.height/2;
}


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


let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioSource = audioContext.createMediaElementSource(audio1);
let analyser = audioContext.createAnalyser();
let volume = audioContext.createGain();


audioContext.resume();

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

const button1 = document.getElementById('button1');

button1.addEventListener('click',function(){
    
    
    audio1.play();
    animate();

});

let offset = 0;

function animate(){
    
    analyser.getByteTimeDomainData(dataArray);  
    
    if(pointEnd.x < canvas.width){

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

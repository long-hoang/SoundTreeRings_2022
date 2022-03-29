
const trackLibrary = document.getElementById('trackLibrary'); // drop-down selector
var selectedTrack ;
updateTrackTitle();


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
audio1.src = selectedTrack; // LOAD SOUND FILE

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

// Track Library Selection 

trackLibrary.addEventListener("change",function(){
    resetAll();
    selectedTrack = trackLibrary.options[trackLibrary.selectedIndex].value; // get selected value
    audio1.src = selectedTrack; // set new track
    document.getElementById("trackTitle").innerHTML = selectedTrack;
    prevNextButtonDisableCheck();

});

// Previous & Next Buttons

const buttonPrev = document.getElementById('buttonPrev');

buttonPrev.addEventListener('click',function(){
    resetAll();
    audio1.src = trackLibrary.options[trackLibrary.selectedIndex-1].value;
    trackLibrary.selectedIndex = trackLibrary.selectedIndex-1;
    prevNextButtonDisableCheck();
    updateTrackTitle();
});


const buttonNext = document.getElementById('buttonNext');

buttonNext.addEventListener('click',function(){
    resetAll();
    audio1.src = trackLibrary.options[trackLibrary.selectedIndex+1].value;
    trackLibrary.selectedIndex = trackLibrary.selectedIndex+1;
    prevNextButtonDisableCheck();
    updateTrackTitle();
});

prevNextButtonDisableCheck(); // for first instance 

// Play Button
const buttonPlay = document.getElementById('buttonPlay');

buttonPlay.addEventListener('click',function(){
    analyser.getByteTimeDomainData(dataArray);  
    audioContext.resume();
    isPlaying = true;
    audio1.play();
    animate();
    buttonPlay.disabled = true;
    buttonSusRes.disabled = false;
});





// Suspend/Resume Button
const buttonSusRes = document.getElementById('buttonSusRes');
buttonSusRes.disabled = true;
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
    resetAll();
});


let offset = 0;

function animate(){ // animate 
    
    analyser.getByteTimeDomainData(dataArray);  
    
    if((isPlaying === true)&&(audio1.ended===false)){

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

    } else if (audio1.ended===true){
        buttonSusRes.disabled = true;
    } else {
        return;
    }

    requestAnimationFrame(animate);
}

function clearCanvas(){    // clear canvas drawings
    ctx.clearRect(0,0,canvas.width,canvas.height);
}

function resetDrawPoint(){ // reset drawing to center of canvas
    angle = 0;
    radius = 0;

    pointStart.x = canvas.width/2;
    pointStart.y = canvas.height/2;

    pointEnd.x = canvas.width/2;
    pointEnd.y = canvas.height/2;
}

function resetAll(){ // clears canvas drawing, reset track, buttons set to default
    isPlaying = false; 
    audioContext.suspend();
    audio1.pause();
    
    clearCanvas();
    buttonPlay.disabled = false;
    buttonSusRes.disabled = false;
    
    buttonSusRes.textContent = 'Pause';
    buttonSusRes.disabled = true;
    resetDrawPoint();
    audio1.load();
    
}

function prevNextButtonDisableCheck(){ // check if the track if is at edges, if true, disable next or prev buttons accordingly
    
    if(trackLibrary.selectedIndex === 0){
        buttonPrev.disabled = true;
    }else if(trackLibrary.selectedIndex !== 0){
        buttonPrev.disabled = false;
    }
    
    
    
    if(trackLibrary.selectedIndex !== trackLibrary.options.length-1){
        buttonNext.disabled = false;
    }else if(trackLibrary.selectedIndex === trackLibrary.options.length-1){
        buttonNext.disabled = true;
    }
}

function updateTrackTitle(){
    selectedTrack = trackLibrary.options[trackLibrary.selectedIndex].value; // get selected value

    document.getElementById("trackTitle").innerHTML = selectedTrack; // update title based on track 

}
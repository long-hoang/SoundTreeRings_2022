

// List of tracks and their data
// duration in seconds 
// time of recording based on hour (0 to 23), mapped to hue value (1 to 360), for background color
// location = [latitude, longitude], for line color
// longitude (-180 to +180) mapped to hue (1 to 360)
// latitude (-90 to +90) mapped to saturation (1 to 100)
var trackList = [
    {trackID:"SR001F_2.wav", duration:16, timeOfRecording: 0, location: [33.812511,-117.918976] },
    {trackID:"animals.wav", duration:44, timeOfRecording: 4, location: [66.160507,-153.369141]},
    {trackID:"waves.mp3", duration:235,timeOfRecording: 10, location: [-33.865143,151.209900]},
    {trackID:"nature.mp3", duration:59, timeOfRecording: 15, location: [90, 30]}
];


for (var track of trackList){

    document.getElementById('trackLibraryDropdown').innerHTML+='<option value ='+track.trackID+'>'+track.trackID+'</option>';

}



// drop-down selector
const trackLibraryDropdown = document.getElementById('trackLibraryDropdown'); 
var selectedTrack ;
updateTrack();



// Background Color based on timeOfRecording
const hueSlider = document.getElementById('hueSlider'); // hue slider (temporary)
var hourRange = 23; // 0 - 23 
var hueRange = 360; // 0 - 360
var hueValue;

// Line Drawing Color based on location
var lineSaturation = latitudeToSaturation(trackList[0].location[0]);
var lineHue = longitudeToHue(trackList[0].location[1]);


document.getElementById("canvas1").style.backgroundColor = 'hsl('+timeToHue(parseInt(trackList[0].timeOfRecording))+',100%,50%)'; // update background based on first track on load in

// Variable line thickness
var decibelRange = 10;
var lineWidth = 0.1;

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
    ctx.lineWidth = lineWidth;  // line width
    ctx.lineJoin = 'round';
     
    ctx.strokeStyle =  'hsl('+lineHue+','+ lineSaturation+'%,50%)'; // line stroke color
    ctx.beginPath();
    ctx.moveTo(pointStart.x, pointStart.y);    // point start
    ctx.lineTo(pointEnd.x, pointEnd.y);    // point end
    ctx.stroke();
    
    
}

// Track Library Selection 

trackLibraryDropdown.addEventListener("change",function(){
    resetAll();
    selectedTrack = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex].value; // get selected value
    audio1.src = selectedTrack; // set new track
    document.getElementById("trackTitle").innerHTML = selectedTrack;
    prevNextButtonDisableCheck();
    updateTrack();
});

// Previous & Next Buttons

const buttonPrev = document.getElementById('buttonPrev');

buttonPrev.addEventListener('click',function(){
    resetAll();
    audio1.src = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex-1].value;
    trackLibraryDropdown.selectedIndex = trackLibraryDropdown.selectedIndex-1;
    prevNextButtonDisableCheck();
    updateTrack();
});


const buttonNext = document.getElementById('buttonNext');

buttonNext.addEventListener('click',function(){
    resetAll();
    audio1.src = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex+1].value;
    trackLibraryDropdown.selectedIndex = trackLibraryDropdown.selectedIndex+1;
    prevNextButtonDisableCheck();
    updateTrack();
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
            
            offset = (dataArray[i]-128);

            draw();
            lineWidth = scaleLineThickness(offset); // controls the line thickness as function of Loudness

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
    
    if(trackLibraryDropdown.selectedIndex === 0){
        buttonPrev.disabled = true;
    }else if(trackLibraryDropdown.selectedIndex !== 0){
        buttonPrev.disabled = false;
    }
    
    
    
    if(trackLibraryDropdown.selectedIndex !== trackLibraryDropdown.options.length-1){
        buttonNext.disabled = false;
    }else if(trackLibraryDropdown.selectedIndex === trackLibraryDropdown.options.length-1){
        buttonNext.disabled = true;
    }
}

function updateTrack(){
    hueValue = timeToHue(parseInt(trackList[trackLibraryDropdown.selectedIndex].timeOfRecording));
    
    selectedTrack = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex].value; // get selected value
    
    document.getElementById("trackTitle").innerHTML = selectedTrack; // update title based on track 
    
    document.getElementById("canvas1").style.backgroundColor = 'hsl('+hueValue+',100%,50%)'; 

    lineHue = longitudeToHue(trackList[trackLibraryDropdown.selectedIndex].location[1]);
    lineSaturation = latitudeToSaturation(trackList[trackLibraryDropdown.selectedIndex].location[0]);
 


}

function timeToHue(hour){
    return hueRange*((hour)/hourRange);
}

function scaleLineThickness(input){ // controls the line thickness as function of Loudness, takes debiels, makes fraction
    return Math.abs(offset/decibelRange)+0.3; 
}

function longitudeToHue(longitude){ // convert longitude to hue value
    return 180+longitude;
}

function latitudeToSaturation(latitude){ // convert latitude to saruation value
    return 100*(90+latitude)/180;
}


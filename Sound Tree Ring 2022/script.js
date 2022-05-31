/* 1). LOAD TRACK LIST INFORMATION */
// Note1: To add a new audio track, move the audio file into the root file of the application and insert 
// manually the TrackID, timeOfRecording, and location information into trackList list below
// Note2: Location determines line base color, "loudness" determines the thickness and color variation during play
// Note3: Time of Recording determines background color 

var trackList = [
    {trackID:"SR001F_2.wav", timeOfRecording: '00:00:00', location: [33.812511,-117.918976] },
    {trackID:"animals.wav", timeOfRecording: '06:00:00', location: [66.160507,-153.369141]},
    {trackID:"waves.mp3",timeOfRecording: '10:00:00', location: [-33.865143,151.209900]},
    {trackID:"nature.mp3", timeOfRecording: '12:00:00', location: [90, 100]},
    {trackID:"dawn-early.mp3", timeOfRecording: '06:00:00', location: [90, 30]},
    {trackID:"daytime.mp3", timeOfRecording: '09:00:00', location: [-20, 30]},
    {trackID:"lateafternoon.mp3", timeOfRecording: '19:00:00', location: [33.812511,-117.918976]},
    {trackID:"nighttime.mp3", timeOfRecording: '22:00:00', location: [50, 30]}
];


for (var track of trackList){

    document.getElementById('trackLibraryDropdown').innerHTML+='<option value ='+track.trackID+'>'+track.trackID+'</option>';

}


/* 2). CANVAS API */

// First Layer, expanding contrasting background
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//  Second Layer, Spiral with noise levels
const canvasSpiral = document.getElementById('canvasSpiral');
const ctxSpiral = canvasSpiral.getContext('2d');
canvasSpiral.width = window.innerWidth;
canvasSpiral.height = window.innerHeight;



// Third Layer, "True Spiral"
const canvasTrueOverlay = document.getElementById('trueTrackOverlay');
const ctxTrueOverlay = canvasTrueOverlay.getContext('2d');
canvasTrueOverlay.width = canvas.width;
canvasTrueOverlay.height = canvas.height;


/* 3). DRAWING PARAMETERS */

// Background Range Colors based on timeOfRecording
var hourRange = 23; // 0 - 23 
var hueRange = 360; // 0 - 360

// Spiral Line Drawing Color based on location
// note: colors of drawn line are based on saturation, hue, and lightness parameters
// which are dictated by the track's location
var lineSaturation = latitudeToSaturation(trackList[0].location[0]);
var lineHue = longitudeToHue(trackList[0].location[1]);
var defaultLineHue = lineHue;
var lineLightness = 50; // default to White 

// Background Color based on time
document.getElementById("canvas1").style.backgroundColor = timeToBackgroundColor(trackList[0].timeOfRecording); // update background based on first track on load in


// Variable line thickness and color 
var decibelRange = 4; // default setting is 4, controls line thickness and color changes as a function of "loudness"
var lineWidth;


// note: origin starts at top left corner of canvas,
// To draw a line, each animation frame calls a "draw line function" which uses a start and end point
// +X = going right, +Y = going down

// Line Points (Objects): 
const pointStart = new Object();
pointStart.x = canvas.width/2;
pointStart.y = canvas.height/2;

const pointEnd = new Object();
pointEnd.x = canvas.width/2;
pointEnd.y = canvas.height/2;

// True Line Points (Objects):
const truePointStart = new Object();
truePointStart.x = canvas.width/2;
truePointStart.y = canvas.height/2;

const truePointEnd = new Object();
truePointEnd.x = canvas.width/2;
truePointEnd.y = canvas.height/2;

// True line Point list(keep track of all points drawn):
var truePoints = [];    
truePoints[0] = truePointStart;

// Spiral Drawing Animation Parameters: 
let angle = 0;  // starting angle 
let radius = 0; // starting radius
let angleRate = 0.002;   // rate of angle spin 
let radiusRate = 0.003;   // rate of radius growth 
let offset = 0; // offset from True line, dependent on loudness of sound


/* 4). CONTROLS & INFORMATION UPDATES  */


// Drop-down selector of audio tracks
const trackLibraryDropdown = document.getElementById('trackLibraryDropdown'); 
var selectedTrack ; // audio of selected track
updateTrack(); // first time loading into page


// Track Library Selection 

trackLibraryDropdown.addEventListener("change",function(){
    resetAll();
    selectedTrack = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex].value; // get selected value
    audio1.src = selectedTrack; // set new track
   
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
    audioDuration = audio1.duration;
    
    
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
    

    selectedTrack = trackLibraryDropdown.options[trackLibraryDropdown.selectedIndex].value; // get selected value
    
    let latitude = trackList[trackLibraryDropdown.selectedIndex].location[0];
    let longitude = trackList[trackLibraryDropdown.selectedIndex].location[1];

    document.getElementById("trackInfo").innerHTML = selectedTrack + ", Latitude: " + latitude +", Longitude: " + longitude; // update title based on track 
    
    document.getElementById("canvas1").style.backgroundColor = timeToBackgroundColor(trackList[trackLibraryDropdown.selectedIndex].timeOfRecording); 

    lineHue = longitudeToHue(trackList[trackLibraryDropdown.selectedIndex].location[1]);
    defaultLineHue = lineHue;
    lineSaturation = latitudeToSaturation(trackList[trackLibraryDropdown.selectedIndex].location[0]);
    
}

/* 5). WEB AUDIO API */

let audio1 = new Audio();
audio1.src = selectedTrack; // LOAD SOUND FILE

let isPlaying = false;

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioSource = audioContext.createMediaElementSource(audio1);
let analyser = audioContext.createAnalyser();
let volume = audioContext.createGain();

var time = 0; // time variable, used for storing points
var audioDuration; // total duration of track
volume.gain.value = 0.5;   // adjust volume of audio, larger number makes audio louder 
audioSource.connect(volume);
volume.connect(analyser);
analyser.connect(audioContext.destination);
analyser.fftSize = 64;
let bufferLength = analyser.fftSize;
let dataArray = new Uint8Array(bufferLength);


var trackProgressRect; // rect for progress of track
var trackBarRect = document.getElementById('trackBar').getBoundingClientRect(); // rect for just the entire bar

// Get coordinate of Mouse
var inTrackProgressArea = false;

var mouseX;
var mouseY;

var barNeedleOffset;
var barNeedlePercentage; // percent of needle on bar which can be moved
document.addEventListener("mousemove", function(event){
    mouseX = event.clientX;
    mouseY = event.clientY;
    


    if (inTrackProgressArea ===true){
        
        barNeedleOffset = event.offsetX;
        
        updateBarNeedle();
        barNeedlePercentage = 100*(event.offsetX)/trackBarRect.width;
        
        document.getElementById('trueTrackOverlay').style.opacity = 90+"%";


        
    } else {
        document.getElementById('trueTrackOverlay').style.opacity = 0+"%";
        
    }



});

/* 6). DRAWING AND ANIMATIONS */


// Draw True Line Spiral:
var trueDrawCounter = 1;

function drawTrueLine(){
    ctxTrueOverlay.lineWidth = 1;  // line width
    ctxTrueOverlay.lineJoin = 'round';
     
    ctxTrueOverlay.strokeStyle =  'black'; 
    
    
    ctxTrueOverlay.beginPath();
    ctxTrueOverlay.moveTo(truePointStart.x, truePointStart.y);    // point start
    ctxTrueOverlay.lineTo(truePointEnd.x, truePointEnd.y);    // point end
    ctxTrueOverlay.stroke();
    
    
}

// Draw Spiral: 
function draw(){
    ctxSpiral.lineWidth = lineWidth;  // line width of Spiral
    ctxSpiral.lineJoin = 'round';
     
    ctxSpiral.strokeStyle =  'hsl('+lineHue+','+ lineSaturation+'%,'+lineLightness+'%)'; // line stroke color
    
    if (editorMode === true){
        ctxSpiral.strokeStyle = lineEditorModeColor; // EDITOR MODE 
    }
    
    ctxSpiral.beginPath();
    ctxSpiral.moveTo(pointStart.x, pointStart.y);    // point start
    ctxSpiral.lineTo(pointEnd.x, pointEnd.y);    // point end
    ctxSpiral.stroke();
    
    
}



// Draw Contrasting Background Cirle:

function drawContrastCircle(){

    ctx.beginPath()
    ctx.fillStyle = '#e6e6e6'; // Color of background Circle (infill)
    ctx.strokeStyle = '#e6e6e6'; // Color of background Circle (border)
    
    if (editorMode === true){
        ctx.fillStyle = contrastCircleColor;
        ctx.strokeStyle = contrastCircleColor;
    }

    ctx.arc(pointStart.x, pointStart.y,5, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke(); 
    



}

var tic = 0;

// Animate:
function animate(){ 
    
    analyser.getByteTimeDomainData(dataArray);  
    

    if((isPlaying === true)&&(audio1.ended===false)){
        
        time = audio1.currentTime;
        timeStamps[tic] = {t: time, xCoord:truePointStart.x, yCoord: truePointStart.y, trackPercent: trackPercentProgress };
        tic++;
    
        updateTrackProgress();


        for (let i = 0; i<bufferLength; i++){
            
            offset = (dataArray[i]-128);
            
            
            lineWidth = scaleLineThickness(offset); // controls the line thickness as function of Loudness
            lineHue = scaleLineColorDecibel(offset); // controls the line lightness as function of Loudness

            draw();
            drawTrueLine();
            drawContrastCircle();
            

            
            

            radius += radiusRate;
            angle += angleRate;


            
            // line with loudness offsets
            pointStart.x = pointEnd.x;
            pointStart.y = pointEnd.y;
    
            pointEnd.x = (radius+offset)*Math.sin(angle) + canvas.width/2;
            pointEnd.y = (radius+offset)*Math.cos(angle) + canvas.height/2;

            // true line points
            truePointStart.x = truePointEnd.x;
            truePointStart.y = truePointEnd.y;

            truePointEnd.x = (radius)*Math.sin(angle) + canvas.width/2;
            truePointEnd.y = (radius)*Math.cos(angle) + canvas.height/2;

        }
        

    } else if (audio1.ended===true){
        buttonSusRes.disabled = true;
    } else {
        return;
    }
    
    requestAnimationFrame(animate);
}


// Clear Functions for each Canvas Layer:
function clearCanvas(){    // clear canvas drawings
    ctxSpiral.clearRect(0,0,canvas.width,canvas.height);

    clearTrueCanvas();
    clearContrastCircle();
    
}



function clearTrueCanvas(){
    ctxTrueOverlay.clearRect(0,0,canvas.width,canvas.height);
}

function clearContrastCircle(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
}


function resetDrawPoint(){ // reset drawing to center of canvas
    angle = 0;
    radius = 0;

    pointStart.x = canvas.width/2;
    pointStart.y = canvas.height/2;

    pointEnd.x = canvas.width/2;
    pointEnd.y = canvas.height/2;



    // True point reset
    truePointStart.x = canvas.width/2;
    truePointStart.y = canvas.height/2;

    truePointEnd.x = canvas.width/2;
    truePointEnd.y = canvas.height/2;
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

    trueDrawCounter = 0;
    
    clearTrackProgress();
    
    resetBarNeedle();

    

    timeStamps = [];
    tic = 0;
}




/* 7). MAPPING FUNCTIONS */ 


// time of recording based on hour (0 to 23), mapped to hue value (1 to 360), for background color
// location = [latitude, longitude], for line color
// longitude (-180 to +180) mapped to hue (1 to 360)
// latitude (-90 to +90) mapped to saturation (1 to 100)


function timeToBackgroundColor(timeOfRec){
    let mycolor = 'RGB(255,255,255)'; // default white color
    if((timeOfRec>='06:00:00')&&(timeOfRec<='07:59:00')){
        mycolor = 'RGB(235,234,234)'; // 6am - 7:59 am (dawn early morning)
    } else if((timeOfRec>='18:01:00')&&(timeOfRec<='19:59:00')){
        mycolor = 'RGB(62,60,61)';    // 6:01pm - 7:59pm (late afternoon-early evening)
    } else if(((timeOfRec>='20:00:00')&&(timeOfRec<='23:59:00'))||((timeOfRec>='00:00:00')&&(timeOfRec<='05:59:00'))){
        mycolor = 'RGB(0,0,0)';   // 8pm - 5:59 am (nighttime)
    }

    return mycolor;
}


function scaleLineThickness(input){ // controls the line thickness as function of Loudness, takes debiels, makes fraction
    return Math.abs(offset/decibelRange)+1; 
}

function scaleLineColorDecibel(input){ // controls the line color based on loudness
    let colorDelta =   Math.abs(offset/decibelRange)*100;
    if (colorDelta>=100){
        return defaultLineHue + 100;
    }
    return defaultLineHue + colorDelta;

}

function longitudeToHue(longitude){ // convert longitude to hue value
    return 180+longitude;
}

function latitudeToSaturation(latitude){ // convert latitude to saruation value
    return 100*(90+latitude)/180;
}



/* 8). MISC */

// Interaction with tracker bar:


document.getElementById("trackProgress").addEventListener("mouseover", function(event){
    document.getElementById("trackProgress").style.backgroundColor = "#f7f7f7";
    inTrackProgressArea = true;

});

document.getElementById("trackProgress").addEventListener("mouseout", function(){
    document.getElementById("trackProgress").style.backgroundColor = "#E7E7E7";
    inTrackProgressArea = false;
});

var timeStamps = []; // for interactive tracking purposes


// Color Selectors for Background and Line (Testing Purposes Only):

var colorEditorMode  = true; // CHANGE THIS FALSE IF COLOR PICKER IS NOT USED

const backgroundPicker = document.getElementById('backgroundPicker');
backgroundPicker.addEventListener("input", function(selected){
    document.getElementById("canvas1").style.backgroundColor = selected.target.value; 

});


const linePicker = document.getElementById('linePicker');
var lineEditorModeColor;
var editorMode = true;

linePicker.addEventListener("input", function(selected){
  
    lineEditorModeColor = selected.target.value;

});

var contrastCircleColor;
const contrastCirclePicker = document.getElementById('contrastCirclePicker');
contrastCirclePicker.addEventListener("input", function(selected){
  
    contrastCircleColor = selected.target.value;
    drawContrastCircle();

});



// Progress Bar Tracker: 

var trackPercentProgress; // real time update based on audio progress 

function updateTrackProgress(){ // update styling 
    trackPercentProgress = (audio1.currentTime/audioDuration)*100 ;
    
    document.getElementById("trackProgress").style.width = trackPercentProgress+ "%";
    trackProgressRect = document.getElementById('trackProgress').getBoundingClientRect();
    
    
}

function clearTrackProgress(){
    trackPercentProgress = 0;
    document.getElementById("trackProgress").style.width = trackPercentProgress+ "%";
}

function updateBarNeedle(){
    document.getElementById('trackBarNeedle').style.left = barNeedleOffset + "px";
}

function resetBarNeedle(){
    barNeedleOffset = 0;
    updateBarNeedle();
}





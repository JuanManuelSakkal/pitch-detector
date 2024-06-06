import { PitchDetector } from "pitchy";
import { sendFeedbackTone, stopFeedback } from "./toneGenerator";

//notes from octaves 1 to 8
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
//pitches for the notes in hz
const octave1 = [32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74]
/*
ocatave 2 = [65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47]
ocatave 3 = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94]
ocatave 4 = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88]
ocatave 5 = [523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77]
ocatave 6 = [1046.5, 1108.7, 1174.7, 1244.5, 1318.5, 1396.9, 1479.1, 1567, 1661.2, 1760, 1864.7, 1975.5]
ocatave 7 = [2093, 2217.5, 2349.3, 2489.5, 2637.0, 2793.8, 2959.0, 3135, 3322.4, 3520, 3729.3, 3951.1]
ocatave 8 = [4186.0, 4434.9, 4698.6, 4978.0, 5274.0, 5587.7, 5919.9, 6271.9, 6644.9, 7040, 7458.6, 7902.1]
*/

const octave2 = octave1.map((pitch) => pitch * 2)
const octave3 = octave2.map((pitch) => pitch * 2)
const octave4 = octave3.map((pitch) => pitch * 2)
const octave5 = octave4.map((pitch) => pitch * 2)
const octave6 = octave5.map((pitch) => pitch * 2)
const octave7 = octave6.map((pitch) => pitch * 2)
const octave8 = octave7.map((pitch) => pitch * 2)

const octaves = [octave1, octave2, octave3, octave4, octave5, octave6, octave7, octave8]

function updatePitch(analyserNode, detector, input, sampleRate) {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = detector.findPitch(input, sampleRate);
  if(pitch > 32 && pitch < 7900){

    document.getElementById("pitch").textContent = `${
      Math.round(pitch * 10) / 10
    } Hz`;
    document.getElementById("clarity").textContent = `${Math.round(
      clarity * 100,
    )} %`;

    const {note, distance} = getNote(pitch)

    const noteElement = document.getElementById("note")
    noteElement.textContent = note
    noteElement.style.color = getNoteColor(distance)
    document.getElementById("distance").textContent = distance
    document.getElementById("distanceMarker").style.left = (72.5 + distance * 72.5/50) + "px"
    if(document.getElementById("feedback").checked){
      sendFeedbackTone(note)
    }
  } else {
    stopFeedback()
  }
  window.setTimeout(
    () => updatePitch(analyserNode, detector, input, sampleRate),
    200,
  );
}

function getNoteColor(distance) {
  const red = 0 + distance * 5
  const green = 255 - Math.abs(distance) * 5 * 2
  const blue = 0 - distance * 5
  return `rgb(${red}, ${green}, ${blue})`
}

function getNote(pitch) {
  const octave = getOctave(pitch)
  console.log(octave)
  const {noteIndex, distance} = findNoteInOctave(pitch, octave)
  console.log(noteIndex)
  return {note: `${notes[noteIndex]}${octave + 1}`, distance}
}

function findNoteInOctave(pitch, octaveIndex) {
  const octave = octaves[octaveIndex]
  let distance = 0
  let noteIndex
  octave.forEach((notePitch, index) => {
    if(index == 0 && octaveIndex == 0 || index == 11 && octaveIndex == 7) return

    const prevNote = index == 0 ? octaves[octaveIndex - 1][11] : octave[index - 1]
    const nextNote = index == 11 ? octaves[octaveIndex + 1][0] : octave[index + 1]

    const pitchRange = [notePitch - (notePitch - prevNote) / 2.0, notePitch + (nextNote - notePitch) / 2.0]
    //console.log(pitchRange)

    if(pitch >= pitchRange[0] && pitch <= pitchRange[1]){
      distance = pitch - notePitch
      let total = pitchRange[1] - pitchRange[0]
      distance = distance * 100 / total
      console.log(distance)
      console.log(index)
      noteIndex = index
    }

  })
  return {noteIndex, distance}

}

function getOctave(pitch) {
  let oct = -1
  octaves.forEach((octave, index) => {
    const prevNote = index == 0 ? 0 : octaves[index - 1][11]
    const nextNote = index == 7 ? 9999999 : octaves[index + 1][0]
    const pitchRange = [octave[0] - (octave[0] - prevNote) / 2.0, octave[11] + (nextNote - octave[11]) / 2.0]
    if(pitch > pitchRange[0] && pitch < pitchRange[1])
      { 
        oct = index
      }
  })
  return oct
}

document.addEventListener("DOMContentLoaded", () => {
  const audioContext = new window.AudioContext();
  const analyserNode = audioContext.createAnalyser();

  document
    .getElementById("resume-button")
    .addEventListener("click", () => audioContext.resume());

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioContext.createMediaStreamSource(stream).connect(analyserNode);
    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);

    detector.minVolumeDecibels = -14;

    const input = new Float32Array(detector.inputLength);

    updatePitch(analyserNode, detector, input, audioContext.sampleRate);
  });
});
import * as Tone from "tone";

const synth = new Tone.Synth().toDestination();
let currentNote
export const sendFeedbackTone = (note) => {
    if(currentNote != note){
        currentNote = note
        const now = Tone.now();
        synth.triggerAttack(note);
    }
}

export const stopFeedback = () => {
    console.log("releasing")
    //synth.triggerRelease();
}
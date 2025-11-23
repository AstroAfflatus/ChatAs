declare global {
  interface Window {
    Tone: any;
  }
}

export const playRingtone = async () => {
  if (window.Tone) {
    await window.Tone.start();
    const synth = new window.Tone.Synth().toDestination();
    // Simple ringtone pattern
    const now = window.Tone.now();
    synth.triggerAttackRelease("C5", "8n", now);
    synth.triggerAttackRelease("E5", "8n", now + 0.2);
    synth.triggerAttackRelease("G5", "8n", now + 0.4);
    
    // Repeat
    const loop = new window.Tone.Loop((time: any) => {
        synth.triggerAttackRelease("C5", "8n", time);
        synth.triggerAttackRelease("E5", "8n", time + 0.2);
    }, "2n").start(0);
    
    window.Tone.Transport.start();
    return loop;
  }
  return null;
};

export const stopRingtone = () => {
  if (window.Tone) {
    window.Tone.Transport.stop();
    window.Tone.Transport.cancel();
  }
};
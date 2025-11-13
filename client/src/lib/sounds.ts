class SoundManager {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  playClick() {
    if (!this.enabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  playCorrect() {
    if (!this.enabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 1200;
    gainNode.gain.value = 0.15;
    
    oscillator.start();
    oscillator.frequency.exponentialRampToValueAtTime(1400, this.context.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  playError() {
    if (!this.enabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 400;
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  playSuccess() {
    if (!this.enabled || !this.context) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.context!.createOscillator();
        const gainNode = this.context!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context!.destination);
        
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.15;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + 0.3);
        oscillator.stop(this.context!.currentTime + 0.3);
      }, index * 100);
    });
  }
}

export const soundManager = new SoundManager();

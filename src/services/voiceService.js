/**
 * Voice Service for Speech-to-Text and Text-to-Speech
 * Uses browser's native Web Speech API (100% FREE, no API key needed!)
 */

/**
 * Check if browser supports speech recognition
 */
export function isSpeechRecognitionSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Check if browser supports speech synthesis
 */
export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Speech-to-Text (Voice Input)
 * Uses browser's native Web Speech API
 */
export class SpeechRecognitionService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      if (this.onResultCallback) {
        this.onResultCallback(transcript, isFinal);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  start(onResult, onError, onEnd) {
    if (this.isListening) {
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (onError) {
        onError(error.message);
      }
    }
  }

  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  setLanguage(lang) {
    this.recognition.lang = lang;
  }
}

/**
 * Text-to-Speech (Voice Output)
 * Uses browser's native Speech Synthesis API
 */
export class SpeechSynthesisService {
  constructor() {
    if (!isSpeechSynthesisSupported()) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to load
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * Get preferred voice (English, female if available)
   */
  async getPreferredVoice() {
    const voices = await this.getVoices();
    
    // Try to find a good English voice
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    
    // Prefer female voices
    const femaleVoice = englishVoices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria')
    );
    
    if (femaleVoice) return femaleVoice;
    
    // Fallback to any English voice
    if (englishVoices.length > 0) return englishVoices[0];
    
    // Last resort: first available voice
    return voices[0];
  }

  /**
   * Speak text
   */
  async speak(text, options = {}) {
    // Stop any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voice = await this.getPreferredVoice();
    utterance.voice = voice;
    
    // Set options
    utterance.rate = options.rate || 1.0; // 0.1 to 10
    utterance.pitch = options.pitch || 1.0; // 0 to 2
    utterance.volume = options.volume || 1.0; // 0 to 1
    utterance.lang = options.lang || 'en-US';

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (options.onError) options.onError(event.error);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Pause speaking
   */
  pause() {
    if (this.isSpeaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume() {
    if (this.isSpeaking) {
      this.synth.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow() {
    return this.isSpeaking;
  }
}

/**
 * Utility function to create speech recognition instance
 */
export function createSpeechRecognition() {
  if (!isSpeechRecognitionSupported()) {
    console.warn('Speech recognition not supported');
    return null;
  }
  return new SpeechRecognitionService();
}

/**
 * Utility function to create speech synthesis instance
 */
export function createSpeechSynthesis() {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported');
    return null;
  }
  return new SpeechSynthesisService();
}

/**
 * Quick speak function for convenience
 */
export async function speak(text, options = {}) {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported');
    return;
  }
  
  const tts = createSpeechSynthesis();
  await tts.speak(text, options);
}

/**
 * Get browser compatibility info
 */
export function getVoiceCapabilities() {
  return {
    speechRecognition: isSpeechRecognitionSupported(),
    speechSynthesis: isSpeechSynthesisSupported(),
    browser: navigator.userAgent,
    recommendedBrowser: !isSpeechRecognitionSupported() ? 'Chrome, Edge, or Safari' : null
  };
}

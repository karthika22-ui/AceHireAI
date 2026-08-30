// Service for High-Quality Tamil Female AI Voice Synthesis with Web Speech API Fallback
export interface TTSOptions {
  text: string;
  language?: 'English' | 'Tanglish' | 'Tamil';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;

  // Speak feedback text with natural Tamil female voice
  public async speak(options: TTSOptions): Promise<void> {
    const { text, language = 'Tanglish', onStart, onEnd, onError } = options;

    if (!text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    // Stop any ongoing audio playback or speech synthesis
    this.stop();

    const isTamilScript = /[\u0B80-\u0BFF]/.test(text);
    const isTamilOrTanglish = isTamilScript || language === 'Tanglish' || language === 'Tamil';

    // 1. Google Cloud TTS REST Endpoint (if API key is present in env)
    const env = (import.meta as any).env || {};
    const googleApiKey = env.VITE_GOOGLE_TTS_API_KEY || env.VITE_API_KEY;

    if (googleApiKey && typeof window !== 'undefined') {
      try {
        const targetVoice = isTamilOrTanglish ? 'ta-IN-Wavenet-A' : 'en-IN-Wavenet-A';
        const targetLang = isTamilOrTanglish ? 'ta-IN' : 'en-IN';

        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: targetLang, name: targetVoice, ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 1.0 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioContent) {
            const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
            this.currentAudio = new Audio(audioSrc);

            this.currentAudio.onplay = () => {
              if (onStart) onStart();
            };
            this.currentAudio.onended = () => {
              if (onEnd) onEnd();
            };
            this.currentAudio.onerror = (e) => {
              console.warn('Google TTS audio playback error, using Web Speech API fallback', e);
              this.fallbackWebSpeech(text, isTamilOrTanglish, onStart, onEnd, onError);
            };

            await this.currentAudio.play();
            return;
          }
        }
      } catch (e) {
        console.warn('Google Cloud TTS REST error, using Web Speech API fallback:', e);
      }
    }

    // 2. High-Quality Web Speech API Fallback
    this.fallbackWebSpeech(text, isTamilOrTanglish, onStart, onEnd, onError);
  }

  // Web Speech API fallback with female Tamil voice priority and 350ms sentence pauses
  private fallbackWebSpeech(
    text: string,
    isTamilOrTanglish: boolean,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError('Web Speech API not supported in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Split feedback into short sentences for natural pauses
      const rawSentences = text.split(/([.!?]+)/);
      const sentences: string[] = [];
      for (let i = 0; i < rawSentences.length; i += 2) {
        const part = rawSentences[i]?.trim();
        const punct = rawSentences[i + 1] || '.';
        if (part && part.length > 0) {
          sentences.push(part + punct);
        }
      }

      if (sentences.length === 0) {
        sentences.push(text);
      }

      const maleKeywords = ['male', 'david', 'mark', 'george', 'ravi', 'valluvar', 'guy', 'boy', 'man'];

      const getBestFemaleVoice = (voices: SpeechSynthesisVoice[]) => {
        if (isTamilOrTanglish) {
          // 1. Strict Tamil Female Voice (ta-IN, Latha, Google தமிழ், Female)
          const tamilFemaleVoice = voices.find((v) => {
            const nameLower = v.name.toLowerCase();
            const langLower = v.lang.toLowerCase();
            const isTa = langLower.includes('ta') || nameLower.includes('tamil');
            const isMale = maleKeywords.some((m) => nameLower.includes(m));
            return isTa && !isMale;
          });

          if (tamilFemaleVoice) {
            return { voice: tamilFemaleVoice, lang: 'ta-IN' };
          }

          // 2. Any Tamil voice
          const anyTamilVoice = voices.find((v) => v.lang.toLowerCase().includes('ta') || v.name.toLowerCase().includes('tamil'));
          if (anyTamilVoice) {
            return { voice: anyTamilVoice, lang: 'ta-IN' };
          }

          // 3. Indian Female Voice for Tanglish
          const indianFemaleVoice = voices.find((v) => {
            const nameLower = v.name.toLowerCase();
            const langLower = v.lang.toLowerCase();
            const isEnIn = langLower.includes('en-in') || nameLower.includes('india');
            const isMale = maleKeywords.some((m) => nameLower.includes(m));
            return isEnIn && !isMale;
          });
          if (indianFemaleVoice) {
            return { voice: indianFemaleVoice, lang: 'en-IN' };
          }
        }

        // English Female Voice
        const englishFemaleVoice = voices.find((v) => {
          const nameLower = v.name.toLowerCase();
          const isFemale = nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('google us english') || nameLower.includes('samantha') || nameLower.includes('victoria') || nameLower.includes('natural');
          const isMale = maleKeywords.some((m) => nameLower.includes(m));
          return isFemale && !isMale;
        });

        return {
          voice: englishFemaleVoice || voices[0] || null,
          lang: isTamilOrTanglish ? 'ta-IN' : 'en-US',
        };
      };

      const playQueue = () => {
        const voices = window.speechSynthesis.getVoices();
        const { voice: targetVoice, lang: targetLang } = getBestFemaleVoice(voices);

        if (onStart) onStart();

        let currentIndex = 0;
        const speakNextSentence = () => {
          if (currentIndex >= sentences.length) {
            if (onEnd) onEnd();
            return;
          }

          const sentenceText = sentences[currentIndex];
          currentIndex++;

          const utterance = new SpeechSynthesisUtterance(sentenceText);
          utterance.rate = 0.64; // Slow, patient, crystal clear student-friendly speed
          utterance.pitch = 1.1;  // Clear female pitch
          utterance.volume = 0.85; // Comfortable volume
          if (targetVoice) utterance.voice = targetVoice;
          if (targetLang) utterance.lang = targetLang;

          utterance.onend = () => {
            // Add a 350ms natural pause between sentences
            setTimeout(speakNextSentence, 350);
          };

          utterance.onerror = (err) => {
            if (onError) onError(err);
            if (onEnd) onEnd();
          };

          window.speechSynthesis.speak(utterance);
        };

        speakNextSentence();
      };

      const loadedVoices = window.speechSynthesis.getVoices();
      if (!loadedVoices || loadedVoices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          playQueue();
        };
        setTimeout(() => {
          if (window.speechSynthesis.getVoices().length > 0) {
            playQueue();
          }
        }, 350);
      } else {
        playQueue();
      }
    } catch (e) {
      if (onError) onError(e);
      if (onEnd) onEnd();
    }
  }

  // Stop any active audio or speech synthesis
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const ttsService = new TTSService();
export default ttsService;

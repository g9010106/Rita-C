import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Mic, 
  Sparkles, 
  Volume2, 
  Ear,
  Compass,
  Trophy,
  Star,
  Info
} from 'lucide-react';
import { DialogueLine, UserProfile, DialogueUnit } from '../types';

function getBestVoiceForLang(list: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const targetLang = lang.toLowerCase();
  const matching = list.filter(v => {
    const vlang = v.lang.toLowerCase();
    return vlang === targetLang || vlang.replace('_', '-').startsWith(targetLang.substring(0, 2));
  });

  if (matching.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice) => {
    let score = 0;
    const name = v.name.toLowerCase();
    
    if (name.includes('premium')) score += 150;
    if (name.includes('natural')) score += 120;
    if (name.includes('google')) score += 100;
    if (name.includes('siri') || name.includes('apple')) score += 80;
    if (name.includes('microsoft')) score += 70;
    
    // specific known good voices
    if (name.includes('samantha')) score += 60;
    if (name.includes('alex')) score += 55;
    if (name.includes('daniel')) score += 50;
    if (name.includes('fiona')) score += 45;
    if (name.includes('moira')) score += 45;
    if (name.includes('hazel')) score += 40;
    
    // Chinese high quality
    if (name.includes('mei-jia') || name.includes('meijia')) score += 80;
    if (name.includes('sin-ji') || name.includes('sinji')) score += 75;
    if (name.includes('ting-ting') || name.includes('tingting')) score += 70;
    if (name.includes('ya-ting') || name.includes('yating')) score += 70;
    if (name.includes('hanhan')) score += 65;
    if (name.includes('国语') || name.includes('國語')) score += 50;

    if (v.lang.toLowerCase() === targetLang) {
      score += 20;
    }
    return score;
  };

  return [...matching].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

const isRecommendedVoice = (v: SpeechSynthesisVoice) => {
  const name = v.name.toLowerCase();
  return name.includes('google') || name.includes('premium') || name.includes('natural') || name.includes('siri') || name.includes('samantha') || name.includes('mei-jia') || name.includes('ting-ting') || name.includes('sin-ji') || name.includes('ya-ting') || name.includes('daniel');
};

interface DialoguePlayerProps {
  activeProfile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  selectedUnitId: string;
  onSelectUnitId: (id: string) => void;
  allDialogues: DialogueUnit[];
}

export default function DialoguePlayer({ 
  activeProfile, 
  onUpdateProfile,
  selectedUnitId,
  onSelectUnitId,
  allDialogues
}: DialoguePlayerProps) {
  // 1. Selector State
  const activeUnit = allDialogues.find(d => d.id === selectedUnitId) || allDialogues[0];

  // 2. Playback Queue States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  // 3. Speed and Settings
  const [speed, setSpeed] = useState<number>(0.85);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);

  // 4. Interactive Speaking Practice States
  const [activePracticeId, setActivePracticeId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [matchedWords, setMatchedWords] = useState<string[]>([]);
  const [recognitionError, setRecognitionError] = useState<string>('');

  // 5. High quality voice state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedEnVoice, setSelectedEnVoice] = useState<string>('');
  const [showVoicePanel, setShowVoicePanel] = useState<boolean>(false);

  // Voices & Web Speech references
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        if (!synthRef.current) return;
        const allVoices = synthRef.current.getVoices();
        setVoices(allVoices);

        const savedEn = localStorage.getItem('coolplay_sel_en_voice');

        const bestEn = getBestVoiceForLang(allVoices, 'en-US');

        if (savedEn && allVoices.some(v => v.name === savedEn)) {
          setSelectedEnVoice(savedEn);
        } else if (bestEn) {
          setSelectedEnVoice(bestEn.name);
        }
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
          setSpokenTranscript('');
          setPracticeScore(null);
          setMatchedWords([]);
          setRecognitionError('');
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript || '';
          setSpokenTranscript(resultText);
          
          if (activePracticeId) {
            const currentLine = activeUnit.lines.find(l => l.id === activePracticeId);
            if (currentLine) {
              evaluateSpeaking(currentLine.text, resultText);
            }
          }
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error === 'no-speech') {
            setRecognitionError('沒有偵測到您的聲音，請大聲一點再試一次！');
          } else if (event.error === 'not-allowed') {
            setRecognitionError('瀏覽器麥克風權限被拒絕，請開啟權限解鎖語音練習！');
          } else {
            setRecognitionError(`辨識失敗: ${event.error}`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
        synthRef.current.onvoiceschanged = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch(e){}
      }
    };
  }, [activePracticeId, selectedUnitId]);

  // Handle Unit Selection and immediate reset
  const handleSelectUnit = (unitId: string) => {
    onSelectUnitId(unitId);
    // Cancel any active playing or practice
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e){}
    }
    setIsPlaying(false);
    setPlayingIndex(null);
    setActivePracticeId(null);
    setIsListening(false);
    setSpokenTranscript('');
    setPracticeScore(null);
    setMatchedWords([]);
    setRecognitionError('');
  };

  // Helper function to synthesize English-only Speech
  const speakTextEnglishOnly = (text: string, onEndCallback?: () => void) => {
    if (!synthRef.current) {
      onEndCallback?.();
      return;
    }

    synthRef.current.cancel(); // cancel any active speech

    // Clean speaker prefixes if present (e.g., "Sarah: ") to avoid reading them out
    const cleanText = text.replace(/^(Sarah|Mark|Receptionist|Bell Boy|Waiter|Sarah Robinson):\s*/i, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = speed;

    // Apply the selected English voice
    const chosenVoice = voices.find(v => v.name === selectedEnVoice) || getBestVoiceForLang(voices, 'en-US');
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    }

    currentUtteranceRef.current = utterance;

    utterance.onend = () => {
      onEndCallback?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      onEndCallback?.(); // continue queue even on error
    };

    synthRef.current.speak(utterance);
  };

  // Speaks a singular line when clicked
  const handleSpeakSingleLine = (text: string) => {
    // Turn off continuous playing if any
    setIsPlaying(false);
    setPlayingIndex(null);
    
    speakTextEnglishOnly(text);
  };

  // Evaluation of Speaking Practice
  const evaluateSpeaking = (original: string, spoken: string) => {
    // Normalize string: lowercase and omit punctuation
    const cleanOrig = original.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/gi, '').split(/\s+/).filter(w => w.length > 0);
    const cleanSpok = spoken.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/gi, '').split(/\s+/).filter(w => w.length > 0);

    const matches: string[] = [];
    cleanOrig.forEach(word => {
      if (cleanSpok.includes(word)) {
        matches.push(word);
      }
    });

    setMatchedWords(matches);
    const rawScore = cleanOrig.length > 0 ? (matches.length / cleanOrig.length) * 100 : 0;
    const finalScore = Math.min(100, Math.round(rawScore));
    setPracticeScore(finalScore);

    // Reward XP system based on accuracy
    if (finalScore >= 50) {
      const xpReward = finalScore >= 80 ? 20 : 10;
      onUpdateProfile({
        ...activeProfile,
        xp: activeProfile.xp + xpReward
      });
    }
  };

  // Trigger microphone speech practice for a specific line
  const handleStartPractice = (line: DialogueLine) => {
    // 1. Terminate continuous playing
    setIsPlaying(false);
    setPlayingIndex(null);

    // 2. Clear state and speak first
    setActivePracticeId(line.id);
    setSpokenTranscript('');
    setPracticeScore(null);
    setMatchedWords([]);
    setRecognitionError('');

    // Pre-read in English to guide the child
    speakTextEnglishOnly(line.text, () => {
      // Once reading completes, turn on listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Speechrecognition already running or aborted', err);
        }
      } else {
        setRecognitionError('警告：您的瀏覽器似乎不支援語音辨識功能。推薦使用 Google Chrome！');
      }
    });
  };

  // Continuous playback sequence (連續播放)
  useEffect(() => {
    if (!isPlaying) {
      setPlayingIndex(null);
      return;
    }

    if (playingIndex === null) {
      setPlayingIndex(0);
      return;
    }

    const currentLine = activeUnit.lines[playingIndex];
    if (!currentLine) {
      // Loop back to beginning or stop
      setIsPlaying(false);
      setPlayingIndex(null);
      return;
    }

    // Play English narration
    speakTextEnglishOnly(currentLine.text, () => {
      // Schedule next line
      const timer = setTimeout(() => {
        if (playingIndex < activeUnit.lines.length - 1) {
          setPlayingIndex(prev => (prev !== null ? prev + 1 : null));
        } else {
          // Reached the end! Let's stop playing
          setIsPlaying(false);
          setPlayingIndex(null);
        }
      }, 1500); // 1.5 seconds pause between lines for kids to digest/shadow

      return () => clearTimeout(timer);
    });

  }, [isPlaying, playingIndex, selectedUnitId, speed]);

  // Toggle continuous play state
  const handleToggleContinuousPlay = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (isPlaying) {
      setIsPlaying(false);
      setPlayingIndex(null);
    } else {
      // Reset practice states
      setActivePracticeId(null);
      setIsListening(false);
      
      setIsPlaying(true);
      setPlayingIndex(0);
    }
  };

  // Speed Adjustment helper
  const handleCycleSpeed = () => {
    const speeds = [0.75, 0.85, 1.0, 1.15];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  return (
    <div className="px-4 py-2 space-y-6">
      
      {/* 1. U01 Banner Unit-Selector Jumper (選單元 跳至單元播放) */}
      <div id="unit_selector_container" className="bg-white border-4 border-emerald-300 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-emerald-400" />
        <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase block">語音情境選擇 (Select Unit)</span>
        
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mt-1 mb-3">
          <Compass className="w-4.5 h-4.5 text-emerald-500 animate-spin-slow" />
          APP 能選單元：點擊下方氣泡即刻跳轉播放單元！
        </h3>

        {/* Horizontal Unit Grid selection Pills */}
        <div className="flex flex-col gap-2.5">
          {allDialogues.map((dialogue) => {
            const isSelected = dialogue.id === selectedUnitId;
            return (
              <button
                key={dialogue.id}
                onClick={() => handleSelectUnit(dialogue.id)}
                className={`py-2 px-4 rounded-full border-2 text-left cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold shadow-sm scale-[1.01]' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black text-white shrink-0 ${
                    isSelected ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}>
                    {dialogue.unitNo}
                  </span>
                  <span className="text-[11.5px] truncate">{dialogue.name}</span>
                  {!dialogue.isPreset && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-black shrink-0">
                      家長自訂
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[9.5px] font-black shrink-0">
                  {isSelected ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      學習中
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-slate-600">切換此單元</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Dialogue Presentation Frame */}
      <div id="dialogue_main_stage" className="bg-white rounded-[36px] border-4 border-blue-200 shadow-xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-3 bg-blue-400" />
        
        {/* Active Unit Metadata Card */}
        <div className="px-5 pt-6 pb-3 bg-blue-50/50 border-b-2 border-blue-100/60">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase">
              {activeUnit.unitNo} 情境會話
            </span>
            <div className="flex gap-1">
              {activeUnit.vocabularies.map((v) => (
                <span key={v} className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  {v}
                </span>
              ))}
            </div>
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 leading-snug">{activeUnit.name}</h2>
          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">{activeUnit.description}</p>
        </div>

        {/* Scrollable Dialogue Bubble List */}
        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto bg-slate-50/20">
          {activeUnit.lines.map((line, index) => {
            const isLineActive = playingIndex === index;
            const isLinePracticed = activePracticeId === line.id;
            const isSarah = line.speaker === 'Sarah';

            return (
              <div 
                key={line.id} 
                className={`flex flex-col space-y-1 transition-all duration-300 ${
                  isSarah ? 'items-start' : 'items-end'
                }`}
              >
                {/* Character Name + Avatar */}
                <div className="flex items-center gap-1.5 px-1.5 text-[10.5px] font-black text-slate-500">
                  <span>{line.avatar}</span>
                </div>

                {/* Bubble Container */}
                <div className="max-w-[85%] relative group">
                  <div 
                    onClick={() => handleSpeakSingleLine(line.text)}
                    className={`p-4 rounded-3xl cursor-pointer text-xs md:text-sm shadow-sm border-2 transition-all hover:scale-[1.01] ${
                      isSarah 
                        ? 'bg-amber-10/20 border-yellow-200 rounded-tl-sm text-left' 
                        : 'bg-sky-10/10 border-sky-200 rounded-tr-sm text-left'
                    } ${
                      isLineActive 
                        ? 'ring-4 ring-orange-400 border-orange-400 bg-orange-50/10 scale-[1.03] shadow-md' 
                        : ''
                    }`}
                  >
                    {/* EN text sentence with bold vocabulary highlighting */}
                    <p className="font-extrabold text-slate-900 leading-relaxed font-sans text-[13px] md:text-sm">
                      {/* Highlight preset vocabularies in original text */}
                      {cleanAndHighlightText(line.text, activeUnit.vocabularies)}
                    </p>

                    {/* ZH text sentence */}
                    {showTranslation && (
                      <p className="text-[11px] text-slate-500 mt-2 font-medium border-t border-dashed border-slate-150 pt-1.5 leading-normal">
                        {line.translation}
                      </p>
                    )}

                    {/* Cute dynamic speaker indicator */}
                    {isLineActive && (
                      <div className="flex items-center gap-1 mt-2 text-[9px] font-extrabold text-orange-600 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        <span>正在為您朗讀英文... (Speaking English)</span>
                      </div>
                    )}
                  </div>

                  {/* Bubble action toolbar (Speaking practice) */}
                  <div className={`mt-1 flex items-center gap-1.5 ${
                    isSarah ? 'justify-start' : 'justify-end'
                  }`}>
                    {/* Direct Speak button */}
                    <button
                      onClick={() => handleSpeakSingleLine(line.text)}
                      className="p-1 px-2.5 bg-white text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-full border border-slate-200 flex items-center gap-1 text-[10px] font-black cursor-pointer transition-all"
                      title="朗讀英文句子"
                    >
                      <Volume2 className="w-3 h-3 text-orange-500" />
                      <span>聽發音</span>
                    </button>

                    {/* Voice practice button */}
                    <button
                      onClick={() => handleStartPractice(line)}
                      className={`p-1 px-2.5 rounded-full border flex items-center gap-1 text-[10px] font-black cursor-pointer transition-all ${
                        isLinePracticed 
                          ? 'bg-orange-500 text-white border-orange-600' 
                          : 'bg-white text-slate-550 border-slate-200 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                      }`}
                      title="點擊跟讀對話練習"
                    >
                      <Mic className={`w-3 h-3 ${isLinePracticed ? 'text-white' : 'text-emerald-500'}`} />
                      <span>語音跟讀</span>
                    </button>
                  </div>
                </div>

                {/* Floating micro speaking evaluation panel under the practiced line bubble */}
                {isLinePracticed && (
                  <div className="w-full max-w-[85%] mt-1.5 p-3 rounded-2xl bg-white border-2 border-dashed border-orange-200 space-y-2 text-left shadow-sm self-baseline">
                    <p className="text-[9px] font-extrabold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      語音挑戰進行中 (PRACTICE PORTAL)
                    </p>

                    {isListening ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <span className="text-[11px] font-black text-rose-500 animate-pulse">聽讀中，請大聲說出上面的英文對話語句...</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {spokenTranscript ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">偵測到您唸出的內容：</span>
                            <p className="text-[11px] p-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 italic">
                              "{spokenTranscript}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-450 block">（點跟讀後，播放完句子即可開始說話噢）</span>
                        )}

                        {/* Match Highlight words & Score card */}
                        {practiceScore !== null && (
                          <div className="space-y-1.5 border-t border-dashed border-slate-100 pt-2 mt-1">
                            {matchedWords.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[9px] text-emerald-600 font-extrabold">說對的字:</span>
                                {matchedWords.map((word, i) => (
                                  <span key={i} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-black">
                                    ✓ {word}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[10px] font-bold">
                                {practiceScore >= 80 ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <Trophy className="w-3.5 h-3.5" /> 🌟 完美發音！獎勵 +20 XP !
                                  </span>
                                ) : (
                                  practiceScore >= 50 ? (
                                    <span className="text-sky-600 flex items-center gap-1">
                                      <Star className="w-3.5 h-3.5 fill-current text-yellow-400" /> 👍 說得很好！獎勵 +10 XP !
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Ear className="w-3.5 h-3.5" /> 🦖 沒關係，再挑戰一次！
                                    </span>
                                  )
                                )}
                              </div>
                              <div className="bg-orange-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full font-mono shrink-0">
                                匹配度: {practiceScore}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recognition error message if any */}
                    {recognitionError && (
                      <p className="text-[10px] text-rose-500 font-bold">{recognitionError}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Bottom controls (Playback buttons in clean music controller format) */}
        <div className="bg-white px-5 py-5 border-t-2 border-slate-100 flex flex-col space-y-4">
          
          {/* Progress Indicator for current dialogue playing queue */}
          {isPlaying && playingIndex !== null && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${((playingIndex + 1) / activeUnit.lines.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 font-extrabold font-mono leading-none">
                <span>DIALOGUE QUEUE</span>
                <span>{playingIndex + 1} / {activeUnit.lines.length} 句子 ({Math.round(((playingIndex + 1) / activeUnit.lines.length) * 100)}%)</span>
              </div>
            </div>
          )}

          {/* Core Player buttons */}
          <div className="flex justify-between items-center gap-2">
            
            {/* Speed selection */}
            <button
              onClick={handleCycleSpeed}
              className="text-[10px] font-black text-slate-500 hover:text-orange-500 bg-slate-50 hover:bg-orange-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="text-slate-400 uppercase text-[8px]">Speed</span>
              <span className="text-orange-500 font-bold font-mono">{speed}x</span>
            </button>

            {/* Continuous Play Trigger (連續播放按鍵) */}
            <button
              onClick={handleToggleContinuousPlay}
              className={`flex-1 max-w-xs py-3 px-5 rounded-full font-black text-xs flex items-center justify-center gap-2 border-b-4 transition-all hover:scale-101 cursor-pointer shadow-md ${
                isPlaying 
                  ? 'bg-rose-500 border-rose-700 hover:bg-rose-600 text-white' 
                  : 'bg-orange-500 border-orange-700 hover:bg-orange-600 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4.5 h-4.5 fill-current" />
                  <span>⏸ 停止對話播放</span>
                </>
              ) : (
                <>
                  <Play className="w-4.5 h-4.5 fill-current" />
                  <span>🔄 連續播放 (講英文對話)</span>
                </>
              )}
            </button>

            {/* Translation show/hide toggle */}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`py-1.5 px-3.5 rounded-xl text-[10.5px] border font-black transition-all cursor-pointer ${
                showTranslation 
                  ? 'bg-yellow-400 text-yellow-950 border-yellow-500 font-bold shadow-sm' 
                  : 'bg-slate-150 text-slate-450 border-slate-200 bg-slate-50/50'
              }`}
            >
              {showTranslation ? '中譯:顯示' : '中譯:隱藏'}
            </button>

          </div>

          {/* Rule statement */}
          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100/80 flex items-start gap-1.5 text-[9.5px] text-slate-450 font-bold">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              遵行規則：<strong>本 APP 情境語音朗讀與連續播放僅會播放英文對話音訊</strong>，絕不會穿插中文配音，以期為孩子建立絕佳的沉浸式英語環境。
            </p>
          </div>

          {/* Quick Voice Settings expandable toggle */}
          <div className="border-t border-slate-150 pt-3 flex flex-col space-y-2">
            <button
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className="w-full py-2 px-4 rounded-xl bg-orange-50 border border-orange-100 text-[11px] font-black hover:bg-orange-100 text-orange-700 transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-sans">
                🗣️ 對話角色與真人美音設定 (Better Voices)
              </span>
              <span className="text-[10px] bg-orange-200 px-2 py-0.5 rounded-md font-sans">
                {showVoicePanel ? '收合配音 ✕' : '設定配音 ⚙️'}
              </span>
            </button>

            {showVoicePanel && (
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3 mt-1 text-left">
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  推薦選用標有 🌟 的高品質美式或英式英語朗讀引擎，讓會話聽起來如同真實外師在與孩子對談。
                </p>

                {/* English Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">🇺🇸 英語美音老師 (English Voice)</label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedEnVoice}
                      onChange={(e) => {
                        setSelectedEnVoice(e.target.value);
                        localStorage.setItem('coolplay_sel_en_voice', e.target.value);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      {voices.filter(v => v.lang.toLowerCase().startsWith('en')).length === 0 ? (
                        <option value="">系統最佳預設</option>
                      ) : (
                        voices.filter(v => v.lang.toLowerCase().startsWith('en')).map(v => (
                          <option key={v.name} value={v.name}>
                            {isRecommendedVoice(v) ? '🌟 ' : ''}{v.name}
                          </option>
                        ))
                      )}
                    </select>
                    
                    <button
                      onClick={() => {
                        if (!synthRef.current) return;
                        synthRef.current.cancel();
                        const tempU = new SpeechSynthesisUtterance("Hi! I am your companion speaker. Let's practice speaking english together!");
                        tempU.lang = 'en-US';
                        const v = voices.find(vo => vo.name === selectedEnVoice);
                        if (v) {
                          tempU.voice = v;
                          tempU.lang = v.lang;
                        }
                        tempU.rate = speed;
                        synthRef.current.speak(tempU);
                      }}
                      className="px-2.5 bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-600 transition-colors"
                    >
                      測試 🔊
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

// Function to clean original text and highlight pre-defined vocabulary words
function cleanAndHighlightText(text: string, vocabularies: string[]) {
  // Strip Speaker prefix e.g. "Sarah: "
  const speakerMatch = text.match(/^(Sarah|Mark|Receptionist|Bell Boy|Waiter|Sarah Robinson):\s*/i);
  let prefix = '';
  let restText = text;

  if (speakerMatch) {
    prefix = speakerMatch[0];
    restText = text.substring(prefix.length);
  }

  // Create regex pattern to match vocabularies (case-insensitive, whole or partial word boundary)
  // To avoid highlighting partial matches, match word boundaries or common suffixes
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Let's build a clean matcher regex
  // Merge vocabs, e.g. "abroad|adventure|opportunity..."
  // Sort vocabs by length descending to match longer ones first
  const sortedVocabs = [...vocabularies].sort((a,b) => b.length - a.length);
  
  if (sortedVocabs.length === 0) {
    return text;
  }

  const escapedVocabs = sortedVocabs.map(v => v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const vocabRegex = new RegExp(`\\b(${escapedVocabs})[a-z]*\\b|\\b(${escapedVocabs})\\b`, 'gi');

  let match;
  let key = 0;

  // Since we parsed restText, let's keep search on restText
  while ((match = vocabRegex.exec(restText)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];

    // Push preceding text
    if (matchIndex > lastIndex) {
      parts.push(restText.substring(lastIndex, matchIndex));
    }

    // Push highlighted vocab
    parts.push(
      <span 
        key={`highlight-${key++}`} 
        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-yellow-300 font-extrabold text-slate-900 border border-yellow-400 shadow-sm inline-block"
      >
        {matchText}
      </span>
    );

    lastIndex = vocabRegex.lastIndex;
  }

  if (lastIndex < restText.length) {
    parts.push(restText.substring(lastIndex));
  }

  return (
    <>
      {prefix && <span className="text-slate-400 font-bold font-sans mr-0.5">{prefix}</span>}
      {parts}
    </>
  );
}

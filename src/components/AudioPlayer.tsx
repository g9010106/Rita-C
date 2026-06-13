import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Bookmark, 
  Mic2, 
  Award, 
  HelpCircle,
  Sparkles,
  Compass
} from 'lucide-react';
import { Playlist, UserProfile } from '../types';

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

interface AudioPlayerProps {
  allPlaylists: Playlist[];
  activePlaylistId: string;
  onSelectPlaylistId: (id: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  activeProfile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export default function AudioPlayer({ 
  allPlaylists,
  activePlaylistId,
  onSelectPlaylistId,
  selectedCategory,
  onSelectCategory,
  activeProfile,
  onUpdateProfile 
}: AudioPlayerProps) {
  const currentPlaylist = allPlaylists.find(p => p.id === activePlaylistId) || allPlaylists[0];
  // 1. Queue States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [likedWords, setLikedWords] = useState<string[]>([]);
  
  // Speech setting states
  const [settings, setSettings] = useState({
    speed: 0.85,
    repeatMode: 'list' as 'none' | 'list', // list = keep playing, none = stop
    showTranslation: true,
  });

  const [currentSpeechStep, setCurrentSpeechStep] = useState<'idle' | 'word' | 'translation' | 'sentence' | 'sentenceTranslation'>('idle');

  // Premium voice selection states
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedEnVoice, setSelectedEnVoice] = useState<string>('');
  const [selectedZhVoice, setSelectedZhVoice] = useState<string>('');
  const [showVoicePanel, setShowVoicePanel] = useState<boolean>(false);

  // Extract unique categories from current playlist words
  const categories = ['All', ...Array.from(new Set((currentPlaylist.words || []).map(w => w.category).filter(Boolean)))];
  
  // Ensure selectedCategory is safe
  const safeSelectedCategory = categories.includes(selectedCategory) ? selectedCategory : 'All';

  // Words list
  const filteredWords = safeSelectedCategory === 'All' 
    ? currentPlaylist.words 
    : currentPlaylist.words.filter(w => w.category === safeSelectedCategory);
  
  const activeWord = filteredWords[currentIndex] || null;

  // Web Speech Synthesis Speech reference
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        if (!synthRef.current) return;
        const allVoices = synthRef.current.getVoices();
        setVoices(allVoices);
        
        // Load persist choices, or automatically pick best
        const savedEn = localStorage.getItem('coolplay_sel_en_voice');
        const savedZh = localStorage.getItem('coolplay_sel_zh_voice');

        const bestEn = getBestVoiceForLang(allVoices, 'en-US');
        const bestZh = getBestVoiceForLang(allVoices, 'zh-TW');

        if (savedEn && allVoices.some(v => v.name === savedEn)) {
          setSelectedEnVoice(savedEn);
        } else if (bestEn) {
          setSelectedEnVoice(bestEn.name);
        }

        if (savedZh && allVoices.some(v => v.name === savedZh)) {
          setSelectedZhVoice(savedZh);
        } else if (bestZh) {
          setSelectedZhVoice(bestZh.name);
        }
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
    
    // Load local likes
    const saved = localStorage.getItem('coolplay_liked_words');
    if (saved) {
      try {
        setLikedWords(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  // Sync index to 0 when playlist changes or category filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentSpeechStep('idle');
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, [currentPlaylist, selectedCategory]);

  // Audio elements speaking queue manager
  useEffect(() => {
    let active = true;
    if (!isPlaying || !activeWord) return;

    const playSequence = async () => {
      if (!synthRef.current) return;

      const speakText = (text: string, lang: 'en-US' | 'zh-TW', rate: number) => {
        return new Promise<void>((resolve) => {
          if (!synthRef.current || !active || !isPlaying) {
            resolve();
            return;
          }
          
          synthRef.current.cancel(); // Clears any current queued speech
          
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.rate = rate;

          // Match selected high-quality premium voice
          const activeVoiceName = lang === 'en-US' ? selectedEnVoice : selectedZhVoice;
          const chosenVoice = voices.find(v => v.name === activeVoiceName) || getBestVoiceForLang(voices, lang);
          if (chosenVoice) {
            u.voice = chosenVoice;
            u.lang = chosenVoice.lang;
          }

          currentUtteranceRef.current = u;

          u.onend = () => {
            resolve();
          };
          u.onerror = (e) => {
            console.warn('TTS Speech error:', e);
            resolve(); // Still resolve to not block player queue
          };

          synthRef.current.speak(u);
        });
      };

      try {
        // Step 1: Speak English Word
        setCurrentSpeechStep('word');
        await speakText(activeWord.word, 'en-US', settings.speed);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Speak Translation
        if (settings.showTranslation) {
          setCurrentSpeechStep('translation');
          await speakText(activeWord.translation, 'zh-TW', 1.0);
          await new Promise(r => setTimeout(r, 600));
        }

        // Step 3: Speak Example Sentence
        if (activeWord.sentence) {
          setCurrentSpeechStep('sentence');
          await speakText(activeWord.sentence, 'en-US', settings.speed);
          await new Promise(r => setTimeout(r, 800));
        }

        // Step 4: Speak Example Sentence Translation
        if (activeWord.sentenceTranslation && settings.showTranslation) {
          setCurrentSpeechStep('sentenceTranslation');
          await speakText(activeWord.sentenceTranslation, 'zh-TW', 1.0);
          await new Promise(r => setTimeout(r, 1200));
        }

        setCurrentSpeechStep('idle');

        // Go to next item
        if (currentIndex < filteredWords.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Wrapped around or stopped
          if (settings.repeatMode === 'list') {
            setCurrentIndex(0);
          } else {
            setIsPlaying(false);
          }
        }
      } catch (err) {
        console.error('Sequence playback failed:', err);
      }
    };

    playSequence();

    return () => {
      active = false;
    };
  }, [isPlaying, currentIndex, activeWord, settings.speed, settings.showTranslation, settings.repeatMode, selectedEnVoice, selectedZhVoice, voices]);


  // Play a standalone item when clicked
  const playElement = (text: string, lang: 'en' | 'zh', part: typeof currentSpeechStep) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    setIsPlaying(false); // Stop the auto sequence
    setCurrentSpeechStep(part);

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'zh-TW';
    u.rate = lang === 'en' ? settings.speed : 1.0;
    
    // Match selected voice
    const localeStr = lang === 'en' ? 'en-US' : 'zh-TW';
    const activeVoiceName = lang === 'en' ? selectedEnVoice : selectedZhVoice;
    const chosenVoice = voices.find(v => v.name === activeVoiceName) || getBestVoiceForLang(voices, localeStr);
    if (chosenVoice) {
      u.voice = chosenVoice;
      u.lang = chosenVoice.lang;
    }

    u.onend = () => {
      setCurrentSpeechStep('idle');
    };
    u.onerror = () => {
      setCurrentSpeechStep('idle');
    };

    synthRef.current.speak(u);
  };

  const togglePlay = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(prev => !prev);
  };

  const handleNext = () => {
    if (synthRef.current) synthRef.current.cancel();
    setCurrentSpeechStep('idle');
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (synthRef.current) synthRef.current.cancel();
    setCurrentSpeechStep('idle');
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(filteredWords.length - 1);
    }
  };

  const toggleLike = (wordId: string) => {
    let next: string[];
    if (likedWords.includes(wordId)) {
      next = likedWords.filter(id => id !== wordId);
    } else {
      next = [...likedWords, wordId];
    }
    setLikedWords(next);
    localStorage.setItem('coolplay_liked_words', JSON.stringify(next));
  };

  // Mark word as mastery (gives XP + updates profile)
  const toggleComplete = (wordId: string) => {
    const isCompleted = activeProfile.completedWordIds.includes(wordId);
    let nextCompleted: string[];
    let newXp = activeProfile.xp;

    if (isCompleted) {
      nextCompleted = activeProfile.completedWordIds.filter(id => id !== wordId);
      newXp = Math.max(0, newXp - 15); // subtract 15 XP
    } else {
      nextCompleted = [...activeProfile.completedWordIds, wordId];
      newXp += 15; // add 15 XP!
    }

    onUpdateProfile({
      ...activeProfile,
      completedWordIds: nextCompleted,
      xp: newXp
    });
  };

  const changeSpeed = () => {
    const speeds = [0.75, 0.85, 1.0, 1.2];
    const nextIdx = (speeds.indexOf(settings.speed) + 1) % speeds.length;
    setSettings(prev => ({ ...prev, speed: speeds[nextIdx] }));
  };

  // Card theme generator based on activeWord id
  const getCardTheme = (index: number) => {
    const themes = [
      { 
        bg: 'bg-white', 
        border: 'border-green-300', 
        text: 'text-green-800', 
        line: 'bg-green-400', 
        badge: 'bg-green-100 text-green-700 border-green-200', 
        sentenceBg: 'bg-yellow-50/80 border-yellow-300 text-yellow-900', 
        accent: 'bg-orange-500 hover:bg-orange-600 shadow-orange-100 border-b-4 border-orange-700 hover:transform hover:scale-105' 
      },
      { 
        bg: 'bg-white', 
        border: 'border-blue-300', 
        text: 'text-blue-800', 
        line: 'bg-blue-400', 
        badge: 'bg-blue-100 text-blue-700 border-blue-200', 
        sentenceBg: 'bg-blue-50/60 border-blue-200 text-blue-900', 
        accent: 'bg-blue-500 hover:bg-blue-600 shadow-blue-100 border-b-4 border-blue-700 hover:transform hover:scale-105' 
      },
      { 
        bg: 'bg-white', 
        border: 'border-rose-300', 
        text: 'text-rose-800', 
        line: 'bg-rose-400', 
        badge: 'bg-rose-100 text-rose-700 border-rose-200', 
        sentenceBg: 'bg-rose-50/50 border-rose-200 text-rose-950', 
        accent: 'bg-rose-500 hover:bg-rose-600 shadow-rose-100 border-b-4 border-rose-700 hover:transform hover:scale-105' 
      },
      { 
        bg: 'bg-white', 
        border: 'border-purple-300', 
        text: 'text-purple-800', 
        line: 'bg-purple-400', 
        badge: 'bg-purple-100 text-purple-700 border-purple-200', 
        sentenceBg: 'bg-purple-50/50 border-purple-200 text-purple-950', 
        accent: 'bg-purple-500 hover:bg-purple-600 shadow-purple-100 border-b-4 border-purple-700 hover:transform hover:scale-105' 
      }
    ];
    return themes[index % themes.length];
  };

  const cardTheme = getCardTheme(currentIndex);
  const isSpeakingNow = currentSpeechStep !== 'idle';

  return (
    <div className="px-4 py-2 space-y-6">
      
      {/* 1. Vocabulary Unit Selector Box */}
      <div id="vocab_unit_selector" className="bg-white border-4 border-yellow-300 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-yellow-400" />
        <span className="text-[10px] font-extrabold text-amber-600 tracking-wider uppercase block">單字單元選擇 (Select Vocabulary Library)</span>
        
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mt-1 mb-3">
          <Compass className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
          APP 能選單元：點擊下方氣泡即刻切換單字閃卡庫！
        </h3>

        {/* List of playlists */}
        <div className="flex flex-col gap-2.5">
          {allPlaylists.map((playlist) => {
            const isSelected = playlist.id === activePlaylistId;
            return (
              <button
                key={playlist.id}
                onClick={() => {
                  if (synthRef.current) synthRef.current.cancel();
                  setIsPlaying(false);
                  onSelectPlaylistId(playlist.id);
                }}
                className={`py-2 px-4 rounded-full border-2 text-left cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-yellow-50 border-yellow-400 text-amber-900 font-extrabold shadow-sm scale-[1.01]' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase text-white shrink-0 ${
                    isSelected ? 'bg-yellow-500' : 'bg-slate-400'
                  }`}>
                    {playlist.isPreset ? '預設' : '匯入'}
                  </span>
                  <span className="text-[11.5px] truncate">{playlist.name}</span>
                </div>

                <div className="flex items-center gap-1 text-[9.5px] font-black shrink-0">
                  {isSelected ? (
                    <span className="text-amber-600 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
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

      {/* 1.5 Sub-Unit / Category Filter Bar */}
      {categories.length > 2 && (
        <div id="sub_unit_filter" className="bg-white border-4 border-orange-300 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2.5 bg-orange-400" />
          <span className="text-[10px] font-extrabold text-orange-600 tracking-wider uppercase block">當前書庫 - 單元細分篩選 (Sub-Unit / Category Filter)</span>
          
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mt-1 mb-3 font-sans">
            <Compass className="w-4.5 h-4.5 text-orange-500 animate-spin-slow" />
            單元快速切換：點擊下方即可只播放特定單元的單字！
          </h3>

          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isActive = cat === safeSelectedCategory;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (synthRef.current) synthRef.current.cancel();
                    setIsPlaying(false);
                    onSelectCategory(cat);
                  }}
                  className={`py-2 px-4 rounded-full border-2 text-left cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                    isActive 
                      ? 'bg-orange-50 border-orange-400 text-orange-950 font-extrabold shadow-sm scale-[1.01]' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black text-white shrink-0 ${
                      isActive ? 'bg-orange-500' : 'bg-slate-400'
                    }`}>
                      {cat === 'All' ? 'ALL' : 'UNIT'}
                    </span>
                    <span className="text-[11.5px] truncate font-sans text-slate-850">
                      {cat === 'All' ? '🌐 全部單字' : cat}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[9.5px] font-black shrink-0">
                    {isActive ? (
                      <span className="text-orange-600 flex items-center gap-0.5 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        選取中
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-slate-600">切換並播放</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Main Player Player Card Container */}
      <div className="flex flex-col h-full max-w-lg mx-auto bg-white rounded-[32px] overflow-hidden border-4 border-blue-200 shadow-xl">
        
        {/* 1. Header Information Panel */}
        <div className="px-6 pt-5 pb-4 bg-blue-50 border-b-4 border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-sky-600 tracking-wider uppercase block">正在播放清單</span>
            <h2 className="text-base font-bold text-slate-800 truncate max-w-[240px] flex items-center gap-1.5 font-sans">
              {currentPlaylist.name}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-black font-sans uppercase">
              {filteredWords.length} Words
            </span>
          </div>
        </div>

        {/* 2. Audio Main Stage Area */}
        <div className="flex-1 min-h-[380px] p-6 flex flex-col items-center justify-center relative bg-gradient-to-b from-[#FFFDF0] to-white">
          {filteredWords.length === 0 ? (
            <div className="text-center p-8 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">這個單字書庫裡面沒有任何單字喔！</p>
              <p className="text-xs text-slate-400">請從下方切換其他書庫，或前往「家長匯入」上傳單字表。</p>
            </div>
          ) : (
            activeWord && (
              <div 
                style={{ contentVisibility: 'auto' }}
                className={`w-full max-w-[340px] min-h-[320px] rounded-[40px] p-6 shadow-xl flex flex-col justify-between ${cardTheme.bg} border-4 ${cardTheme.border} transition-all relative overflow-hidden`}
              >
                {/* Absolute Top Line Accent */}
                <div className={`absolute top-0 left-0 w-full h-2.5 ${cardTheme.line}`} />

                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-100/10 rounded-full blur-xl pointer-events-none" />

                {/* Card Top Actions Bar */}
                <div className="flex justify-between items-center z-10 mt-1">
                  <span 
                    onClick={() => {
                      if (activeWord.category) {
                        onSelectCategory(activeWord.category);
                      }
                    }}
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${cardTheme.badge} cursor-pointer hover:scale-105 active:scale-95 transition-all`}
                    title="點擊單元標籤快速篩選此單元單字"
                  >
                    {activeWord.category || '自用字彙庫'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Mastery state reward */}
                    <button
                      onClick={() => toggleComplete(activeWord.id)}
                      className={`p-2 rounded-full transition-all border-2 ${
                        activeProfile.completedWordIds.includes(activeWord.id)
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                          : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                      title={activeProfile.completedWordIds.includes(activeWord.id) ? '標示為未熟記' : '標示為已熟記 (+15 XP!)'}
                    >
                      <Award className="w-4 h-4" />
                    </button>

                    {/* Bookmark favorite */}
                    <button
                      onClick={() => toggleLike(activeWord.id)}
                      className={`p-2 rounded-full bg-white border-2 border-slate-200 transition-all ${
                        likedWords.includes(activeWord.id) ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${likedWords.includes(activeWord.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Central text content block */}
                <div className="text-center py-4 space-y-1.5 z-10">
                  {/* Voice sound waves animation */}
                  <div className="h-6 flex items-center justify-center gap-1">
                    {isSpeakingNow ? (
                      [...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-3 ${isSpeakingNow ? 'bg-orange-500' : 'bg-slate-300'} rounded-full animate-pulse`}
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))
                    ) : (
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    )}
                  </div>

                  {/* English Word */}
                  <h1 
                    onClick={() => playElement(activeWord.word, 'en', 'word')}
                    className="text-4xl md:text-5xl font-black text-slate-900 leading-none tracking-tight cursor-pointer hover:scale-105 active:scale-95 transition-all hover:opacity-85"
                  >
                    {activeWord.word}
                  </h1>

                  {activeWord.phonetic && (
                    <div 
                      onClick={() => playElement(activeWord.word, 'en', 'word')}
                      className="text-blue-500 font-mono text-sm inline-block px-3 py-0.5 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 font-bold"
                    >
                      {activeWord.phonetic}
                    </div>
                  )}

                  {/* Translation Meaning */}
                  <p 
                    onClick={() => playElement(activeWord.translation, 'zh', 'translation')}
                    className="text-xl md:text-2xl font-black text-orange-600 cursor-pointer pt-1 hover:text-orange-700 transition-colors"
                  >
                    {activeWord.translation}
                  </p>
                </div>

                {/* Card Sentence Portion */}
                <div className={`border-2 border-dashed p-3.5 rounded-3xl text-left space-y-1.5 pointer-events-auto z-10 ${cardTheme.sentenceBg}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                    <span>例句條示</span>
                    {isSpeakingNow && (currentSpeechStep === 'sentence' || currentSpeechStep === 'sentenceTranslation') && (
                      <span className="text-orange-600 animate-pulse flex items-center gap-1 font-bold">
                        <Volume2 className="w-3 h-3" /> 朗讀中
                      </span>
                    )}
                  </div>

                  {activeWord.sentence && (
                    <p 
                      onClick={() => playElement(activeWord.sentence || '', 'en', 'sentence')}
                      className="text-sm font-bold leading-snug cursor-pointer text-slate-850 hover:text-orange-600 transition-colors"
                    >
                      {activeWord.sentence}
                    </p>
                  )}

                  {activeWord.sentenceTranslation && (
                    <p 
                      onClick={() => playElement(activeWord.sentenceTranslation || '', 'zh', 'sentenceTranslation')}
                      className="text-xs text-slate-600 hover:text-orange-600 cursor-pointer transition-colors"
                    >
                      {activeWord.sentenceTranslation}
                    </p>
                  )}
                </div>

                {/* Reward hints */}
                <div className="text-center mt-2">
                  <span className="text-[9px] text-slate-400 font-bold tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    點選中文字即可聽取中文發音
                  </span>
                </div>

              </div>
            )
          )}
        </div>

        {/* 3. Bottom controls (Playback buttons in clean music controller format) */}
        <div className="bg-white px-6 py-6 border-t-4 border-blue-100 flex flex-col space-y-4">
          
          {/* ProgressBar */}
          {filteredWords.length > 1 && (
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-extrabold font-mono">
                <span className="tracking-widest">PROGRESS</span>
                <span>{currentIndex + 1} / {filteredWords.length} 個單字 ({Math.round(((currentIndex + 1) / filteredWords.length) * 100)}%)</span>
              </div>
            </div>
          )}

          {/* Action button rows */}
          <div className="flex items-center justify-between">
            
            {/* Accent Mic speech helper trigger */}
            <button
              onClick={() => {
                if (activeWord) playElement(activeWord.word, 'en', 'word');
              }}
              className="p-3 text-slate-550 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:scale-95 transition-all rounded-2xl disabled:opacity-30"
              title="發音當前單字"
              disabled={filteredWords.length === 0}
            >
              <Mic2 className="w-5.5 h-5.5 text-orange-500" />
            </button>

            {/* Core Player triggers */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={filteredWords.length <= 1}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all rounded-full disabled:opacity-30"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                id="btn_play_pause"
                disabled={filteredWords.length === 0}
                onClick={togglePlay}
                className={`w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-rose-500 border-b-4 border-rose-700 hover:bg-rose-600' 
                    : (filteredWords.length > 0 ? 'bg-orange-500 border-b-4 border-orange-700 hover:bg-orange-600' : 'bg-slate-300 shadow-none cursor-not-allowed')
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={filteredWords.length <= 1}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all rounded-full disabled:opacity-30"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Playlist settings toggle */}
            <button
              onClick={() => setSettings(prev => ({ ...prev, repeatMode: prev.repeatMode === 'list' ? 'none' : 'list' }))}
              className={`p-3 border-2 transition-all rounded-2xl ${
                settings.repeatMode === 'list' 
                  ? 'text-orange-600 bg-orange-50 border-orange-200' 
                  : 'text-slate-400 border-slate-100 hover:bg-slate-50'
              }`}
              title={settings.repeatMode === 'list' ? '循環播放開啟' : '循環播放關閉'}
            >
              <Volume2 className="w-5.5 h-5.5" />
            </button>

          </div>

          {/* Rate, Translation Settings Pill-board bar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
            
            {/* Rate click setting */}
            <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-inner">
              <button 
                onClick={changeSpeed}
                className="font-bold text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5"
              >
                <span className="text-[10px] text-slate-400 uppercase font-black">Speed</span>
                <span className="text-orange-500 font-extrabold font-mono text-[11px]">{settings.speed}x</span>
              </button>
            </div>

            {/* Toggle translation show/hide */}
            <button
              onClick={() => setSettings(prev => ({ ...prev, showTranslation: !prev.showTranslation }))}
              className={`px-4 py-1.5 rounded-full font-bold transition-all border ${
                settings.showTranslation 
                  ? 'bg-amber-150 text-amber-900 border-amber-300 bg-yellow-400 shadow-sm' 
                  : 'bg-slate-100 text-slate-450 border-slate-200'
              }`}
            >
              {settings.showTranslation ? '顯示中譯與例句' : '隱藏中譯例句 (純英文)'}
            </button>

          </div>

          {/* Quick Voice Settings expandable toggle */}
          <div className="border-t border-slate-150 pt-3 flex flex-col space-y-2">
            <button
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className="w-full py-2 px-4 rounded-xl bg-orange-50 border border-orange-100 text-[11px] font-black hover:bg-orange-100 text-orange-700 transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-sans">
                🗣️ 語音語調與真人美音切換 (Better Voices)
              </span>
              <span className="text-[10px] bg-orange-200 px-2 py-0.5 rounded-md font-sans">
                {showVoicePanel ? '收合配音 ✕' : '設定配音 ⚙️'}
              </span>
            </button>

            {showVoicePanel && (
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3 mt-1 text-left">
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  推薦選用標有 🌟 的高品質語音，能體驗生動、擬真人的美音老師朗讀！若選項為空，系統會自動選用當前最佳內建配音。
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
                        const tempU = new SpeechSynthesisUtterance("Hi there! I am your natural English reader. Nice to study with you!");
                        tempU.lang = 'en-US';
                        const v = voices.find(vo => vo.name === selectedEnVoice);
                        if (v) {
                          tempU.voice = v;
                          tempU.lang = v.lang;
                        }
                        tempU.rate = settings.speed;
                        synthRef.current.speak(tempU);
                      }}
                      className="px-2.5 bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-600 transition-colors"
                    >
                      測試 🔊
                    </button>
                  </div>
                </div>

                {/* Chinese Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">🇨🇳/🇹🇼 中文朗讀助教 (Chinese Voice)</label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedZhVoice}
                      onChange={(e) => {
                        setSelectedZhVoice(e.target.value);
                        localStorage.setItem('coolplay_sel_zh_voice', e.target.value);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      {voices.filter(v => v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().startsWith('cn')).length === 0 ? (
                        <option value="">系統最佳預設</option>
                      ) : (
                        voices.filter(v => v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().startsWith('cn')).map(v => (
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
                        const tempU = new SpeechSynthesisUtterance("你好！我是你的中文助教，讓我們開心地學習英語單字吧！");
                        tempU.lang = 'zh-TW';
                        const v = voices.find(vo => vo.name === selectedZhVoice);
                        if (v) {
                          tempU.voice = v;
                          tempU.lang = v.lang;
                        }
                        synthRef.current.speak(tempU);
                      }}
                      className="px-2.5 bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-orange-600 transition-colors"
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

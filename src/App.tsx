import { useState, useEffect } from 'react';
import { 
  Play, 
  BookOpen, 
  FileSpreadsheet, 
  ChevronRight, 
  Smartphone, 
  Share2,
  Volume2,
  Users
} from 'lucide-react';
import AudioPlayer from './components/AudioPlayer';
import DialoguePlayer from './components/DialoguePlayer';
import ParentConsole from './components/ParentConsole';
import KidsStats from './components/KidsStats';
import { Playlist, UserProfile, DialogueUnit } from './types';
import { PRESET_PLAYLISTS } from './presets';
import { PRESET_DIALOGUES } from './dialoguePresets';
import { PRESET_ESSAYS } from './essayPresets';
import { parseUnitNoAndName } from './utils';

export default function App() {
  // 1. Core State
  const [playlists, setPlaylists] = useState<Playlist[]>(PRESET_PLAYLISTS);
  const [dialogues, setDialogues] = useState<DialogueUnit[]>(PRESET_DIALOGUES.map(d => ({ ...d, isPreset: true })));
  const [essays, setEssays] = useState<DialogueUnit[]>(PRESET_ESSAYS.map(e => ({ ...e, isPreset: true })));
  const [activePlaylistId, setActivePlaylistId] = useState<string>('preset-u01-part1');
  
  const [profiles, setProfiles] = useState<UserProfile[]>([
    {
      id: 'prof-son',
      name: '👦 弟弟彼得',
      avatar: '👦',
      xp: 85,
      streak: 3,
      lastPlayedDate: '2026-06-12',
      completedWordIds: ['elem-1', 'elem-2']
    },
    {
      id: 'prof-daughter',
      name: '👧 姊姊安娜',
      avatar: '👧',
      xp: 150,
      streak: 5,
      lastPlayedDate: '2026-06-12',
      completedWordIds: ['elem-1', 'elem-3', 'elem-4']
    }
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>('prof-son');
  const [currentTab, setCurrentTab] = useState<'player' | 'presets' | 'parent' | 'progress'>('player');
  const [playerMode, setPlayerMode] = useState<'dialogue' | 'essay' | 'vocabulary'>('dialogue');
  
  // Dual-Direction Unit Synchronization States
  const [selectedUnitId, setSelectedUnitId] = useState<string>('u01-part1');
  const [selectedEssayId, setSelectedEssayId] = useState<string>('essay-u01-part1');
  const [selectedCategory, setSelectedCategory] = useState<string>('U01 海外商務與旅行');
  
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // 2. LocalStorage Persistence Syncing
  useEffect(() => {
    // Load from LocalStorage if exists
    const storedPlaylists = localStorage.getItem('eng_player_playlists');
    const storedDialogues = localStorage.getItem('eng_player_dialogues');
    const storedEssays = localStorage.getItem('eng_player_essays');
    const storedProfiles = localStorage.getItem('eng_player_profiles');
    const storedActiveProfile = localStorage.getItem('eng_player_active_profile');
    const storedActivePlaylist = localStorage.getItem('eng_player_active_playlist');
    const storedPwaBanner = localStorage.getItem('eng_player_pwa_banner');

    if (storedPlaylists) {
      try {
        const parsed = JSON.parse(storedPlaylists);
        // Merge preset playlists as readonly and saved lists as customizable
        const presets = PRESET_PLAYLISTS;
        const customs = parsed.filter((p: Playlist) => !p.isPreset);
        setPlaylists([...presets, ...customs]);
      } catch (e) {
        console.error('Failed to parse stored playlists', e);
      }
    }
    if (storedDialogues) {
      try {
        const parsed = JSON.parse(storedDialogues);
        const presets = PRESET_DIALOGUES.map(d => ({ ...d, isPreset: true }));
        const customs = parsed.filter((d: DialogueUnit) => !d.isPreset).map((d: DialogueUnit) => {
          const corrected = parseUnitNoAndName(d.unitNo === 'U99' ? d.name : `${d.unitNo} ${d.name}`);
          return {
            ...d,
            unitNo: corrected.unitNo,
            name: corrected.name
          };
        });
        setDialogues([...presets, ...customs]);
      } catch (e) {
        console.error('Failed to parse stored dialogues', e);
      }
    }
    if (storedEssays) {
      try {
        const parsed = JSON.parse(storedEssays);
        const presets = PRESET_ESSAYS.map(e => ({ ...e, isPreset: true }));
        const customs = parsed.filter((e: DialogueUnit) => !e.isPreset).map((e: DialogueUnit) => {
          const corrected = parseUnitNoAndName(e.unitNo === 'U99' ? e.name : `${e.unitNo} ${e.name}`);
          return {
            ...e,
            unitNo: corrected.unitNo,
            name: corrected.name
          };
        });
        setEssays([...presets, ...customs]);
      } catch (e) {
        console.error('Failed to parse stored essays', e);
      }
    }
    if (storedProfiles) {
      try {
        setProfiles(JSON.parse(storedProfiles));
      } catch (e) {
        console.error('Failed to parse stored profiles', e);
      }
    }
    if (storedActiveProfile) {
      setActiveProfileId(storedActiveProfile);
    }
    if (storedActivePlaylist) {
      setActivePlaylistId(storedActivePlaylist);
    }
    if (storedPwaBanner) {
      setShowPwaBanner(storedPwaBanner === 'true');
    }
  }, []);

  // Sync to LocalStorage on updates
  const savePlaylistsToStorage = (updatedPlaylists: Playlist[]) => {
    localStorage.setItem('eng_player_playlists', JSON.stringify(updatedPlaylists));
  };

  const saveDialoguesToStorage = (updatedDialogues: DialogueUnit[]) => {
    localStorage.setItem('eng_player_dialogues', JSON.stringify(updatedDialogues.filter(d => !d.isPreset)));
  };

  const saveEssaysToStorage = (updatedEssays: DialogueUnit[]) => {
    localStorage.setItem('eng_player_essays', JSON.stringify(updatedEssays.filter(e => !e.isPreset)));
  };

  const saveProfilesToStorage = (updatedProfiles: UserProfile[]) => {
    localStorage.setItem('eng_player_profiles', JSON.stringify(updatedProfiles));
  };

  // 3. User operations handlers
  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    localStorage.setItem('eng_player_active_profile', id);
    
    // Auto-update streak of chosen kid profiles if continuous study
    const updated = profiles.map(p => {
      if (p.id === id) {
        const today = new Date().toISOString().split('T')[0];
        if (p.lastPlayedDate !== today) {
          // Increment streak if studied yesterday, or restart if gap
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let scoreIncreaseXp = 10; // Extra XP for starting or continuing streak!
          const newStreak = p.lastPlayedDate === yesterdayStr ? p.streak + 1 : 1;
          
          return {
            ...p,
            streak: newStreak,
            lastPlayedDate: today,
            xp: p.xp + scoreIncreaseXp
          };
        }
      }
      return p;
    });

    setProfiles(updated);
    saveProfilesToStorage(updated);
  };

  const handleUpdateActiveProfile = (updatedProfile: UserProfile) => {
    const updated = profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
    setProfiles(updated);
    saveProfilesToStorage(updated);
  };

  const handleAddProfile = (name: string, avatar: string) => {
    const newProfile: UserProfile = {
      id: `prof-${Date.now()}`,
      name,
      avatar,
      xp: 0,
      streak: 1,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      completedWordIds: []
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    saveProfilesToStorage(updated);
    setActiveProfileId(newProfile.id);
  };

  const handleUpdateProfilesList = (fullProfiles: UserProfile[]) => {
    setProfiles(fullProfiles);
    saveProfilesToStorage(fullProfiles);
  };

  const handleAddCustomPlaylist = (newPlaylist: Playlist) => {
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    savePlaylistsToStorage(updated);
    setActivePlaylistId(newPlaylist.id); // set active
  };

  const handleDeletePlaylist = (id: string) => {
    // Only allow deleting custom lists
    const target = playlists.find(p => p.id === id);
    if (target && target.isPreset) return;

    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    savePlaylistsToStorage(updated);
    
    // fallback if deleted list was active
    if (activePlaylistId === id) {
      setActivePlaylistId('preset-u01-part1');
    }
  };

  const handleAddCustomDialogues = (newDialogues: DialogueUnit[]) => {
    const updated = [...dialogues, ...newDialogues];
    setDialogues(updated);
    saveDialoguesToStorage(updated);
    if (newDialogues.length > 0) {
      setSelectedUnitId(newDialogues[0].id); // Auto jump to first imported dialogue
    }
  };

  const handleDeleteDialogue = (id: string) => {
    const target = dialogues.find(d => d.id === id);
    if (target && target.isPreset) return;

    const updated = dialogues.filter(d => d.id !== id);
    setDialogues(updated);
    saveDialoguesToStorage(updated);

    // fallback if deleted list was active
    if (selectedUnitId === id) {
      setSelectedUnitId('u01-part1');
    }
  };

  const handleAddCustomEssays = (newEssays: DialogueUnit[]) => {
    const updated = [...essays, ...newEssays];
    setEssays(updated);
    saveEssaysToStorage(updated);
    if (newEssays.length > 0) {
      setSelectedEssayId(newEssays[0].id); // Auto jump to first imported essay
    }
  };

  const handleDeleteEssay = (id: string) => {
    const target = essays.find(e => e.id === id);
    if (target && target.isPreset) return;

    const updated = essays.filter(e => e.id !== id);
    setEssays(updated);
    saveEssaysToStorage(updated);

    // fallback if deleted list was active
    if (selectedEssayId === id) {
      setSelectedEssayId('essay-u01-part1');
    }
  };

  const dismissPwaBanner = () => {
    setShowPwaBanner(false);
    localStorage.setItem('eng_player_pwa_banner', 'false');
  };

  const handleClearAllCustomData = () => {
    // 1. Reset state to presets only
    const cleanPlaylists = PRESET_PLAYLISTS;
    const cleanDialogues = PRESET_DIALOGUES.map(d => ({ ...d, isPreset: true }));
    const cleanEssays = PRESET_ESSAYS.map(e => ({ ...e, isPreset: true }));
    
    setPlaylists(cleanPlaylists);
    setDialogues(cleanDialogues);
    setEssays(cleanEssays);
    
    // 2. Clear from localstorage
    localStorage.removeItem('eng_player_playlists');
    localStorage.removeItem('eng_player_dialogues');
    localStorage.removeItem('eng_player_essays');
    
    // 3. Fallbacks for active selection
    setActivePlaylistId('preset-u01-part1');
    setSelectedUnitId('u01-part1');
    setSelectedEssayId('essay-u01-part1');
    setSelectedCategory('U01 海外商務與旅行');
  };

  // Bidirectional Synchronization Handlers
  const handleSelectUnitId = (unitId: string) => {
    setSelectedUnitId(unitId);
    
    let matchingPlaylistId = '';
    let categoryName = '';
    
    if (unitId === 'u01-part1') {
      matchingPlaylistId = 'preset-u01-part1';
      categoryName = 'U01 海外商務與旅行';
    } else if (unitId === 'u01-part2') {
      matchingPlaylistId = 'preset-u01-part2';
      categoryName = 'U01 海外商務與旅行';
    } else if (unitId === 'u02-part1') {
      matchingPlaylistId = 'preset-u02-part1';
      categoryName = 'U02 飯店住宿與服務櫃檯';
    } else if (unitId === 'u03-part1') {
      matchingPlaylistId = 'preset-u03-part1';
      categoryName = 'U03 餐館饗宴與美味點餐';
    } else {
      // Dynamic lookup of user custom imported dialogue unit
      const customDlg = dialogues.find(d => d.id === unitId);
      if (customDlg) {
        categoryName = customDlg.name;
        // See if there's a matching vocabulary library with similar name
        const correspondingPlay = playlists.find(p => p.name.includes(customDlg.name) || customDlg.name.includes(p.name));
        if (correspondingPlay) {
          matchingPlaylistId = correspondingPlay.id;
        }
      }
    }
    
    if (matchingPlaylistId) {
      setActivePlaylistId(matchingPlaylistId);
      localStorage.setItem('eng_player_active_playlist', matchingPlaylistId);
    }
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
  };

  const handleSelectEssayId = (essayId: string) => {
    setSelectedEssayId(essayId);
    
    let matchingPlaylistId = '';
    let categoryName = '';
    
    if (essayId === 'essay-u01-part1') {
      matchingPlaylistId = 'preset-u01-part1';
      categoryName = 'U01 海外商務與旅行';
    } else if (essayId === 'essay-u02-part1') {
      matchingPlaylistId = 'preset-u02-part1';
      categoryName = 'U02 飯店住宿與服務櫃檯';
    } else if (essayId === 'essay-u03-part1') {
      matchingPlaylistId = 'preset-u03-part1';
      categoryName = 'U03 餐館饗宴與美味點餐';
    } else {
      const customEss = essays.find(e => e.id === essayId);
      if (customEss) {
        categoryName = customEss.name;
        const correspondingPlay = playlists.find(p => p.name.includes(customEss.name) || customEss.name.includes(p.name));
        if (correspondingPlay) {
          matchingPlaylistId = correspondingPlay.id;
        }
      }
    }
    
    if (matchingPlaylistId) {
      setActivePlaylistId(matchingPlaylistId);
      localStorage.setItem('eng_player_active_playlist', matchingPlaylistId);
    }
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    
    const categoryUpper = category.toUpperCase();
    let targetUnitId = '';
    let targetEssayId = '';
    let matchingPlaylistId = '';
    
    if (categoryUpper.includes('U01')) {
      targetUnitId = 'u01-part1';
      targetEssayId = 'essay-u01-part1';
      matchingPlaylistId = 'preset-u01-part1';
    } else if (categoryUpper.includes('U02')) {
      targetUnitId = 'u02-part1';
      targetEssayId = 'essay-u02-part1';
      matchingPlaylistId = 'preset-u02-part1';
    } else if (categoryUpper.includes('U03')) {
      targetUnitId = 'u03-part1';
      targetEssayId = 'essay-u03-part1';
      matchingPlaylistId = 'preset-u03-part1';
    } else {
      // Custom dialogue lookup based on selected vocabulary sheet category
      const customDlg = dialogues.find(d => !d.isPreset && (d.name.includes(category) || category.includes(d.name)));
      if (customDlg) {
        targetUnitId = customDlg.id;
      }
      const customEss = essays.find(e => !e.isPreset && (e.name.includes(category) || category.includes(e.name)));
      if (customEss) {
        targetEssayId = customEss.id;
      }
    }
    
    if (targetUnitId) {
      setSelectedUnitId(targetUnitId);
    }
    if (targetEssayId) {
      setSelectedEssayId(targetEssayId);
    }
    if (matchingPlaylistId && activePlaylistId.startsWith('preset-u')) {
      setActivePlaylistId(matchingPlaylistId);
      localStorage.setItem('eng_player_active_playlist', matchingPlaylistId);
    }
  };

  // 4. Selections
  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Total words across playlists for percentage calculations
  const totalAvailableWordsCount = activePlaylist.words.length;

  return (
    <div className="min-h-screen bg-[#FFF9E5] pb-24 font-sans tracking-tight antialiased">
      
      {/* A. Top Navigation Bar (Branding & Global Profile switcher trigger) */}
      <nav id="nav_header" className="sticky top-0 bg-white border-b-4 border-yellow-400 px-5 py-3.5 flex items-center justify-between z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-orange-500 text-white p-2 rounded-xl flex items-center justify-center shadow-md">
            <Volume2 className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black text-orange-600 leading-none">CoolPlay 酷英播放器</h1>
            <span className="text-[9px] text-slate-400 font-extrabold tracking-widest block uppercase mt-0.5">Kids English Audio Learning Player</span>
          </div>
        </div>

        {/* Global Active Profile Pill badge on top right */}
        {activeProfile && (
          <button 
            id="btn_header_profile"
            onClick={() => setCurrentTab('progress')}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-2 border-yellow-500 pl-2 pr-3.5 py-1 rounded-full cursor-pointer border-b-4 border-b-yellow-600 transition-all shadow-sm"
          >
            <span className="text-xl bg-white p-0.5 rounded-full shadow-inner leading-none">{activeProfile.avatar}</span>
            <div className="text-left leading-tight hidden min-[360px]:block">
              <p className="text-xs font-black text-yellow-950">{activeProfile.name}</p>
              <p className="text-[9px] font-black text-amber-900">{activeProfile.xp} XP</p>
            </div>
          </button>
        )}
      </nav>

      {/* B. PWA Guide Banner: How to put it on mobile phones for son and daughter */}
      {showPwaBanner && (
        <div className="max-w-md mx-auto mt-4 px-4">
          <div className="bg-white border-4 border-blue-200 rounded-3xl p-4 relative overflow-hidden flex gap-3 shadow-md">
            <div className="bg-blue-100 p-2.5 rounded-2xl flex items-center justify-center h-fit self-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex-1 pr-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                📱 行動裝置安裝，隨身聽英文！
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                將此網頁傳送到您的<strong>兒子與女兒的手機</strong>：
              </p>
              <div className="mt-2 text-[10px] text-slate-600 space-y-0.5 list-none pl-0">
                <p>📍 <strong>iPhone (Safari)</strong>：點下方分享鈕 <Share2 className="w-3 h-3 inline text-sky-600" /> &gt; 選「<strong>加入主畫面</strong>」</p>
                <p>📍 <strong>Android (Chrome)</strong>：點右上三個點 &gt; 選「<strong>安裝應用程式 / 新增至主畫面</strong>」</p>
              </div>
            </div>

            <button 
              id="btn_dismiss_pwa_banner"
              onClick={dismissPwaBanner}
              className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-600 font-black text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* C. Dynamic Tab Contents render */}
      <main className="container max-w-lg mx-auto py-4">
        {currentTab === 'player' && (
          <div className="space-y-4">
            {/* Mode Switcher Banner: 3 categories */}
            <div className="mx-4 flex p-1 bg-slate-200/70 backdrop-blur-md rounded-2xl border border-slate-300/40">
              <button
                id="btn_mode_dialogue"
                onClick={() => setPlayerMode('dialogue')}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  playerMode === 'dialogue'
                    ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700 font-extrabold'
                    : 'text-slate-500 hover:text-slate-700 font-bold'
                }`}
              >
                <span>💬 會話練習</span>
              </button>
              
              <button
                id="btn_mode_essay"
                onClick={() => setPlayerMode('essay')}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  playerMode === 'essay'
                    ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700 font-extrabold'
                    : 'text-slate-500 hover:text-slate-700 font-bold'
                }`}
              >
                <span>📖 口語短文</span>
              </button>

              <button
                id="btn_mode_vocabulary"
                onClick={() => setPlayerMode('vocabulary')}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  playerMode === 'vocabulary'
                    ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700 font-extrabold'
                    : 'text-slate-500 hover:text-slate-700 font-bold'
                }`}
              >
                <span>🔤 單字閃卡</span>
              </button>
            </div>

            {playerMode === 'dialogue' ? (
              <DialoguePlayer 
                activeProfile={activeProfile}
                onUpdateProfile={handleUpdateActiveProfile}
                selectedUnitId={selectedUnitId}
                onSelectUnitId={handleSelectUnitId}
                allDialogues={dialogues}
              />
            ) : playerMode === 'essay' ? (
              <DialoguePlayer 
                activeProfile={activeProfile}
                onUpdateProfile={handleUpdateActiveProfile}
                selectedUnitId={selectedEssayId}
                onSelectUnitId={handleSelectEssayId}
                allDialogues={essays}
              />
            ) : (
              <AudioPlayer 
                allPlaylists={playlists}
                activePlaylistId={activePlaylistId}
                onSelectPlaylistId={(id) => {
                  setActivePlaylistId(id);
                  localStorage.setItem('eng_player_active_playlist', id);
                }}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                activeProfile={activeProfile}
                onUpdateProfile={handleUpdateActiveProfile}
              />
            )}
          </div>
        )}

        {currentTab === 'presets' && (
          <div className="px-4 py-2 space-y-6">
            
            <div className="bg-white p-5 rounded-[32px] border-4 border-blue-200 shadow-lg">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-sky-500" />
                挑選適合的英文單字朗讀庫 ({playlists.length} 個)
              </h3>
              
              <div className="space-y-3 mt-4">
                {playlists.map((playlist) => {
                  const isActive = playlist.id === activePlaylistId;
                  return (
                    <div
                      key={playlist.id}
                      onClick={() => {
                        setActivePlaylistId(playlist.id);
                        localStorage.setItem('eng_player_active_playlist', playlist.id);
                        setCurrentTab('player'); // jump back
                      }}
                      className={`p-4 rounded-3xl border-4 transition-all cursor-pointer flex items-center justify-between group ${
                        isActive 
                          ? 'border-yellow-400 bg-yellow-50/20' 
                          : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-sm ${isActive ? 'text-amber-900' : 'text-slate-850 group-hover:text-slate-900'}`}>
                            {playlist.name}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            playlist.isPreset ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {playlist.isPreset ? '內建預設' : '家長匯入'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{playlist.description}</p>
                        <span className="text-[10px] font-black text-slate-500 font-mono mt-2 block">
                          總計: {playlist.words.length} 個英文單字
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isActive ? '播放中' : '選擇播放'}
                        </span>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruction on custom playlists */}
            <div className="text-center bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl text-xs text-slate-400 font-bold">
              💡 如果想要增加自己設定的隨身英文單字，可以點擊下方「家長匯入」按鈕，上傳 Excel 檔案即刻套用！
            </div>

          </div>
        )}

        {currentTab === 'parent' && (
          <ParentConsole 
            onAddCustomPlaylist={handleAddCustomPlaylist}
            customPlaylists={playlists.filter(p => !p.isPreset)}
            onDeletePlaylist={handleDeletePlaylist}
            onAddCustomDialogues={handleAddCustomDialogues}
            customDialogues={dialogues.filter(d => !d.isPreset)}
            onDeleteDialogue={handleDeleteDialogue}
            onAddCustomEssays={handleAddCustomEssays}
            customEssays={essays.filter(e => !e.isPreset)}
            onDeleteEssay={handleDeleteEssay}
            onClearAllCustomData={handleClearAllCustomData}
          />
        )}

        {currentTab === 'progress' && (
          <KidsStats 
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onAddProfile={handleAddProfile}
            onUpdateProfilesList={handleUpdateProfilesList}
            totalWords={totalAvailableWordsCount}
          />
        )}
      </main>

      {/* D. Beautiful Fixed CSS Mobile Bottom Tabs Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t-4 border-yellow-400 py-3 px-3 flex items-center justify-around z-40 shadow-2xl max-w-lg mx-auto rounded-t-3xl">
        
        {/* Tab 1: Player */}
        <button
          id="tab_player"
          onClick={() => setCurrentTab('player')}
          className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer rounded-xl transition-all ${
            currentTab === 'player' ? 'text-orange-500 font-black scale-105' : 'text-slate-400 hover:text-slate-605'
          }`}
        >
          <Play className={`w-5.5 h-5.5 ${currentTab === 'player' ? 'fill-current stroke-[3.5]' : 'stroke-[2.5]'}`} />
          <span className="text-[10px] font-black tracking-tight">播放器</span>
        </button>

        {/* Tab 2: Selection Presets */}
        <button
          id="tab_presets"
          onClick={() => setCurrentTab('presets')}
          className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer rounded-xl transition-all ${
            currentTab === 'presets' ? 'text-orange-500 font-black scale-105' : 'text-slate-400 hover:text-slate-605'
          }`}
        >
          <BookOpen className={`w-5.5 h-5.5 ${currentTab === 'presets' ? 'stroke-[3]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-black tracking-tight">選擇書庫</span>
        </button>

        {/* Tab 3: Parent Console */}
        <button
          id="tab_parent"
          onClick={() => setCurrentTab('parent')}
          className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer rounded-xl transition-all ${
            currentTab === 'parent' ? 'text-orange-500 font-black scale-105' : 'text-slate-400 hover:text-slate-605'
          }`}
        >
          <FileSpreadsheet className={`w-5.5 h-5.5 ${currentTab === 'parent' ? 'stroke-[3]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-black tracking-tight">家長匯入</span>
        </button>

        {/* Tab 4: Kids growth profiles & stats */}
        <button
          id="tab_progress"
          onClick={() => setCurrentTab('progress')}
          className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer rounded-xl transition-all ${
            currentTab === 'progress' ? 'text-orange-500 font-black scale-105' : 'text-slate-400 hover:text-slate-605'
          }`}
        >
          <Users className={`w-5.5 h-5.5 ${currentTab === 'progress' ? 'stroke-[3]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-black tracking-tight">成長紀錄</span>
        </button>

      </div>

    </div>
  );
}

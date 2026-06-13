import { useState } from 'react';
import { 
  Award, 
  Flame, 
  CheckCircle, 
  UserPlus, 
  Trash2, 
  Trophy, 
  Star
} from 'lucide-react';
import { UserProfile } from '../types';

interface KidsStatsProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onAddProfile: (name: string, avatar: string) => void;
  onUpdateProfilesList: (profiles: UserProfile[]) => void;
  totalWords: number;
}

export default function KidsStats({ 
  profiles, 
  activeProfileId, 
  onSelectProfile, 
  onAddProfile,
  onUpdateProfilesList,
  totalWords 
}: KidsStatsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👦');

  const avatars = ['👦', '👧', '🦁', '🐱', '🦄', '🐳', '🚀', '🐼', '🎨'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddProfile(newName.trim(), selectedAvatar);
    setNewName('');
    setShowAddForm(false);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering select
    if (profiles.length <= 1) {
      alert('請至少保留一個孩子學習紀錄！');
      return;
    }
    const filtered = profiles.filter(p => p.id !== id);
    onUpdateProfilesList(filtered);
    if (activeProfileId === id) {
      onSelectProfile(filtered[0].id);
    }
  };

  return (
    <div className="px-4 py-2 space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white border-4 border-yellow-300 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-yellow-400" />
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-orange-500" />
          孩子成長英語學習紀錄
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          每當孩子聽讀一個單字，並點選「標記為已熟記」（星號圖示）即可獲得 <strong>15 XP</strong> 學習點數！連續學習更能維持「每日學習神火」喔！
        </p>
      </div>

      {/* 2. Profiles Switching Shelf */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">孩子帳號切換</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-[11px] font-black text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showAddForm ? '關閉新增' : '新增新成員'}
          </button>
        </div>

        {/* Dynamic creation form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-3xl border-4 border-dashed border-blue-200 shadow-sm space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">孩子英文名 / 暱稱</label>
              <input 
                type="text" 
                placeholder="例如：Peter, Emma"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full text-xs p-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">挑選趣味大頭貼</label>
              <div className="flex flex-wrap gap-2">
                {avatars.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      selectedAvatar === av 
                        ? 'bg-yellow-400 border-2 border-yellow-500 scale-110 shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-b-4 border-yellow-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              確認送出，新增帳號
            </button>
          </form>
        )}

        {/* Profiles Deck */}
        <div className="space-y-3">
          {profiles.map((prof) => {
            const isActive = prof.id === activeProfileId;
            const completionPercent = totalWords > 0 
              ? Math.min(100, Math.round((prof.completedWordIds.length / totalWords) * 100))
              : 0;

            return (
              <div
                key={prof.id}
                onClick={() => onSelectProfile(prof.id)}
                className={`p-4 rounded-3xl border-4 transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive 
                    ? 'border-yellow-400 bg-yellow-50/10' 
                    : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-[8px] font-black uppercase text-yellow-950 px-3.5 py-0.5 rounded-l-full border-b border-l border-yellow-500 z-10">
                    目前播放中帳號
                  </div>
                )}

                {/* Profile detail card segment */}
                <div className="flex items-center gap-3">
                  <div className="text-4xl bg-slate-100/60 p-2.5 rounded-2xl shadow-inner border border-slate-200">
                    {prof.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                      {prof.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      最近讀書日期: {prof.lastPlayedDate || '暫無資料'}
                    </p>
                  </div>
                </div>

                {/* Center progress metrics */}
                <div className="flex-1 max-w-sm space-y-2">
                  {/* Streak & XP stickers badge */}
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-full font-bold text-[10px]">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{prof.streak} 日連續學習</span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-50 border border-yellow-100 text-amber-700 rounded-full font-extrabold text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                      <span>{prof.xp} XP 總經驗值</span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full font-extrabold text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>已熟記 {prof.completedWordIds.length} 個單字</span>
                    </div>
                  </div>

                  {/* Words learning completeness indicator */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-yellow-400 transition-all duration-300" 
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold font-mono">
                      <span>BOOK COMPLETION</span>
                      <span>{completionPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Switch or Delete action buttons */}
                <div className="flex items-center gap-1.5 justify-end">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    isActive ? 'bg-yellow-400 text-yellow-950 border-yellow-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {isActive ? '播放中' : '選擇切換'}
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteProfile(prof.id, e)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Medal and Rewards system showcase */}
      <div className="bg-white border-4 border-green-200 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-green-400" />
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <Award className="w-4.5 h-4.5 text-green-600" />
          🎖️ 孩子學習光榮榜與徽章
        </h3>
        
        <div className="grid grid-cols-3 gap-3 mt-4">
          
          <div className="bg-amber-50/50 p-3 rounded-2xl text-center border-2 border-amber-100 flex flex-col items-center justify-center space-y-1 relative">
            <span className="text-2xl">🌱</span>
            <span className="text-[10px] font-black text-amber-900 block leading-tight">萌芽初醒者</span>
            <span className="text-[8px] text-slate-400 leading-none">熟記達 2 單字</span>
            <div className="absolute -top-1.5 -right-1 bg-amber-500 text-[7px] text-white font-extrabold px-1 rounded-full scale-90">
              安娜/弟弟
            </div>
          </div>

          <div className="bg-indigo-50/50 p-3 rounded-2xl text-center border-2 border-indigo-100 flex flex-col items-center justify-center space-y-1">
            <span className="text-2xl">🔥</span>
            <span className="text-[10px] font-black text-indigo-900 block leading-tight">神火維持者</span>
            <span className="text-[8px] text-slate-400 leading-none">連續學習 3 日</span>
          </div>

          <div className="bg-purple-50/50 p-3 rounded-2xl text-center border-2 border-purple-100 flex flex-col items-center justify-center space-y-1">
            <span className="text-2xl">👑</span>
            <span className="text-[10px] font-black text-purple-900 block leading-tight">英語酷學者</span>
            <span className="text-[8px] text-slate-400 leading-none">總修獲 150+ XP</span>
          </div>

        </div>
      </div>

    </div>
  );
}

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle, 
  FileUp, 
  AlertCircle
} from 'lucide-react';
import { Playlist, Word, DialogueUnit, DialogueLine } from '../types';
import { parseUnitNoAndName } from '../utils';

interface ParentConsoleProps {
  onAddCustomPlaylist: (playlist: Playlist) => void;
  customPlaylists: Playlist[];
  onDeletePlaylist: (id: string) => void;
  onAddCustomDialogues: (dialogues: DialogueUnit[]) => void;
  customDialogues: DialogueUnit[];
  onDeleteDialogue: (id: string) => void;
  onAddCustomEssays: (essays: DialogueUnit[]) => void;
  customEssays: DialogueUnit[];
  onDeleteEssay: (id: string) => void;
  onClearAllCustomData?: () => void;
}

export default function ParentConsole({ 
  onAddCustomPlaylist, 
  customPlaylists, 
  onDeletePlaylist,
  onAddCustomDialogues,
  customDialogues,
  onDeleteDialogue,
  onAddCustomEssays,
  customEssays,
  onDeleteEssay,
  onClearAllCustomData
}: ParentConsoleProps) {
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [manualWords, setManualWords] = useState<Omit<Word, 'id'>[]>([
    { word: '', phonetic: '', translation: '', sentence: '', sentenceTranslation: '', category: '日常生活' }
  ]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download simple sample Template spreadsheet Excel with both Vocabulary and Dialogues tabs!
  const handleDownloadTemplate = () => {
    // 1. Vocabulary sheet data
    const vocabData = [
      {
        '單字 (English Word)': 'Brilliant',
        '音標 (K.K. Phonetic)': '/ˈbrɪljənt/',
        '中文翻譯 (Translation)': '優秀的、傑出的',
        '互動例句 (Example Sentence)': 'She had a brilliant idea for the project.',
        '例句翻譯 (Sentence Translation)': '她對這個專案有一個非常棒的主意。',
        '分類 (Category)': '形容詞'
      },
      {
        '單字 (English Word)': 'Adventure',
        '音標 (K.K. Phonetic)': '/ədˈventʃər/',
        '中文翻譯 (Translation)': '冒險、探險旅行',
        '互動例句 (Example Sentence)': 'They went on a wild adventure in the jungle.',
        '例句翻譯 (Sentence Translation)': '他們在叢林裡進行了一場野外冒險。',
        '分類 (Category)': '名詞'
      }
    ];

    // 2. Dialogue sheet data
    const dialogueData = [
      {
        '單元 (Unit)': 'U01 海外商務與旅行',
        '情境對話 EN': "Natural/Colloquial English\nSarah: Hey Mark, I’ve been thinking about heading abroad next year. I’m really itching for a big adventure!\n\nMark: Nice! Sounds like a blast. You got a place in mind?\n\nSarah: I’m leaning towards Japan. It’s such a cool opportunity to soak up some new culture.",
        '情境對話 中文': "中文對話翻譯\n莎拉：嘿馬克，我一直在想說明年出國 (abroad) 走走。我真的好想來場大冒險 (adventure)！\n\n馬克：很棒欸！聽起來超好玩。你有目標了嗎？\n\n莎拉：我蠻想去日本的。這真的是個體驗新文化的超棒機會 (opportunity)。",
        '包含單字群組': 'abroad | airline | accommodation | opportunity | adventure'
      },
      {
        '單元 (Unit)': 'U02 飯店部與訂房服務',
        '情境對話 EN': "A: Do you have a reservation?\nB: Yes, under the name of Sarah Robinson.\nA: Let me confirm your details.",
        '情境對話 中文': "A: 您有預約房位嗎？\nB: 有，登記的名字是 Sarah Robinson。\nA: 讓我來為您確認詳情。",
        '包含單字群組': 'reservation | confirm | reception'
      }
    ];

    // 3. Oral Essay sheet data
    const essayData = [
      {
        '單元 (Unit)': 'U01 海外商務與旅行',
        '生活口語短文 EN': "Hey, I'm finally going abroad next month! I booked tickets through a budget airline and found affordable accommodation near the city centre. It's a huge opportunity to see the world and try something new. Honestly, the whole trip feels like one big adventure!",
        '生活口語短文 中文': "嘿，我下個月終於要出國了！我訂了廉價航空的機票，也找到了市中心附近平價的住宿。這是個大好機會可以看看世界、嘗試新事物。說真的，整趟旅程感覺就是一場大冒險！",
        '包含單字群組': 'abroad | airline | accommodation | opportunity | adventure'
      }
    ];

    const workbook = XLSX.utils.book_new();

    const vocabWorksheet = XLSX.utils.json_to_sheet(vocabData);
    XLSX.utils.book_append_sheet(workbook, vocabWorksheet, '酷英單字庫範本');

    const dialogueWorksheet = XLSX.utils.json_to_sheet(dialogueData);
    XLSX.utils.book_append_sheet(workbook, dialogueWorksheet, '情境對話 Dialogue');

    const essayWorksheet = XLSX.utils.json_to_sheet(essayData);
    XLSX.utils.book_append_sheet(workbook, essayWorksheet, '生活口語短文 Essay');
    
    // Trigger download
    XLSX.writeFile(workbook, 'CoolPlay_English_Template.xlsx');
  };

  // Upload spreadsheet xlsx parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        
        let vocabPlaylistsImported: Playlist[] = [];
        let dialogueUnitsImported: DialogueUnit[] = [];
        let essayUnitsImported: DialogueUnit[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json<any>(worksheet);
          if (rawData.length === 0) continue;

          // Check columns of the first row to detect type
          const firstRow = rawData[0];
          
          const hasEssayColumn = Object.keys(firstRow).some(key => 
            key.includes('短文') || key.includes('Essay') || key.includes('Passage')
          );
          const hasDialogueColumn = !hasEssayColumn && Object.keys(firstRow).some(key => 
            key.includes('對話') || key.includes('Dialogue')
          );
          const hasVocabColumn = !hasDialogueColumn && !hasEssayColumn && Object.keys(firstRow).some(key => 
            key.includes('單字') || key.includes('Word') || key.includes('word')
          );

          if (hasEssayColumn) {
            // Parse oral essay rows!
            const importedEssays: DialogueUnit[] = rawData.map((row: any, i: number) => {
              const keys = Object.keys(row);
              
              // Super robust unit column lookup
              const unitKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return cleanK === '單元' || 
                       cleanK.includes('單元') || 
                       cleanK.includes('主題') || 
                       cleanK.includes('unit') || 
                       cleanK.includes('課別') || 
                       cleanK.includes('課') || 
                       cleanK.includes('chapter');
              }) || '';
              const unitRaw = unitKey ? String(row[unitKey] || '').trim() : '';

              // Robust check with wildcards for Essay EN
              const enKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return (cleanK.includes('短文') && (cleanK.includes('en') || cleanK.includes('english'))) || cleanK.includes('essay en') || cleanK.includes('essayen') || cleanK === 'essay' || cleanK === 'english' || cleanK === 'en';
              }) || keys.find(k => k.includes('EN') || k.toLowerCase().includes('english') || k.includes('短文') || k.includes('Essay') || k.includes('文章') || k.includes('內容')) || '';
              
              // Robust check with wildcards for Essay 中文/Translation
              const cnKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return (cleanK.includes('短文') && (cleanK.includes('中文') || cleanK.includes('cn') || cleanK.includes('繁中') || cleanK.includes('翻譯') || cleanK.includes('zh') || cleanK.includes('chinese'))) || cleanK.includes('essay cn') || cleanK.includes('essaycn') || cleanK === 'chinese' || cleanK === '中文' || cleanK === 'translation';
              }) || keys.find(k => k.includes('中文') || k.includes('翻譯') || k.includes('CN') || k.toLowerCase().includes('chinese') || k.includes('譯文')) || '';
              
              const enText = enKey ? String(row[enKey] || '').trim() : '';
              const cnText = cnKey ? String(row[cnKey] || '').trim() : '';
              
              // Robust check with wildcards for vocab cluster
              const vocabKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return cleanK.includes('單字') || cleanK.includes('word') || cleanK.includes('vocab');
              }) || '';
              const vocabulariesRaw = vocabKey ? String(row[vocabKey] || '').trim() : '';
              
              if (!unitRaw && !enText) return null;

              // Parse unitNo and name using our robust helper function
              const parsedInfo = parseUnitNoAndName(unitRaw, '99');
              const unitNo = parsedInfo.unitNo;
              const name = parsedInfo.name;

              // Parse vocabularies list
              const vocabList = vocabulariesRaw
                .split(/[|,;]/)
                .map((v: string) => v.trim())
                .filter((v: string) => v !== '');

              // Split block of text into sentences
              const enClean = enText.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
              const cnClean = cnText.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();

              const enSents = enClean.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean);
              const cnSents = cnClean.split(/(?<=[。！？])\s*/).map((s: string) => s.trim()).filter(Boolean);

              const lines: DialogueLine[] = [];
              const maxSents = Math.max(enSents.length, cnSents.length);

              if (enSents.length !== cnSents.length || enSents.length <= 1) {
                // Keep whole paragraph if counts differ or single sentence
                lines.push({
                  id: `essay-line-${Date.now()}-${i}-0-${Math.random().toString(36).substr(2, 4)}`,
                  speaker: 'Sarah',
                  avatar: '📖 生活口語短文',
                  text: enClean,
                  translation: cnClean
                });
              } else {
                for (let idx = 0; idx < maxSents; idx++) {
                  lines.push({
                    id: `essay-line-${Date.now()}-${i}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
                    speaker: 'Sarah',
                    avatar: `🎙️ 生活口語短文 [句 ${idx + 1}]`,
                    text: enSents[idx] || '',
                    translation: cnSents[idx] || ''
                  });
                }
              }

              if (lines.length === 0) return null;

              return {
                id: `custom-dialogue-essay-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                unitNo,
                name: `${name} (口語短文)`,
                description: `來自口語短文工作表： ${name}`,
                vocabularies: vocabList,
                lines,
                isPreset: false
              } as DialogueUnit;
            }).filter(Boolean) as DialogueUnit[];

            essayUnitsImported.push(...importedEssays);
          } else if (hasDialogueColumn) {
            // Parse dialogue rows!
            const importedDialogues: DialogueUnit[] = rawData.map((row: any, i: number) => {
              const keys = Object.keys(row);
              
              // Super robust unit column lookup
              const unitKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return cleanK === '單元' || 
                       cleanK.includes('單元') || 
                       cleanK.includes('主題') || 
                       cleanK.includes('unit') || 
                       cleanK.includes('課別') || 
                       cleanK.includes('課') || 
                       cleanK.includes('chapter');
              }) || '';
              const unitRaw = unitKey ? String(row[unitKey] || '').trim() : '';

              // Find Dialogue EN
              const enKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return (cleanK.includes('對話') && (cleanK.includes('en') || cleanK.includes('english'))) || cleanK.includes('dialogue en') || cleanK.includes('dialogueen') || cleanK === 'dialogue' || cleanK === 'english' || cleanK === 'en';
              }) || keys.find(k => k.includes('EN') || k.toLowerCase().includes('english') || k.includes('對話') || k.includes('Dialogue') || k.includes('英文') || k.includes('內容')) || '';
              const enText = enKey ? String(row[enKey] || '').trim() : '';

              // Find Dialogue 中文/Translation
              const cnKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return (cleanK.includes('對話') && (cleanK.includes('中文') || cleanK.includes('cn') || cleanK.includes('繁中') || cleanK.includes('翻譯') || cleanK.includes('zh') || cleanK.includes('chinese'))) || cleanK.includes('dialogue cn') || cleanK.includes('dialoguecn') || cleanK === 'chinese' || cleanK === '中文' || cleanK === 'translation';
              }) || keys.find(k => k.includes('中文') || k.includes('翻譯') || k.includes('CN') || k.toLowerCase().includes('chinese') || k.includes('繁中') || k.includes('譯文')) || '';
              const cnText = cnKey ? String(row[cnKey] || '').trim() : '';

              // Find Vocab column
              const vocabKey = keys.find(k => {
                const cleanK = k.trim().toLowerCase();
                return cleanK.includes('單字') || cleanK.includes('word') || cleanK.includes('vocab');
              }) || '';
              const vocabulariesRaw = vocabKey ? String(row[vocabKey] || '').trim() : '';
              
              if (!unitRaw && !enText) return null;

              // Parse unitNo and name using our robust helper function
              const parsedInfo = parseUnitNoAndName(unitRaw, '99');
              const unitNo = parsedInfo.unitNo;
              const name = parsedInfo.name;

              // Parse vocabularies list
              const vocabList = vocabulariesRaw
                .split(/[|,;]/)
                .map((v: string) => v.trim())
                .filter((v: string) => v !== '');

              // Split lines by newline
              const enLinesRaw = enText.split('\n').map((l: any) => l.trim()).filter((l: any) => l !== '');
              const cnLinesRaw = cnText.split('\n').map((l: any) => l.trim()).filter((l: any) => l !== '');

              // Align speaker roles and transcripts
              const enLinesParsed = enLinesRaw
                .map((line: string) => {
                  const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
                  if (match) {
                    return { speaker: match[1].trim(), text: match[2].trim() };
                  }
                  // Skip header lines
                  if (line.toLowerCase().includes('english') || line.toLowerCase().includes('dialogue') || line.toLowerCase().includes('情境')) {
                    return null;
                  }
                  return { speaker: 'Speaker', text: line };
                })
                .filter(Boolean);

              const cnLinesParsed = cnLinesRaw
                .map((line: string) => {
                  const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
                  if (match) {
                    return { speaker: match[1].trim(), text: match[2].trim() };
                  }
                  if (line.includes('中文') || line.includes('翻譯')) {
                    return null;
                  }
                  return { speaker: '', text: line };
                })
                .filter(Boolean);

              // Zip the lines
              const lines = enLinesParsed.map((enLine: any, idx: number) => {
                let translation = '';
                if (cnLinesParsed[idx]) {
                  translation = cnLinesParsed[idx].text;
                }
                
                let avatar = enLine.speaker;
                const speakerLower = enLine.speaker.toLowerCase();
                if (speakerLower.includes('sarah') || speakerLower.includes('莎拉')) {
                  avatar = '👧 Sarah';
                } else if (speakerLower.includes('mark') || speakerLower.includes('馬克')) {
                  avatar = '👦 Mark';
                } else if (speakerLower === 'a') {
                  avatar = '🅰️ Role A';
                } else if (speakerLower === 'b') {
                  avatar = '🅱️ Role B';
                } else {
                  avatar = `👤 ${enLine.speaker}`;
                }

                return {
                  id: `line-${Date.now()}-${i}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
                  speaker: enLine.speaker,
                  avatar,
                  text: enLine.text,
                  translation
                };
              });

              if (lines.length === 0) return null;

              return {
                id: `custom-dialogue-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                unitNo,
                name,
                description: `來自 Excel 檔案的情境對話。`,
                vocabularies: vocabList,
                lines,
                isPreset: false
              } as DialogueUnit;
            }).filter(Boolean) as DialogueUnit[];

            dialogueUnitsImported.push(...importedDialogues);
          } else if (hasVocabColumn) {
            // Map custom keys from spreadsheet and build words
            const importedWords: Word[] = rawData.map((row: any, i: number) => {
              const keys = Object.keys(row);
              
              const wordKey = keys.find(k => k.trim().includes('單字') || k.trim().toLowerCase() === 'word') || '';
              const word = wordKey ? String(row[wordKey] || '').trim() : '';
              
              const phoneticKey = keys.find(k => k.trim().includes('音標') || k.trim().toLowerCase().includes('phonetics') || k.trim().toLowerCase() === 'phonetic') || '';
              const phonetic = phoneticKey ? String(row[phoneticKey] || '').trim() : '';

              const transKey = keys.find(k => k.trim().includes('翻譯') || k.trim().toLowerCase() === 'translation') || '';
              const translation = transKey ? String(row[transKey] || '').trim() : '';

              const sentKey = keys.find(k => k.trim().includes('例句') || k.trim().toLowerCase() === 'sentence') || '';
              const sentence = sentKey ? String(row[sentKey] || '').trim() : '';

              const sentTransKey = keys.find(k => k.trim().includes('例句翻譯') || k.trim().toLowerCase().includes('sentencetranslation') || k.trim().toLowerCase().includes('sentence_translation')) || '';
              const sentenceTranslation = sentTransKey ? String(row[sentTransKey] || '').trim() : '';

              const catKey = keys.find(k => k.trim().includes('分類') || k.trim().toLowerCase() === 'category') || '';
              const category = catKey ? String(row[catKey] || '').trim() : '匯入單字';

              return {
                id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                word,
                phonetic,
                translation,
                sentence,
                sentenceTranslation,
                category
              };
            }).filter((w: Word) => w.word !== '');

            if (importedWords.length > 0) {
              const newPlaylist: Playlist = {
                id: `custom-playlist-${Date.now()}-${vocabPlaylistsImported.length}-${Math.random().toString(36).substr(2, 4)}`,
                name: `📥 匯入:${sheetName === '酷英單字庫範本' ? file.name.replace(/\.[^/.]+$/, '') : sheetName}`,
                description: `來自篩選工作表 ${sheetName} 的 Excel 檔案，共 ${importedWords.length} 個單字。`,
                words: importedWords,
                isPreset: false
              };
              vocabPlaylistsImported.push(newPlaylist);
            }
          }
        }

        if (vocabPlaylistsImported.length === 0 && dialogueUnitsImported.length === 0 && essayUnitsImported.length === 0) {
          setErrMsg('找不到可用的英文單字列、情境對話列或生活口語短文列，請檢查表格欄位名稱與工作表格式！');
          return;
        }

        // Trigger updates back to parent state
        vocabPlaylistsImported.forEach(pl => onAddCustomPlaylist(pl));
        if (dialogueUnitsImported.length > 0) {
          onAddCustomDialogues(dialogueUnitsImported);
        }
        if (essayUnitsImported.length > 0) {
          onAddCustomEssays(essayUnitsImported);
        }

        // Setup clear successful message
        let statusMsg = '🎉 成功由試算表匯入：';
        if (vocabPlaylistsImported.length > 0) {
          statusMsg += ` ${vocabPlaylistsImported.reduce((acc, pl) => acc + pl.words.length, 0)} 個單字 (已存入單字庫)`;
        }
        if (dialogueUnitsImported.length > 0) {
          statusMsg += `${vocabPlaylistsImported.length > 0 ? '、' : ''} ${dialogueUnitsImported.length} 組會話情境 (已存入會話練習選單)`;
        }
        if (essayUnitsImported.length > 0) {
          statusMsg += `${(vocabPlaylistsImported.length > 0 || dialogueUnitsImported.length > 0) ? '、' : ''} ${essayUnitsImported.length} 組生活口語短文 (已存入短文讀寫選單)`;
        }
        setSuccessMsg(statusMsg);
        setErrMsg('');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error(err);
        setErrMsg('解析 Excel 檔案失敗，請使用上方下載的標準格式再試一遍！');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Add individual words manually in console
  const handleAddManualRow = () => {
    setManualWords(prev => [
      ...prev, 
      { word: '', phonetic: '', translation: '', sentence: '', sentenceTranslation: '', category: '手動輸入' }
    ]);
  };

  const handleManualRowChange = (index: number, field: keyof Omit<Word, 'id'>, value: string) => {
    setManualWords(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveManualRow = (index: number) => {
    setManualWords(prev => prev.filter((_, i) => i !== index));
  };

  // Save manually input playlist
  const handleSaveManualList = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWords = manualWords
      .filter(w => w.word.trim() !== '')
      .map((w, i) => ({
        id: `manual-${Date.now()}-${i}`,
        ...w
      }));

    if (cleanWords.length === 0) {
      setErrMsg('請至少輸入一個英文單字才能儲存！');
      return;
    }

    const title = listName.trim() || `✍️ 手寫清單 #${Date.now().toString().slice(-4)}`;
    const newPlaylist: Playlist = {
      id: `custom-manual-${Date.now()}`,
      name: `✍️ ${title}`,
      description: listDesc.trim() || '家長透過手動輸入，建立的日常自訂英文聽寫朗讀書庫。',
      words: cleanWords as Word[],
      isPreset: false
    };

    onAddCustomPlaylist(newPlaylist);
    setSuccessMsg(`🎉 成功儲存自訂單字書庫「${title}」並同步開啟播放！`);
    setErrMsg('');

    // Reset fields
    setListName('');
    setListDesc('');
    setManualWords([{ word: '', phonetic: '', translation: '', sentence: '', sentenceTranslation: '', category: '手動輸入' }]);
  };

  return (
    <div className="px-4 py-2 space-y-6">
      
      {/* Visual Header banner */}
      <div className="bg-white border-4 border-blue-200 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-400" />
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-orange-500" />
          英文學習家長控制台
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          家長可以使用標準 Excel / 試算表格式，快速整批匯入學校聽寫、模擬卷或是課外閱讀的必備生字！
        </p>

        {/* State Alerts */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
        )}

        {errMsg && (
          <div className="mt-4 p-3 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <p>{errMsg}</p>
          </div>
        )}
      </div>

      {/* Box A: Excel Upload Section */}
      <div className="bg-white rounded-3xl border-4 border-green-200 shadow-md p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-400" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileUp className="w-4.5 h-4.5 text-green-600" />
              方法一：Excel 檔案一鍵匯入
            </h3>
            <p className="text-[10.5px] text-slate-450">整批單字、會話與日後口語聽寫一次搞定！</p>
          </div>

          <button 
            onClick={handleDownloadTemplate}
            type="button"
            className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-full border border-sky-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            下載標準 Excel 範本格式
          </button>
        </div>

        <div className="border-4 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="space-y-2 pointer-events-none">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">拖曳或點選電腦上的 Excel 試算表檔案</p>
            <p className="text-[10px] text-slate-400">支援副檔名 .xlsx, .xls (一次載入「酷英單字」、「情境會話」與「口語短文」工作表)</p>
          </div>
        </div>
      </div>

      {/* Box B: Manual Words Keyboard Form Input */}
      <div className="bg-white rounded-3xl border-4 border-yellow-300 shadow-md p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />
        
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4.5 h-4.5 text-yellow-600" />
            方法二：手動輸入自定義書單
          </h3>
          <p className="text-[10.5px] text-slate-450">適合臨時新增小單字、日常課堂小考聽寫準備</p>
        </div>

        <form onSubmit={handleSaveManualList} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">書單名稱</label>
              <input 
                type="text" 
                placeholder="例如：安娜的英文第五課考試範疇" 
                value={listName}
                onChange={e => setListName(e.target.value)}
                className="w-full text-xs p-3 border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">簡短備註描述</label>
              <input 
                type="text" 
                placeholder="例如：主要加強發音與互動例句的熟記" 
                value={listDesc}
                onChange={e => setListDesc(e.target.value)}
                className="w-full text-xs p-3 border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner font-sans">
            <table className="min-w-full divide-y divide-slate-100 text-left bg-slate-50/50">
              <thead className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <tr>
                  <th className="p-3">單字</th>
                  <th className="p-3">K.K.音標</th>
                  <th className="p-3">中譯</th>
                  <th className="p-3">互動例句 與 解釋</th>
                  <th className="p-3 text-right">刪除</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {manualWords.map((row, index) => (
                  <tr key={index} className="bg-white hover:bg-slate-50/50">
                    <td className="p-2">
                      <input 
                        type="text" 
                        required
                        placeholder="例: Brilliant"
                        value={row.word}
                        onChange={e => handleManualRowChange(index, 'word', e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:border-yellow-400 outline-none font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        placeholder="例: /ˈbrɪljənt/"
                        value={row.phonetic}
                        onChange={e => handleManualRowChange(index, 'phonetic', e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:border-yellow-400 outline-none font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        required
                        placeholder="例: 傑出的"
                        value={row.translation}
                        onChange={e => handleManualRowChange(index, 'translation', e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:border-yellow-400 outline-none"
                      />
                    </td>
                    <td className="p-2 space-y-1">
                      <input 
                        type="text" 
                        placeholder="英文例句"
                        value={row.sentence}
                        onChange={e => handleManualRowChange(index, 'sentence', e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:border-yellow-400 outline-none text-[11px]"
                      />
                      <input 
                        type="text" 
                        placeholder="例句翻譯"
                        value={row.sentenceTranslation}
                        onChange={e => handleManualRowChange(index, 'sentenceTranslation', e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:border-yellow-400 outline-none text-[11px]"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button 
                        type="button"
                        onClick={() => handleRemoveManualRow(index)}
                        disabled={manualWords.length === 1}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
            <button 
              type="button" 
              onClick={handleAddManualRow}
              className="flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增下一行單字
            </button>
            
            <button 
              type="submit" 
              className="px-6 py-2 bg-yellow-400 border-b-4 border-yellow-600 font-black text-xs text-yellow-900 rounded-full hover:bg-yellow-500 transition-all cursor-pointer"
            >
              儲存自訂書單並開啟
            </button>
          </div>
        </form>
      </div>

      {/* Box C: Managed Custom Lists (Created by Parent) */}
      <div className="bg-white rounded-3xl border-4 border-rose-200 shadow-md p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-400" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-4.5 h-4.5 text-rose-600" />
              管理已匯入的單字、會話與短文庫清單 (共 {customPlaylists.length + customDialogues.length + customEssays.length} 個)
            </h3>
            <p className="text-[10.5px] text-slate-450">可個別移除，或使用右側一鍵清除所有自訂匯入資源</p>
          </div>
          
          {(customPlaylists.length > 0 || customDialogues.length > 0 || customEssays.length > 0) && onClearAllCustomData && (
            <div className="flex items-center gap-2">
              {!isConfirmingClear ? (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-black text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 px-3.5 py-1.5 rounded-full border border-rose-200 hover:border-transparent transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  一鍵清空所有匯入項目
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1.5 rounded-xl">
                  <span className="text-[10px] font-black text-rose-700 px-1">⚠️ 確定全部刪除？</span>
                  <button
                    onClick={() => {
                      onClearAllCustomData();
                      setIsConfirmingClear(false);
                      setSuccessMsg('🎉 成功清空所有匯入的家長自訂單字、對話與短文！');
                      setErrMsg('');
                    }}
                    type="button"
                    className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    確定
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    type="button"
                    className="text-[10px] font-black text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sub-Section 1: Playlists */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-1.5 flex justify-between items-center">
              <span>🔤 自訂單字庫 ({customPlaylists.length} 組)</span>
            </h4>
            {customPlaylists.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-400 text-[11px] font-bold">
                目前無匯入的自製單字庫。
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                {customPlaylists.map((list) => (
                  <div key={list.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-[11px] text-slate-800 truncate block">{list.name}</span>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{list.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-fit">
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded font-black">
                        {list.words.length} 字
                      </span>
                      <button 
                        onClick={() => onDeletePlaylist(list.id)}
                        type="button"
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="刪除此單字庫"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Section 2: Dialogues */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-1.5 flex justify-between items-center">
              <span>💬 自訂情境會話庫 ({customDialogues.length} 組)</span>
            </h4>
            {customDialogues.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-400 text-[11px] font-bold">
                目前無匯入的自製會話課程。
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                {customDialogues.map((dlg) => (
                  <div key={dlg.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-[11px] text-slate-800 truncate block">
                        <span className="bg-emerald-100 text-emerald-800 text-[8.5px] px-1 rounded font-black mr-1">{dlg.unitNo}</span>
                        {dlg.name}
                      </span>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{dlg.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-fit">
                      <span className="text-[9px] bg-slate-100 text-slate-605 font-mono px-1.5 py-0.5 rounded font-black">
                        {dlg.lines.length} 句
                      </span>
                      <button 
                        onClick={() => onDeleteDialogue(dlg.id)}
                        type="button"
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="刪除此會話"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Section 3: Essays */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-1.5 flex justify-between items-center">
              <span>📖 自訂生活口語短文庫 ({customEssays.length} 組)</span>
            </h4>
            {customEssays.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-400 text-[11px] font-bold">
                目前無匯入的自製口語短文。
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                {customEssays.map((ess) => (
                  <div key={ess.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-[11px] text-slate-800 truncate block">
                        <span className="bg-blue-100 text-blue-800 text-[8.5px] px-1 rounded font-black mr-1">{ess.unitNo}</span>
                        {ess.name}
                      </span>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{ess.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-fit">
                      <span className="text-[9px] bg-slate-100 text-slate-605 font-mono px-1.5 py-0.5 rounded font-black">
                        {ess.lines.length} 段
                      </span>
                      <button 
                        onClick={() => onDeleteEssay(ess.id)}
                        type="button"
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="刪除此短文"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

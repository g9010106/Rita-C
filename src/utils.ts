// A robust and automatic parser for unit numbers and unit titles from Excel cell imports.
export function parseUnitNoAndName(unitRaw: string, defaultFallbackNum = '99') {
  if (!unitRaw) {
    return { unitNo: `U${defaultFallbackNum}`, name: '自訂單元' };
  }
  
  const cleaned = unitRaw.trim();
  const rawLower = cleaned.toLowerCase();
  
  // 1. Try to match prefix unit numbers (e.g., "U01", "u1", "U_12", "Unit 11", "U12-", "U04:")
  const uMatch = cleaned.match(/^[Uu](?:nit)?\s*[-_:：.\s]*\s*(\d+)/i);
  if (uMatch) {
    const num = parseInt(uMatch[1], 10);
    const unitNo = `U${num < 10 ? '0' + num : num}`;
    let name = cleaned.substring(uMatch[0].length).replace(/^[-_:：.\s]+/, '').trim();
    if (!name) {
      name = `單元 ${unitNo}`;
    }
    return { unitNo, name };
  }

  // 2. Try to match Chinese chapter numbers (e.g. "第12單元", "第一課", "第十單元", "單元十二")
  const cnNumMap: { [key: string]: number } = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
  };
  
  const cnPattern = /(?:單元|第)\s*([0-9a-zA-Z一二三四五六七八九十]+)\s*(?:單元|課|節)?/i;
  const cnMatch = cleaned.match(cnPattern);
  if (cnMatch) {
    const matchVal = cnMatch[1].trim();
    let num = parseInt(matchVal, 10);
    if (isNaN(num)) {
      if (cnNumMap[matchVal] !== undefined) {
        num = cnNumMap[matchVal];
      }
    }
    if (!isNaN(num) && num > 0) {
      const unitNo = `U${num < 10 ? '0' + num : num}`;
      let name = cleaned.replace(cnPattern, '').replace(/^[-_:：.\s]+/, '').trim();
      if (!name) {
        name = `單元 ${unitNo}`;
      }
      return { unitNo, name };
    }
  }

  // 3. Try to look for any digits at the very beginning of the string (e.g. "04 家庭、日常與生活場景" or "12-工廠")
  const leadingNumMatch = cleaned.match(/^(\d+)\s*[-_:：.\s]*\s*(.*)$/);
  if (leadingNumMatch) {
    const num = parseInt(leadingNumMatch[1], 10);
    const unitNo = `U${num < 10 ? '0' + num : num}`;
    let name = leadingNumMatch[2].trim();
    if (!name) {
      name = `單元 ${unitNo}`;
    }
    return { unitNo, name };
  }

  // 4. Match by keywords in the text
  if (rawLower.includes('海外商務與旅行') || rawLower.includes('海外商務') || rawLower.includes('旅行') || rawLower.includes('u01') || rawLower.includes('travel')) {
    return { unitNo: 'U01', name: '海外商務與旅行' };
  }
  if (rawLower.includes('飯店部') || rawLower.includes('客房') || rawLower.includes('預約') || rawLower.includes('訂房') || rawLower.includes('飯店住宿') || rawLower.includes('u02') || rawLower.includes('hotel')) {
    return { unitNo: 'U02', name: '飯店部與訂房服務' };
  }
  if (rawLower.includes('餐館') || rawLower.includes('點餐') || rawLower.includes('美味') || rawLower.includes('饗宴') || rawLower.includes('u03') || rawLower.includes('restaurant')) {
    return { unitNo: 'U03', name: '餐館饗宴與美味點餐' };
  }
  if (rawLower.includes('家庭') || rawLower.includes('日常') || rawLower.includes('日常與生活') || rawLower.includes('日常與生活場景') || rawLower.includes('生活場景') || rawLower.includes('u04') || rawLower.includes('family') || rawLower.includes('daily')) {
    return { unitNo: 'U04', name: '家庭、日常與生活場景' };
  }
  if (rawLower.includes('職業') || rawLower.includes('媒體') || rawLower.includes('科技') || rawLower.includes('職業、媒體與科技場景') || rawLower.includes('科技場景') || rawLower.includes('u05') || rawLower.includes('career') || rawLower.includes('media') || rawLower.includes('tech')) {
    return { unitNo: 'U05', name: '職業、媒體與科技場景' };
  }
  if (rawLower.includes('學校') || rawLower.includes('教育') || rawLower.includes('校園') || rawLower.includes('學習') || rawLower.includes('u06') || rawLower.includes('school') || rawLower.includes('education')) {
    return { unitNo: 'U06', name: '學校與教育' };
  }
  if (rawLower.includes('休閒') || rawLower.includes('娛樂') || rawLower.includes('運動') || rawLower.includes('健康') || rawLower.includes('u07') || rawLower.includes('hobby') || rawLower.includes('sport')) {
    return { unitNo: 'U07', name: '休閒、娛樂與運動' };
  }
  if (rawLower.includes('節慶') || rawLower.includes('文化') || rawLower.includes('習俗') || rawLower.includes('u08') || rawLower.includes('festival') || rawLower.includes('culture')) {
    return { unitNo: 'U08', name: '節慶、文化與習俗' };
  }
  if (rawLower.includes('辦公室') || rawLower.includes('溝通') || rawLower.includes('辦公') || rawLower.includes('office') || rawLower.includes('u09')) {
    return { unitNo: 'U09', name: '辦公室業務與溝通' };
  }
  if (rawLower.includes('簡報') || rawLower.includes('會議') || rawLower.includes('展覽') || rawLower.includes('presentation') || rawLower.includes('meeting') || rawLower.includes('u10')) {
    return { unitNo: 'U10', name: '簡報、會議與海外展覽' };
  }
  if (rawLower.includes('銷售') || rawLower.includes('行銷') || rawLower.includes('客戶') || rawLower.includes('顧客') || rawLower.includes('sales') || rawLower.includes('marketing') || rawLower.includes('u11')) {
    return { unitNo: 'U11', name: '銷售、行銷與客戶' };
  }
  if (rawLower.includes('工廠') || rawLower.includes('生產') || rawLower.includes('工業') || rawLower.includes('製造') || rawLower.includes('製造業') || rawLower.includes('factory') || rawLower.includes('production') || rawLower.includes('u12')) {
    return { unitNo: 'U12', name: '工廠、生產與工業' };
  }
  if (rawLower.includes('採購') || rawLower.includes('物流') || rawLower.includes('倉儲') || rawLower.includes('u13') || rawLower.includes('procurement') || rawLower.includes('logistics')) {
    return { unitNo: 'U13', name: '採購、物流與倉儲' };
  }
  if (rawLower.includes('談判') || rawLower.includes('合約') || rawLower.includes('簽約') || rawLower.includes('協議') || rawLower.includes('u14') || rawLower.includes('negotiation') || rawLower.includes('contract')) {
    return { unitNo: 'U14', name: '商務談判與合約' };
  }
  if (rawLower.includes('人力') || rawLower.includes('面試') || rawLower.includes('徵才') || rawLower.includes('u15') || rawLower.includes('human resources') || rawLower.includes('interview')) {
    return { unitNo: 'U15', name: '人力資源與面試' };
  }
  if (rawLower.includes('財務') || rawLower.includes('會計') || rawLower.includes('稅務') || rawLower.includes('u16') || rawLower.includes('finance') || rawLower.includes('accounting')) {
    return { unitNo: 'U16', name: '財務、會計與稅務' };
  }

  // 5. Ultimate Fallback: Just search for ANY digits in the text to make it the unit number!
  const salvageNumMatch = cleaned.match(/(\d+)/);
  if (salvageNumMatch) {
    const num = parseInt(salvageNumMatch[1], 10);
    const unitNo = `U${num < 10 ? '0' + num : num}`;
    return { unitNo, name: cleaned };
  }

  // Default fallback
  return { unitNo: `U${defaultFallbackNum}`, name: cleaned };
}

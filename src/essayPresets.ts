import { DialogueUnit } from './types';

export const PRESET_ESSAYS: DialogueUnit[] = [
  {
    id: 'essay-u01-part1',
    unitNo: 'U01',
    name: '海外商務與旅行 (生活口語短文)',
    description: '自我發表與口說短文練習：海外旅遊與探索世界的熱情！',
    vocabularies: ['abroad', 'airline', 'accommodation', 'opportunity', 'adventure'],
    lines: [
      {
        id: 'essay-u01-1',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "Hey, I'm finally going abroad next month! I booked tickets through a budget airline and found affordable accommodation near the city centre.",
        translation: '嘿，我下個月終於要出國了！我訂了廉價航空的機票，也找到了市中心附近平價的住宿。'
      },
      {
        id: 'essay-u01-2',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "It's a huge opportunity to see the world and try something new. Honestly, the whole trip feels like one big adventure!",
        translation: '這是個探索世界與嘗試新事物的大好機會。說真的，整趟旅程感覺就是一場大冒險！'
      }
    ]
  },
  {
    id: 'essay-u02-part1',
    unitNo: 'U02',
    name: '飯店住宿與訂房服務 (生活口語短文)',
    description: '自我發表與口說短文練習：如何完美地登記入住與安排飯店服務。',
    vocabularies: ['reception', 'reservation', 'room service', 'confirm', 'baggage'],
    lines: [
      {
        id: 'essay-u02-1',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "When I arrive at the hotel, I will go straight to the reception desk to make a reservation check. The helpful clerk can confirm my details.",
        translation: '當我抵達飯店時，我會直接前往櫃檯辦理預約確認，熱心的員工能協助核對我的資料。'
      },
      {
        id: 'essay-u02-2',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "Also, they will deliver my heavy baggage to the room. I can't wait to rest and order delicious late-night room service!",
        translation: '此外，他們會將我沉重的行李送到房間。我等不及要好好休息並點一份美味的深夜客房餐飲了！'
      }
    ]
  },
  {
    id: 'essay-u03-part1',
    unitNo: 'U03',
    name: '餐館饗宴與點餐 (生活口語短文)',
    description: '自我發表與口說短文練習：享受美食、點餐與付款的樂趣。',
    vocabularies: ['recommend', 'delicious', 'menu', 'allergy', 'bill'],
    lines: [
      {
        id: 'essay-u03-1',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "I always look closely at the menu to find recommended dishes. There are so many delicious appetizers and main courses available here.",
        translation: '我總是仔細看著菜單尋找推薦的菜餚，這裡有好多美味的前菜和主餐。'
      },
      {
        id: 'essay-u03-2',
        speaker: 'Sarah',
        avatar: '🎙️ Sarah [口語短文]',
        text: "Before ordering, I need to check if anyone has a food allergy. Finally, we will enjoy the meal and then ask the waiter for the bill.",
        translation: '在點餐之前，我需要確認是否有人對食物過敏。最後，我們會享受這頓美食，然後請服務生過來結帳。'
      }
    ]
  }
];

import { DialogueUnit } from './types';

export const PRESET_DIALOGUES: DialogueUnit[] = [
  {
    id: 'u01-part1',
    unitNo: 'U01',
    name: '海外商務與旅行 (第一部分：大冒險與客棧訂房)',
    description: 'Sarah 與 Mark 之間的趣味旅行對話，學習如何規劃出國探險與住宿！',
    vocabularies: ['abroad', 'airline', 'accommodation', 'opportunity', 'adventure'],
    lines: [
      {
        id: 'u01-1-l1',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Hey Mark, I’ve been thinking about heading abroad next year. I’m really itching for a big adventure!',
        translation: '哈囉馬克，我一直在想說明年出國 (abroad) 走走。我真的好想來場大冒險 (adventure)！'
      },
      {
        id: 'u01-1-l2',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'Nice! Sounds like a blast. You got a place in mind?',
        translation: '很棒欸！聽起來超好玩。你有目標了嗎？'
      },
      {
        id: 'u01-1-l3',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'I’m leaning towards Japan. It’s such a cool opportunity to soak up some new culture. I’ve been checking which airline is running the best promos lately.',
        translation: '我蠻想去日本的。這真的是個體驗新文化的超棒機會 (opportunity)。我最近都在看哪家航空公司 (airline) 有在推促銷。'
      },
      {
        id: 'u01-1-l4',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'Smart move. Have you figured out your accommodation yet?',
        translation: '聰明喔。那你住宿 (accommodation) 搞定了嗎？'
      },
      {
        id: 'u01-1-l5',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Not yet. I’m thinking about booking a ryokan—something a bit more authentic, you know?',
        translation: '還沒耶。我在想說要不要訂那種日式旅館，感覺比較道地，你知道的。'
      }
    ]
  },
  {
    id: 'u01-part2',
    unitNo: 'U01',
    name: '海外商務與旅行 (第二部分：出發日程與準備)',
    description: 'Sarah 與 Mark 討論有關機票日程表安排與長途飛行的準備！',
    vocabularies: ['according to', 'exhausted', 'arrive', 'schedule', 'arrangement'],
    lines: [
      {
        id: 'u01-2-l1',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Hey Mark, I’ve been thinking about heading abroad next year. I’m really itching for a big adventure!',
        translation: '嘿馬克，我一直在想說明年出國走走。我真的好想來場大冒險！'
      },
      {
        id: 'u01-2-l2',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'Nice! Sounds like a blast. According to the latest travel news, it’s a great time to go. You got a place in mind?',
        translation: '很棒欸！聽起來超好玩。根據 (according to) 最新旅遊消息，現在是去的好時機。你有目標了嗎？'
      },
      {
        id: 'u01-2-l3',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'I plan to visit Tokyo first. But checking the flight schedule and organizing the accommodation arrangement makes me feel a bit exhausted already.',
        translation: '我計劃先去東京。但光是整理航班日程表 (schedule) 與客店住宿安排 (arrangement) 就讓我感到有點筋疲力竭 (exhausted) 了。'
      },
      {
        id: 'u01-2-l4',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'Haha, don’t stress too much! Once you arrive at the hotel and take a nice hot bath, you will feel completely charged up!',
        translation: '哈哈，別太緊張！一旦你抵達 (arrive) 飯店並洗個舒服的熱水澡，你就會感覺精氣神滿滿！'
      }
    ]
  },
  {
    id: 'u02-part1',
    unitNo: 'U02',
    name: '飯店住宿與服務櫃檯 (Check-in 篇)',
    description: '海外旅行抵達飯店後，如何與櫃檯客服進行英文溝通對話。',
    vocabularies: ['reception', 'reservation', 'room service', 'confirm', 'baggage'],
    lines: [
      {
        id: 'u02-1-l1',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Hello, I would like to check in, please. My reservation is under the name of Sarah Robinson.',
        translation: '哈囉，我想辦理入住。我的預約 (reservation) 名稱是 Sarah Robinson。'
      },
      {
        id: 'u02-1-l2',
        speaker: 'Mark',
        avatar: '🛎️ Mark',
        text: 'Welcome to our hotel, Sarah! Let me confirm your details in the computer. Yes, standard room for five nights. Is that correct?',
        translation: '歡迎光臨本飯店！讓我為您在電腦裡確認 (confirm) 詳情。是的，標準雙人房五個晚上。這樣對嗎？'
      },
      {
        id: 'u02-1-l3',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Yes! That is correct. Do you provide breakfast and late night room service?',
        translation: '對的，完全正確！請問飯店有提供早餐和深夜的房間餐點服務 (room service) 嗎？'
      },
      {
        id: 'u02-1-l4',
        speaker: 'Mark',
        avatar: '🛎️ Mark',
        text: 'Yes, we do. Our reception desk is open twenty-four hours to help you. And our polite bell boy will carry your baggage to your room right away.',
        translation: '是的，我們有。我們的櫃檯服務處 (reception) 是二十四小時開放服務的。我們的禮貌行李員會立刻將您的行李 (baggage) 送到您的房間！'
      }
    ]
  },
  {
    id: 'u03-part1',
    unitNo: 'U03',
    name: '餐館饗宴與美味點餐 (餐廳英語)',
    description: '在米其林推薦餐館，如何用英語點選美味料理、確認過敏原以及買單結帳。',
    vocabularies: ['recommend', 'delicious', 'menu', 'allergy', 'bill'],
    lines: [
      {
        id: 'u03-1-l1',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'Look at the menu, Mark! Everything looks incredibly delicious here.',
        translation: '看看這本菜單 (menu)，馬克！這裡的每道料理看起來都無敵美味 (delicious)！'
      },
      {
        id: 'u03-1-l2',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'Wow, indeed! Excuse me, what dishes do you recommend for standard family sharing?',
        translation: '哇，真的！不好意思，請問有甚麼推薦 (recommend) 適合家庭共享的主菜菜色嗎？'
      },
      {
        id: 'u03-1-l3',
        speaker: 'Sarah',
        avatar: '👧 Sarah',
        text: 'I highly suggest the cheese pasta, but wait—Mark, do you have any specific seafood allergy?',
        translation: '我特別推薦起司通心麵，但等等——馬克，你對海鮮食物會有過敏 (allergy) 反應嗎？'
      },
      {
        id: 'u03-1-l4',
        speaker: 'Mark',
        avatar: '👦 Mark',
        text: 'No allergy at all! Let’s order that pasta. And when we finish, we can call the waiter and ask for the bill.',
        translation: '完全沒有任何過敏問題！我們就點這盤通心麵。等吃飽後，我們再請服務生過來結帳買單 (bill) 吧！'
      }
    ]
  }
];

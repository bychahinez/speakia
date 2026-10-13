import { CastId } from './cast';

export type PlaceId = 'gate' | 'office' | 'cafe' | 'library' | 'lab' | 'amphi';

export type Hints = { idea: string; starter: string; example: string };

export type RoleOption = {
  player: CastId;            // the character the learner plays
  partner: CastId;           // the character the AI plays
  mission: string;           // short, shown on the role card
  goal: string;              // full goal sent to the AI
  opening: string;           // partner's first line to the learner
  firstHints: Hints;         // hints for the learner's first answer
  demoReplies: string[];     // used when no server is configured
};

export type Episode = {
  id: string;
  season: number;
  level: number;
  title: string;
  place: PlaceId;
  placeName: string;
  time: string;
  focus: string;
  summary: string;
  setting: string;           // sent to the AI
  scene: { who: CastId; text: string }[];
  roles: RoleOption[];
  maxTurns: number;
  playable: boolean;
};

export const EPISODES: Episode[] = [
  {
    id: 'orientation', season: 1, level: 1, title: 'Orientation Day', place: 'gate', placeName: 'Campus gate',
    time: 'Sunday · 08:30', focus: 'Introductions and follow-up questions',
    summary: 'Your first day. Yacine is lost too.', setting: '', scene: [], roles: [], maxTurns: 3, playable: false,
  },
  {
    id: 'professor', season: 1, level: 2, title: 'Meet the Professor', place: 'office', placeName: "Professor's office",
    time: 'Monday · 11:00', focus: 'Polite questions', summary: 'Introduce yourself to Prof. Benali.',
    setting: '', scene: [], roles: [], maxTurns: 3, playable: false,
  },
  {
    id: 'friends', season: 1, level: 3, title: 'Make Friends', place: 'cafe', placeName: 'Campus café',
    time: 'Monday · 13:00', focus: 'Keeping a conversation going', summary: 'Coffee with Sara and Yacine.',
    setting: '', scene: [], roles: [], maxTurns: 3, playable: false,
  },
  {
    id: 'team-project', season: 1, level: 4, title: 'Team Project', place: 'library', placeName: 'Library',
    time: 'Tuesday · 10:00', focus: 'Giving reasons',
    summary: 'Your team must build a tool for students in two weeks. Sara wants a web app. Yacine wants a mobile app.',
    setting:
      'The university library in Algeria. Three Computer Science students must choose how to build a tool for students in two weeks: a web app or a mobile app.',
    scene: [
      { who: 'sara', text: 'Okay, the brief is out. We have two weeks to build a tool for students.' },
      { who: 'yacine', text: "Two weeks? Easy. Let's make a mobile app. Everyone is on their phone all day." },
      { who: 'sara', text: 'A mobile app takes longer. We need to publish it in the store and test it on Android and iPhone.' },
      { who: 'yacine', text: "But students don't open websites anymore. They open apps." },
      { who: 'sara', text: 'A web app works on every device. The professor can test it from her laptop in one click.' },
      { who: 'yacine', text: "Hmm. And notifications? A website can't remind you about deadlines." },
      { who: 'sara', text: 'Okay. We need a third opinion. Let’s ask {name}.' },
      { who: 'yacine', text: 'Good idea. So, {name}… what do you think?' },
    ],
    roles: [
      {
        player: 'sara', partner: 'yacine',
        mission: 'Defend the web app. Convince Yacine.',
        goal: 'convince Yacine that a web app is better than a mobile app, giving at least two reasons',
        opening: 'So, {name}, you agree with Sara? Come on, everyone uses phones. Why a web app?',
        firstHints: {
          idea: 'Mention the two-week deadline, and that anyone can test it on any device.',
          starter: 'I think a web app is better because…',
          example: 'I think a web app is better because we only have two weeks, and everyone can test it on any device.',
        },
        demoReplies: [
          'Okay, but what about notifications? Apps can remind students about deadlines.',
          'Hmm, that’s fair. But will it look good on a small phone screen?',
          'Alright, you convinced me. Web app it is!',
        ],
      },
      {
        player: 'yacine', partner: 'sara',
        mission: 'Defend the mobile app. Convince Sara.',
        goal: 'convince Sara that a mobile app is better than a web app, giving at least two reasons',
        opening: 'So, {name}, you’re on Yacine’s side? A web app is faster to build. Why a mobile app?',
        firstHints: {
          idea: 'Talk about how students use their phones, and deadline reminders.',
          starter: 'I prefer a mobile app because…',
          example: 'I prefer a mobile app because students use their phones all day, and we can send deadline reminders.',
        },
        demoReplies: [
          'But publishing in the store takes time. How do we finish in two weeks?',
          'Okay… and what if the professor wants to test it on her laptop?',
          'Fine, you win. Let’s build the mobile app!',
        ],
      },
    ],
    maxTurns: 3,
    playable: true,
  },
  {
    id: 'deadline', season: 1, level: 5, title: 'Deadline Trouble', place: 'lab', placeName: 'Project lab',
    time: 'Thursday · 15:00', focus: 'Explaining a problem', summary: 'Prof. Haddad wants an update.',
    setting: '', scene: [], roles: [], maxTurns: 3, playable: false,
  },
  {
    id: 'presentation', season: 1, level: 6, title: 'Presentation Day', place: 'amphi', placeName: 'Amphitheatre',
    time: 'Sunday · 09:00', focus: 'Presenting and answering questions', summary: 'Both professors are watching.',
    setting: '', scene: [], roles: [], maxTurns: 3, playable: false,
  },
];

/**
 * Lines can say {name}: the characters know the learner by name once they have met (from episode 2
 * on). Orientation Day, where the learner is new, simply doesn't use it.
 */
export function personalise(text: string, name: string | undefined) {
  return text.replace(/\{name\}/g, name?.trim() || 'friend');
}

export function getEpisode(id: string | undefined) {
  return EPISODES.find((e) => e.id === id);
}

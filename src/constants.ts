import moment from 'moment';

export interface Issue {
  title: string;
  number: number;
  updated_at: string;
  labels: Label[];
  pull_request: any;
  state: string;
  locked: boolean;
}

export interface Milestone {
  id: number;
  title: string;
  number: number;
  updated_at: string;
  description: string;
  open_issues: number;
  closed_issues: number;
  state: string;
  due_on?: string;
}

export interface Label {
  name: string;
}

export interface GlobalMilestone {
  id: string;
  emoji: string;
  name: string;
  firstDueDate: moment.Moment;
}

// Milestones:
//
// `🍎  Apple` - May 14 2020
// `🚲  Bike` - May 21 2020
// `🌵  Cactus` - May 28 2020
// `🦆  Duck` - June 4 2020 (@marissamarym's bday 🧁)
// `🥚  Egg` - June 11 2020
// `🥏  Frisbee` - June 18 2020
// `🍇  Grape` - June 25 2020
// `🐴  Horse` - July 2 2020
// `🦞  Lobster` - July 9 2020
// `🗺  Map` - July 16 2020
// `🍊  Orange` - July 23 2020
// `🦔  Porcupine` - July 30 2020
// `☀️  Sun` - August 6 2020
// `🎾  Tennis` - August 13 2020
// `☂️  Umbrella` - August 20 2020
// `🍉  Watermelon` - August 27 2020

function _getFirstDueDate(date: string) {
  return moment.utc(date, 'YYYY-MM-DD', true).add(12, 'hours');
}

// TODO: Have a way of validating/changing this if people really want to change the names.
// If you do change the names or formatting, make sure it's backwards compatible.
const APPLE = Object.freeze({
  id: 'APPLE',
  emoji: `🍎`,
  name: `Apple`,
  firstDueDate: _getFirstDueDate('2020-05-14')
});

const BIKE = Object.freeze({
  id: 'BIKE',
  emoji: `🚲`,
  name: `Bike`,
  firstDueDate: _getFirstDueDate('2020-05-21')
});
const CACTUS = Object.freeze({
  id: 'CACTUS',
  emoji: `🌵`,
  name: `Cactus`,
  firstDueDate: _getFirstDueDate('2020-05-28')
});
const DUCK = Object.freeze({
  id: 'DUCK',
  emoji: `🦆`,
  name: `Duck`,
  firstDueDate: _getFirstDueDate('2020-06-04')
});
const EGG = Object.freeze({
  id: 'EGG',
  emoji: `🥚`,
  name: `Egg`,
  firstDueDate: _getFirstDueDate('2020-06-11')
});
const FRISBEE = Object.freeze({
  id: 'FRISBEE',
  emoji: `🥏`,
  name: `Frisbee`,
  firstDueDate: _getFirstDueDate('2020-06-18')
});
const GRAPE = Object.freeze({
  id: 'GRAPE',
  emoji: `🍇`,
  name: `Grape`,
  firstDueDate: _getFirstDueDate('2020-06-25')
});
const HORSE = Object.freeze({
  id: 'HORSE',
  emoji: `🐴`,
  name: `Horse`,
  firstDueDate: _getFirstDueDate('2020-07-02')
});
const LOBSTER = Object.freeze({
  id: 'LOBSTER',
  emoji: `🦞`,
  name: `Lobster`,
  firstDueDate: _getFirstDueDate('2020-07-09')
});
const MAP = Object.freeze({
  id: 'MAP',
  emoji: `🗺`,
  name: `Map`,
  firstDueDate: _getFirstDueDate('2020-07-16')
});
const ORANGE = Object.freeze({
  id: 'ORANGE',
  emoji: `🍊`,
  name: `Orange`,
  firstDueDate: _getFirstDueDate('2020-07-23')
});
const PORCUPINE = Object.freeze({
  id: 'PORCUPINE',
  emoji: `🦔`,
  name: `Porcupine`,
  firstDueDate: _getFirstDueDate('2020-07-30')
});
const SUN = Object.freeze({
  id: 'SUN',
  emoji: `☀️`,
  name: `Sun`,
  firstDueDate: _getFirstDueDate('2020-08-06')
});
const TENNIS = Object.freeze({
  id: 'TENNIS',
  emoji: `🎾`,
  name: `Tennis`,
  firstDueDate: _getFirstDueDate('2020-08-13')
});
const UMBRELLA = Object.freeze({
  id: 'UMBRELLA',
  emoji: `☂️`,
  name: `Umbrella`,
  firstDueDate: _getFirstDueDate('2020-08-20')
});
const WATERMELON = Object.freeze({
  id: 'WATERMELON',
  emoji: `🍉`,
  name: `Watermelon`,
  firstDueDate: _getFirstDueDate('2020-08-27')
});

const map = new Map<string, GlobalMilestone>();
map.set('APPLE', APPLE);
map.set('BIKE', BIKE);
map.set('CACTUS', CACTUS);
map.set('DUCK', DUCK);
map.set('EGG', EGG);
map.set('FRISBEE', FRISBEE);
map.set('GRAPE', GRAPE);
map.set('HORSE', HORSE);
map.set('LOBSTER', LOBSTER);
map.set('MAP', MAP);
map.set('ORANGE', ORANGE);
map.set('PORCUPINE', PORCUPINE);
map.set('SUN', SUN);
map.set('TENNIS', TENNIS);
map.set('UMBRELLA', UMBRELLA);
map.set('WATERMELON', WATERMELON);
export const GLOBAL_MILESTONES_MAP = Object.freeze(map);

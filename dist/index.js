module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(953);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 6:
/***/ (function(module) {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 304:
/***/ (function(module) {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 795:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(__webpack_require__(6));
const github = __importStar(__webpack_require__(304));
const moment_1 = __importDefault(__webpack_require__(996));
const constants_1 = __webpack_require__(857);
const OPERATIONS_PER_RUN = 100;
// TODO: Expose as option.
const MIN_ISSUES_IN_MILESTONE = 3;
const SHORTEST_SPRINT_LENGTH_IN_DAYS = 2;
const NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES = 8;
const NUMBER_OF_WEEKS_IN_CYCLE = 16;
const DAYS_IN_WEEK = 7;
/***
 * Handle processing of milestones.
 */
class MilestoneProcessor {
    constructor(options, getMilestones, now) {
        this.operationsLeft = 0;
        this.closedIssues = [];
        this.closedMilestones = [];
        this.options = options;
        this.operationsLeft = OPERATIONS_PER_RUN;
        this.client = new github.GitHub(options.repoToken);
        this.currentGlobalMilestoneIds = [];
        this.milestonesToAdd = [];
        this.milestoneTitleToGlobalMilestoneIdMap = new Map();
        this.now = now || moment_1.default.utc();
        core.info(`Checking milestones at ${this.now.toISOString()}`);
        if (getMilestones) {
            this.getMilestones = getMilestones;
        }
        if (this.options.debugOnly) {
            core.warning('Executing in debug mode. Debug output will be written but no milestones will be processed.');
        }
        // Seed map
        for (const globalMilestone of constants_1.GLOBAL_MILESTONES_MAP.values()) {
            const title = _getMilestoneTitle(globalMilestone);
            this.milestoneTitleToGlobalMilestoneIdMap.set(title, globalMilestone.id);
        }
    }
    processMilestones(page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.operationsLeft <= 0) {
                core.warning('Reached max number of operations to process. Exiting.');
                return 0;
            }
            // get the next batch of milestones
            const milestones = yield this.getMilestones(page);
            this.operationsLeft -= 1;
            if (milestones.length <= 0) {
                yield this._assertMilestones();
                core.debug('No more milestones found to process. Exiting.');
                return {
                    operationsLeft: this.operationsLeft,
                    milestonesToAdd: this.milestonesToAdd
                };
            }
            for (const milestone of milestones.values()) {
                const globalMilestoneId = this.milestoneTitleToGlobalMilestoneIdMap.get(milestone.title);
                core.debug(`Checking global milestone: ${globalMilestoneId}`);
                if (globalMilestoneId &&
                    !this.currentGlobalMilestoneIds.includes(globalMilestoneId)) {
                    this.currentGlobalMilestoneIds.push(globalMilestoneId);
                }
                const totalIssues = (milestone.open_issues || 0) + (milestone.closed_issues || 0);
                const { number, title } = milestone;
                const updatedAt = milestone.updated_at;
                const openIssues = milestone.open_issues;
                core.debug(`Found milestone: milestone #${number} - ${title} last updated ${updatedAt}`);
                if (totalIssues < MIN_ISSUES_IN_MILESTONE) {
                    core.debug(`Skipping ${title} because it has less than ${MIN_ISSUES_IN_MILESTONE} issues`);
                    continue;
                }
                if (openIssues > 0) {
                    core.debug(`Skipping ${title} because it has open issues/prs`);
                    continue;
                }
                // Close instantly because there isn't a good way to tag milestones
                // and do another pass.
                yield this.closeMilestone(milestone);
            }
            // do the next batch
            return this.processMilestones(page + 1);
        });
    }
    // Enforce list of global milestones
    _assertMilestones() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Asserting milestones');
            const globalMilestonesLeft = [];
            for (const globalMilestone of constants_1.GLOBAL_MILESTONES_MAP.values()) {
                if (!this.currentGlobalMilestoneIds.includes(globalMilestone.id)) {
                    globalMilestonesLeft.push(globalMilestone);
                }
            }
            core.debug(`Global milestones left: ${globalMilestonesLeft
                .map(m => m.id)
                .join(', ')}`);
            // If there are possible milestones to add.
            if (globalMilestonesLeft.length > 0) {
                // Calculate milestones that are coming up soon and are not already
                // created.
                const globalMilestonesIdsLeftToNearestDueDateMap = new Map();
                for (const globalMilestone of globalMilestonesLeft.values()) {
                    const nearestDueDate = this._getNearestDueDate(globalMilestone);
                    if (nearestDueDate) {
                        globalMilestonesIdsLeftToNearestDueDateMap.set(globalMilestone.id, nearestDueDate);
                    }
                }
                // Build the params for the milestones to add.
                for (const globalMilestoneId of globalMilestonesIdsLeftToNearestDueDateMap.keys()) {
                    const globalMilestone = constants_1.GLOBAL_MILESTONES_MAP.get(globalMilestoneId);
                    if (globalMilestone) {
                        const nearestDueDate = globalMilestonesIdsLeftToNearestDueDateMap.get(globalMilestoneId);
                        this.milestonesToAdd.push({
                            title: _getMilestoneTitle(globalMilestone),
                            description: 'Generated by [Memorable Milestones](https://github.com/instantish/memorable-milestones)',
                            due_on: nearestDueDate && nearestDueDate.toISOString()
                        });
                    }
                }
                core.debug(`Milestones to create: ${this.milestonesToAdd.length}`);
                // Create the milestones.
                if (this.options.debugOnly) {
                    return;
                }
                for (const milestone of this.milestonesToAdd.values()) {
                    yield this.createMilestone({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        title: milestone.title,
                        description: milestone.description,
                        due_on: milestone.due_on
                    });
                }
            }
        });
    }
    // Get issues from github in baches of 100
    getMilestones(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const milestoneResult = yield this.client.issues.listMilestonesForRepo({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                state: 'open',
                per_page: 100,
                page
            });
            return milestoneResult.data;
        });
    }
    // Create milestone
    createMilestone(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const milestoneResult = yield this.client.issues.createMilestone(params);
            return milestoneResult.data;
        });
    }
    /// Close an milestone
    closeMilestone(milestone) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Closing milestone #${milestone.number} - ${milestone.title}`);
            this.closedMilestones.push(milestone);
            if (this.options.debugOnly) {
                return;
            }
            yield this.client.issues.updateMilestone({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                milestone_number: milestone.number,
                state: 'closed'
            });
        });
    }
    _getNearestDueDate(globalMilestone) {
        const initialDueDate = globalMilestone.firstDueDate;
        // Hacky because I don't want to do this with calculation because of
        // leap years etc.
        // TODO: Make better.
        for (let i = 0; i < 100; i++) {
            const nearestDueDate = i === 0
                ? initialDueDate
                : initialDueDate.add(1 * NUMBER_OF_WEEKS_IN_CYCLE, 'weeks');
            const daysUntilNearestDueDate = nearestDueDate.diff(this.now, 'days');
            // If the due date is between 2 days from now and 8 weeks, eligible to add.
            if (daysUntilNearestDueDate > SHORTEST_SPRINT_LENGTH_IN_DAYS &&
                daysUntilNearestDueDate <
                    NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES * DAYS_IN_WEEK) {
                return nearestDueDate;
            }
            else if (daysUntilNearestDueDate >
                (NUMBER_OF_WEEKS_IN_CYCLE + NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES) *
                    DAYS_IN_WEEK) {
                return;
            }
        }
        return;
    }
}
exports.MilestoneProcessor = MilestoneProcessor;
function _getMilestoneTitle(globalMilestone) {
    return `${globalMilestone.emoji}  ${globalMilestone.name}`;
}


/***/ }),

/***/ 857:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(__webpack_require__(996));
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
function _getFirstDueDate(date) {
    return moment_1.default.utc(date, 'YYYY-MM-DD', true).add(12, 'hours');
}
// TODO: Have a way of validating/changing this if people really want to change the names.
// If you do change the names or formatting, make sure it's backwards compatible.
const APPLE = {
    id: 'APPLE',
    emoji: `🍎`,
    name: `Apple`,
    firstDueDate: _getFirstDueDate('2020-05-14')
};
const BIKE = {
    id: 'BIKE',
    emoji: `🚲`,
    name: `Bike`,
    firstDueDate: _getFirstDueDate('2020-05-21')
};
const CACTUS = {
    id: 'CACTUS',
    emoji: `🌵`,
    name: `Cactus`,
    firstDueDate: _getFirstDueDate('2020-05-28')
};
const DUCK = {
    id: 'DUCK',
    emoji: `🦆`,
    name: `Duck`,
    firstDueDate: _getFirstDueDate('2020-06-04')
};
const EGG = {
    id: 'EGG',
    emoji: `🥚`,
    name: `Egg`,
    firstDueDate: _getFirstDueDate('2020-06-11')
};
const FRISBEE = {
    id: 'FRISBEE',
    emoji: `🥏`,
    name: `Frisbee`,
    firstDueDate: _getFirstDueDate('2020-06-18')
};
const GRAPE = {
    id: 'GRAPE',
    emoji: `🍇`,
    name: `Grape`,
    firstDueDate: _getFirstDueDate('2020-06-25')
};
const HORSE = {
    id: 'HORSE',
    emoji: `🐴`,
    name: `Horse`,
    firstDueDate: _getFirstDueDate('2020-07-02')
};
const LOBSTER = {
    id: 'LOBSTER',
    emoji: `🦞`,
    name: `Lobster`,
    firstDueDate: _getFirstDueDate('2020-07-09')
};
const MAP = {
    id: 'MAP',
    emoji: `🗺`,
    name: `Map`,
    firstDueDate: _getFirstDueDate('2020-07-16')
};
const ORANGE = {
    id: 'ORANGE',
    emoji: `🍊`,
    name: `Orange`,
    firstDueDate: _getFirstDueDate('2020-07-23')
};
const PORCUPINE = {
    id: 'PORCUPINE',
    emoji: `🦔`,
    name: `Porcupine`,
    firstDueDate: _getFirstDueDate('2020-07-30')
};
const SUN = {
    id: 'SUN',
    emoji: `☀️`,
    name: `Sun`,
    firstDueDate: _getFirstDueDate('2020-08-06')
};
const TENNIS = {
    id: 'TENNIS',
    emoji: `🎾`,
    name: `Tennis`,
    firstDueDate: _getFirstDueDate('2020-08-13')
};
const UMBRELLA = {
    id: 'UMBRELLA',
    emoji: `☂️`,
    name: `Umbrella`,
    firstDueDate: _getFirstDueDate('2020-08-20')
};
const WATERMELON = {
    id: 'WATERMELON',
    emoji: `🍉`,
    name: `Watermelon`,
    firstDueDate: _getFirstDueDate('2020-08-27')
};
const map = new Map();
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
exports.GLOBAL_MILESTONES_MAP = map;


/***/ }),

/***/ 953:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(__webpack_require__(6));
const MilestoneProcessor_1 = __webpack_require__(795);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const args = getAndValidateArgs();
            const processor = new MilestoneProcessor_1.MilestoneProcessor(args);
            yield processor.processMilestones();
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
function getAndValidateArgs() {
    const args = {
        repoToken: core.getInput('repo-token', { required: true }),
        debugOnly: core.getInput('debug-only') === 'true'
    };
    return args;
}
run();


/***/ }),

/***/ 996:
/***/ (function(module) {

module.exports = eval("require")("moment");


/***/ })

/******/ });
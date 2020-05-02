import * as core from '@actions/core';
import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';
import moment from 'moment';
import {
  Issue,
  Milestone,
  GlobalMilestone,
  GLOBAL_MILESTONES_MAP
} from './constants';

type OctoKitMilestoneList = Octokit.Response<
  Octokit.IssuesListMilestonesForRepoResponse
>;
type OctoKitMilestone = Octokit.Response<Octokit.IssuesCreateMilestoneResponse>;

type IssuesCreateMilestoneParams = Octokit.IssuesCreateMilestoneParams;

const OPERATIONS_PER_RUN = 100;
// TODO: Expose as option.
const MIN_ISSUES_IN_MILESTONE = 3;
const SHORTEST_SPRINT_LENGTH_IN_DAYS = 2;
const NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES = 8;
const NUMBER_OF_WEEKS_IN_CYCLE = 16;
const DAYS_IN_WEEK = 7;

export interface MilestoneProcessorOptions {
  repoToken: string;
  debugOnly: boolean;
}

export interface MilestoneCreationParams {
  title: string;
  description: string;
}

/***
 * Handle processing of milestones.
 */
export class MilestoneProcessor {
  readonly client: github.GitHub;
  readonly options: MilestoneProcessorOptions;
  private operationsLeft: number = 0;
  private currentGlobalMilestoneIds: GlobalMilestone['id'][];
  private milestoneTitleToGlobalMilestoneIdMap: Map<
    Milestone['title'],
    GlobalMilestone['id']
  >;
  private milestonesToAdd: any[];
  private now: moment.Moment;

  readonly closedIssues: Issue[] = [];
  readonly closedMilestones: Milestone[] = [];

  constructor(
    options: MilestoneProcessorOptions,
    getMilestones?: (page: number) => Promise<Milestone[]>,
    now?: moment.Moment
  ) {
    this.options = options;
    this.operationsLeft = OPERATIONS_PER_RUN;
    this.client = new github.GitHub(options.repoToken);
    this.currentGlobalMilestoneIds = [];
    this.milestonesToAdd = [];
    this.milestoneTitleToGlobalMilestoneIdMap = new Map<
      Milestone['title'],
      GlobalMilestone['id']
    >();
    this.now = now || moment.utc();

    core.info(`Checking milestones at ${this.now.toISOString()}`);

    if (getMilestones) {
      this.getMilestones = getMilestones;
    }

    if (this.options.debugOnly) {
      core.warning(
        'Executing in debug mode. Debug output will be written but no milestones will be processed.'
      );
    }

    // Seed map

    for (const globalMilestone of GLOBAL_MILESTONES_MAP.values()) {
      const title = _getMilestoneTitle(globalMilestone);
      this.milestoneTitleToGlobalMilestoneIdMap.set(title, globalMilestone.id);
    }
  }

  async processMilestones(page: number = 1): Promise<any> {
    if (this.operationsLeft <= 0) {
      core.warning('Reached max number of operations to process. Exiting.');
      return 0;
    }

    // get the next batch of milestones
    const milestones: Milestone[] = await this.getMilestones(page);
    this.operationsLeft -= 1;

    if (milestones.length <= 0) {
      await this._assertMilestones();

      core.debug('No more milestones found to process. Exiting.');
      return {
        operationsLeft: this.operationsLeft,
        milestonesToAdd: this.milestonesToAdd
      };
    }

    for (const milestone of milestones.values()) {
      const globalMilestoneId = this.milestoneTitleToGlobalMilestoneIdMap.get(
        milestone.title
      );

      core.debug(`Checking global milestone: ${globalMilestoneId}`);
      if (
        globalMilestoneId &&
        !this.currentGlobalMilestoneIds.includes(globalMilestoneId)
      ) {
        this.currentGlobalMilestoneIds.push(globalMilestoneId);
      }

      const totalIssues =
        (milestone.open_issues || 0) + (milestone.closed_issues || 0);
      const {number, title} = milestone;
      const updatedAt = milestone.updated_at;
      const openIssues = milestone.open_issues;

      core.debug(
        `Found milestone: milestone #${number} - ${title} last updated ${updatedAt}`
      );

      if (totalIssues < MIN_ISSUES_IN_MILESTONE) {
        core.debug(
          `Skipping ${title} because it has less than ${MIN_ISSUES_IN_MILESTONE} issues`
        );
        continue;
      }
      if (openIssues > 0) {
        core.debug(`Skipping ${title} because it has open issues/prs`);
        continue;
      }
      // Close instantly because there isn't a good way to tag milestones
      // and do another pass.
      await this.closeMilestone(milestone);
    }

    // do the next batch
    return this.processMilestones(page + 1);
  }

  // Enforce list of global milestones
  private async _assertMilestones() {
    core.debug('Asserting milestones');
    const globalMilestonesLeft: GlobalMilestone[] = [];

    for (const globalMilestone of GLOBAL_MILESTONES_MAP.values()) {
      if (!this.currentGlobalMilestoneIds.includes(globalMilestone.id)) {
        globalMilestonesLeft.push(globalMilestone);
      }
    }

    core.debug(
      `Global milestones left: ${globalMilestonesLeft
        .map(m => m.id)
        .join(', ')}`
    );

    // If there are possible milestones to add.
    if (globalMilestonesLeft.length > 0) {
      // Calculate milestones that are coming up soon and are not already
      // created.
      const globalMilestonesIdsLeftToNearestDueDateMap = new Map<
        GlobalMilestone['id'],
        moment.Moment
      >();
      for (const globalMilestone of globalMilestonesLeft.values()) {
        const nearestDueDate = this._getNearestDueDate(globalMilestone);
        if (nearestDueDate) {
          globalMilestonesIdsLeftToNearestDueDateMap.set(
            globalMilestone.id,
            nearestDueDate
          );
        }
      }

      // Build the params for the milestones to add.
      for (const globalMilestoneId of globalMilestonesIdsLeftToNearestDueDateMap.keys()) {
        const globalMilestone = GLOBAL_MILESTONES_MAP.get(globalMilestoneId);
        if (globalMilestone) {
          const nearestDueDate = globalMilestonesIdsLeftToNearestDueDateMap.get(
            globalMilestoneId
          );
          this.milestonesToAdd.push({
            title: _getMilestoneTitle(globalMilestone),
            description:
              'Generated by [Memorable Milestones](https://github.com/instantish/memorable-milestones)',
            due_on: nearestDueDate && nearestDueDate.toISOString()
          });
        }
      }

      core.debug(
        `Milestones to create: ${this.milestonesToAdd
          .map(m => m.title)
          .join(', ')}`
      );

      // Create the milestones.
      if (this.options.debugOnly) {
        return;
      }

      for (const milestone of this.milestonesToAdd.values()) {
        await this.createMilestone({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          title: milestone.title,
          description: milestone.description,
          due_on: milestone.due_on
        });
      }
    }
  }

  // Get issues from github in baches of 100
  private async getMilestones(page: number): Promise<Milestone[]> {
    const milestoneResult: OctoKitMilestoneList = await this.client.issues.listMilestonesForRepo(
      {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        state: 'open',
        per_page: 100,
        page
      }
    );

    return milestoneResult.data;
  }

  // Create milestone
  private async createMilestone(
    params: IssuesCreateMilestoneParams
  ): Promise<any> {
    const milestoneResult: OctoKitMilestone = await this.client.issues.createMilestone(
      params
    );

    return milestoneResult.data;
  }

  /// Close an milestone
  private async closeMilestone(milestone: Milestone): Promise<void> {
    core.debug(`Closing milestone #${milestone.number} - ${milestone.title}`);

    this.closedMilestones.push(milestone);

    if (this.options.debugOnly) {
      return;
    }

    await this.client.issues.updateMilestone({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      milestone_number: milestone.number,
      state: 'closed'
    });
  }

  private _getNearestDueDate(globalMilestone: GlobalMilestone) {
    const initialDueDate = globalMilestone.firstDueDate;

    // Hacky because I don't want to do this with calculation because of
    // leap years etc.
    // TODO: Make better.
    for (let i = 0; i < 100; i++) {
      const nearestDueDate =
        i === 0
          ? initialDueDate
          : initialDueDate.add(1 * NUMBER_OF_WEEKS_IN_CYCLE, 'weeks');
      const daysUntilNearestDueDate = nearestDueDate.diff(this.now, 'days');
      // If the due date is between 2 days from now and 8 weeks, eligible to add.
      if (
        daysUntilNearestDueDate > SHORTEST_SPRINT_LENGTH_IN_DAYS &&
        daysUntilNearestDueDate <
          NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES * DAYS_IN_WEEK
      ) {
        return nearestDueDate;
      } else if (
        daysUntilNearestDueDate >
        (NUMBER_OF_WEEKS_IN_CYCLE + NUMBER_OF_WEEKS_OUT_TO_MAKE_MILESTONES) *
          DAYS_IN_WEEK
      ) {
        return;
      }
    }
    return;
  }
}

function _getMilestoneTitle(globalMilestone: GlobalMilestone) {
  return `${globalMilestone.emoji}  ${globalMilestone.name}`;
}

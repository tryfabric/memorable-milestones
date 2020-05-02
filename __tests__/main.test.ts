import * as core from '@actions/core';
import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';
import moment from 'moment';

import {
  MilestoneProcessor,
  MilestoneProcessorOptions
} from '../src/MilestoneProcessor';
import {Milestone} from '../src/constants';

function generateMilestone(
  id: number,
  number: number,
  title: string,
  description: string,
  updatedAt: string,
  openIssues: number,
  closedIssues: number,
  isClosed: boolean = false,
  dueOn: string
): Milestone {
  return {
    id: id,
    number: number,
    description: description,
    title: title,
    updated_at: updatedAt,
    open_issues: openIssues,
    closed_issues: closedIssues,
    state: isClosed ? 'closed' : 'open',
    due_on: dueOn
  };
}

const DefaultProcessorOptions: MilestoneProcessorOptions = {
  repoToken: 'none',
  debugOnly: true
};

test('empty milestone list results in 8 created', async () => {
  // June 1 2020
  const now = moment
    .utc(0)
    .add(50, 'years')
    .add(5, 'months');

  const processor = new MilestoneProcessor(
    DefaultProcessorOptions,
    async () => [],
    now
  );

  // process our fake milestone list
  const {operationsLeft, milestonesToAdd} = await processor.processMilestones(
    1
  );

  // processing an empty milestone list should result in 1 operation
  expect(operationsLeft).toEqual(99);
  expect(milestonesToAdd.length).toEqual(8);
  expect(milestonesToAdd[0].title).toEqual('🦆  Duck');
  expect(milestonesToAdd[1].title).toEqual('🥚  Egg');
  expect(milestonesToAdd[2].title).toEqual('🥏  Frisbee');
  expect(milestonesToAdd[3].title).toEqual('🍇  Grape');
  expect(milestonesToAdd[4].title).toEqual('🐴  Horse');
  expect(milestonesToAdd[5].title).toEqual('🦞  Lobster');
  expect(milestonesToAdd[6].title).toEqual('🗺  Map');
  expect(milestonesToAdd[7].title).toEqual('🍊  Orange');
});

test('should not create a <2 day sprint', async () => {
  // June 3 2020 (a milestone is due June 4)
  const now = moment
    .utc(0)
    .add(50, 'years')
    .add(5, 'months')
    .add(2, 'days');

  const processor = new MilestoneProcessor(
    DefaultProcessorOptions,
    async () => [],
    now
  );

  // process our fake milestone list
  const {operationsLeft, milestonesToAdd} = await processor.processMilestones(
    1
  );

  // processing an empty milestone list should result in 1 operation
  expect(operationsLeft).toEqual(99);
  expect(milestonesToAdd.length).toEqual(7);
  expect(milestonesToAdd[0].title).toEqual('🥚  Egg');
  expect(milestonesToAdd[1].title).toEqual('🥏  Frisbee');
  expect(milestonesToAdd[2].title).toEqual('🍇  Grape');
  expect(milestonesToAdd[3].title).toEqual('🐴  Horse');
  expect(milestonesToAdd[4].title).toEqual('🦞  Lobster');
  expect(milestonesToAdd[5].title).toEqual('🗺  Map');
  expect(milestonesToAdd[6].title).toEqual('🍊  Orange');
});

test('single milestone list results in 7 created', async () => {
  // June 1 2020
  const now = moment
    .utc(0)
    .add(50, 'years')
    .add(5, 'months');
  const TestMilestoneList: Milestone[] = [
    generateMilestone(
      1234,
      1,
      '🦆  Duck',
      'First sprint',
      '2020-01-01T17:00:00Z',
      0,
      3,
      false,
      '2020-06-04T12:00:00Z'
    )
  ];

  const processor = new MilestoneProcessor(
    DefaultProcessorOptions,
    async p => (p == 1 ? TestMilestoneList : []),
    now
  );

  // process our fake list
  const {milestonesToAdd} = await processor.processMilestones(1);

  expect(processor.closedMilestones.length).toEqual(1);
  expect(milestonesToAdd.length).toEqual(7);
  expect(milestonesToAdd[0].title).toEqual('🥚  Egg');
  expect(milestonesToAdd[1].title).toEqual('🥏  Frisbee');
  expect(milestonesToAdd[2].title).toEqual('🍇  Grape');
  expect(milestonesToAdd[3].title).toEqual('🐴  Horse');
  expect(milestonesToAdd[4].title).toEqual('🦞  Lobster');
  expect(milestonesToAdd[5].title).toEqual('🗺  Map');
  expect(milestonesToAdd[6].title).toEqual('🍊  Orange');
});

test('single milestone list in future cycle results in 7 created', async () => {
  // June 1 2021
  const now = moment
    .utc(0)
    .add(51, 'years')
    .add(5, 'months');
  const TestMilestoneList: Milestone[] = [
    generateMilestone(
      1234,
      1,
      '🍊  Orange',
      'First sprint',
      '2020-01-01T17:00:00Z',
      0,
      3,
      false,
      '2020-06-04T12:00:00Z'
    )
  ];

  const processor = new MilestoneProcessor(
    DefaultProcessorOptions,
    async p => (p == 1 ? TestMilestoneList : []),
    now
  );

  // process our fake list
  const {operationsLeft, milestonesToAdd} = await processor.processMilestones(
    1
  );

  expect(processor.closedMilestones.length).toEqual(1);
  expect(milestonesToAdd.length).toEqual(6);
  expect(milestonesToAdd[0].title).toEqual('🦞  Lobster');
  expect(milestonesToAdd[1].title).toEqual('🗺  Map');
  expect(milestonesToAdd[2].title).toEqual('🦔  Porcupine');
  expect(milestonesToAdd[3].title).toEqual('☀️  Sun');
  expect(milestonesToAdd[4].title).toEqual('🎾  Tennis');
  expect(milestonesToAdd[5].title).toEqual('☂️  Umbrella');
});

test('doesnt add more milestones if ran twice', async () => {
  // June 1 2021
  const now = moment
    .utc(0)
    .add(51, 'years')
    .add(5, 'months');
  const TestMilestoneList: Milestone[] = [
    generateMilestone(
      1234,
      1,
      '🍊  Orange',
      'First sprint',
      '2020-01-01T17:00:00Z',
      0,
      3,
      false,
      '2020-06-04T12:00:00Z'
    )
  ];

  const processor = new MilestoneProcessor(
    DefaultProcessorOptions,
    async p => (p == 1 ? TestMilestoneList : []),
    now
  );

  // process our fake list
  const {operationsLeft, milestonesToAdd} = await processor.processMilestones(
    1
  );

  expect(processor.closedMilestones.length).toEqual(1);
  expect(milestonesToAdd.length).toEqual(6);
  expect(milestonesToAdd[0].title).toEqual('🦞  Lobster');
  expect(milestonesToAdd[1].title).toEqual('🗺  Map');
  expect(milestonesToAdd[2].title).toEqual('🦔  Porcupine');
  expect(milestonesToAdd[3].title).toEqual('☀️  Sun');
  expect(milestonesToAdd[4].title).toEqual('🎾  Tennis');
  expect(milestonesToAdd[5].title).toEqual('☂️  Umbrella');

  const TestMilestoneList2: Milestone[] = [
    _quickGenerateMilestone('🍊  Orange'),
    _quickGenerateMilestone('🦞  Lobster'),
    _quickGenerateMilestone('🗺  Map'),
    _quickGenerateMilestone('🦔  Porcupine'),
    _quickGenerateMilestone('☀️  Sun'),
    _quickGenerateMilestone('🎾  Tennis'),
    _quickGenerateMilestone('☂️  Umbrella')
  ];

  const processor2 = new MilestoneProcessor(
    DefaultProcessorOptions,
    async p => (p == 1 ? TestMilestoneList2 : []),
    now
  );

  const processorResult = await processor2.processMilestones(1);
  expect(processorResult.milestonesToAdd.length).toEqual(0);
});

function _quickGenerateMilestone(title: string) {
  return generateMilestone(
    1234,
    1,
    title,
    'First sprint',
    '2020-01-01T17:00:00Z',
    0,
    3,
    false,
    '2020-06-04T12:00:00Z'
  );
}

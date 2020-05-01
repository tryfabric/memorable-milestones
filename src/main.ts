import * as core from '@actions/core';
import {
  MilestoneProcessor,
  MilestoneProcessorOptions
} from './MilestoneProcessor';

async function run(): Promise<void> {
  try {
    const args = getAndValidateArgs();

    const processor: MilestoneProcessor = new MilestoneProcessor(args);
    await processor.processMilestones();
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getAndValidateArgs(): MilestoneProcessorOptions {
  const args = {
    repoToken: core.getInput('repo-token', {required: true}),
    debugOnly: core.getInput('debug-only') === 'true'
  };
  return args;
}

run();

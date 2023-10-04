import * as core from '@actions/core'
import { gatherInputs } from './input/inputs'
import { ActionOrchestrator } from './action/action-orchestrator'
import { setOutputs } from './output/outputs'

async function run(): Promise<void> {
  const inputs = gatherInputs()
  const outputs = await new ActionOrchestrator().execute(inputs)
  setOutputs(outputs)
}

// eslint-disable-next-line github/no-then
run().catch(error => {
  core.error(error)
  if (error instanceof Error) {
    core.setFailed(error.message)
  }
})

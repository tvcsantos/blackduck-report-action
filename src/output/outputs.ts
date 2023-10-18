import * as core from '@actions/core'

export type Outputs = {
  reportFilePath: string
}

export enum Output {
  REPORT_FILE_PATH = 'report-file-path'
}

export function setOutputs(outputs: Outputs): void {
  setOutput(Output.REPORT_FILE_PATH, outputs.reportFilePath)
}

function setOutput(output: Output, value: unknown): void {
  core.setOutput(output, value)
}

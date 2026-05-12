import { SbomReportFormat, SbomReportType } from '../input/inputs'

export type SbomReportPayload = {
  reportFormat: SbomReportFormat
  specification: SbomReportType
  includeSubprojects: boolean
  template?: string
}

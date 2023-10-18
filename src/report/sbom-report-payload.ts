import { SbomReportFormat, SbomReportType } from '../input/inputs'

export type SbomReportPayload = {
  reportFormat: SbomReportFormat
  sbomType: SbomReportType
  includeSubprojects: boolean
}

import { ReportProperties } from './report-properties'
import { SbomReportFormat, SbomReportType } from '../input/inputs'

export interface SbomReportProperties extends ReportProperties {
  readonly type: SbomReportType
  readonly format: SbomReportFormat
}

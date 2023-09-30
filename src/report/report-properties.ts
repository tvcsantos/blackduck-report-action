import { ReportFormat, ReportType } from '../input/inputs'

export interface ReportProperties {
  readonly type: ReportType
  readonly format: ReportFormat
  readonly outputDirectory: string
}

import { ReportProperties } from './report-properties'
import { LicenseReportFormat, LicenseReportType } from '../input/inputs'

export interface LicenseReportProperties extends ReportProperties {
  readonly type: LicenseReportType
  readonly format: LicenseReportFormat
}

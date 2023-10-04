import { ReportProperties } from './report-properties'
import {
  CycloneDXReportFormat,
  SbomReportType,
  SPDXReportFormat
} from '../input/inputs'

export interface SbomReportProperties extends ReportProperties {
  readonly type: SbomReportType
  readonly format: SPDXReportFormat | CycloneDXReportFormat
}

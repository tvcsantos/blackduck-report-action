import { ReportProperties } from './report-properties'

export interface ReportGenerator<T extends ReportProperties> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generate(projectVersion: any, reportProperties: T): Promise<string>
}

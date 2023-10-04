import { ReportProperties } from './report-properties'
import { ProjectVersion } from '../model/blackduck'

export interface ReportGenerator<T extends ReportProperties> {
  generate(projectVersion: ProjectVersion, reportProperties: T): Promise<string>
}

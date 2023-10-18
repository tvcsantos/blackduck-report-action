import { LicenseReportFormat } from '../input/inputs'

export type LicenseReportPayload = {
  reportFormat: LicenseReportFormat
  categories: LicenseReportCategory[]
  includeSubprojects: boolean
}

export enum LicenseReportCategory {
  COPYRIGHT_TEXT = 'COPYRIGHT_TEXT',
  DEEP_LICENSE_DATA = 'DEEP_LICENSE_DATA',
  FILE_COPYRIGHT_TEXT = 'FILE_COPYRIGHT_TEXT',
  FILE_LICENSE_DATA = 'FILE_LICENSE_DATA',
  UNMATCHED_FILE_DISCOVERIES = 'UNMATCHED_FILE_DISCOVERIES'
}

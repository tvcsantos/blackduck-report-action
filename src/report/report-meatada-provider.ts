import { SbomReportProperties } from './sbom-report-properties'
import { ReportMetadata } from './report-metadata'
import { SbomReportPayload } from './sbom-report-payload'
import { LicenseReportProperties } from './license-report-properties'
import { LicenseReportPayload } from './license-report-payload'

export const SBOM_REPORT_METADATA_PROVIDER = (
  reportProperties: SbomReportProperties
): ReportMetadata<SbomReportPayload> => {
  return {
    path: '/sbom-reports',
    payload: {
      reportFormat: reportProperties.format,
      sbomType: reportProperties.type,
      includeSubprojects: false
    }
  }
}

export const LICENSE_REPORT_METADATA_PROVIDER = (
  reportProperties: LicenseReportProperties
): ReportMetadata<LicenseReportPayload> => {
  return {
    path: '/license-reports',
    payload: {
      reportFormat: reportProperties.format,
      categories: [],
      includeSubprojects: false
    }
  }
}

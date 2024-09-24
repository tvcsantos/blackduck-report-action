import { SbomReportProperties } from './sbom-report-properties'
import { ReportMetadata } from './report-metadata'
import { SbomReportPayload } from './sbom-report-payload'
import { LicenseReportProperties } from './license-report-properties'
import { LicenseReportPayload } from './license-report-payload'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { SbomTemplate } from '../model/blackduck'
import { asyncIteratorFirstOrUndefined } from '../utils/utils'

const TEMPLATES_URL = 'sbom-templates'

export const SBOM_REPORT_METADATA_PROVIDER = async (
  blackDuckClient: BlackDuckClient,
  reportProperties: SbomReportProperties
): Promise<ReportMetadata<SbomReportPayload>> => {
  let templateUrl: string | undefined = undefined
  if (reportProperties.template) {
    const templatesUrl =
      await blackDuckClient.getResourceUrlByPath(TEMPLATES_URL)
    const templates = blackDuckClient.getItemsByUrl<SbomTemplate>(templatesUrl)
    const template = await asyncIteratorFirstOrUndefined(
      templates,
      x => x.name === reportProperties.template
    )
    if (!template) {
      throw new Error(`Template ${reportProperties.template} not found.`)
    }
    templateUrl = template._meta.href
  }
  return {
    path: '/sbom-reports',
    payload: {
      reportFormat: reportProperties.format,
      sbomType: reportProperties.type,
      includeSubprojects: false,
      template: templateUrl
    }
  }
}

export const LICENSE_REPORT_METADATA_PROVIDER = async (
  _: BlackDuckClient,
  reportProperties: LicenseReportProperties
): Promise<ReportMetadata<LicenseReportPayload>> => {
  return {
    name: 'licenseReports',
    payload: {
      reportFormat: reportProperties.format,
      categories: [],
      includeSubprojects: false
    }
  }
}

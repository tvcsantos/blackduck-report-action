import { LicenseReportType, ReportType, SbomReportType } from '../input/inputs'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { ReportGenerator } from './report-generator'
import { ReportProperties } from './report-properties'
import { DefaultReportGenerator } from './default-report-generator'
import {
  LICENSE_REPORT_METADATA_PROVIDER,
  SBOM_REPORT_METADATA_PROVIDER
} from './report-meatada-provider'
import { ReportMetadata } from './report-metadata'

export class ReportGeneratorFactory {
  private constructor() {}

  getReportGenerator(
    blackDuckClient: BlackDuckClient,
    reportType: ReportType
  ): ReportGenerator<ReportProperties> {
    let reportMetadataProvider: (
      reportProperties: never
    ) => ReportMetadata<unknown>
    if (reportType in SbomReportType) {
      reportMetadataProvider = SBOM_REPORT_METADATA_PROVIDER
    } else if (reportType in LicenseReportType) {
      reportMetadataProvider = LICENSE_REPORT_METADATA_PROVIDER
    } else {
      throw new Error('Invalid report type.')
    }
    return new DefaultReportGenerator(blackDuckClient, reportMetadataProvider)
  }

  private static instance = new ReportGeneratorFactory()

  static getInstance(): ReportGeneratorFactory {
    return ReportGeneratorFactory.instance
  }
}

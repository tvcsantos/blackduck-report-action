import { ReportType, SbomReportType } from '../input/inputs'
import { SbomReportGenerator } from './sbom-report-generator'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { ReportGenerator } from './report-generator'
import { ReportProperties } from './report-properties'

export class ReportGeneratorFactory {
  private constructor() {}

  getReportGenerator(
    blackDuckClient: BlackDuckClient,
    reportType: ReportType
  ): ReportGenerator<ReportProperties> {
    if (reportType in SbomReportType) {
      return new SbomReportGenerator(blackDuckClient)
    }
    throw new Error('Invalid report type.')
  }

  private static instance = new ReportGeneratorFactory()

  static getInstance(): ReportGeneratorFactory {
    return ReportGeneratorFactory.instance
  }
}

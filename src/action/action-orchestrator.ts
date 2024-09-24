import { Inputs, SbomReportType } from '../input/inputs'
import { ReportGeneratorFactory } from '../report/report-generator-factory'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { BlackDuckEnhancedClient } from '../blackduck/black-duck-enhanced-client'
import { ProjectProperties } from '../model/project-properties'
import { ReportProperties } from '../report/report-properties'
import { Outputs } from '../output/outputs'
import { SbomReportProperties } from '../report/sbom-report-properties'
import { LicenseReportProperties } from '../report/license-report-properties'

export class ActionOrchestrator {
  private inputs!: Inputs
  private blackDuckClient!: BlackDuckClient
  private blackDuckEnhancedClient!: BlackDuckEnhancedClient
  private readonly reportGeneratorFactory: ReportGeneratorFactory =
    ReportGeneratorFactory.getInstance()

  private makeBlackDuckClient(): BlackDuckClient {
    return new BlackDuckClient(
      this.inputs.blackDuckUrl,
      this.inputs.blackDuckToken
    )
  }

  private makeBlackDuckEnhancedClient(): BlackDuckEnhancedClient {
    return new BlackDuckEnhancedClient(
      this.blackDuckClient,
      this.reportGeneratorFactory
    )
  }

  private getProjectProperties(): ProjectProperties {
    return {
      name: this.inputs.projectName,
      version: this.inputs.projectVersion
    }
  }

  private getReportProperties(): ReportProperties {
    if (this.inputs.reportType in SbomReportType) {
      return {
        type: this.inputs.reportType,
        format: this.inputs.reportFormat,
        outputDirectory: this.inputs.outputDirectory,
        template: this.inputs.sbomReportTemplate
      } as SbomReportProperties
    }

    return {
      type: this.inputs.reportType,
      format: this.inputs.reportFormat,
      outputDirectory: this.inputs.outputDirectory
    } as LicenseReportProperties
  }

  async execute(inputs: Inputs): Promise<Outputs> {
    this.inputs = inputs
    this.blackDuckClient = this.makeBlackDuckClient()
    this.blackDuckEnhancedClient = this.makeBlackDuckEnhancedClient()
    const filePath = await this.blackDuckEnhancedClient.generateReport(
      this.getProjectProperties(),
      this.getReportProperties()
    )
    return { reportFilePath: filePath }
  }
}

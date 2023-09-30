import fs from 'fs/promises'
import * as core from '@actions/core'
import { retrySuccessWithExponentialBackoff } from '../utils/utils'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { ReportGenerator } from './report-generator'
import { SbomReportProperties } from './sbom-report-properties'

export class SbomReportGenerator
  implements ReportGenerator<SbomReportProperties>
{
  // Define constants for retry settings
  private static MAX_RETRIES = 10 // Maximum number of retries
  private static INITIAL_DELAY_MS = 1000 // Initial delay in milliseconds
  private static MAX_CUMULATIVE_DELAY_MS = 300000 // Maximum cumulative delay (5 minutes)

  constructor(private readonly blackDuckClient: BlackDuckClient) {}

  async generate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    version: any,
    reportProperties: SbomReportProperties
  ): Promise<string> {
    const url = await this.blackDuckClient.getResourceUrlByPath(
      '/sbom-reports',
      version
    )

    const payload = {
      reportFormat: reportProperties.format,
      sbomType: reportProperties.type,
      includeSubprojects: true
    }

    const response = await this.blackDuckClient.client.post(url, payload)

    const locationHeader = response.headers['location']

    if (!locationHeader) {
      throw Error(
        'Request to create report failed. Location header is missing.'
      )
    }

    core.debug(
      `Report creation request successful. Location: ${locationHeader}`
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report: any = await retrySuccessWithExponentialBackoff<any>(
      async () => this.getReportStatus(locationHeader),
      SbomReportGenerator.INITIAL_DELAY_MS,
      SbomReportGenerator.MAX_CUMULATIVE_DELAY_MS,
      SbomReportGenerator.MAX_RETRIES,
      (result: { status: string } | null) => result?.status === 'IN_PROGRESS'
    )

    if (!report || report.status !== 'COMPLETED') {
      throw Error('Unable to get a COMPLETED report.')
    }

    core.debug('Found report with status COMPLETED.')

    const downloadLink = report._meta.links.find(
      (link: { rel: string }) => link.rel === 'download'
    )?.href

    core.debug(`Report download link: ${downloadLink}`)

    return this.downloadAndSaveFile(
      downloadLink,
      reportProperties.outputDirectory
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getReportStatus(reportUrl: string): Promise<any> {
    const response = await this.blackDuckClient.client.get(reportUrl)
    return response.data
  }

  private async downloadAndSaveFile(
    url: string,
    outputDirectory: string
  ): Promise<string> {
    const response = await this.blackDuckClient.client.get(url, {
      responseType: 'blob'
    })
    let fileName = 'downloaded_file.zip'

    // Get the content disposition header
    const contentDisposition = response.headers['content-disposition'] || ''

    // Extract the filename from the content disposition header
    const matches = /filename="([^"]+)"/.exec(contentDisposition)

    if (matches && matches.length > 1) {
      // Use the extracted filename if available
      fileName = matches[1]
    }

    await fs.writeFile(`${outputDirectory}/${fileName}`, response.data)

    return `${outputDirectory}/${fileName}`
  }
}

import fs from 'fs'
import fsp from 'fs/promises'
import { Readable } from 'stream'
import * as core from '@actions/core'
import { retrySuccessWithExponentialBackoff } from '../utils/utils'
import { BlackDuckClient } from '../blackduck/black-duck-client'
import { ReportGenerator } from './report-generator'
import { ProjectVersion, Report } from '../model/blackduck'
import { getReportDownloadLink } from './utils'
import { ReportProperties } from './report-properties'
import { ReportMetadata } from './report-metadata'

export class DefaultReportGenerator<T extends ReportProperties>
  implements ReportGenerator<T>
{
  // Define constants for retry settings
  private static MAX_RETRIES = 10 // Maximum number of retries
  private static INITIAL_DELAY_MS = 1000 // Initial delay in milliseconds
  private static MAX_CUMULATIVE_DELAY_MS = 300000 // Maximum cumulative delay (5 minutes)
  private static REPORT_FILE_NAME_PATTERN = /filename="([^"]+)"/
  private static DEFAULT_FILE_NAME = 'downloaded_file.zip'

  constructor(
    private readonly blackDuckClient: BlackDuckClient,
    private readonly reportMetadataProvider: (
      reportProperties: T
    ) => ReportMetadata<unknown>
  ) {}

  private async createReport(
    version: ProjectVersion,
    reportProperties: T
  ): Promise<string> {
    const reportMetadata = this.reportMetadataProvider(reportProperties)
    const url = await this.blackDuckClient.getResourceUrlByPath(
      reportMetadata.path,
      version
    )

    const response = await this.blackDuckClient.client.post(
      url,
      reportMetadata.payload
    )

    const locationHeader = response.headers['location']

    if (!locationHeader) {
      throw Error(
        'Request to create report failed. Location header is missing.'
      )
    }

    core.debug(
      `Report creation request successful. Location: ${locationHeader}`
    )

    return locationHeader
  }

  private async getCreatedReportData(locationHeader: string): Promise<Report> {
    const report = await retrySuccessWithExponentialBackoff<Report>(
      async () => this.getReportStatus(locationHeader),
      DefaultReportGenerator.INITIAL_DELAY_MS,
      DefaultReportGenerator.MAX_CUMULATIVE_DELAY_MS,
      DefaultReportGenerator.MAX_RETRIES,
      result => result?.status === 'IN_PROGRESS'
    )
    if (!report || report.status !== 'COMPLETED') {
      throw Error('Unable to get a COMPLETED report.')
    }

    core.debug('Found report with status COMPLETED.')

    return report
  }

  async generate(
    version: ProjectVersion,
    reportProperties: T
  ): Promise<string> {
    const locationHeader = await this.createReport(version, reportProperties)
    const report = await this.getCreatedReportData(locationHeader)
    const downloadLink = getReportDownloadLink(report)
    core.debug(`Report download link: ${downloadLink}`)

    return this.downloadAndSaveFile(
      downloadLink,
      reportProperties.outputDirectory,
      report.fileName
    )
  }

  private async getReportStatus(reportUrl: string): Promise<Report> {
    const { data: result } =
      await this.blackDuckClient.client.get<Report>(reportUrl)
    return result
  }

  private async downloadAndSaveFile(
    url: string,
    outputDirectory: string,
    fileName?: string
  ): Promise<string> {
    const response = await this.blackDuckClient.client.get(url, {
      responseType: 'stream'
    })
    let savedFileName = fileName
    if (!savedFileName) {
      savedFileName = DefaultReportGenerator.DEFAULT_FILE_NAME

      // Get the content disposition header
      const contentDisposition = response.headers['content-disposition'] || ''

      // Extract the filename from the content disposition header
      const matches =
        DefaultReportGenerator.REPORT_FILE_NAME_PATTERN.exec(contentDisposition)

      if (matches && matches.length > 1) {
        // Use the extracted filename if available
        savedFileName = matches[1]
      }
    }

    await fsp.mkdir(outputDirectory, { recursive: true })

    const fileStream = fs.createWriteStream(
      `${outputDirectory}/${savedFileName}`
    )

    await new Promise<void>((resolve, reject) => {
      const stream = response.data as Readable
      stream.pipe(fileStream)

      stream.on('end', () => {
        core.debug(`File "${fileName}" downloaded and saved.`)
        resolve()
      })

      stream.on('error', err => {
        console.debug('Error downloading file:', err)
        reject(err)
      })
    })

    return `${outputDirectory}/${savedFileName}`
  }
}

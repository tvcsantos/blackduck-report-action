import * as core from '@actions/core'

export type Inputs = {
  blackDuckUrl: string
  blackDuckToken: string
  outputDirectory: string
  projectName: string
  projectVersion: string
  reportFormat: ReportFormat
  reportType: ReportType
}

export enum Input {
  // noinspection SpellCheckingInspection
  BLACKDUCK_URL = 'blackduck-url',
  BLACKDUCK_TOKEN = 'blackduck-token',
  PROJECT_NAME = 'project-name',
  PROJECT_VERSION = 'project-version',
  REPORT_FORMAT = 'report-format',
  REPORT_TYPE = 'report-type',
  OUTPUT_DIRECTORY = 'output-directory'
}

// noinspection SpellCheckingInspection
export enum SbomReportType {
  // noinspection SpellCheckingInspection
  SPDX_22 = 'SPDX_22',
  SPDX_23 = 'SPDX_23',
  CYCLONEDX_13 = 'CYCLONEDX_13',
  CYCLONEDX_14 = 'CYCLONEDX_14'
}

export enum LicenseReportType {
  LICENSE = 'LICENSE'
}

export type ReportType = SbomReportType | LicenseReportType

export enum SPDXReportFormat {
  // noinspection SpellCheckingInspection
  JSON = 'JSON',
  YAML = 'YAML',
  RDF = 'RDF',
  TAGVALUE = 'TAGVALUE'
}

export enum CycloneDXReportFormat {
  JSON = 'JSON'
}

export enum LicenseReportFormat {
  JSON = 'JSON',
  TEXT = 'TEXT'
}

export type SbomReportFormat = SPDXReportFormat | CycloneDXReportFormat

export type ReportFormat = SbomReportFormat | LicenseReportFormat

const REPORT_MATCHING: Map<ReportType, ReportFormat[]> = new Map<
  ReportType,
  ReportFormat[]
>([
  [
    LicenseReportType.LICENSE,
    [LicenseReportFormat.JSON, LicenseReportFormat.TEXT]
  ],
  [
    SbomReportType.SPDX_22,
    [
      SPDXReportFormat.JSON,
      SPDXReportFormat.YAML,
      SPDXReportFormat.RDF,
      SPDXReportFormat.TAGVALUE
    ]
  ],
  [
    SbomReportType.SPDX_23,
    [
      SPDXReportFormat.JSON,
      SPDXReportFormat.YAML,
      SPDXReportFormat.RDF,
      SPDXReportFormat.TAGVALUE
    ]
  ],
  [SbomReportType.CYCLONEDX_13, [SPDXReportFormat.JSON]],
  [SbomReportType.CYCLONEDX_14, [SPDXReportFormat.JSON]]
])

export function gatherInputs(): Inputs {
  const blackDuckUrl = getInputBlackDuckUrl()
  const blackDuckToken = getInputBlackDuckToken()
  const projectName = getInputProjectName()
  const projectVersion = getInputProjectVersion()
  const reportFormat = getInputReportFormat()
  const reportType = getInputReportType()
  const outputDirectory = getInputOutputDirectory()
  verifyMatchingReportTypeAndFormat(reportType, reportFormat)
  return {
    blackDuckUrl,
    blackDuckToken,
    projectName,
    projectVersion,
    reportFormat,
    reportType,
    outputDirectory
  }
}

function getInputBlackDuckUrl(): string {
  return core.getInput(Input.BLACKDUCK_URL, { required: true })
}

function getInputBlackDuckToken(): string {
  return core.getInput(Input.BLACKDUCK_TOKEN, { required: true })
}

function getInputProjectName(): string {
  return core.getInput(Input.PROJECT_NAME, { required: true })
}

function getInputProjectVersion(): string {
  return core.getInput(Input.PROJECT_VERSION, { required: true })
}

function internalGetInputReportFormat(): string {
  return core.getInput(Input.REPORT_FORMAT)
}

function internalGetInputReportType(): string {
  return core.getInput(Input.REPORT_TYPE)
}

function getInputOutputDirectory(): string {
  return core.getInput(Input.OUTPUT_DIRECTORY)
}

function getInputReportFormat(): ReportFormat {
  const reportFormat = internalGetInputReportFormat()
  const allowedReportFormats = []
  allowedReportFormats.push(...Object.values<string>(SPDXReportFormat))
  allowedReportFormats.push(...Object.values<string>(CycloneDXReportFormat))
  if (!allowedReportFormats.includes(reportFormat)) {
    throw new Error(`Invalid ${Input.REPORT_FORMAT} option '${reportFormat}'`)
  }
  return reportFormat as ReportFormat
}

function getInputReportType(): ReportType {
  const reportType = internalGetInputReportType()
  const allowedReportTypes = []
  allowedReportTypes.push(...Object.values<string>(SbomReportType))
  if (!allowedReportTypes.includes(reportType)) {
    throw new Error(`Invalid ${Input.REPORT_TYPE} option '${reportType}'`)
  }
  return reportType as ReportType
}

function verifyMatchingReportTypeAndFormat(
  reportType: ReportType,
  reportFormat: ReportFormat
): void {
  const allowedReportFormats = REPORT_MATCHING.get(reportType)
  if (!allowedReportFormats) {
    throw new Error(`Unknown report type '${reportType}'`)
  }
  if (!allowedReportFormats.includes(reportFormat)) {
    throw new Error(
      `Report type '${reportType}' does not support report format '${reportFormat}'`
    )
  }
}

// Pattern: function getInput<input-name>(): <type>

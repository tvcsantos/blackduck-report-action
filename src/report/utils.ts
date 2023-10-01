import { Report } from '../model/blackduck'

export function getReportDownloadLinkOrUndefined(
  report: Report
): string | undefined {
  return report._meta.links.find(link => link.rel === 'download')?.href
}

export function getReportDownloadLink(report: Report): string {
  const downloadLink = getReportDownloadLinkOrUndefined(report)
  if (!downloadLink) {
    throw Error('Unable to find report download link.')
  }
  return downloadLink
}

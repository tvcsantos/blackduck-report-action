/* eslint-disable @typescript-eslint/no-explicit-any */
import { BlackDuckClient } from './black-duck-client'
import { asyncIteratorFirstOrUndefined } from '../utils/utils'
import { ReportGeneratorFactory } from '../report/report-generator-factory'
import { ProjectProperties } from '../model/project-properties'
import { ReportProperties } from '../report/report-properties'

export class BlackDuckEnhancedClient {
  private static ITEMS_DEFAULT_PAGE_SIZE = 50

  private static PROJECTS_RESOURCE = 'projects'
  private static VERSIONS_RESOURCE = 'versions'
  private static NAME_SEARCH = 'name'
  private static VERSION_NAME_SEARCH = 'versionName'

  constructor(
    private readonly blackDuckClient: BlackDuckClient,
    private readonly reportGeneratorFactory: ReportGeneratorFactory
  ) {}

  async getProjectsByName(
    projectName: string
  ): Promise<AsyncIterableIterator<any>> {
    return this.blackDuckClient.getItemsByName(
      BlackDuckEnhancedClient.PROJECTS_RESOURCE,
      null,
      BlackDuckEnhancedClient.ITEMS_DEFAULT_PAGE_SIZE,
      {
        searchParams: {
          q: `${BlackDuckEnhancedClient.NAME_SEARCH}:${projectName}`
        }
      }
    )
  }

  async getProjectByName(projectName: string): Promise<any> {
    const projectsWithName = await this.getProjectsByName(projectName)
    return asyncIteratorFirstOrUndefined<any>(
      projectsWithName,
      x => x.name === projectName
    )
  }

  async getProjectVersions(project: any): Promise<AsyncIterableIterator<any>> {
    return this.blackDuckClient.getItemsByName(
      BlackDuckEnhancedClient.VERSIONS_RESOURCE,
      project
    )
  }

  async getProjectVersion(project: any, versionName: string): Promise<any> {
    const versions = await this.blackDuckClient.getItemsByName(
      BlackDuckEnhancedClient.VERSIONS_RESOURCE,
      project,
      BlackDuckEnhancedClient.ITEMS_DEFAULT_PAGE_SIZE,
      {
        searchParams: {
          q: `${BlackDuckEnhancedClient.VERSION_NAME_SEARCH}:${versionName}`
        }
      }
    )
    return asyncIteratorFirstOrUndefined<any>(
      versions,
      x => x.name === versionName
    )
  }

  private async deleteResource(resource: any): Promise<void> {
    await this.blackDuckClient.client.delete(resource._meta.href)

    return Promise.resolve()
  }

  async generateReport(
    projectProperties: ProjectProperties,
    reportProperties: ReportProperties
  ): Promise<string> {
    const project = await this.getProjectByName(projectProperties.name)
    const version = await this.getProjectVersion(
      project,
      projectProperties.version
    )
    const reportGenerator = this.reportGeneratorFactory.getReportGenerator(
      this.blackDuckClient,
      reportProperties.type
    )
    return reportGenerator.generate(version, reportProperties)
  }
}

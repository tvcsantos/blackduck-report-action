import { BlackDuckClient } from './black-duck-client'
import { asyncIteratorFirstOrUndefined } from '../utils/utils'
import { ReportGeneratorFactory } from '../report/report-generator-factory'
import { ProjectProperties } from '../model/project-properties'
import { ReportProperties } from '../report/report-properties'
import { MetaResource, Project, ProjectVersion } from '../model/blackduck'

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
  ): Promise<AsyncIterableIterator<Project>> {
    return this.blackDuckClient.getItemsByName<Project>(
      BlackDuckEnhancedClient.PROJECTS_RESOURCE,
      undefined,
      BlackDuckEnhancedClient.ITEMS_DEFAULT_PAGE_SIZE,
      {
        params: {
          q: `${BlackDuckEnhancedClient.NAME_SEARCH}:${projectName}`
        }
      }
    )
  }

  async getProjectByName(projectName: string): Promise<Project | undefined> {
    const projectsWithName = await this.getProjectsByName(projectName)
    return asyncIteratorFirstOrUndefined<Project>(
      projectsWithName,
      x => x.name === projectName
    )
  }

  async getProjectVersions(
    project: Project
  ): Promise<AsyncIterableIterator<ProjectVersion>> {
    return this.blackDuckClient.getItemsByName<ProjectVersion>(
      BlackDuckEnhancedClient.VERSIONS_RESOURCE,
      project
    )
  }

  async getProjectVersion(
    project: Project,
    versionName: string
  ): Promise<ProjectVersion | undefined> {
    const versions = await this.blackDuckClient.getItemsByName<ProjectVersion>(
      BlackDuckEnhancedClient.VERSIONS_RESOURCE,
      project,
      BlackDuckEnhancedClient.ITEMS_DEFAULT_PAGE_SIZE,
      {
        params: {
          q: `${BlackDuckEnhancedClient.VERSION_NAME_SEARCH}:${versionName}`
        }
      }
    )
    return asyncIteratorFirstOrUndefined(
      versions,
      x => x.versionName === versionName
    )
  }

  private async deleteResource(resource: MetaResource): Promise<void> {
    await this.blackDuckClient.client.delete(resource._meta.href)

    return Promise.resolve()
  }

  async generateReport(
    projectProperties: ProjectProperties,
    reportProperties: ReportProperties
  ): Promise<string> {
    const project = await this.getProjectByName(projectProperties.name)
    if (!project) {
      throw Error(`Project '${projectProperties.name}' not found`)
    }
    const version = await this.getProjectVersion(
      project,
      projectProperties.version
    )
    if (!version) {
      throw Error(
        `Version '${projectProperties.version}' not found in project '${projectProperties.name}'`
      )
    }
    const reportGenerator = this.reportGeneratorFactory.getReportGenerator(
      this.blackDuckClient,
      reportProperties.type
    )
    return reportGenerator.generate(version, reportProperties)
  }
}

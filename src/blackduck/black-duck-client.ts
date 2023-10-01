import * as core from '@actions/core'
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from 'axios'
import { AuthenticationToken } from '../model/authentication-token'
import { Meta, Page, Resource } from '../model/blackduck'

// ℹ️ This code is adapted from hub-rest-api-python project
// and ported to TypeScript.
// For reference: https://github.com/blackducksoftware/hub-rest-api-python/blob/master/blackduck/Client.py
export class BlackDuckClient {
  private static TOKEN_EXPIRATION_DELTA = 5 * 60 * 1_000 // 5 minutes

  private cachedAuthenticationExpireTime: number | null = null
  private cachedAuthentication: AuthenticationToken | null = null
  private readonly clientInstance: AxiosInstance
  private rootResourcesDict: Resource | null = null

  private async authenticationHook(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    const accessToken = await this.getAccessToken()
    config.headers.Authorization = `Bearer ${accessToken}`
    return config
  }

  constructor(
    private readonly basePath: string,
    private readonly token: string
  ) {
    // Create an Axios instance with a request interceptor
    this.clientInstance = axios.create({
      baseURL: basePath
    })
    this.clientInstance.interceptors.request.use(async config =>
      this.authenticationHook(config)
    )
  }

  private isTokenExpired(): boolean {
    return (
      !this.cachedAuthenticationExpireTime ||
      Date.now() >
        this.cachedAuthenticationExpireTime -
          BlackDuckClient.TOKEN_EXPIRATION_DELTA
    )
  }

  private async getAccessToken(): Promise<string> {
    let currentToken = this.cachedAuthentication
    let expired = true
    if (currentToken != null) {
      expired = this.isTokenExpired()
    }
    if (expired) {
      core.debug('Access Token Expired!. Retrieving a fresh token.')
      currentToken = await this.getFreshAccessToken()
      this.cachedAuthenticationExpireTime =
        Date.now() + currentToken.expiresInMilliseconds
      this.cachedAuthentication = currentToken
    } else {
      core.debug('Access Token Ok.')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Promise.resolve(currentToken!.bearerToken)
  }

  private async getFreshAccessToken(): Promise<AuthenticationToken> {
    const config = {
      headers: {
        Authorization: `token ${this.token}`
      }
    }
    const { data: response } = await axios.post<AuthenticationToken>(
      `${this.basePath}/api/tokens/authenticate`,
      {},
      config
    )
    return Promise.resolve(response)
  }

  // noinspection GrazieInspection
  /**
   * List named resources that can be fetched.
   *
   * @returns dict(str -> str): of public resource names to urls
   * To obtain the url to the parent itself, use key 'href'.
   *
   * @param parent (dict/json): resource object from prior get_resource invocations.
   * Defaults to None (for root /api/ base).
   */
  async listResources<T>(parent?: Resource): Promise<T> {
    if (parent) {
      const key = '_hub_rest_api_python_resources_dict'
      if (!(key in parent)) {
        const parentMeta = parent['_meta'] as Meta
        const resourcesDict: Resource = {}
        for (const res of parentMeta.links) {
          resourcesDict[res['rel']] = res['href']
        }
        // save url to parent itself if available, otherwise save 'href': None
        resourcesDict['href'] = parentMeta.href
        parent[key] = resourcesDict // cache for future use
      }
      return Promise.resolve(parent[key] as T)
    } else {
      // the root resources are in a different format (name -> href)
      // compared to (rel, href) pairs in _meta.links
      if (!this.rootResourcesDict) {
        // cache root resources for efficiency
        const response = await this.clientInstance.get<Resource>(
          `${this.basePath}/api/`
        )
        const data = response.data
        data['href'] = response.config.url // save url to root itself
        delete data['_meta']
        this.rootResourcesDict = data
      }
      return Promise.resolve(this.rootResourcesDict as T)
    }
  }

  async getResourceUrlByName(name: string, parent?: Resource): Promise<string> {
    const resourcesDict: Resource = await this.listResources(parent)
    if (!(name in resourcesDict)) {
      const message = `resource name '${name}' not found in available resources`
      core.error(message)
      core.error(JSON.stringify(resourcesDict))
      throw Error(message)
    }
    return Promise.resolve(resourcesDict[name] as string)
  }

  async getItemsByName<T>(
    name: string,
    parent?: Resource,
    pageSize = 50,
    properties?: AxiosRequestConfig
  ): Promise<AsyncIterableIterator<T>> {
    const url = await this.getResourceUrlByName(name, parent)
    return Promise.resolve(this.getItemsByUrl(url, pageSize, properties))
  }

  getItemsByUrl<T>(
    url: string,
    pageSize = 50,
    properties?: AxiosRequestConfig
  ): AsyncIterableIterator<T> {
    return this.internalGetItems(url, pageSize, properties)
  }

  // noinspection GrazieInspection
  /**
   * Fetch a named resource.
   *
   * @returns list (items=True) or dict formed from returned json
   *
   * @param name (str): resource name i.e. specific key from list_resources()
   * @param parent (dict/json): resource object from prior get_resource() call.
   *                                 Use None for root /api/ base.
   * @param properties passed to session.request
   */
  async getResource<T>(
    name: string,
    parent?: Resource,
    properties?: AxiosRequestConfig
  ): Promise<T> {
    if (name.length <= 0) {
      throw new Error('name parameter must be non-empty')
    }

    const url = await this.getResourceUrlByName(name, parent)
    return this.getJson(url, properties ?? {})
  }

  // noinspection GrazieInspection
  /**
   * Fetch named resource metadata and other useful data such as totalCount.
   *
   * @returns dict/json: named resource metadata
   *
   * @param name (str): resource name i.e. specific key from list_resources()
   * @param parent (dict/json): resource object from prior get_resource() call.
   *                                 Use None for root /api/ base.
   * @param properties passed to session.request
   */
  async getMetadata(
    name: string,
    parent?: Resource,
    properties?: AxiosRequestConfig
  ): Promise<unknown> {
    // limit: 0 works for 'projects' but not for 'codeLocations' or project 'versions'
    const newProperties = properties ?? {}
    newProperties.params = { limit: 1 }
    return this.getResource(name, parent, newProperties)
  }

  // noinspection GrazieInspection
  /**
   * Streamline GET request to url endpoint and return json result
   *            while preserving underlying error handling.
   *
   * @returns json/dict: requested object
   *
   * @throws requests.exceptions.HTTPError: from response.raise_for_status()
   * json.JSONDecodeError: if response.text is not json
   *
   * @param url (str): of endpoint
   * @param properties passed to session.request
   */
  private async getJson<T>(
    url: string,
    properties: AxiosRequestConfig
  ): Promise<T> {
    const headers = properties.headers ?? {}
    headers['Accept'] = 'application/json' // request json response
    properties.responseType = 'json'
    properties.headers = headers
    const response = await this.clientInstance.get<T>(url, properties)
    if ('content-type' in response.headers) {
      const contentType = response.headers['content-type'] ?? ''
      const values = contentType.split(',').map((x: string) => x.trim())
      if (values.some((x: string) => x === 'internal')) {
        core.warning(
          `Response contains internal proprietary Content-Type: ${contentType}`
        )
      }
    }
    core.debug(
      `Response received from '${url}': '${JSON.stringify(response.data)}'`
    )
    return Promise.resolve(response.data)
  }

  private async *internalGetItems<T>(
    url: string,
    pageSize: number,
    properties?: AxiosRequestConfig
  ): AsyncIterableIterator<T> {
    let offset = 0
    const myProperties = properties ?? {}
    const searchParams: { offset?: number; limit?: number } =
      myProperties.params ?? {}

    while (true) {
      searchParams.offset = offset
      searchParams.limit = pageSize
      myProperties.params = searchParams
      const json = await this.getJson<Page<T>>(url, myProperties)
      const items = json.items

      for (const item of items) {
        yield item
      }

      if (items.length < pageSize) {
        break
      }

      offset += pageSize
    }
  }

  async getResourceUrlByPath(path: string, parent?: Resource): Promise<string> {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    let basePath = `${this.basePath}/api`
    if (parent) {
      basePath = await this.getResourceUrlByName('href', parent)
    }
    return Promise.resolve(`${basePath}${path}`)
  }

  get client(): AxiosInstance {
    return this.clientInstance
  }
}

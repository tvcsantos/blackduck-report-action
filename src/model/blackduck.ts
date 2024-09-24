export type Project = { readonly name: string } & MetaResource

export type MetaResource = { readonly _meta: Meta } & Resource

export type Resource = Record<string, unknown>

export type ProjectVersion = { readonly versionName: string } & MetaResource

export type Report = {
  readonly status: string
  readonly fileName?: string
} & MetaResource

export type Page<T> = { readonly items: T[] } & MetaResource

export type Meta = {
  readonly allow?: string[]
  readonly href: string
  readonly links?: Link[]
}

export type Link = {
  readonly rel?: string
  readonly href?: string
}

export type SbomTemplate = {
  active: boolean
  default: boolean
  id: string
  name: string
} & MetaResource

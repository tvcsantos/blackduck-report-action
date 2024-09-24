# Create Black Duck Report Action

## Overview

This action provides support for creating Black Duck reports. Currently, it supports the following types:

- Software Bill of Materials (SBOM)
- License Reports

Software Bill of Materials (SBOM) reports can be generated in the following formats:

- SPDX v2.2
- SPDX v2.3
- CycloneDX v1.3
- CycloneDX v1.4

License reports can be generated in the following formats:

- JSON
- TEXT

## Changelog

All notable changes to this project are documented in [`CHANGELOG.md`](CHANGELOG.md).

## Usage

### Example

```yaml
on:
  push:
    tags:
      - '*'

jobs:
  create-report:
    name: Create Black Duck report 
    runs-on: ubuntu-latest
    steps:
      - name: Create Black Duck report
        uses: tvcsantos/blackduck-report-action@v2
        with:
          blackduck-url: ${{ vars.BLACKDUCK_URL }}
          blackduck-token: ${{ secrets.BLACKDUCK_API_TOKEN }}
```

In the example above we are using the action to create a Black Duck report for the current repository on push to any
tag. First we checkout our code, then we run this action.

⚠️ Note that this action requires at least the following parameters to work:

- `blackduck-url` - Black Duck instance URL.
- `blackduck-token` - Authentication token for a user, to scan your project.

⚠️ Note that `blackduck-token` should be kept as secret and not exposed in plain text in your action. Also, we can
benefit from variables to avoid having `blackduck-url` in plain text and promote re-usability of the above workflow in
our pipelines later.

In the example above `blackduck-token` is provided via the secret `BLACKDUCK_API_TOKEN`, that must be defined either in
your project repository or shared at organization level. With respect to `blackduck-url` it is provided via the variable
`BLACKDUCK_URL` that must be defined either in your repository variables or shared at organization level.

For more details on the values for these secrets and variables please check [Inputs](#inputs) section.

### Inputs

<!-- markdownlint-disable MD033 -->

| Input                  | Type   | Required | Default Value              | Description                                                                                                                                                                                                                                                                                          |
|------------------------|--------|----------|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `blackduck-url`        | String | Yes      | -                          | Black Duck instance URL.                                                                                                                                                                                                                                                                             |
| `blackduck-token`      | String | Yes      | -                          | Black Duck API token.                                                                                                                                                                                                                                                                                |
| `output-directory`     | String | No       | `./blackduck-report`       | Path to the directory where the report will be saved.                                                                                                                                                                                                                                                |
| `project-name`         | String | No       | `${{ github.repository }}` | Project name in Black Duck.                                                                                                                                                                                                                                                                          |
| `project-version`      | String | No       | `${{ github.ref_name }}`   | Project version in Black Duck.                                                                                                                                                                                                                                                                       |
| `report-format`        | String | No       | `JSON`                     | Report format depending on report-type. The following values are supported:<ul><li>`SPDX_22` report: `JSON`, `YAML`, `RDF` or `TAG_VALUE`.</li><li>`SPDX_23` report: `JSON`, `YAML`, `RDF` or `TAG_VALUE`.</li><li>`CYCLONE_DX_13` report: `JSON`.</li><li>`CYCLONE_DX_14` report: `JSON`.</li></ul> |
| `report-type`          | String | No       | `SPDX_23`                  | Report type. The following values are supported:<ul><li>`SPDX_22`. Generate a SBOM SPDX v2.2 report.</li><li>`SPDX_23`. Generate a SBOM SPDX v2.3 report.</li><li>`CYCLONE_DX_13`. Generate a SBOM CycloneDX v1.3 report.</li><li>`CYCLONE_DX_14`. Generate a SBOM CycloneDX v1.4 report.</li></ul>  |
| `sbom-report-template` | String | No       | -                          | Template name to be used for the SBOM report. This needs to match the name of the template in Black Duck. If not provided, the default template will be used.                                                                                                                                        |

<!-- markdownlint-enable MD033 -->

### Outputs

<!-- markdownlint-disable MD033 -->

| Output             | Type   | Description                        |
|--------------------|--------|------------------------------------|
| `report-file-path` | String | Path to the generated report file. |

<!-- markdownlint-enable MD033 -->

## License

This project is released under [MIT License](LICENSE.md).

## Contributions

Contributions are welcome! See [Contributor's Guide](CONTRIBUTING.md).

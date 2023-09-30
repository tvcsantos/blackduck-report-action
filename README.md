[test-badge]: https://github.com/tvcsantos/blackduck-report-action/actions/workflows/test.yml/badge.svg

# Create Black Duck Report Action

![test workflow][test-badge]

## Overview

This action provides support for creating Black Duck reports. Currently, it supports the following types:

- Software Bill of Materials (SBOM)

Software Bill of Materials (SBOM) reports can be generated in the following formats:
- SPDX v2.2
- SPDX v2.3
- CycloneDX v1.3
- CycloneDX v1.4

## Changelog

All notable changes to this project are documented in [`CHANGELOG.md`](CHANGELOG.md).

## Usage

### Example

```yaml
on:
  push:
    branches:
      - main

jobs:
  create-report:
    name: Create Black Duck report 
    runs-on: ubuntu-latest
    steps:
      - name: Create Black Duck report
        uses: tvcsantos/blackduck-report-action@v1
```

### Inputs

| Input              | Type   | Required | Default Value        | Description                                                                                                                                                                                                                                                                                          |
|--------------------|--------|----------|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `blackduck-url`    | String | Yes      | -                    | Black Duck instance URL.                                                                                                                                                                                                                                                                             |
| `blackduck-token`  | String | Yes      | -                    | Black Duck API token.                                                                                                                                                                                                                                                                                |
| `output-directory` | String | No       | `./blackduck-report` | Path to the directory where the report will be saved.                                                                                                                                                                                                                                                |
| `project-name`     | String | Yes      | -                    | Project name in Black Duck.                                                                                                                                                                                                                                                                          |
| `project-version`  | String | Yes      | -                    | Project version in Black Duck.                                                                                                                                                                                                                                                                       |
| `report-format`    | String | No       | `JSON`               | Report format depending on report-type. The following values are supported:<ul><li>`SPDX_22` report: `JSON`, `YAML`, `RDF` or `TAG_VALUE`.</li><li>`SPDX_23` report: `JSON`, `YAML`, `RDF` or `TAG_VALUE`.</li><li>`CYCLONE_DX_13` report: `JSON`.</li><li>`CYCLONE_DX_14` report: `JSON`.</li></ul> |
| `report-type`      | String | No       | `SPDX_23`            | Report type. The following values are supported:<ul><li>`SPDX_22`. Generate a SBOM SPDX v2.2 report.</li><li>`SPDX_23`. Generate a SBOM SPDX v2.3 report.</li><li>`CYCLONE_DX_13`. Generate a SBOM CycloneDX v1.3 report.</li><li>`CYCLONE_DX_14`. Generate a SBOM CycloneDX v1.4 report.</li></ul>  |

### Outputs

| Output             | Type   | Description                        |
|--------------------|--------|------------------------------------|
| `report-file-path` | String | Path to the generated report file. |

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE.md).

## Contributions

Contributions are welcome! See [Contributor's Guide](CONTRIBUTING.md).

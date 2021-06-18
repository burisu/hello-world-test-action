# Jira workflow

This action merge branchs.

## Inputs
### `Token`

**Required** Github token.
### `issueKey`

**Required** The Jira issue key.
### `mergeIn`

**Required** The target branch.

## Outputs

## Example usage

uses: actions/hello-world-javascript-action@v1.1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  issueKey: ${{ github.event.inputs.issueKey }}
  mergeIn: ${{ github.event.inputs.mergeIn }}

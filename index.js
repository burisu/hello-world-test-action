const core = require('@actions/core')
const github = require('@actions/github')

async function exec() {
  try {
    const token = core.getInput('token')
    const octokit = github.getOctokit(token)
    const issueKey = core.getInput('issueKey')

    const searchResult = await octokit.graphql(`
      query targetPullRequest($queryString: String!) {
        search(last: 1, query: $queryString, type: ISSUE) {
          nodes {
            ... on PullRequest {
              title
              headRefName
              baseRefName
              mergeable
              reviewDecision
              checksResourcePath
              checksUrl
            }
          }
        }
      }
    `,
      {
      queryString: `is:pr ${issueKey} in:title repo:${github.context.payload.repository.full_name}`
      })
    const pullRequest = searchResult.search.nodes[0]
    if (pullRequest.mergeable !== 'MERGEABLE' || pullRequest.reviewDecision === 'CHANGES_REQUESTED') {
      console.error(`Mergeable : ${pullRequest.mergeable}, Review : ${reviewDecision}`)
      throw new Error('Pull Request is not ready for merging')
    }

    core.setOutput('targetBranch', pullRequest.headRefName)
  } catch (error) {
    core.setFailed(error.toString())
  }

}

exec()

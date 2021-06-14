const core = require('@actions/core')
const github = require('@actions/github')

async function exec() {
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
  console.log(searchResult.search.nodes[0])

  core.setOutput('targetBranch', searchResult.search.nodes[0].headRefName)
}

exec()

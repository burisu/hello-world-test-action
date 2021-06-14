const core = require('@actions/core')
const github = require('@actions/github')

async function exec() {
  const token = core.getInput('token')
  const octokit = github.getOctokit(token)
  const issueKey = core.getInput('issueKey')
  const context = github.context
  // console.log(context)

  // const pullResults = await octokit.graphql(`
  //   {
  //     repository(owner: "pedraalcorp", name: "hello-world-test-action") {
  //       pullRequests(last: 100, states:OPEN) {
  //         nodes {
  //           title
  //           headRefName
  //           mergeable
  //           reviewDecision
  //         }
  //       }
  //     }
  //   }
  // `)
  // console.log(pullResults.repository.pullRequests.nodes)

  const searchResult = await octokit.graphql(`
    query targetPullRequest($queryString: String!) {
      search(last: 1, query: $queryString, type: ISSUE) {
        nodes {
          ... on PullRequest {
            title
            headRefName
            mergeable
            reviewDecision
          }
        }
      }
    }
  `,
    {
    queryString: `is:pr ${issueKey} in:title repo:${context.payload.repository.full_name}`
  })
  console.log(searchResult.search.nodes[0])
}

exec()

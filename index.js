const core = require('@actions/core')
const github = require('@actions/github')
const token = core.getInput('token')
const octokit = github.getOctokit(token)
const issueKey = core.getInput('issueKey')
const mergeIn = core.getInput('mergeIn')
async function exec () {
  try {
    let pullRequest = await getPullRequest()
    let queryAttemptCount = 0
    while (pullRequest.mergeable === 'UNKNOWN' && queryAttemptCount < 10) {
      await sleep(1000)
      pullRequest = await getPullRequest()
      queryAttemptCount++
    }

    if (pullRequest.mergeable !== 'MERGEABLE' || pullRequest.mergeStateStatus !== 'CLEAN') {
      console.error(`Mergeable : ${pullRequest.mergeable}, Merge state status : ${pullRequest.mergeStateStatus}`)
      throw new Error('Pull Request is not ready for merging')
    }

    await octokit.graphql(`
      mutation {
        mergeBranch(input: { base: "${mergeIn}", commitMessage: "Merging ${pullRequest.headRefName} in ${mergeIn}", head: "${pullRequest.headRefName}", repositoryId: "${pullRequest.repository.id}" }) {
          clientMutationId
        }
      }
    `)
  } catch (error) {
    core.setFailed(error.toString())
  }
}

exec()

async function getPullRequest () {
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
              repository {
                id
              }
            }
          }
        }
      }
    `,
  {
    queryString: `is:pr ${issueKey} in:title repo:${github.context.payload.repository.full_name}`
  }
  )

  return searchResult.search.nodes[0]
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

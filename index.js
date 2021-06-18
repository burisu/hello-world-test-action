const core = require('@actions/core')
const github = require('@actions/github')
const token = core.getInput('token')
const octokit = github.getOctokit(token, { previews: ['merge-info-preview'] })
const issueKey = core.getInput('issueKey')
const mergeIn = core.getInput('mergeIn')

async function exec () {
  try {
    let pullRequest = await getPullRequest()

    let queryAttemptCount = 0
    while ([pullRequest.mergeable, pullRequest.mergeStateStatus].includes('UNKNOWN') && queryAttemptCount < 10) {
      await sleep(1000)
      pullRequest = await getPullRequest()
      queryAttemptCount++
    }

    if (pullRequest.mergeable !== 'MERGEABLE' || pullRequest.mergeStateStatus !== 'CLEAN') {
      console.error(`Mergeable : ${pullRequest.mergeable}, Merge state status : ${pullRequest.mergeStateStatus}`)
      throw new Error(`Pull Request is not ready for merging in ${mergeIn}`)
    }

    await octokit.graphql(`
      mutation mergeBranch($base: String!, $commitMessage: String!, $head: String!, $repositoryId: String!){
        mergeBranch(input: { base: $base, commitMessage: $commitMessage, head: $head, repositoryId: $repositoryId }) {
          clientMutationId
        }
      }
    `,
    {
      base: mergeIn,
      commitMessage: `Merging ${pullRequest.headRefName} in ${mergeIn}`,
      head: pullRequest.headRefName,
      repositoryId: pullRequest.repository.id
    })
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
              mergeStateStatus
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

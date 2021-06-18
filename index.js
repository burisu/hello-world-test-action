const core = require('@actions/core')
const github = require('@actions/github')

async function exec () {
  try {
    const token = core.getInput('token')
    const octokit = github.getOctokit(token, { previews: ['merge-info-preview'] })
    const issueKey = core.getInput('issueKey')
    const mergeIn = core.getInput('mergeIn')
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
              reviewDecision
              checksResourcePath
              checksUrl
              repository {
                id
              }
              commits (last: 1) {
                nodes {
                  commit {
                    commitUrl
                    oid
                    status {
                      state
                      contexts {
                        state
                        targetUrl
                        description
                        context
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      queryString: `is:pr ${issueKey} in:title repo:${github.context.payload.repository.full_name}`
    })

    const pullRequest = searchResult.search.nodes[0]
    pullRequest.commit = pullRequest.commits.nodes[0].commit
    delete pullRequest.commits
    console.log(pullRequest)
    if (pullRequest.mergeable !== 'MERGEABLE' || pullRequest.reviewDecision === 'CHANGES_REQUESTED') {
      console.error(`Mergeable : ${pullRequest.mergeable}, Review : ${pullRequest.reviewDecision}`)
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

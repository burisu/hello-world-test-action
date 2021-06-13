const core = require('@actions/core')
const github = require('@actions/github')

async function exec() {
  const token = core.getInput('token')
  const octokit = github.getOctokit(token)

  const context = github.context
  console.log(context)

  const result = await octokit.graphql(`
    {
      repository(owner: "pedraalcorp", name: "hello-world-test-action") {
        pullRequests(last: 100, states:OPEN) {
          nodes {
            title
            headRefName
            mergeable
            reviewDecision
          }
        }
      }
    }
  `)
  console.log(result.repository.pullRequests.nodes)
}

exec()

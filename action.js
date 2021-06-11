// const _ = require('lodash')
const Jira = require('./jira/Jira')

const issueIdRegEx = /([a-zA-Z0-9]+-[0-9]+)/g
module.exports = class {
  constructor({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute() {
    return await this.Jira.getIssue(this.argv.issuekey)
  }
}

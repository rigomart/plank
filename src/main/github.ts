import { Octokit } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'

const PaginatingOctokit = Octokit.plugin(paginateRest)

function createClient(token: string) {
  return new PaginatingOctokit({ auth: token })
}

export async function fetchRepoIssues(token: string, owner: string, repo: string) {
  const octokit = createClient(token)
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    state: 'open',
    sort: 'updated',
    per_page: 100
  })
  return issues.filter((issue) => !issue.pull_request)
}

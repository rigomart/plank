import { Octokit } from 'octokit'

function createClient(token: string): Octokit {
  return new Octokit({ auth: token })
}

export async function fetchUserRepos(token: string) {
  const octokit = createClient(token)
  return octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    sort: 'pushed',
    per_page: 100
  })
}

export async function fetchRepoIssues(token: string, owner: string, repo: string) {
  const octokit = createClient(token)
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    sort: 'updated',
    per_page: 100
  })
  return issues.filter((issue) => !issue.pull_request)
}

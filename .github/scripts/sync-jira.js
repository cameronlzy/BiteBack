import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const jiraDomain = process.env.JIRA_DOMAIN;
const jiraEmail = process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_API_TOKEN;
const jiraProjectKey = process.env.JIRA_PROJECT_KEY;

const userMap = {
  'cameronlzy@gmail.com': 'cameronlzy',
  'benlua73@gmail.com': 'lkxben'
};

const normalizeLabel = (label) =>
  label.toLowerCase().replace(/\s+/g, '-');

async function getJiraIssues() {
  const jql = `project=${jiraProjectKey} AND status="To Do" AND labels NOT IN ("synced-to-github")`;
  const res = await fetch(`https://${jiraDomain}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Jira issues: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.issues;
}

async function addJiraLabel(issueKey, label) {
  const url = `https://${jiraDomain}/rest/api/3/issue/${issueKey}`;
  const body = {
    update: {
      labels: [{ add: label }]
    }
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to add label to Jira issue ${issueKey}:`, text);
  } else {
    console.log(`Added label "${label}" to Jira issue ${issueKey}`);
  }
}

async function createGitHubIssue(issue) {
  const assigneeEmail = issue.fields.assignee?.emailAddress;
  const assigneeGitHub = userMap[assigneeEmail];
  const labels = [];

  const type = issue.fields.issuetype?.name;
  const priority = issue.fields.priority?.name;

  if (type) labels.push(normalizeLabel(type));
  if (priority) labels.push(normalizeLabel(priority));

  // Fallback description
  let body = 'Synced from Jira. No additional details.';
  if (issue.fields.description) {
    // Jira descriptions can be complex; for simplicity, try to get plain text if possible
    if (typeof issue.fields.description === 'string') {
      body = issue.fields.description;
    } else if (issue.fields.description.content?.[0]?.content?.[0]?.text) {
      body = issue.fields.description.content[0].content[0].text;
    }
  }

  const { data } = await octokit.rest.issues.create({
    owner: 'cameronlzy',
    repo: 'BiteBack',
    title: issue.fields.summary,
    body,
    assignees: assigneeGitHub ? [assigneeGitHub] : [],
    labels,
  });

  console.log(`Created GitHub issue: ${data.html_url}`);

  await addJiraLabel(issue.key, 'synced-to-github');
}

(async () => {
  try {
    const issues = await getJiraIssues();
    console.log(`Found ${issues.length} Jira issues to sync.`);

    for (const issue of issues) {
      try {
        await createGitHubIssue(issue);
      } catch (err) {
        console.error(`Failed to sync Jira issue ${issue.key}:`, err);
      }
    }
  } catch (err) {
    console.error('Error during sync:', err);
  }
})();

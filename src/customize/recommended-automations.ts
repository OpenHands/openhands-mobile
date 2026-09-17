/**
 * Recommended automation templates, copied from `@openhands/extensions`
 * (`featuredAutomationIds` + `AUTOMATION_CATALOG` launch prompts).
 * Mobile does not depend on that package — keep this list in sync when
 * the published catalog changes.
 */

export interface RecommendedAutomation {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedSetupMinutes: number;
  featured: boolean;
  launchPrompt: string;
}

export const CREATE_AUTOMATION_PROMPT = "Create an automation";

const FEATURED_IDS = [
  "github-pr-reviewer",
  "github-agents-md-maintainer",
  "news-digest",
  "github-issue-to-pr",
  "slack-channel-monitor",
  "custom-automation",
] as const;

export const RECOMMENDED_AUTOMATIONS: RecommendedAutomation[] = [
  {
    id: "github-pr-reviewer",
    name: "GitHub code review",
    category: "Code review",
    description:
      "Watch for a configurable label on GitHub pull requests, inspect full PR and repository context, and post an AI review comment once per label event.",
    estimatedSetupMinutes: 4,
    featured: true,
    launchPrompt: "/pr-reviewer:setup",
  },
  {
    id: "github-agents-md-maintainer",
    name: "AGENTS.md Maintainer",
    category: "Documentation",
    description:
      "Keep AGENTS.md current in your repositories. On a schedule, an agent reads the repository, creates or updates AGENTS.md, and opens a pull request — and stays quiet while one of its pull requests is still open.",
    estimatedSetupMinutes: 3,
    featured: true,
    launchPrompt: "/agents-md:setup",
  },
  {
    id: "news-digest",
    name: "Daily news digest",
    category: "Research",
    description:
      "Read a list of public RSS and Atom feeds on a schedule, hand an agent everything new, and have it pick out what matters for your topics and write a short digest. Connects to nothing and needs no credentials.",
    estimatedSetupMinutes: 2,
    featured: true,
    launchPrompt: "/news-digest:setup",
  },
  {
    id: "github-issue-to-pr",
    name: "GitHub issue to PR",
    category: "Software development",
    description:
      "Watch for a configurable label on GitHub issues, implement the issue in a clone of the default branch, and open a pull request for each label event.",
    estimatedSetupMinutes: 4,
    featured: true,
    launchPrompt: "/issue-to-pr:setup",
  },
  {
    id: "slack-channel-monitor",
    name: "Slack channel monitor",
    category: "Team communication",
    description:
      "Watch Slack channels for @openhands mentions, open a conversation with the message context, reply when the agent finishes, and continue the same conversation from triggered Slack thread follow-ups.",
    estimatedSetupMinutes: 7,
    featured: true,
    launchPrompt: "/slack-monitor:poll",
  },
  {
    id: "custom-automation",
    name: "Custom automation",
    category: "Custom",
    description:
      "Create a custom automation from a prompt, plugin-powered prompt, or uploaded script tarball.",
    estimatedSetupMinutes: 5,
    featured: true,
    launchPrompt: CREATE_AUTOMATION_PROMPT,
  },
  {
    id: "github-repo-monitor",
    name: "GitHub repository monitor",
    category: "Developer tools",
    description:
      "Watch a repository for @OpenHands mentions in issues and PR comments, start a conversation, and post the agent's reply back to GitHub.",
    estimatedSetupMinutes: 5,
    featured: false,
    launchPrompt: "/github-monitor:poll",
  },
  {
    id: "qa-changes",
    name: "QA changes",
    category: "Code review",
    description:
      "When a pull request is opened for review, run the QA changes methodology — set up the environment, exercise the changed behavior as a real user would, and post the outcome by editing the PR description with a QA Agent section.",
    estimatedSetupMinutes: 5,
    featured: false,
    launchPrompt: "/qa-changes",
  },
  {
    id: "linear-issue-to-github-pr",
    name: "Linear issue to GitHub PR",
    category: "Project management",
    description:
      "Watch Linear for implementation-ready issues, start an agent to make the requested code change, and open a GitHub pull request.",
    estimatedSetupMinutes: 6,
    featured: false,
    launchPrompt: "/ticket-to-code-change:setup",
  },
  {
    id: "linear-triage-assistant",
    name: "Linear issue triage assistant",
    category: "Project management",
    description:
      "Classify new Linear issues, suggest labels, find duplicates, and ask clarifying questions.",
    estimatedSetupMinutes: 3,
    featured: false,
    launchPrompt: "/linear-triage:setup",
  },
  {
    id: "slack-standup-digest",
    name: "Slack standup digest",
    category: "Team updates",
    description:
      "Summarize yesterday’s Slack activity into an async standup note with blockers, decisions, and owners.",
    estimatedSetupMinutes: 5,
    featured: false,
    launchPrompt: "/standup-digest:setup",
  },
  {
    id: "jira-issue-to-pr",
    name: "Jira issue to GitHub PR",
    category: "Project management",
    description:
      "Watch a Jira Cloud project for issues with a configurable label and automatically open a GitHub pull request for each new issue found. The target GitHub repo is read from the ticket body — no repo parameter required at deploy time.",
    estimatedSetupMinutes: 5,
    featured: false,
    launchPrompt: "Set up the Jira issue to GitHub PR automation",
  },
  {
    id: "upstream-fork-sync",
    name: "Upstream fork sync",
    category: "Developer tools",
    description:
      "Keep a long-lived fork current with its upstream by re-running a nightly job that fetches upstream changes, rebases local customizations on top, verifies the software still works, and replaces the running version when it does.",
    estimatedSetupMinutes: 4,
    featured: false,
    launchPrompt: "/upstream-fork-sync:setup",
  },
  {
    id: "incident-retrospective-drafter",
    name: "Incident retrospective drafter",
    category: "Reliability",
    description:
      "Collect incident chatter and issue updates, then draft a timeline and follow-up checklist.",
    estimatedSetupMinutes: 8,
    featured: false,
    launchPrompt: "/incident-retro:setup",
  },
  {
    id: "research-brief-writer",
    name: "Research brief writer",
    category: "Research",
    description:
      "Monitor a topic, gather sources from the web, and publish a short brief for your team.",
    estimatedSetupMinutes: 7,
    featured: false,
    launchPrompt: "/research-brief:setup",
  },
  {
    id: "linear-issue-to-gitlab-mr",
    name: "Linear issue to GitLab MR",
    category: "Project management",
    description:
      "Watch Linear for implementation-ready issues, start an agent to make the requested code change, and open a GitLab merge request.",
    estimatedSetupMinutes: 6,
    featured: false,
    launchPrompt: "/ticket-to-code-change:setup",
  },
  {
    id: "linear-issue-to-bitbucket-pr",
    name: "Linear issue to Bitbucket PR",
    category: "Project management",
    description:
      "Watch Linear for implementation-ready issues, start an agent to make the requested code change, and open a Bitbucket pull request.",
    estimatedSetupMinutes: 6,
    featured: false,
    launchPrompt: "/ticket-to-code-change:setup",
  },
  {
    id: "jira-issue-to-gitlab-mr",
    name: "Jira issue to GitLab MR",
    category: "Project management",
    description:
      "Watch Jira for implementation-ready issues, start an agent to make the requested code change, and open a GitLab merge request.",
    estimatedSetupMinutes: 6,
    featured: false,
    launchPrompt: "/ticket-to-code-change:setup",
  },
  {
    id: "jira-issue-to-bitbucket-pr",
    name: "Jira issue to Bitbucket PR",
    category: "Project management",
    description:
      "Watch Jira for implementation-ready issues, start an agent to make the requested code change, and open a Bitbucket pull request.",
    estimatedSetupMinutes: 6,
    featured: false,
    launchPrompt: "/ticket-to-code-change:setup",
  },
];

const FEATURED_ORDER = new Map<string, number>(
  FEATURED_IDS.map((id, index) => [id, index]),
);

export function filterRecommendedAutomations(
  query: string,
): RecommendedAutomation[] {
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? RECOMMENDED_AUTOMATIONS.filter((item) => {
        return (
          item.name.toLowerCase().includes(needle) ||
          item.category.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle)
        );
      })
    : RECOMMENDED_AUTOMATIONS;
  return [...matches].sort((left, right) => {
    const leftFeatured = FEATURED_ORDER.get(left.id);
    const rightFeatured = FEATURED_ORDER.get(right.id);
    if (leftFeatured !== undefined && rightFeatured !== undefined) {
      return leftFeatured - rightFeatured;
    }
    if (leftFeatured !== undefined) return -1;
    if (rightFeatured !== undefined) return 1;
    return left.name.localeCompare(right.name);
  });
}

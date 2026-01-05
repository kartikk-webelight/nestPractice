const { fail, warn, danger } = require("danger");
const pnpm = require("danger-pnpm").default;
const { gitSpellcheck } = require("./spell-check");

const minimumLengthDescription = 30;
const minimumLengthTitle = 15;
const maximumPRFiles = 300;

pnpm({
  disableCheckForTypesInDeps: false,
  disableCheckForLockfileDiff: false,
  disableCheckForRelease: false,
});

if (danger.git.created_files.concat(danger.git.modified_files).filter((file) => file === ".env").length) {
  fail("You pushed .env file");
}

const noAssignee = () => "There are no assignees to this pull request.";
const noReviewer = () => "There are no reviewers to this pull request.";
const descriptionNotLongEnough = (minimumLength: number) => `This PR's description is too short.
It should be contain at least ${minimumLength} characters.`;
const titleDoeNotMatch = (minimumLength: number) =>
  `This PR's title is too short.
It should be contain at least ${minimumLength} characters.`;

function checkAssignees() {
  const hasAssignees = !!danger.gitlab.mr.assignee;
  if (!hasAssignees) {
    fail(noAssignee());
  }
}

function checkReviewer() {
  const hasReviewer = danger.gitlab.mr.reviewers;
  if (!hasReviewer.length) {
    fail(noReviewer());
  }
}

function checkDescription(minimumLength: number) {
  const descriptionIsLongEnough = danger.gitlab.mr.description.length >= minimumLength;
  if (!descriptionIsLongEnough) {
    fail(descriptionNotLongEnough(minimumLength));
  }
}

function checkTitle(minimumLength: number) {
  const { title } = danger.gitlab.mr;
  const titleIsValid = title.length >= minimumLength;
  if (!titleIsValid) {
    fail(titleDoeNotMatch(minimumLength));
  }
}

function checkPRFiles(lines: number) {
  const changeCount =
    danger.git.created_files.length + danger.git.deleted_files.length + danger.git.modified_files.length || 0;
  const bigPRThreshold = lines;

  if (changeCount > bigPRThreshold) {
    fail(
      `This PR size is too large (Over ${bigPRThreshold} files. Please split into separate PRs to enable faster & easier review.`,
    );
  }
}

checkAssignees();
checkReviewer();
checkDescription(minimumLengthDescription);
checkTitle(minimumLengthTitle);
checkPRFiles(maximumPRFiles);

gitSpellcheck();

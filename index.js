#!/usr/bin/env node

const { graphql } = require("@octokit/graphql");
const meow = require("meow");
const package = require("./package.json");

const cli = meow(
  `
  Usage
    $ vercel-is-pull-request

  Options
    --auth, -a  Sets the access token used to query the git provider

  Examples
    $ foo --auth githubpersonalaccesstoken
`,
  {
    flags: {
      auth: {
        type: "string",
        alias: "a",
      },
    },
  }
);

const log = (str) => console.log(`\`vercel-is-pull-request\``, str);
const exec = (str) => console.log(`# exec\n${str}`);
const setEnv = (name, value) =>
  exec(
    `export ${name}=${
      value === true || value === false || Number.isFinite(value)
        ? value
        : `"${value}"`
    }`
  );
const exit = (str) => {
  log(str);
  process.exit(0);
};

const {
  VERCEL,
  VERCEL_ENV,
  VERCEL_GIT_PROVIDER,
  VERCEL_GIT_REPO_OWNER,
  VERCEL_GIT_REPO_SLUG,
  VERCEL_GIT_COMMIT_REF,
} = {
  VERCEL: true,
  VERCEL_ENV: 'preview',
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'avigoldman',
  VERCEL_GIT_REPO_SLUG: 'parcel',
  VERCEL_GIT_COMMIT_REF: 'main-pr'
};

if (!VERCEL) {
  exit("did not detect a Vercel build. Exiting...");
}

if (VERCEL_ENV === "production") {
  return setEnv("VERCEL_GIT_IS_PULL_REQUEST", 0);
}

if (VERCEL_GIT_PROVIDER !== "github") {
  exit(
    `does not support ${VERCEL_GIT_PROVIDER} right now. PRs are welcome: https://github.com/useparcel/vercel-is-pull-request \nExiting...`
  );
}

graphql(
  `
    {
      search(query: "${`
        repo:${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}
        head:${VERCEL_GIT_COMMIT_REF}
        type:pr
        state:open
      `.split('\n').join(' ')}", type:ISSUE, first:100) {
        edges {
          node {
            ...on PullRequest{
              number
              headRefName
            }
          }
        } 
      }
    }
  `,
  {
    headers: {
      'user-agent': `${package.name} v${package.version}`,
      ...(cli.flags.auth ? { authorization: `token ${cli.flags.auth}` } : {})
    },
  }
)
.then((results) => {
  const match = results.search.edges.find(({ node }) => node.headRefName === VERCEL_GIT_COMMIT_REF)
  if (match) {
    setEnv("VERCEL_GIT_IS_PULL_REQUEST", 1);
    setEnv("VERCEL_GIT_PULL_REQUEST_NUMBER", match.number);
  } else {
    setEnv("VERCEL_GIT_IS_PULL_REQUEST", 0);    
  }
})
.catch((error) => {
  exit(`failed to query pull request. Exiting...`);
});

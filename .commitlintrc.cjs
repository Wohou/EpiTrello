module.exports = {
  parserPreset: {
    parserOpts: {
      // Regex for parsing the commit message header
      // Explanation: [TYPE] SCOPE - SUBJECT
      headerPattern: /^\[(\+|-|~)\] ([A-Z ]+) - (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    // Rule 1: The type must be only +, - or ~
    'type-enum': [2, 'always', ['+', '-', '~']],

    // Rule 2: The "Scope" (Your TITLE) must be in uppercase
    'scope-case': [2, 'always', 'upper-case'],

    // Rule 3: The "Scope" must not be empty
    'scope-empty': [2, 'never'],

    // Rule 4: The description must not be empty
    'subject-empty': [2, 'never'],

    // Rule 5: Maximum line length (150 characters)
    'header-max-length': [2, 'always', 150],
  },
};

// Example of valid commit messages:
// [+] FEATURE - Add user authentication
// [-] BUGFIX - Fix login issue
// [~] DOCS - Update README file

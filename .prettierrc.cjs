// Configuration reference: https://prettier.io/en/configuration.html
module.exports = {
  // Different line endings between Windows and macOS/Linux users can cause diffs when saving files.
  // Following the official recommendation, use 'lf' for line endings.
  endOfLine: 'lf',

  // Use single quotes instead of double quotes
  singleQuote: true,

  // For ES5, trailing commas cannot be used for function parameters.
  // Therefore, use them only for arrays and objects.
  trailingComma: 'all',
};

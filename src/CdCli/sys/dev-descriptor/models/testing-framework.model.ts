/* eslint-disable antfu/if-newline */
export interface TestingFrameworkDescriptor {
  name: string; // Name of the testing framework
  type: 'unit' | 'integration' | 'end-to-end'; // Type of testing it supports
  language: string; // Programming language (e.g., JavaScript, Python, Java)
  tools?: string[]; // Tools or libraries it integrates with (e.g., Puppeteer, Selenium)
  testingFeatures: TestingFeatures;
  popularityRank?: number; // An optional rank or popularity index
}

export interface TestingFeatures {
  assertions: boolean; // Supports assertions
  mocking: boolean; // Supports mocking/stubbing
  parallelExecution?: boolean; // Supports parallel test execution
  codeCoverage?: boolean; // Supports code coverage reporting
  customExtensions?: boolean; // Allows custom plugins/extensions
}

export const testingFrameworks: TestingFrameworkDescriptor[] = [
  {
    name: 'Jest',
    type: 'unit',
    language: 'JavaScript',
    tools: ['Puppeteer'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
      codeCoverage: true,
    },
    popularityRank: 1,
  },
  {
    name: 'Mocha',
    type: 'unit',
    language: 'JavaScript',
    tools: ['Chai', 'Sinon'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      customExtensions: true,
    },
    popularityRank: 2,
  },
  {
    name: 'Cypress',
    type: 'end-to-end',
    language: 'JavaScript',
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
    },
    popularityRank: 3,
  },
  {
    name: 'Selenium',
    type: 'end-to-end',
    language: 'Multi-language',
    tools: ['WebDriver'],
    testingFeatures: {
      assertions: false,
      mocking: false,
      parallelExecution: true,
    },
    popularityRank: 4,
  },
  {
    name: 'JUnit',
    type: 'unit',
    language: 'Java',
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
      codeCoverage: true,
    },
    popularityRank: 5,
  },
];

export const defaultTestingFramework: TestingFrameworkDescriptor = {
  name: 'Default Testing Framework',
  type: 'unit',
  language: 'JavaScript',
  testingFeatures: {
    assertions: true,
    mocking: true,
  },
};

/**
 * Usage:
 * const result = getTestingFramework(["Mocha", "Nonexistent Framework"], knownTestingFrameworks);
 * console.log(result);
 *
 * @param names
 * @param frameworks
 * @returns
 */
export function getTestingFramework(
  names: string[],
  frameworks: TestingFrameworkDescriptor[],
): TestingFrameworkDescriptor {
  for (const name of names) {
    const found = frameworks.find((framework) => framework.name === name);
    if (found) return found;
  }
  return defaultTestingFramework;
}

import type { ContributorDescriptor } from './version-control.model';

// Example Contributors
const contributors: ContributorDescriptor = {
  vendors: [
    {
      name: 'TechCorp Inc.',
      contact: 'support@techcorp.com',
      website: 'https://techcorp.com',
    },
  ],
  developers: [
    {
      name: 'John Doe',
      role: 'Lead Developer',
      contact: 'john.doe@example.com',
      profileLink: 'https://github.com/johndoe',
    },
    {
      name: 'OpenDev Group',
      role: 'Contributor',
      profileLink: 'https://github.com/opendev',
    },
  ],
  communities: [
    {
      name: 'OpenSource Forum',
      type: 'forum',
      link: 'https://forum.example.com',
    },
    {
      name: 'GitHub Community',
      type: 'github',
      link: 'https://github.com/example-org',
    },
  ],
};

// Default Contributor
const defaultContributor: ContributorDescriptor = {
  vendors: [
    {
      name: 'Default Vendor',
      contact: 'default@vendor.com',
      website: 'https://defaultvendor.com',
    },
  ],
  developers: [
    {
      name: 'Default Developer',
      role: 'Contributor',
      contact: 'default@developer.com',
      profileLink: 'https://github.com/default-developer',
    },
  ],
  communities: [
    {
      name: 'Default Community',
      type: 'forum',
      link: 'https://defaultcommunity.com',
    },
  ],
};

// Function to Get Contributors by Names
export function getContributorsByNames(
  names: string[],
  contributors: ContributorDescriptor,
): ContributorDescriptor {
  const matchedVendors = contributors.vendors?.filter((vendor) =>
    names.includes(vendor.name),
  );

  const matchedDevelopers = contributors.developers?.filter((developer) =>
    names.includes(developer.name),
  );

  const matchedCommunities = contributors.communities?.filter((community) =>
    names.includes(community.name),
  );

  // Combine matched contributors, falling back to default if no matches
  return {
    vendors: matchedVendors?.length
      ? matchedVendors
      : defaultContributor.vendors,
    developers: matchedDevelopers?.length
      ? matchedDevelopers
      : defaultContributor.developers,
    communities: matchedCommunities?.length
      ? matchedCommunities
      : defaultContributor.communities,
  };
}

// Example Usage
const selectedContributors = getContributorsByNames(
  ['John Doe', 'OpenSource Forum'],
  contributors,
);
console.log(selectedContributors);

const unknownContributors = getContributorsByNames(
  ['Unknown Name'],
  contributors,
);
console.log(unknownContributors); // Returns defaultContributor

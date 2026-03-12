export const CATEGORIES_QUERY = `
  query GetCategories($first: Int = 100, $hideEmpty: Boolean = true) {
    productCategories(first: $first, where: { hideEmpty: $hideEmpty }) {
      nodes {
        databaseId
        name
        slug
        parentDatabaseId
        description
        count
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const CATEGORY_BY_SLUG_QUERY = `
  query GetCategoryBySlug($slug: [String!]) {
    productCategories(where: { slug: $slug }) {
      nodes {
        databaseId
        name
        slug
        parentDatabaseId
        description
        count
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

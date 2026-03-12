export const PRODUCT_TAGS_QUERY = `
  query GetProductTags($first: Int = 100, $hideEmpty: Boolean = true) {
    productTags(first: $first, where: { hideEmpty: $hideEmpty, orderby: COUNT, order: DESC }) {
      nodes {
        databaseId
        name
        slug
        count
      }
    }
  }
`;

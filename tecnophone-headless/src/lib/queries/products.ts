export const PRODUCT_FIELDS = `
  fragment ProductFields on SimpleProduct {
    databaseId
    name
    slug
    type
    status
    featured
    description
    shortDescription
    sku
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    onSale
    stockStatus
    stockQuantity
    averageRating
    reviewCount
    image {
      databaseId
      sourceUrl
      altText
      title
    }
    galleryImages {
      nodes {
        databaseId
        sourceUrl
        altText
        title
      }
    }
    productCategories {
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
    productTags {
      nodes {
        databaseId
        name
        slug
      }
    }
    attributes {
      nodes {
        name
        position
        visible
        variation
        options
      }
    }
    related(first: 8) {
      nodes {
        databaseId
      }
    }
    metaData {
      id
      key
      value
    }
  }
`;

export const VARIABLE_PRODUCT_FIELDS = `
  fragment VariableProductFields on VariableProduct {
    databaseId
    name
    slug
    type
    status
    featured
    description
    shortDescription
    sku
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    onSale
    stockStatus
    stockQuantity
    averageRating
    reviewCount
    image {
      databaseId
      sourceUrl
      altText
      title
    }
    galleryImages {
      nodes {
        databaseId
        sourceUrl
        altText
        title
      }
    }
    productCategories {
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
    productTags {
      nodes {
        databaseId
        name
        slug
      }
    }
    attributes {
      nodes {
        name
        position
        visible
        variation
        options
      }
    }
    variations(first: 100) {
      nodes {
        databaseId
        sku
        price(format: RAW)
        regularPrice(format: RAW)
        salePrice(format: RAW)
        stockStatus
        stockQuantity
        attributes {
          nodes {
            name
            value
          }
        }
        image {
          databaseId
          sourceUrl
          altText
          title
        }
      }
    }
    related(first: 8) {
      nodes {
        databaseId
      }
    }
    metaData {
      id
      key
      value
    }
  }
`;

export const EXTERNAL_PRODUCT_FIELDS = `
  fragment ExternalProductFields on ExternalProduct {
    databaseId
    name
    slug
    type
    status
    featured
    description
    shortDescription
    sku
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    onSale
    averageRating
    reviewCount
    externalUrl
    buttonText
    image {
      databaseId
      sourceUrl
      altText
      title
    }
    productCategories {
      nodes {
        databaseId
        name
        slug
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  ${PRODUCT_FIELDS}
  ${VARIABLE_PRODUCT_FIELDS}
  ${EXTERNAL_PRODUCT_FIELDS}
  query GetProducts(
    $first: Int = 12,
    $after: String,
    $search: String,
    $categorySlug: [String],
    $orderby: [ProductsOrderbyInput],
    $onSale: Boolean,
    $featured: Boolean,
    $minPrice: Float,
    $maxPrice: Float,
    $tagSlug: [String]
  ) {
    products(
      first: $first,
      after: $after,
      where: {
        search: $search,
        categoryIn: $categorySlug,
        orderby: $orderby,
        onSale: $onSale,
        featured: $featured,
        minPrice: $minPrice,
        maxPrice: $maxPrice,
        tagIn: $tagSlug,
        status: "publish"
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on SimpleProduct {
          ...ProductFields
        }
        ... on VariableProduct {
          ...VariableProductFields
        }
        ... on ExternalProduct {
          ...ExternalProductFields
        }
      }
    }
  }
`;

export const PRODUCT_BY_SLUG_QUERY = `
  ${PRODUCT_FIELDS}
  ${VARIABLE_PRODUCT_FIELDS}
  ${EXTERNAL_PRODUCT_FIELDS}
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ... on SimpleProduct {
        ...ProductFields
      }
      ... on VariableProduct {
        ...VariableProductFields
      }
      ... on ExternalProduct {
        ...ExternalProductFields
      }
    }
  }
`;

export const PRODUCT_BY_ID_QUERY = `
  ${PRODUCT_FIELDS}
  ${VARIABLE_PRODUCT_FIELDS}
  ${EXTERNAL_PRODUCT_FIELDS}
  query GetProductById($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ... on SimpleProduct {
        ...ProductFields
      }
      ... on VariableProduct {
        ...VariableProductFields
      }
      ... on ExternalProduct {
        ...ExternalProductFields
      }
    }
  }
`;

// ============ LIGHTWEIGHT QUERY FOR PRODUCT CARDS ============
// Only fetches fields needed to render a ProductCard (~5x less data)

export const PRODUCT_CARD_FIELDS_SIMPLE = `
  fragment ProductCardSimple on SimpleProduct {
    databaseId
    name
    slug
    type
    onSale
    shortDescription
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    stockStatus
    averageRating
    reviewCount
    image {
      sourceUrl
      altText
    }
    productCategories(first: 5) {
      nodes {
        databaseId
        name
        slug
      }
    }
  }
`;

export const PRODUCT_CARD_FIELDS_VARIABLE = `
  fragment ProductCardVariable on VariableProduct {
    databaseId
    name
    slug
    type
    onSale
    shortDescription
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    stockStatus
    averageRating
    reviewCount
    image {
      sourceUrl
      altText
    }
    productCategories(first: 5) {
      nodes {
        databaseId
        name
        slug
      }
    }
  }
`;

export const PRODUCT_CARD_FIELDS_EXTERNAL = `
  fragment ProductCardExternal on ExternalProduct {
    databaseId
    name
    slug
    type
    onSale
    shortDescription
    price(format: RAW)
    regularPrice(format: RAW)
    salePrice(format: RAW)
    averageRating
    reviewCount
    externalUrl
    buttonText
    image {
      sourceUrl
      altText
    }
    productCategories(first: 5) {
      nodes {
        databaseId
        name
        slug
      }
    }
  }
`;

export const PRODUCTS_LIST_QUERY = `
  ${PRODUCT_CARD_FIELDS_SIMPLE}
  ${PRODUCT_CARD_FIELDS_VARIABLE}
  ${PRODUCT_CARD_FIELDS_EXTERNAL}
  query GetProductsList(
    $first: Int = 12,
    $after: String,
    $search: String,
    $categorySlug: [String],
    $orderby: [ProductsOrderbyInput],
    $onSale: Boolean,
    $featured: Boolean,
    $minPrice: Float,
    $maxPrice: Float,
    $tagSlug: [String]
  ) {
    products(
      first: $first,
      after: $after,
      where: {
        search: $search,
        categoryIn: $categorySlug,
        orderby: $orderby,
        onSale: $onSale,
        featured: $featured,
        minPrice: $minPrice,
        maxPrice: $maxPrice,
        tagIn: $tagSlug,
        status: "publish"
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on SimpleProduct {
          ...ProductCardSimple
        }
        ... on VariableProduct {
          ...ProductCardVariable
        }
        ... on ExternalProduct {
          ...ProductCardExternal
        }
      }
    }
  }
`;

// Lightweight query to get all product slugs for static generation
export const ALL_PRODUCT_SLUGS_QUERY = `
  query GetAllProductSlugs($first: Int = 100, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes { slug }
    }
  }
`;

export const BANNERS_QUERY = `
  query GetBanners($first: Int = 10) {
    banners(first: $first, where: { status: PUBLISH, orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        databaseId
        title
        bannerSettings {
          subtitulo
          textoDestacado
          badge
          textoBoton
          linkBoton
          gradientFrom
          gradientTo
          productImage {
            node {
              sourceUrl
              altText
            }
          }
          isActive
          orden
        }
      }
    }
  }
`;

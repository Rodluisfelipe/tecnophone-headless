const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  `${process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co'}/graphql`;

export interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export async function graphqlFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 300
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data;
}

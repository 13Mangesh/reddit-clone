// import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
// import { withApollo as createWithApollo } from 'next-with-apollo'
// import { PaginatedPosts } from '../generated/graphql'
// import { NextPageContext } from 'next'
// import { IncomingHttpHeaders } from 'http'

// const createClient = ({ctx: NextPageContext}) => {
// 	console.log('CTX: ', ctx)

// 	return new ApolloClient({
// 		uri: process.env.NEXT_PUBLIC_API_URL as string,
// 		// ssrMode: typeof window === 'undefined',
// 		// link: new HttpLink({
// 		// 	uri: process.env.NEXT_PUBLIC_API_URL as string,
// 		// 	credentials: 'include',
// 		// 	headers: {
// 		// 		cookie: ctx?.req?.headers.cookie,
// 		// 	},
// 		// }),
// 		credentials: 'include',
// 		headers: {
// 			cookie:
// 				(typeof window === 'undefined'
// 					? ctx?.req?.headers.cookie
// 					: undefined) || '',
// 		},
// 		cache: new InMemoryCache({
// 			typePolicies: {
// 				Query: {
// 					fields: {
// 						posts: {
// 							keyArgs: [],
// 							merge(
// 								exisitng: PaginatedPosts | undefined,
// 								incoming: PaginatedPosts
// 							): PaginatedPosts {
// 								return {
// 									...incoming,
// 									posts: [...(exisitng?.posts || []), ...incoming.posts],
// 								}
// 							},
// 						},
// 					},
// 				},
// 			},
// 		}),
// 	})
// }
// export const withApollo = createWithApollo(createClient)

// import withApollo from 'next-with-apollo'
// import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
// import { PaginatedPosts } from '../generated/graphql'

// export default withApollo(({ ctx, initialState }) => {
// 	return new ApolloClient({
// 		uri: process.env.NEXT_PUBLIC_API_URL as string,
// 		credentials: 'include',
// 		headers: {
// 			cookie:
// 				(typeof window === 'undefined'
// 					? ctx?.req?.headers.cookie
// 					: undefined) || '',
// 		},
// 		cache: new InMemoryCache({
// 			typePolicies: {
// 				Query: {
// 					fields: {
// 						posts: {
// 							keyArgs: [],
// 							merge(
// 								exisitng: PaginatedPosts | undefined,
// 								incoming: PaginatedPosts
// 							): PaginatedPosts {
// 								return {
// 									...incoming,
// 									posts: [...(exisitng?.posts || []), ...incoming.posts],
// 								}
// 							},
// 						},
// 					},
// 				},
// 			},
// 		}),
// 	})
// })

import { createWithApollo } from './createWithApollo'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { NextPageContext } from 'next'
import { PaginatedPosts } from '../generated/graphql'

const createClient = (ctx: NextPageContext) =>
	new ApolloClient({
		uri: process.env.NEXT_PUBLIC_API_URL as string,
		credentials: 'include',
		headers: {
			cookie:
				(typeof window === 'undefined'
					? ctx?.req?.headers.cookie
					: undefined) || '',
		},
		cache: new InMemoryCache({
			typePolicies: {
				Query: {
					fields: {
						posts: {
							keyArgs: [],
							merge(
								exisitng: PaginatedPosts | undefined,
								incoming: PaginatedPosts
							): PaginatedPosts {
								return {
									...incoming,
									posts: [...(exisitng?.posts || []), ...incoming.posts],
								}
							},
						},
					},
				},
			},
		}),
	})

export const withApollo = createWithApollo(createClient)

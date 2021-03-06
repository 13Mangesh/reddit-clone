import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'
import { PaginatedPosts } from '../generated/graphql'
import theme from '../theme'
import { withApollo } from '../utils/withApollo'

const client = new ApolloClient({
	uri: process.env.NEXT_PUBLIC_API_URL as string,
	credentials: 'include',
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

function MyApp({ Component, pageProps }: any) {
	return (
		<ApolloProvider client={client}>
			<ChakraProvider resetCSS theme={theme}>
				<ColorModeProvider
					options={{
						useSystemColorMode: true,
					}}
				>
					<Component {...pageProps} />
				</ColorModeProvider>
			</ChakraProvider>
		</ApolloProvider>
	)
}

export default withApollo({ ssr: false })(MyApp)

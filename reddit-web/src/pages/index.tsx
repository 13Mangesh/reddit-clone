import { Button } from '@chakra-ui/button'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import { Layout } from '../components/Layout'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

const Index = () => {
	const [{ data }] = usePostsQuery()

	return (
		<Layout variant="regular">
			<NextLink href="/create-post">
				<Button variant="outline" colorScheme="orange">
					Create Post
				</Button>
			</NextLink>
			<br />
			{!data ? (
				<div>loading ........</div>
			) : (
				data.posts.map((p) => <div key={p.id}>{p.title}</div>)
			)}
		</Layout>
	)
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)

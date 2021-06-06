import { Button } from '@chakra-ui/button'
import { Link, Stack } from '@chakra-ui/layout'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import React from 'react'
import { EditDeletePostButton } from '../components/EditDeletePostButton'
import { Layout } from '../components/Layout'
import { UpdootSection } from '../components/UpdootSection'
import { usePostsQuery } from '../generated/graphql'

const Index = () => {
	const { data, error, loading, fetchMore, variables } = usePostsQuery({
		variables: {
			limit: 15,
			cursor: null,
		},
		notifyOnNetworkStatusChange: true,
	})

	if (!loading && !data) {
		return (
			<div>
				<div>The data fetching is failed</div>
				<div>{error?.message}</div>
			</div>
		)
	}

	return (
		<Layout variant="regular">
			{!data && loading ? (
				<div>loading ........</div>
			) : (
				<Stack spacing={8}>
					{data!.posts.posts.map((p) =>
						// This ternery expression is for when cache invalidate post after delete and set it to null
						// so that data.posts.posts could contain null value
						!p ? null : (
							<Flex key={p.id} p={5} shadow="md" borderWidth="1px">
								<UpdootSection post={p} />
								<Box flex={1}>
									<NextLink href="/post/[id]" as={`/post/${p.id}`}>
										<Link>
											<Heading Heading fontSize="xl">
												{p.title}
											</Heading>
										</Link>
									</NextLink>
									<Text>Posted By - {p.creator.username}</Text>
									<Flex align="center">
										<Text mt={4}>{p.textSnippet}</Text>
										<Box ml="auto">
											<EditDeletePostButton
												creatorId={p.creator.id}
												id={p.id}
											/>
										</Box>
									</Flex>
								</Box>
							</Flex>
						)
					)}
				</Stack>
			)}
			{data && data.posts.hasMore ? (
				<Flex>
					<Button
						onClick={() => {
							fetchMore({
								variables: {
									limit: variables?.limit,
									cursor:
										data.posts.posts[data.posts.posts.length - 1].createdAt,
								},
								// Deprecated
								// updateQuery: (prevValue, { fetchMoreResult }): PostsQuery => {
								// 	if (!fetchMoreResult) {
								// 		return prevValue as PostsQuery
								// 	}

								// 	return {
								// 		__typename: 'Query',
								// 		posts: {
								// 			__typename: 'PaginatedPosts',
								// 			hasMore: (fetchMoreResult as PostsQuery).posts.hasMore,
								// 			posts: [
								// 				...(prevValue as PostsQuery).posts.posts,
								// 				...(fetchMoreResult as PostsQuery).posts.posts,
								// 			],
								// 		},
								// 	}
								// },
							})
						}}
						colorScheme="purple"
						isLoading={loading}
						m="auto"
						my="8"
					>
						Load More
					</Button>
				</Flex>
			) : null}
		</Layout>
	)
}

export default Index

import { Button } from '@chakra-ui/button'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { Link, Stack } from '@chakra-ui/layout'
import { Box, Flex, Heading, Text, IconButton } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React, { useState } from 'react'
import { Layout } from '../components/Layout'
import { UpdootSection } from '../components/UpdootSection'
import {
	useDeletePostMutation,
	useMeQuery,
	usePostsQuery,
} from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

const Index = () => {
	const [variables, setVariables] = useState({
		limit: 15,
		cursor: null as null | string,
	})
	const [{ data: meData }] = useMeQuery()
	const [, deletePost] = useDeletePostMutation()
	const [{ data, fetching }] = usePostsQuery({
		variables,
	})

	if (!fetching && !data) {
		return <div>The data fetching is failed</div>
	}

	return (
		<Layout variant="regular">
			{!data && fetching ? (
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
										{meData?.me?.id !== p.creator.id ? null : (
											<Box ml="auto">
												<NextLink
													href="/post/edit/[id]"
													as={`/post/edit/${p.id}`}
												>
													<IconButton
														as={Link}
														colorScheme="whiteAlpha"
														aria-label="Edit-post"
														icon={<EditIcon color="twitter.500" boxSize={6} />}
													></IconButton>
												</NextLink>
												<IconButton
													onClick={() => {
														deletePost({ id: p.id })
													}}
													colorScheme="whiteAlpha"
													aria-label="Delete-post"
													icon={<DeleteIcon color="red.600" boxSize={6} />}
												></IconButton>
											</Box>
										)}
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
							setVariables({
								limit: variables.limit,
								cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
							})
						}}
						colorScheme="purple"
						isLoading={fetching}
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

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)

import { Button } from '@chakra-ui/button'
import { Link, Stack } from '@chakra-ui/layout'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React, { useState } from 'react'
import { EditDeletePostButton } from '../components/EditDeletePostButton'
import { Layout } from '../components/Layout'
import { UpdootSection } from '../components/UpdootSection'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

const Index = () => {
	const [variables, setVariables] = useState({
		limit: 15,
		cursor: null as null | string,
	})
	const [{ data, error, fetching }] = usePostsQuery({
		variables,
	})

	if (!fetching && !data) {
		return (
			<div>
				<div>The data fetching is failed</div>
				<div>{error?.message}</div>
			</div>
		)
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

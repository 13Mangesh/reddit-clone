import { Button } from '@chakra-ui/button'
import { Stack } from '@chakra-ui/layout'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React from 'react'
import { Layout } from '../components/Layout'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

const Index = () => {
	const [{ data, fetching }] = usePostsQuery({
		variables: {
			limit: 10,
		},
	})

	if (!fetching && !data) {
		return <div>The data fetching is failed</div>
	}

	return (
		<Layout variant="regular">
			<Flex align="center">
				<Heading>Reddit-Clone</Heading>

				<NextLink href="/create-post">
					<Button ml="auto" variant="outline" colorScheme="orange">
						Create Post
					</Button>
				</NextLink>
			</Flex>
			<br />
			{!data && fetching ? (
				<div>loading ........</div>
			) : (
				<Stack spacing={8}>
					{data!.posts.map((p) => (
						<Box key={p.id} p={5} shadow="md" borderWidth="1px">
							<Heading Heading fontSize="xl">
								{p.title}
							</Heading>
							<Text mt={4}>{p.textSnippet}</Text>
						</Box>
					))}
				</Stack>
			)}
			{data ? (
				<Flex>
					<Button isLoading={fetching} m="auto" my="8">
						Load More
					</Button>
				</Flex>
			) : null}
		</Layout>
	)
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)

import { Box, Heading } from '@chakra-ui/layout'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import { Layout } from '../../components/Layout'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { GetPostFromUrl } from '../../utils/useGetPostFromUrl'

const Post = ({}) => {
	const [{ data, error, fetching }] = GetPostFromUrl()

	if (fetching) {
		return (
			<Layout variant="regular">
				<div>...loading</div>
			</Layout>
		)
	}

	if (error) {
		console.log(error)
		return (
			<Layout variant="regular">
				<div>{error}</div>
			</Layout>
		)
	}

	if (!data?.post) {
		return (
			<Layout variant="regular">
				<Box>Could not find the post</Box>
			</Layout>
		)
	}

	return (
		<Layout variant="regular">
			<Heading mb={4}>{data.post.title}</Heading>
			{data.post.text}
		</Layout>
	)
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)

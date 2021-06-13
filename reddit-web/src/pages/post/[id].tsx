import { Box, Heading } from '@chakra-ui/layout'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import { EditDeletePostButton } from '../../components/EditDeletePostButton'
import { Layout } from '../../components/Layout'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { GetPostFromUrl } from '../../utils/useGetPostFromUrl'
import { withApollo } from '../../utils/withApollo'

const Post = ({}) => {
	const { data, error, loading } = GetPostFromUrl()

	if (loading) {
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
			<EditDeletePostButton
				id={data.post.id}
				creatorId={data.post.creator.id}
			/>
			<Box mt={4}>{data.post.text}</Box>
		</Layout>
	)
}

export default withApollo({ ssr: true })(Post)

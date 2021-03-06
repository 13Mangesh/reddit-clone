import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../../../components/InputField'
import { Layout } from '../../../components/Layout'
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql'
import { createUrqlClient } from '../../../utils/createUrqlClient'
import { useGetIntId } from '../../../utils/useGetIntId'
import { withApollo } from '../../../utils/withApollo'

const EditPost = ({}) => {
	// We don't have to update cache in case of update as we are returning a post
	// & URQL will automatically upadte text, title, textSnippet based on id (see updatepost mutation)
	const router = useRouter()
	const intId = useGetIntId()
	const { data, loading } = usePostQuery({
		skip: intId === -1,
		variables: {
			id: intId,
		},
	})
	const [updatePost] = useUpdatePostMutation()
	if (loading) {
		return (
			<Layout variant="regular">
				<div>Loading.......</div>
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
		<Layout variant="small">
			<Formik
				initialValues={{ title: data.post.title, text: data.post.text }}
				onSubmit={async (values) => {
					await updatePost({ variables: { id: intId, ...values } })
					// back is convinient if edit button is on details page or any other page
					router.back()
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField name="title" placeholder="title" label="Title" />
						<Box mt={4}>
							<InputField
								textarea
								name="text"
								placeholder="text..."
								label="Body"
							/>
						</Box>
						<Button
							mt={4}
							isLoading={isSubmitting}
							type="submit"
							colorScheme="teal"
						>
							Update Post
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	)
}

export default withApollo({ ssr: false })(EditPost)

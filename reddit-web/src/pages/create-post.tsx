import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../components/InputField'
import { Layout } from '../components/Layout'
import { useCreatePostMutation } from '../generated/graphql'
import { useIsAuthenticated } from '../utils/isAuthenticated'
import { withApollo } from '../utils/withApollo'

const CreatePost: React.FC<{}> = ({}) => {
	const [createPost] = useCreatePostMutation()
	const router = useRouter()
	useIsAuthenticated()
	return (
		<Layout variant="small">
			<Formik
				initialValues={{ title: '', text: '' }}
				onSubmit={async (values) => {
					const { errors } = await createPost({
						variables: { input: values },
						update: (cache, { data: createPost }) => {
							// https://dev.to/lucis/update-apollo-cache-after-a-mutation-and-get-instant-benefits-on-your-ui-1c3b
							console.log('createpost', createPost)
							console.log(cache)
							cache.evict({
								fieldName: 'posts:{}',
								// id: 'ROOT_QUERY',
								// broadcast: false,
							})
							// cache.gc()
						},
					})
					if (!errors) {
						router.push('/')
					}
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
							Create Post
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	)
}

export default withApollo({ ssr: false })(CreatePost)

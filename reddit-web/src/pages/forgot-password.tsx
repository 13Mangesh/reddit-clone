import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import React, { useState } from 'react'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { useForgotPasswordMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { withApollo } from '../utils/withApollo'

const ForgotPassword: React.FC<{}> = ({}) => {
	const [complete, setComplete] = useState(false)
	const [forgotPassword] = useForgotPasswordMutation()
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ email: '' }}
				onSubmit={async (values) => {
					await forgotPassword({ variables: values })
					setComplete(true)
				}}
			>
				{({ isSubmitting }) =>
					complete ? (
						<Box>Check your email for reset password link</Box>
					) : (
						<Form>
							<InputField
								name="email"
								placeholder="email"
								label="Email"
								type="email"
							/>
							<Button
								mt={4}
								isLoading={isSubmitting}
								type="submit"
								colorScheme="teal"
							>
								Forgot Password
							</Button>
						</Form>
					)
				}
			</Formik>
		</Wrapper>
	)
}

export default withApollo({ ssr: false })(ForgotPassword)

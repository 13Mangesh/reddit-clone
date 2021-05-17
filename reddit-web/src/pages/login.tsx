import { Box, Button, Flex, Link } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import React from 'react'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { useLoginMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'
import { useRouter } from 'next/router'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'
import NextLink from 'next/link'

interface loginProps {}

const Login: React.FC<loginProps> = ({}) => {
	const router = useRouter()
	const [, login] = useLoginMutation()
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ usernameOrEmail: '', password: '' }}
				onSubmit={async (values, { setErrors }) => {
					const response = await login(values)
					console.log(response)
					if (response.data?.login.errors) {
						setErrors(toErrorMap(response.data.login.errors))
					} else if (response.data?.login.user) {
						router.push('/')
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="usernameOrEmail"
							placeholder="username or email"
							label="Username Or Email"
						/>
						<Box mt={4}>
							<InputField
								name="password"
								placeholder="password"
								label="Password"
								type="password"
							/>
						</Box>
						<Flex mt={2}>
							<NextLink href="/forgot-password">
								<Link ml="auto">Forgot Password?</Link>
							</NextLink>
						</Flex>
						<Button
							mt={4}
							isLoading={isSubmitting}
							type="submit"
							colorScheme="teal"
						>
							Login
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	)
}

export default withUrqlClient(createUrqlClient)(Login)

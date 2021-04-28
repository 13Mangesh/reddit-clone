import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Box,
	Button,
} from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import React from 'react'
import { useMutation } from 'urql'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'

interface registerProps {}

const REGISTER_MUT = `
mutation Register($username: String!, $password: String!){
    register(options: { username: $username, password: $password }) {
      errors {
        field
        message
      }
      user {
        username
        id
        createdAt
        updatedAt
      }
    }
  }
`

const Register: React.FC<registerProps> = ({}) => {
	const [, register] = useMutation(REGISTER_MUT)
	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ username: '', password: '' }}
				onSubmit={(values) => {
					return register(values)
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="username"
							placeholder="username"
							label="Username"
						/>
						<Box mt={4}>
							<InputField
								name="password"
								placeholder="password"
								label="Password"
								type="password"
							/>
						</Box>
						<Button
							mt={4}
							isLoading={isSubmitting}
							type="submit"
							colorScheme="teal"
						>
							Register
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	)
}

export default Register

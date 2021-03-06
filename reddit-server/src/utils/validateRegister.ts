import { UsernamePasswordInput } from '../resolvers/UsernamePasswordInput'

export const validateRegister = (options: UsernamePasswordInput) => {
	if (!options.email.includes('@')) {
		return [
			{
				field: 'email',
				message: 'email must be valid',
			},
		]
	}

	if (options.username.length <= 2) {
		return [
			{
				field: 'username',
				message: 'length must be greater than 2',
			},
		]
	}

	if (options.username.includes('@')) {
		return [
			{
				field: 'username',
				message: 'cannot include @ in username',
			},
		]
	}

	if (options.password.length <= 5) {
		return [
			{
				field: 'password',
				message: 'length must be greater than 5',
			},
		]
	}
	return null
}

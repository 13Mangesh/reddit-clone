// import { EntityManager } from '@mikro-orm/postgresql'
import argon2 from 'argon2'
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { v4 } from 'uuid'
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../constants'
import { User } from '../entities/User'
import { MyContext } from '../types'
import { sendEmail } from '../utils/sendEmail'
import { validateRegister } from '../utils/validateRegister'
import { UsernamePasswordInput } from './UsernamePasswordInput'

@ObjectType()
class FieldError {
	@Field()
	field: string

	@Field()
	message: string
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[]

	@Field(() => User, { nullable: true })
	user?: User
}

@Resolver(User)
export class UserResolver {
	// Field level auth
	@FieldResolver(() => String)
	email(@Root() user: User, @Ctx() { req }: MyContext) {
		// This is current user and its okay to show their own email
		if (req.session.userId === user.id) {
			return user.email
		}
		// Current user wants to see other person's email
		return ''
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 5) {
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'length must be greater than 5',
					},
				],
			}
		}

		const key = FORGOT_PASSWORD_PREFIX + token
		const userId = await redis.get(key)
		if (!userId) {
			return {
				errors: [
					{
						field: 'token',
						message: 'token expired',
					},
				],
			}
		}

		const userIdInt = parseInt(userId)
		const user = await User.findOne(userIdInt)
		if (!user) {
			return {
				errors: [
					{
						field: 'token',
						message: 'user no longer exists',
					},
				],
			}
		}

		await User.update(
			{ id: userIdInt },
			{ password: await argon2.hash(newPassword) }
		)

		await redis.del(key)

		// login after password change
		req.session.userId = user.id

		return { user }
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { redis }: MyContext
	) {
		const user = await User.findOne({ where: { email } })
		if (!user) {
			return true
		}

		const token = v4()
		await redis.set(
			FORGOT_PASSWORD_PREFIX + token,
			user.id,
			'ex',
			1000 * 60 * 60 * 24 * 3
		) // 3 days

		await sendEmail(
			email,
			`<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
		)

		return true
	}

	@Query(() => User, { nullable: true })
	me(@Ctx() { req }: MyContext) {
		// not logged in
		console.log('before', req.session)

		if (!req.session.userId) {
			console.log('undefined')
			return null
		}

		return User.findOne(req.session.userId)
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options)
		if (errors) {
			return { errors }
		}
		const hashedPassword = await argon2.hash(options.password)
		let user
		try {
			// Another way
			// User.create({
			// 	username: options.username,
			// 	email: options.email,
			// 	password: hashedPassword,
			// }).save()

			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					email: options.email,
					password: hashedPassword,
				})
				.returning('*')
				.execute()

			user = result.raw[0]
		} catch (err) {
			if (err.detail.includes('already exists')) {
				return {
					errors: [
						{
							field: 'username',
							message: 'username already taken',
						},
					],
				}
			}
		}

		// To keep the user logged in after register
		req.session.userId = user.id

		return { user }
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		)
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: 'username does not exists',
					},
				],
			}
		}
		const isValid = await argon2.verify(user.password, password)
		if (!isValid) {
			return {
				errors: [
					{
						field: 'password',
						message: 'Password is incorrect',
					},
				],
			}
		}

		req.session.userId = user.id

		return { user }
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(COOKIE_NAME)
				if (err) {
					console.log(err)
					resolve(false)
					return
				}
				resolve(true)
			})
		)
	}
}

// import { EntityManager } from '@mikro-orm/postgresql'
import argon2 from 'argon2'
import {
	Arg,
	Ctx,
	Field,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from 'type-graphql'
import { COOKIE_NAME } from '../constants'
import { User } from '../entities/User'
import { MyContext } from '../types'
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

@Resolver()
export class UserResolver {
	// @Mutation(() => Boolean)
	// async forgotPassword(@Arg("email") email: string, @Ctx() {em}: MyContext
	// ) {
	// 	// const user = await em.findOne(User, {email})
	// 	return true
	// }

	@Query(() => User, { nullable: true })
	async me(@Ctx() { req, em }: MyContext) {
		// not logged in
		if (!req.session.userId) {
			return null
		}

		const user = await em.findOne(User, { id: req.session.userId })
		return user
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options)
		if (errors) {
			return { errors }
		}
		const hashedPassword = await argon2.hash(options.password)
		// let user
		const user = em.create(User, {
			username: options.username,
			email: options.email,
			password: hashedPassword,
		})
		try {
			// const result = await (em as EntityManager)
			// 	.createQueryBuilder(User)
			// 	.getKnexQuery()
			// 	.insert({
			// 		username: options.username,
			// 		password: hashedPassword,
			// 		created_at: new Date(),
			// 		updated_at: new Date(),
			// 	})
			// 	.returning('*')
			// user = result[0]
			await em.persistAndFlush(user)
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
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail }
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

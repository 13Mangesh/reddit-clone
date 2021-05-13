// import { EntityManager } from '@mikro-orm/postgresql'
import argon2 from 'argon2'
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from 'type-graphql'
import { COOKIE_NAME } from '../constants'
import { User } from '../entities/User'
import { MyContext } from '../types'

// Another way of passing multiple arguements
// InputType used as type of args/inputs
// ObjectType can be returned from Mutations/Query
@InputType()
class UsernamePasswordInput {
	@Field()
	username: string

	@Field()
	password: string
}

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
		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: 'username',
						message: 'length must be greater than 2',
					},
				],
			}
		}

		if (options.password.length <= 5) {
			return {
				errors: [
					{
						field: 'password',
						message: 'length must be greater than 5',
					},
				],
			}
		}

		const hashedPassword = await argon2.hash(options.password)
		// let user
		const user = em.create(User, {
			username: options.username,
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
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username })
		if (!user) {
			return {
				errors: [
					{
						field: 'username',
						message: 'username does not exists',
					},
				],
			}
		}
		const isValid = await argon2.verify(user.password, options.password)
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

import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { Post } from '../entities/Post'
import { Updoot } from '../entities/Updoot'
import { User } from '../entities/User'
import { isAuthenticated } from '../middleware/isAuthenticated'
import { MyContext } from '../types'

@InputType()
class PostInput {
	@Field()
	title: string

	@Field()
	text: string
}

@ObjectType()
class PaginatedPosts {
	@Field(() => [Post])
	posts: Post[]

	@Field()
	hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 50)
	}

	// This will fire a sql query for each post so for home page it'll fire 15 queries for each post
	// This is n+1 problem and it is not a good approach.
	// We use data loader to use this same kind of syntax without performance hit
	// It'll patch all 16 sql req in 1 req
	// Usage of field resolver is that they only run if included in query
	// It's advantage over complex query with joins
	@FieldResolver(() => User)
	creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
		// return User.findOne(post.creatorId)
		return userLoader.load(post.creatorId)
	}

	@FieldResolver(() => Int)
	async voteStatus(
		@Root() post: Post,
		@Ctx() { updootLoader, req }: MyContext
	) {
		if (!req.session.userId) {
			return null
		}
		const updoot = await updootLoader.load({
			postId: post.id,
			userId: req.session.userId,
		})
		return updoot ? updoot.value : null
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuthenticated)
	async vote(
		@Arg('postId', () => Int) postId: number,
		@Arg('value', () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const { userId } = req.session
		// Following two lines are for preventing users to pass value more than 1 or less than -1

		const isUpdoot = value !== -1
		const realValue = isUpdoot ? 1 : -1

		const updoot = await Updoot.findOne({ where: { userId, postId } })

		// User has voted before and wants to change their vote (from upvote to downvote & v.v)
		if (updoot && updoot.value !== realValue) {
			getConnection().transaction(async (tm) => {
				await tm.query(
					`
					update updoot
					set value = $1
					where "postId" = $2 and "userId" = $3
				`,
					[realValue, postId, userId]
				)

				await tm.query(
					`
					update post
					set points = points + $1
					where id = $2
				`,
					[2 * realValue, postId]
				)
			})
		} else if (!updoot) {
			// User never voted before
			// By making transaction we can assure if one query fails another will also fail
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
				insert into updoot ("userId", "postId", value)
				values ($1, $2, $3)
				`,
					[userId, postId, realValue]
				)

				await tm.query(
					`
				update post
				set points = points + $1
				where id = $2
				`,
					[realValue, postId]
				)
			})
		}

		// await getConnection().query(
		// 	`
		// 	START TRANSACTION;

		// 	insert into updoot ("userId", "postId", value)
		// 	values (${userId}, ${postId}, ${realValue});

		// 	update post
		// 	set points = points + ${realValue}
		// 	where id = ${postId};

		// 	COMMIT;
		// 	`
		// )
		return true
	}

	// We can use offset instead of cursor
	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedPosts> {
		const realLimit = Math.min(50, limit)
		// +1 for fetching one more post let's say we want 10 posts and we'll fetch 11 posts
		// if we get less than 11 that means no more posts available and we can set value of hasMore variable
		const realLimitPlusOne = realLimit + 1

		const replacements: any[] = [realLimitPlusOne]

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)))
		}

		const posts = await getConnection().query(
			`
			select p.*
			from post p
			${cursor ? `where p."createdAt" < $2` : ''}
			order by p."createdAt" DESC
			limit $1
		`,
			replacements
		)

		// if (req.session.userId) {
		// 	replacements.push(req.session.userId)
		// }
		// let cursorIndex = 3
		// if (cursor) {
		// 	replacements.push(new Date(parseInt(cursor)))
		// 	cursorIndex = replacements.length
		// }

		// Query before used before field resolver for user
		// const posts = await getConnection().query(
		// 	`
		// 	select p.*,
		// 	json_build_object(
		// 		'id', u.id,
		// 		'username', u.username,
		// 		'email', u.email,
		// 		'createdAt', u."createdAt",
		// 		'updatedAt', u."updatedAt"
		// 	) as creator,
		// 	${
		// 		req.session.userId
		// 			? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
		// 			: 'null as "voteStatus"'
		// 	}
		// 	from post p
		// 	inner join public.user u on u.id = p."creatorId"
		// 	${cursor ? `where p."createdAt" < $${cursorIndex}` : ''}
		// 	order by p."createdAt" DESC
		// 	limit $1
		// `,
		// 	replacements
		// )

		// const queryBuilder = getConnection()
		// 	.getRepository(Post)
		// 	.createQueryBuilder('p')
		// 	.innerJoinAndSelect(
		// 		'p.creator',
		// 		'u',
		// 		'u.id = p."creatorId"'
		// 	)
		// 	.orderBy('p."createdAt"', 'DESC')
		// 	.take(realLimitPlusOne)

		// if (cursor) {
		// 	queryBuilder.where('p."createdAt" < :cursor', {
		// 		cursor: new Date(parseInt(cursor)),
		// 	})
		// }

		// const posts = await queryBuilder.getMany()

		return {
			posts: posts.slice(0, realLimit),
			hasMore: posts.length === realLimitPlusOne,
		}
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
		// Following syntax will cause typeorm to automatically find user (used before field resolver for user)
		// return Post.findOne(id, { relations: ['creator'] })
		return Post.findOne(id)
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuthenticated)
	async createPost(
		@Arg('input') input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({
			...input,
			creatorId: req.session.userId,
		}).save()
	}

	@Mutation(() => Post, { nullable: true })
	@UseMiddleware(isAuthenticated)
	async updatePost(
		@Arg('id', () => Int) id: number,
		@Arg('title') title: string,
		@Arg('text') text: string,
		@Ctx() { req }: MyContext
	): Promise<Post | null> {
		const result = await getConnection()
			.createQueryBuilder()
			.update(Post)
			.set({ title, text })
			.where('id = :id and "creatorId" = :creatorId', {
				id,
				creatorId: req.session.userId,
			})
			.returning('*')
			.execute()

		return result.raw[0]
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuthenticated)
	async deletePost(
		@Arg('id', () => Int) id: number,
		@Ctx() { req }: MyContext
	): Promise<boolean> {
		// This is one way to delete - It is not cascade delete
		// const post = await Post.findOne(id)
		// if (!post) {
		// 	return false
		// }
		// if (post.creatorId !== req.session.userId) {
		// 	throw new Error('Not Authorized')
		// }
		// await Updoot.delete({ postId: id })
		// await Post.delete({ id })

		// Cascade delete
		// We can let postgres handle it by adding option on Post column in updoot table
		await Post.delete({ id, creatorId: req.session.userId })
		return true
	}
}

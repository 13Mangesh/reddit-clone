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
		// await Updoot.insert({
		// 	userId,
		// 	postId,
		// 	value: realValue,
		// })

		// By making transaction we can assure if one query fails another will also fail
		await getConnection().query(
			`
			START TRANSACTION;

			insert into updoot ("userId", "postId", value)
			values (${userId}, ${postId}, ${realValue});

			update post
			set points = points + ${realValue}
			where id = ${postId};

			COMMIT;
			`
		)
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
			select p.*,
			json_build_object(
				'id', u.id,
				'username', u.username,
				'email', u.email,
				'createdAt', u."createdAt",
				'updatedAt', u."updatedAt"
			) as creator
			from post p
			inner join public.user u on u.id = p."creatorId"
			${cursor ? `where p."createdAt" < $2` : ''}
			order by p."createdAt" DESC
			limit $1
		`,
			replacements
		)

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
	post(@Arg('id') id: number): Promise<Post | undefined> {
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
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true }) title: string
	): Promise<Post | null> {
		const post = await Post.findOne(id)
		if (!post) {
			return null
		}
		if (typeof title !== 'undefined') {
			Post.update({ id }, { title })
		}
		return post
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id)
		return true
	}
}

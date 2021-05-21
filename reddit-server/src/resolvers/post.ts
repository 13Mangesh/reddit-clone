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
		const queryBuilder = getConnection()
			.getRepository(Post)
			.createQueryBuilder('p')
			.orderBy('"createdAt"', 'DESC')
			.take(realLimitPlusOne)

		if (cursor) {
			queryBuilder.where('"createdAt" < :cursor', {
				cursor: new Date(parseInt(cursor)),
			})
		}

		const posts = await queryBuilder.getMany()

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

import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { COOKIE_NAME, __prod__ } from './constants'
import { Post } from './entities/Post'
import { User } from './entities/User'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { MyContext } from './types'
import path from 'path'

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		database: 'reddit-clone2',
		username: 'mangesh',
		password: 'mangesh',
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User],
	})
	conn.runMigrations()
	// await Post.delete({})

	const app = express()

	const RedisStore = connectRedis(session)
	const redis = new Redis()
	app.use(
		cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})
	)
	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({ client: redis, disableTouch: true }),
			saveUninitialized: false,
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
				httpOnly: true, // can't be accessed in JS
				sameSite: 'lax', // csrf
				secure: __prod__, // cookie only works in https
			},
			secret: 'mfwepfmowopmgvowpnrvwwrfwr',
			resave: false,
		})
	)

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({ req, res, redis }),
	})

	apolloServer.applyMiddleware({
		app,
		cors: false,
	})

	app.listen(4000, () => {
		console.log('Server is started on localhost:4000')
	})
}

main()

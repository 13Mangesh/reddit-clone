import { ApolloServer } from 'apollo-server-express'
import 'dotenv-safe/config'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import path from 'path'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { COOKIE_NAME, __prod__ } from './constants'
import { Post } from './entities/Post'
import { Updoot } from './entities/Updoot'
import { User } from './entities/User'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { MyContext } from './types'
import { createUpdootLoader } from './utils/createUpdootLoader'
import { createUserLoader } from './utils/createUserLoader'

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		url: process.env.DATABASE_URL,
		logging: true,
		synchronize: !__prod__,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User, Updoot],
	})

	// ormconfig.json is temporary file used so that following command can run
	// npx typeorm migration:generate -n Initial

	// Due to we have run the migration here, so when we upload docker image, it'll run migrations
	// In the migrations folder and thus will create the tables.
	// conn.runMigrations()
	// await Updoot.delete({})
	// await Post.delete({})

	const app = express()

	const RedisStore = connectRedis(session)
	const redis = new Redis(process.env.REDIS_URL)
	app.set('trust proxy', 1)
	app.use(
		cors({
			origin: process.env.CORS_ORIGIN,
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
				domain: __prod__ ? '.mydomain.com' : undefined, // If we run into cookie-problems while SSR
			},
			secret: process.env.SESSION_SECRET,
			resave: false,
		})
	)

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({
			req,
			res,
			redis,
			userLoader: createUserLoader(),
			updootLoader: createUpdootLoader(),
		}),
	})

	apolloServer.applyMiddleware({
		app,
		cors: false,
	})

	app.listen(parseInt(process.env.PORT), () => {
		console.log('Server is started on localhost:4000')
	})
}

main()

import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import path from 'path';

export default {
	migrations: {
		path: path.join(__dirname, './migrations'),
		pattern: /^[\w-]+\d+\.[tj]s$/,
	},
	entities: [Post],
	host: 'localhost',
	port: 5432,
	user: 'postgres',
	password: 'postgres',
	dbName: 'reddit-clone',
	type: 'postgresql',
	debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];

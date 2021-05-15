import { Field, InputType } from 'type-graphql'

// Another way of passing multiple arguements
// InputType used as type of args/inputs
// ObjectType can be returned from Mutations/Query

@InputType()
export class UsernamePasswordInput {
	@Field()
	username: string

	@Field()
	email: string

	@Field()
	password: string
}

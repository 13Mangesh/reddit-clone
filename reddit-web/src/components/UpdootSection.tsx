import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { Flex, IconButton } from '@chakra-ui/react'
import React, { useState } from 'react'
import gql from 'graphql-tag'
import {
	PostSnippetFragment,
	useVoteMutation,
	VoteMutation,
} from '../generated/graphql'
import { ApolloCache } from '@apollo/client'

interface UpdootSectionProps {
	post: PostSnippetFragment
}

const updateAfterVote = (
	value: number,
	postId: number,
	cache: ApolloCache<VoteMutation>
) => {
	const data = cache.readFragment<{
		id: number
		points: number
		voteStatus: number | null
	}>({
		id: 'Post:' + postId,
		fragment: gql`
			fragment _ on Post {
				id
				points
				voteStatus
			}
		`,
	})
	if (data) {
		if (data.voteStatus === value) {
			return
		}
		const newPoints =
			(data.points as number) + (!data.voteStatus ? 1 : 2) * value
		cache.writeFragment({
			id: 'Post:' + postId,
			fragment: gql`
				fragment __ on Post {
					points
					voteStatus
				}
			`,
			data: { points: newPoints, voteStatus: value },
		})
	}
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
	const [loadingState, setLoadingState] = useState<
		'updoot-loading' | 'downvote-loading' | 'none-loading'
	>('none-loading')
	const [vote] = useVoteMutation()
	return (
		<Flex
			direction="column"
			alignItems="center"
			justifyContent="space-evenly"
			mr={4}
		>
			<IconButton
				onClick={async () => {
					if (post.voteStatus === 1) {
						return
					}
					setLoadingState('updoot-loading')
					await vote({
						variables: {
							value: 1,
							postId: post.id,
						},
						update: (cache) => {
							updateAfterVote(1, post.id, cache)
						},
					})
					setLoadingState('none-loading')
				}}
				colorScheme={post.voteStatus === 1 ? 'blackAlpha' : 'gray'}
				isLoading={loadingState === 'updoot-loading'}
				size="sm"
				aria-label="Upvote"
				icon={<ChevronUpIcon boxSize={6} />}
			></IconButton>
			{post.points}
			<IconButton
				onClick={async () => {
					if (post.voteStatus === -1) {
						return
					}
					setLoadingState('downvote-loading')
					await vote({
						variables: {
							value: -1,
							postId: post.id,
						},

						update: (cache) => {
							updateAfterVote(-1, post.id, cache)
						},
					})
					setLoadingState('none-loading')
				}}
				colorScheme={post.voteStatus === -1 ? 'blackAlpha' : 'gray'}
				isLoading={loadingState === 'downvote-loading'}
				size="sm"
				aria-label="Downvote"
				icon={<ChevronDownIcon boxSize={6} />}
			></IconButton>
		</Flex>
	)
}

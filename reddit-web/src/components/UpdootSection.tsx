import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { Flex, IconButton } from '@chakra-ui/react'
import React, { useState } from 'react'
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql'

interface UpdootSectionProps {
	post: PostSnippetFragment
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
	const [loadingState, setLoadingState] = useState<
		'updoot-loading' | 'downvote-loading' | 'none-loading'
	>('none-loading')
	const [, vote] = useVoteMutation()
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
						value: 1,
						postId: post.id,
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
						value: -1,
						postId: post.id,
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

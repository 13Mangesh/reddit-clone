import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { Box, IconButton, Link } from '@chakra-ui/react'
import React from 'react'
import NextLink from 'next/link'
import { useDeletePostMutation, useMeQuery } from '../generated/graphql'

interface EditDeletePostButtonProps {
	id: number
	creatorId: number
}

export const EditDeletePostButton: React.FC<EditDeletePostButtonProps> = ({
	id,
	creatorId,
}) => {
	const [deletePost] = useDeletePostMutation()
	const { data: meData } = useMeQuery()

	if (meData?.me?.id !== creatorId) {
		return null
	}

	return (
		<Box>
			<NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
				<IconButton
					as={Link}
					colorScheme="whiteAlpha"
					aria-label="Edit-post"
					icon={<EditIcon color="twitter.500" boxSize={6} />}
				></IconButton>
			</NextLink>
			<IconButton
				onClick={() => {
					deletePost({
						variables: { id },
						update: (cache) => {
							cache.evict({ id: 'Post:' + id })
						},
					})
				}}
				colorScheme="whiteAlpha"
				aria-label="Delete-post"
				icon={<DeleteIcon color="red.600" boxSize={6} />}
			></IconButton>
		</Box>
	)
}

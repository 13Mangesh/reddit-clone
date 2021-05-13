import { Box, Flex, Link } from '@chakra-ui/layout'
import React from 'react'
import NextLink from 'next/link'
import { useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const [{ data, fetching }] = useMeQuery()
	let body = null
	// data is loading
	if (fetching) {
		// user is not logged in
	} else if (!data?.me) {
		body = (
			<>
				<NextLink href="/login">
					<Link color="white" mr={2}>
						Login
					</Link>
				</NextLink>
				<NextLink href="/register">
					<Link color="white">Register</Link>
				</NextLink>
			</>
		)
		// user is logged in
	} else {
		body = (
			<Flex>
				<Box mr={2} color="white">
					{data.me.username}
				</Box>
				<Button variant="link" colorScheme="blackAlpha">
					Logout
				</Button>
			</Flex>
		)
	}

	return (
		<Flex bg="purple" p={4}>
			<Box ml={'auto'}>{body}</Box>
		</Flex>
	)
}

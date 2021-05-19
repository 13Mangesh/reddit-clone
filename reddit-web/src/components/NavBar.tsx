import { Box, Flex, Link } from '@chakra-ui/layout'
import React from 'react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button'
import { isServer } from '../utils/isServer'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
	const [{ data, fetching }] = useMeQuery({
		pause: isServer(),
	})
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
				<Button
					onClick={() => {
						logout()
					}}
					isLoading={logoutFetching}
					variant="link"
					colorScheme="linkedin"
				>
					Logout
				</Button>
			</Flex>
		)
	}

	return (
		<Flex zIndex={2} position="sticky" top={0} bg="purple" p={4}>
			<Box ml={'auto'}>{body}</Box>
		</Flex>
	)
}

import { Box, Flex, Heading, Link } from '@chakra-ui/layout'
import React from 'react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button'
import { isServer } from '../utils/isServer'
import { useRouter } from 'next/router'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const router = useRouter()
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
			<Flex align="center">
				<NextLink href="/create-post">
					<Button mr={4} variant="outline" colorScheme="red" color="salmon">
						Create Post
					</Button>
				</NextLink>
				<Box mr={4} color="white">
					{data.me.username}
				</Box>
				<Button
					onClick={async () => {
						await logout()
						router.reload()
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
		<Flex zIndex={2} position="sticky" top={0} bg="purple.900" p={4}>
			<Flex align="center" m="auto" flex={1} maxW={800}>
				<NextLink href="/">
					<Link>
						<Heading textColor="twitter.200">Reddit-Clone</Heading>
					</Link>
				</NextLink>
				<Box ml={'auto'}>{body}</Box>
			</Flex>
		</Flex>
	)
}

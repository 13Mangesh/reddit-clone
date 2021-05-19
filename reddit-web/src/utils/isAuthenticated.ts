import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useMeQuery } from '../generated/graphql'

export const useIsAuthenticated = () => {
	const [{ data, fetching }] = useMeQuery()
	const router = useRouter()
	useEffect(() => {
		if (!fetching && !data?.me) {
			router.replace('/login?nextpage=' + router.pathname)
		}
	}, [fetching, data, router])
}

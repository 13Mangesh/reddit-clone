import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useMeQuery } from '../generated/graphql'

export const useIsAuthenticated = () => {
	const { data, loading } = useMeQuery()
	const router = useRouter()
	useEffect(() => {
		if (!loading && !data?.me) {
			router.replace('/login?nextpage=' + router.pathname)
		}
	}, [loading, data, router])
}

import { useEffect, useState } from 'react'
import { authService, rolesService } from '../services/supabase'
import { AuthContext } from './AuthContextProvider'
import { notifications } from '@mantine/notifications'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRoles, setUserRoles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previousUser, setPreviousUser] = useState(null)

  useEffect(() => {
    // Show success toast when user logs in (user changes from null to logged-in state)
    if (user && !previousUser) {
      notifications.show({
        title: 'Login Successful',
        message: `Welcome! You have been logged in.`,
        color: 'green',
      })
    }
    setPreviousUser(user)
  }, [user, previousUser])

  useEffect(() => {
    // Listen for auth changes - this properly handles session restoration on page load
    let isMounted = true
    
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null)
        
        // Set loading to false immediately - don't wait for roles
        setLoading(false)
        
        if (session?.user) {
          // Fetch roles in background (non-blocking) with timeout
          const rolesPromise = rolesService.getUserRoles(session.user.id)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
          )
          
          try {
            const roles = await Promise.race([rolesPromise, timeoutPromise])
            if (isMounted) setUserRoles(roles)
          } catch (roleError) {
            console.error('Error fetching user roles:', roleError)
            // Set default permissions on error
            if (isMounted) setUserRoles({
              user_id: session.user.id,
              can_edit: false
            })
          }
        } else {
          if (isMounted) setUserRoles(null)
        }
      } catch (unexpectedError) {
        console.error('Unexpected error in auth state change:', unexpectedError)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signInWithProvider = async (provider) => {
    try {
      setLoading(true)
      await authService.signInWithProvider(provider)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      setUserRoles(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    userRoles,
    loading,
    signInWithProvider,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
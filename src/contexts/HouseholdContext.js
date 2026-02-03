'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const HouseholdContext = createContext(null)

export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const supabase = createClient()

  // Check for user session
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch household data when user changes
  useEffect(() => {
    if (user) {
      fetchHousehold()
      checkPremiumStatus()
    } else {
      setHousehold(null)
      setFamilyMembers([])
      setLoading(false)
      setIsPremium(false)
    }
  }, [user])

  // Fetch household and family members
  const fetchHousehold = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/household')
      const data = await response.json()

      if (data.success) {
        setHousehold(data.household)
        setFamilyMembers(data.household?.family_members || [])
      } else if (response.status === 401) {
        // Not logged in, clear state
        setHousehold(null)
        setFamilyMembers([])
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Failed to fetch household:', err)
      setError('Kunde inte hämta hushållsdata')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Check premium status
  const checkPremiumStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/subscription')
      const data = await response.json()
      setIsPremium(data.plan === 'premium')
    } catch (err) {
      console.error('Failed to check premium status:', err)
      setIsPremium(false)
    }
  }, [])

  // Create household
  const createHousehold = useCallback(async (name = 'Mitt hushåll') => {
    try {
      const response = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await response.json()

      if (data.success) {
        setHousehold(data.household)
        return { success: true, household: data.household }
      } else {
        return { success: false, error: data.error, requiresPremium: data.requiresPremium }
      }
    } catch (err) {
      console.error('Failed to create household:', err)
      return { success: false, error: 'Ett fel uppstod' }
    }
  }, [])

  // Update household name
  const updateHouseholdName = useCallback(async (name) => {
    try {
      const response = await fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await response.json()

      if (data.success) {
        setHousehold(prev => ({ ...prev, name }))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to update household:', err)
      return { success: false, error: 'Ett fel uppstod' }
    }
  }, [])

  // Add family member
  const addMember = useCallback(async (memberData) => {
    try {
      const response = await fetch('/api/household/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      const data = await response.json()

      if (data.success) {
        setFamilyMembers(prev => [...prev, data.member])
        // Update household if it was just created
        if (!household) {
          await fetchHousehold()
        }
        return { success: true, member: data.member }
      } else {
        return { success: false, error: data.error, requiresPremium: data.requiresPremium }
      }
    } catch (err) {
      console.error('Failed to add member:', err)
      return { success: false, error: 'Ett fel uppstod' }
    }
  }, [household, fetchHousehold])

  // Update family member
  const updateMember = useCallback(async (memberId, memberData) => {
    try {
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      const data = await response.json()

      if (data.success) {
        setFamilyMembers(prev =>
          prev.map(m => m.id === memberId ? data.member : m)
        )
        return { success: true, member: data.member }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to update member:', err)
      return { success: false, error: 'Ett fel uppstod' }
    }
  }, [])

  // Remove family member
  const removeMember = useCallback(async (memberId) => {
    try {
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setFamilyMembers(prev => prev.filter(m => m.id !== memberId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
      return { success: false, error: 'Ett fel uppstod' }
    }
  }, [])

  // Reorder family members
  const reorderMembers = useCallback(async (newOrder) => {
    // Optimistic update
    setFamilyMembers(newOrder)

    // Update sort_order for each member
    const updates = newOrder.map((member, index) =>
      fetch(`/api/household/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: index })
      })
    )

    try {
      await Promise.all(updates)
      return { success: true }
    } catch (err) {
      console.error('Failed to reorder members:', err)
      // Refetch to get correct order
      await fetchHousehold()
      return { success: false, error: 'Kunde inte ändra ordningen' }
    }
  }, [fetchHousehold])

  // Get combined dietary restrictions for all family members
  const getCombinedRestrictions = useCallback(() => {
    if (familyMembers.length === 0) {
      return {
        allergies: [],
        intolerances: [],
        dislikes: [],
        diet_type: 'none'
      }
    }

    const allAllergies = new Set()
    const allIntolerances = new Set()
    const allDislikes = new Set()
    let strictestDiet = 'none'
    const dietPriority = { vegan: 3, vegetarian: 2, pescatarian: 1, none: 0 }

    familyMembers.forEach(member => {
      const r = member.dietary_restrictions || {}
      r.allergies?.forEach(a => allAllergies.add(a))
      r.intolerances?.forEach(i => allIntolerances.add(i))
      r.dislikes?.forEach(d => allDislikes.add(d))

      const memberDiet = r.diet_type || 'none'
      if ((dietPriority[memberDiet] || 0) > (dietPriority[strictestDiet] || 0)) {
        strictestDiet = memberDiet
      }
    })

    return {
      allergies: [...allAllergies],
      intolerances: [...allIntolerances],
      dislikes: [...allDislikes],
      diet_type: strictestDiet
    }
  }, [familyMembers])

  // Get total servings from all family members
  const getTotalServings = useCallback(() => {
    if (familyMembers.length === 0) return 0
    return familyMembers.reduce((sum, m) => sum + (parseFloat(m.portion_multiplier) || 1), 0)
  }, [familyMembers])

  // Get readable portion label
  const getPortionLabel = useCallback((totalServings) => {
    const rounded = Math.ceil(totalServings)
    if (rounded === totalServings) {
      return `${rounded} portioner`
    }
    return `ca ${rounded} portioner (${totalServings.toFixed(1)} exakt)`
  }, [])

  // Check if user has a household
  const hasHousehold = Boolean(household)

  // Member count
  const memberCount = familyMembers.length

  const value = {
    // State
    household,
    familyMembers,
    loading,
    error,
    user,
    isPremium,
    hasHousehold,
    memberCount,

    // Actions
    fetchHousehold,
    createHousehold,
    updateHouseholdName,
    addMember,
    updateMember,
    removeMember,
    reorderMembers,

    // Computed values
    getCombinedRestrictions,
    getTotalServings,
    getPortionLabel,
    totalServings: getTotalServings(),
    combinedRestrictions: getCombinedRestrictions()
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}

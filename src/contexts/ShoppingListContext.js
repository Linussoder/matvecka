'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const ShoppingListContext = createContext(null)

const STORAGE_KEY = 'matvecka-shopping-list'

export function ShoppingListProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Load items from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setItems(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse shopping list:', e)
        }
      }
    }
    setLoading(false)
  }, [])

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

  // Save to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, loading])

  // Add item to list
  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id)

      if (existingIndex >= 0) {
        // Update quantity if already exists
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        }
        return updated
      }

      // Add new item
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'st',
        store: product.store || 'ICA',
        quantity,
        checked: false,
        source: 'browse', // 'browse' | 'meal_plan' | 'manual'
        addedAt: new Date().toISOString()
      }]
    })
  }, [])

  // Remove item from list
  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  // Update item quantity
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ))
  }, [removeItem])

  // Toggle item checked status
  const toggleChecked = useCallback((itemId) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ))
  }, [])

  // Clear all items
  const clearList = useCallback(() => {
    setItems([])
  }, [])

  // Clear checked items
  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(item => !item.checked))
  }, [])

  // Check if product is in list
  const isInList = useCallback((productId) => {
    return items.some(item => item.productId === productId)
  }, [items])

  // Get item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Get total price
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Get checked count
  const checkedCount = items.filter(item => item.checked).length

  // Get quantity for a specific product
  const getQuantity = useCallback((productId) => {
    const item = items.find(item => item.productId === productId)
    return item?.quantity || 0
  }, [items])

  // Open/close drawer
  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const toggleDrawer = useCallback(() => setIsOpen(prev => !prev), [])

  const value = {
    items,
    itemCount,
    totalItems: itemCount, // alias for compatibility
    totalPrice,
    isOpen,
    setIsOpen,
    loading,
    user,
    addItem,
    removeItem,
    updateQuantity,
    toggleChecked,
    clearList,
    clearChecked,
    isInList,
    getQuantity,
    checkedCount,
    openDrawer,
    closeDrawer,
    toggleDrawer
  }

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  )
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext)
  if (!context) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider')
  }
  return context
}

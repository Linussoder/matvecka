import { redirect } from 'next/navigation'

export default function MyShoppingListsPage() {
  redirect('/dashboard?tab=lists')
}

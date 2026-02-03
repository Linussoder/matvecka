import { redirect } from 'next/navigation'

export default function MyMealPlansPage() {
  redirect('/dashboard?tab=plans')
}

import Link from 'next/link'

export default function EmptyState({
  icon = '📭',
  title = 'Inget att visa',
  description = 'Det finns inget här ännu.',
  actionText = null,
  actionHref = null
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  )
}

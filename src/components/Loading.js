export default function Loading({ text = 'Laddar...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-green-200 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-green-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  )
}

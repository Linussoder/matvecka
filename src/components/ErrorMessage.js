export default function ErrorMessage({
  title = 'Något gick fel',
  message = 'Ett oväntat fel uppstod. Försök igen senare.',
  onRetry = null
}) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">😕</div>
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">{title}</h3>
      <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Försök igen
        </button>
      )}
    </div>
  )
}

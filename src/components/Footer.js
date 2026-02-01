import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold text-green-600">
              🛒 Matvecka
            </Link>
            <p className="mt-3 text-gray-600 text-sm">
              Smart matplanering som sparar tid och pengar på veckohandlingen.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Tjänster</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/meal-planner" className="text-gray-600 hover:text-green-600">
                  Matplanering
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-green-600">
                  Veckans erbjudanden
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-600 hover:text-green-600">
                  Skapa konto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-green-600">
                  Vanliga frågor
                </Link>
              </li>
              <li>
                <a href="mailto:info@matvecka.se" className="text-gray-600 hover:text-green-600">
                  Kontakta oss
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Juridiskt</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-green-600">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-green-600">
                  Integritetspolicy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Matvecka. Alla rättigheter förbehållna.
          </p>
          <p className="text-gray-400 text-sm">
            🇸🇪 Gjort i Sverige
          </p>
        </div>
      </div>
    </footer>
  )
}

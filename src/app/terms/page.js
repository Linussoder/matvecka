import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Användarvillkor</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptans av villkor</h2>
            <p className="text-gray-600 mb-4">
              Genom att använda Matvecka godkänner du dessa användarvillkor. Om du inte accepterar
              villkoren, vänligen använd inte tjänsten.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Beskrivning av tjänsten</h2>
            <p className="text-gray-600 mb-4">
              Matvecka är en tjänst som hjälper användare att planera sina veckoköp genom att
              skapa matplaner baserade på aktuella erbjudanden från svenska matbutiker.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Användarkonto</h2>
            <p className="text-gray-600 mb-4">
              För att använda vissa funktioner behöver du skapa ett konto. Du ansvarar för att:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Ange korrekt information vid registrering</li>
              <li>Hålla ditt lösenord säkert</li>
              <li>Meddela oss om obehörig användning av ditt konto</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Priser och erbjudanden</h2>
            <p className="text-gray-600 mb-4">
              Vi strävar efter att visa korrekta priser och erbjudanden, men kan inte garantera
              att all information är aktuell. Kontrollera alltid priser i butiken innan köp.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Recept och matplaner</h2>
            <p className="text-gray-600 mb-4">
              Recepten som genereras är förslag och användaren ansvarar själv för att:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Kontrollera ingredienser mot eventuella allergier</li>
              <li>Bedöma om receptet passar dina kostbehov</li>
              <li>Följa god livsmedelshygien vid tillagning</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Betalning och prenumeration</h2>
            <p className="text-gray-600 mb-4">
              Gratisversionen ger tillgång till 2 matplaner per vecka. Premium-prenumerationen
              kostar 99 kr/månad och ger obegränsad tillgång.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Avsluta konto</h2>
            <p className="text-gray-600 mb-4">
              Du kan när som helst avsluta ditt konto via inställningarna. Vid avslut raderas
              dina personuppgifter enligt vår integritetspolicy.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Ändringar i villkoren</h2>
            <p className="text-gray-600 mb-4">
              Vi kan uppdatera dessa villkor. Väsentliga ändringar meddelas via e-post eller
              i tjänsten.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Kontakt</h2>
            <p className="text-gray-600 mb-4">
              Har du frågor om villkoren? Kontakta oss på{' '}
              <a href="mailto:info@matvecka.se" className="text-green-600 hover:underline">
                info@matvecka.se
              </a>
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/" className="text-green-600 hover:text-green-700">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Integritetspolicy</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Din integritet är viktig för oss. Denna policy förklarar hur vi samlar in,
              använder och skyddar dina personuppgifter.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Vilka uppgifter samlar vi in?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Vi samlar in följande information:</p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
              <li><strong>Kontoinformation:</strong> Namn, e-postadress</li>
              <li><strong>Preferenser:</strong> Kostpreferenser, antal portioner, föredragen stad</li>
              <li><strong>Användningsdata:</strong> Skapade veckomenyer och inköpslistor</li>
              <li><strong>Teknisk data:</strong> IP-adress, webbläsartyp (för att förbättra tjänsten)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Hur använder vi dina uppgifter?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Vi använder dina uppgifter för att:</p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
              <li>Skapa personliga veckomenyer baserade på dina preferenser</li>
              <li>Spara dina veckomenyer och inköpslistor</li>
              <li>Skicka viktig information om tjänsten</li>
              <li>Förbättra och utveckla Matvecka</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. Hur skyddar vi dina uppgifter?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vi använder branschstandard för säkerhet:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
              <li>Krypterad dataöverföring (HTTPS/SSL)</li>
              <li>Säker databaslagring hos Supabase (EU-baserat)</li>
              <li>Begränsad åtkomst till personuppgifter</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Delning av uppgifter</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vi säljer aldrig dina personuppgifter. Vi delar endast data med:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
              <li><strong>Supabase:</strong> Databaslagring (EU)</li>
              <li><strong>Vercel:</strong> Webbhosting</li>
              <li><strong>Stripe:</strong> Betalningshantering (vid prenumeration)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vi använder nödvändiga cookies för att hålla dig inloggad. Vi använder inga
              spårningscookies för reklam.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Dina rättigheter (GDPR)</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Du har rätt att:</p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
              <li><strong>Få tillgång</strong> till dina personuppgifter</li>
              <li><strong>Rätta</strong> felaktig information</li>
              <li><strong>Radera</strong> ditt konto och all data</li>
              <li><strong>Exportera</strong> dina uppgifter</li>
              <li><strong>Invända</strong> mot viss databehandling</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Datalagring</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vi behåller dina uppgifter så länge du har ett aktivt konto. Vid kontoborttagning
              raderas dina personuppgifter inom 30 dagar.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Barn</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Matvecka är inte avsett för barn under 16 år. Vi samlar inte medvetet in
              uppgifter från barn.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. Ändringar</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vi kan uppdatera denna policy. Väsentliga ändringar meddelas via e-post.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. Kontakt</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Frågor om din integritet? Kontakta oss på{' '}
              <a href="mailto:privacy@matvecka.se" className="text-green-600 hover:underline">
                privacy@matvecka.se
              </a>
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link href="/" className="text-green-600 hover:text-green-700">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

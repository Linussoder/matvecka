'use client'

import { useState } from 'react'
import Link from 'next/link'

// Sample data - looks like real generated content
const sampleMealPlan = {
  name: 'Exempelplan - Vecka 5',
  createdAt: '2026-02-01',
  totalCost: 847,
  servings: 4,
  recipes: [
    {
      day: 1,
      dayName: 'Måndag',
      name: 'Krämig kycklingpasta',
      description: 'Saftig kyckling i en krämig sås med pasta och grönsaker - perfekt vardagsmat som går snabbt att laga.',
      prepTime: '15 min',
      cookTime: '25 min',
      servings: 4,
      estimatedCost: 112,
      costPerServing: 28,
      difficulty: 'Lätt',
      image: '🍝',
      ingredients: [
        { name: 'Kycklingfilé', amount: '600', unit: 'g', isFromOffer: true },
        { name: 'Pasta penne', amount: '400', unit: 'g', isFromOffer: true },
        { name: 'Grädde', amount: '2', unit: 'dl', isFromOffer: false },
        { name: 'Gul lök', amount: '1', unit: 'st', isFromOffer: true },
        { name: 'Vitlök', amount: '2', unit: 'klyftor', isFromOffer: false },
        { name: 'Spenat', amount: '100', unit: 'g', isFromOffer: true },
        { name: 'Olivolja', amount: '2', unit: 'msk', isFromOffer: false },
        { name: 'Salt och peppar', amount: '', unit: 'efter smak', isFromOffer: false },
      ],
      instructions: [
        'Koka pastan enligt förpackningens anvisningar i saltat vatten.',
        'Skär kycklingfilén i ca 2 cm stora bitar. Krydda med salt och peppar.',
        'Hetta upp olivolja i en stor stekpanna på medelhög värme.',
        'Stek kycklingbitarna i 5-6 minuter tills de är genomstekta och gyllene. Lägg åt sidan.',
        'I samma panna, fräs hackad lök i 2-3 minuter tills den mjuknat.',
        'Tillsätt pressad vitlök och fräs ytterligare 30 sekunder.',
        'Häll i grädden och låt sjuda på låg värme i 3-4 minuter.',
        'Lägg tillbaka kycklingen i pannan tillsammans med spenaten.',
        'Rör om tills spenaten sjunkit ihop, ca 1-2 minuter.',
        'Smaka av med salt och peppar. Servera över den nykokta pastan.',
      ],
      tips: 'Toppa med riven parmesan för extra smak! Du kan också tillsätta soltorkade tomater eller champinjoner.',
    },
    {
      day: 2,
      dayName: 'Tisdag',
      name: 'Ugnsbakad lax med potatismos',
      description: 'Elegant men enkel rätt med saftig lax och krämigt potatismos. Perfekt för en lite lyxigare vardag.',
      prepTime: '10 min',
      cookTime: '20 min',
      servings: 4,
      estimatedCost: 145,
      costPerServing: 36,
      difficulty: 'Lätt',
      image: '🐟',
      ingredients: [
        { name: 'Laxfilé', amount: '600', unit: 'g', isFromOffer: true },
        { name: 'Potatis', amount: '800', unit: 'g', isFromOffer: true },
        { name: 'Smör', amount: '50', unit: 'g', isFromOffer: false },
        { name: 'Mjölk', amount: '1', unit: 'dl', isFromOffer: false },
        { name: 'Citron', amount: '1', unit: 'st', isFromOffer: false },
        { name: 'Färsk dill', amount: '1', unit: 'knippe', isFromOffer: false },
        { name: 'Salt och peppar', amount: '', unit: 'efter smak', isFromOffer: false },
      ],
      instructions: [
        'Sätt ugnen på 200°C.',
        'Skala potatisen och skär i jämna bitar. Koka i saltat vatten ca 15-20 minuter.',
        'Lägg laxfiléerna på en bakplåtspappersklädd plåt.',
        'Krydda laxen med salt, peppar och en skvätt citronjuice.',
        'Baka i ugnen i 12-15 minuter beroende på tjocklek.',
        'När potatisen är mjuk, häll av vattnet och mosa med smör och mjölk.',
        'Smaka av potatismoset med salt och peppar.',
        'Servera laxen på en bädd av potatismos, toppa med färsk dill och citronklyftor.',
      ],
      tips: 'Vill du ha extra krispig lax? Grilla på högsta värme sista 2 minuterna!',
    },
    {
      day: 3,
      dayName: 'Onsdag',
      name: 'Klassisk köttfärssås med spagetti',
      description: 'Familjefavoriten som alltid uppskattas. Långkok gör såsen extra smakrik.',
      prepTime: '15 min',
      cookTime: '30 min',
      servings: 4,
      estimatedCost: 89,
      costPerServing: 22,
      difficulty: 'Lätt',
      image: '🍝',
      ingredients: [
        { name: 'Nötfärs', amount: '500', unit: 'g', isFromOffer: true },
        { name: 'Spagetti', amount: '400', unit: 'g', isFromOffer: true },
        { name: 'Krossade tomater', amount: '400', unit: 'g', isFromOffer: true },
        { name: 'Gul lök', amount: '1', unit: 'st', isFromOffer: true },
        { name: 'Morot', amount: '1', unit: 'st', isFromOffer: true },
        { name: 'Vitlök', amount: '2', unit: 'klyftor', isFromOffer: false },
        { name: 'Tomatpuré', amount: '2', unit: 'msk', isFromOffer: false },
        { name: 'Parmesan', amount: '50', unit: 'g', isFromOffer: false },
        { name: 'Olivolja', amount: '2', unit: 'msk', isFromOffer: false },
        { name: 'Italienska örter', amount: '1', unit: 'tsk', isFromOffer: false },
      ],
      instructions: [
        'Hacka löken och moroten fint. Pressa vitlöken.',
        'Hetta upp olivolja i en stor kastrull.',
        'Fräs lök och morot på medelvärme i 5 minuter.',
        'Tillsätt vitlöken och fräs 1 minut till.',
        'Höj värmen och tillsätt köttfärsen. Bryn tills den fått färg.',
        'Rör ner tomatpurén och låt fräsa 1 minut.',
        'Tillsätt krossade tomater och örter. Rör om väl.',
        'Sänk värmen och låt sjuda utan lock i 20-25 minuter.',
        'Koka spagetin enligt förpackningen.',
        'Smaka av såsen med salt och peppar. Servera med riven parmesan.',
      ],
      tips: 'Tillsätt en nypa socker om tomatsåsen känns för syrlig. Såsen blir ännu godare om den får stå till nästa dag!',
    },
    {
      day: 4,
      dayName: 'Torsdag',
      name: 'Vegetarisk kikärtscurry',
      description: 'Smakrik och mättande curry som är både nyttig och prisvärd. Perfekt för köttfria dagar.',
      prepTime: '10 min',
      cookTime: '25 min',
      servings: 4,
      estimatedCost: 78,
      costPerServing: 20,
      difficulty: 'Lätt',
      image: '🍛',
      ingredients: [
        { name: 'Kikärtor (burk)', amount: '400', unit: 'g', isFromOffer: true },
        { name: 'Kokosmjölk', amount: '400', unit: 'ml', isFromOffer: true },
        { name: 'Currypasta', amount: '2', unit: 'msk', isFromOffer: false },
        { name: 'Basmatiris', amount: '300', unit: 'g', isFromOffer: true },
        { name: 'Färsk spenat', amount: '100', unit: 'g', isFromOffer: true },
        { name: 'Tomat', amount: '2', unit: 'st', isFromOffer: true },
        { name: 'Gul lök', amount: '1', unit: 'st', isFromOffer: true },
        { name: 'Ingefära', amount: '1', unit: 'tsk', isFromOffer: false },
        { name: 'Koriander (valfritt)', amount: '', unit: 'för topping', isFromOffer: false },
      ],
      instructions: [
        'Koka riset enligt förpackningens anvisningar.',
        'Hacka löken och tärna tomaterna.',
        'Fräs löken i olja tills den mjuknat.',
        'Tillsätt currypasta och riven ingefära, fräs 1 minut.',
        'Häll i kokosmjölken och rör om väl.',
        'Skölj kikärtorna och tillsätt i pannan.',
        'Låt sjuda på medelvärme i 15 minuter.',
        'Tillsätt tomaterna och spenaten, låt värmas genom.',
        'Smaka av med salt och servera med ris.',
        'Toppa med färsk koriander om du önskar.',
      ],
      tips: 'Vill du ha mer hetta? Tillsätt en hackad chili eller lite sambal oelek.',
    },
    {
      day: 5,
      dayName: 'Fredag',
      name: 'Panerad fisk med pommes',
      description: 'Fredagsmys på riktigt! Krispig fisk med gyllene pommes och hemgjord remouladsås.',
      prepTime: '20 min',
      cookTime: '30 min',
      servings: 4,
      estimatedCost: 125,
      costPerServing: 31,
      difficulty: 'Medel',
      image: '🍟',
      ingredients: [
        { name: 'Torskfilé', amount: '600', unit: 'g', isFromOffer: true },
        { name: 'Potatis', amount: '800', unit: 'g', isFromOffer: true },
        { name: 'Vetemjöl', amount: '1', unit: 'dl', isFromOffer: false },
        { name: 'Ägg', amount: '2', unit: 'st', isFromOffer: true },
        { name: 'Ströbröd', amount: '2', unit: 'dl', isFromOffer: false },
        { name: 'Majonnäs', amount: '2', unit: 'dl', isFromOffer: false },
        { name: 'Saltgurka', amount: '2', unit: 'st', isFromOffer: false },
        { name: 'Citron', amount: '1', unit: 'st', isFromOffer: false },
        { name: 'Olja för stekning', amount: '', unit: 'efter behov', isFromOffer: false },
      ],
      instructions: [
        'Sätt ugnen på 225°C för pommesen.',
        'Skär potatisen i stavar, lägg på plåt med olja, salt och peppar.',
        'Rosta i ugnen ca 25-30 minuter, vänd halvvägs.',
        'Skär fisken i portionsbitar.',
        'Ställ fram tre djupa tallrikar: mjöl, vispat ägg, och ströbröd.',
        'Doppa fisken först i mjöl, sedan ägg, sist ströbröd.',
        'Stek fisken i rikligt med olja, ca 3-4 min per sida.',
        'Blanda majonnäs med finhackad saltgurka till remouladsås.',
        'Servera fisken med pommes, remoulad och citronklyftor.',
      ],
      tips: 'Lägg fisken på hushållspapper efter stekning för att få bort överflödig olja.',
    },
    {
      day: 6,
      dayName: 'Lördag',
      name: 'Tacofredag (på lördag!)',
      description: 'Klassisk tacos med allt tillbehör. Låt alla bygga sina egna - kul för hela familjen!',
      prepTime: '20 min',
      cookTime: '15 min',
      servings: 4,
      estimatedCost: 135,
      costPerServing: 34,
      difficulty: 'Lätt',
      image: '🌮',
      ingredients: [
        { name: 'Nötfärs', amount: '500', unit: 'g', isFromOffer: true },
        { name: 'Tacokrydda', amount: '1', unit: 'påse', isFromOffer: false },
        { name: 'Tacoskal', amount: '12', unit: 'st', isFromOffer: true },
        { name: 'Tomat', amount: '3', unit: 'st', isFromOffer: true },
        { name: 'Isbergssallad', amount: '1', unit: 'st', isFromOffer: true },
        { name: 'Riven ost', amount: '200', unit: 'g', isFromOffer: true },
        { name: 'Gräddfil', amount: '2', unit: 'dl', isFromOffer: false },
        { name: 'Salsa', amount: '1', unit: 'burk', isFromOffer: false },
        { name: 'Avokado', amount: '1', unit: 'st', isFromOffer: false },
      ],
      instructions: [
        'Stek köttfärsen i en stekpanna tills den är genomstekt.',
        'Tillsätt tacokrydda och vatten enligt förpackningen.',
        'Låt sjuda 5 minuter.',
        'Hacka tomater i tärningar.',
        'Strimla isbergssalladen fint.',
        'Gör guacamole av mosad avokado, salt, lime och vitlök.',
        'Värm tacoskalen i ugnen på 175°C i några minuter.',
        'Ställ fram allt tillbehör i skålar.',
        'Låt alla bygga sina egna tacos!',
      ],
      tips: 'Servera med nachochips och extra salsa som förrätt medan du förbereder resten.',
    },
    {
      day: 7,
      dayName: 'Söndag',
      name: 'Helstekt kyckling med rostade grönsaker',
      description: 'Söndagsmiddag när den är som bäst. Saftig kyckling med krispigt skinn och rostade rotfrukter.',
      prepTime: '15 min',
      cookTime: '60 min',
      servings: 4,
      estimatedCost: 163,
      costPerServing: 41,
      difficulty: 'Medel',
      image: '🍗',
      ingredients: [
        { name: 'Hel kyckling', amount: '1.5', unit: 'kg', isFromOffer: true },
        { name: 'Potatis', amount: '600', unit: 'g', isFromOffer: true },
        { name: 'Morötter', amount: '4', unit: 'st', isFromOffer: true },
        { name: 'Palsternacka', amount: '2', unit: 'st', isFromOffer: false },
        { name: 'Citron', amount: '1', unit: 'st', isFromOffer: false },
        { name: 'Färsk rosmarin', amount: '3', unit: 'kvistar', isFromOffer: false },
        { name: 'Vitlök', amount: '1', unit: 'hel', isFromOffer: false },
        { name: 'Smör', amount: '50', unit: 'g', isFromOffer: false },
        { name: 'Kycklingfond', amount: '2', unit: 'dl', isFromOffer: false },
      ],
      instructions: [
        'Ta ut kycklingen ur kylen 30 minuter innan tillagning.',
        'Sätt ugnen på 200°C.',
        'Torka kycklingen torr med hushållspapper.',
        'Gnid in kycklingen med mjukt smör, salt och peppar.',
        'Stoppa citronhalvor, rosmarin och vitlök i kycklingens hålrum.',
        'Skär rotfrukterna i bitar och lägg i en ugnsform.',
        'Ringla olja över grönsakerna, salta och peppra.',
        'Placera kycklingen ovanpå grönsakerna.',
        'Stek i ugnen ca 1 timme (innertemp 75°C i låret).',
        'Låt kycklingen vila 10 minuter under folie.',
        'Koka ihop skyn med fond till sås.',
        'Skär upp kycklingen och servera med grönsaker och sås.',
      ],
      tips: 'Stek kycklingen bröst nedåt första halvan för extra saftigt bröst, vänd sedan.',
    },
  ],
}

const sampleShoppingList = [
  {
    category: 'Kött & Fågel',
    color: 'bg-red-50 border-red-200',
    items: [
      { name: 'Kycklingfilé', amount: '600', unit: 'g', price: 89, isOffer: true },
      { name: 'Nötfärs', amount: '1000', unit: 'g', price: 95, isOffer: true },
      { name: 'Hel kyckling', amount: '1.5', unit: 'kg', price: 79, isOffer: true },
    ]
  },
  {
    category: 'Fisk & Skaldjur',
    color: 'bg-blue-50 border-blue-200',
    items: [
      { name: 'Laxfilé', amount: '600', unit: 'g', price: 119, isOffer: true },
      { name: 'Torskfilé', amount: '600', unit: 'g', price: 99, isOffer: true },
    ]
  },
  {
    category: 'Grönsaker',
    color: 'bg-green-50 border-green-200',
    items: [
      { name: 'Potatis', amount: '2.4', unit: 'kg', price: 25, isOffer: true },
      { name: 'Gul lök', amount: '4', unit: 'st', price: 8, isOffer: true },
      { name: 'Morötter', amount: '6', unit: 'st', price: 12, isOffer: true },
      { name: 'Spenat', amount: '200', unit: 'g', price: 20, isOffer: true },
      { name: 'Tomater', amount: '5', unit: 'st', price: 25, isOffer: true },
      { name: 'Isbergssallad', amount: '1', unit: 'st', price: 15, isOffer: true },
      { name: 'Avokado', amount: '1', unit: 'st', price: 15, isOffer: false },
      { name: 'Palsternacka', amount: '2', unit: 'st', price: 18, isOffer: false },
    ]
  },
  {
    category: 'Mejeri & Ägg',
    color: 'bg-yellow-50 border-yellow-200',
    items: [
      { name: 'Grädde', amount: '2', unit: 'dl', price: 18, isOffer: false },
      { name: 'Smör', amount: '150', unit: 'g', price: 25, isOffer: false },
      { name: 'Mjölk', amount: '1', unit: 'dl', price: 5, isOffer: false },
      { name: 'Ägg', amount: '2', unit: 'st', price: 8, isOffer: true },
      { name: 'Riven ost', amount: '250', unit: 'g', price: 35, isOffer: true },
      { name: 'Parmesan', amount: '50', unit: 'g', price: 25, isOffer: false },
      { name: 'Gräddfil', amount: '2', unit: 'dl', price: 15, isOffer: false },
      { name: 'Kokosmjölk', amount: '400', unit: 'ml', price: 18, isOffer: true },
    ]
  },
  {
    category: 'Pasta, Ris & Bröd',
    color: 'bg-orange-50 border-orange-200',
    items: [
      { name: 'Pasta penne', amount: '400', unit: 'g', price: 15, isOffer: true },
      { name: 'Spagetti', amount: '400', unit: 'g', price: 12, isOffer: true },
      { name: 'Basmatiris', amount: '300', unit: 'g', price: 20, isOffer: true },
      { name: 'Tacoskal', amount: '12', unit: 'st', price: 25, isOffer: true },
      { name: 'Ströbröd', amount: '2', unit: 'dl', price: 12, isOffer: false },
    ]
  },
  {
    category: 'Konserver & Skafferi',
    color: 'bg-purple-50 border-purple-200',
    items: [
      { name: 'Krossade tomater', amount: '400', unit: 'g', price: 12, isOffer: true },
      { name: 'Kikärtor', amount: '400', unit: 'g', price: 15, isOffer: true },
      { name: 'Tacokrydda', amount: '1', unit: 'påse', price: 12, isOffer: false },
      { name: 'Currypasta', amount: '2', unit: 'msk', price: 35, isOffer: false },
      { name: 'Salsa', amount: '1', unit: 'burk', price: 25, isOffer: false },
      { name: 'Tomatpuré', amount: '1', unit: 'tub', price: 15, isOffer: false },
      { name: 'Majonnäs', amount: '2', unit: 'dl', price: 20, isOffer: false },
    ]
  },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('recipes')
  const [expandedRecipe, setExpandedRecipe] = useState(null)
  const [checkedItems, setCheckedItems] = useState({})

  const toggleRecipe = (day) => {
    setExpandedRecipe(expandedRecipe === day ? null : day)
  }

  const toggleItem = (itemName) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const totalItems = sampleShoppingList.reduce((acc, cat) => acc + cat.items.length, 0)
  const checkedCount = Object.values(checkedItems).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Så här ser din veckomeny ut
          </h1>
          <p className="text-green-100 max-w-2xl mx-auto text-lg">
            Utforska ett exempel på en komplett veckomeny med recept och inköpslista.
            Klicka på recepten för att se alla detaljer!
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">7 dagar</p>
                <p className="text-xs text-green-200">Komplett vecka</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">847 kr</p>
                <p className="text-xs text-green-200">Total kostnad</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">4 pers</p>
                <p className="text-xs text-green-200">Per måltid</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">~30 kr</p>
                <p className="text-xs text-green-200">Per portion</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'recipes'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Veckans recept
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'shopping'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Inköpslista
            {activeTab === 'shopping' && checkedCount > 0 && (
              <span className="bg-white text-green-600 text-xs px-2 py-0.5 rounded-full">
                {checkedCount}/{totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Veckans veckomeny</h2>
              <p className="text-sm text-gray-500">Klicka på ett recept för detaljer</p>
            </div>

            <div className="space-y-4">
              {sampleMealPlan.recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.day}
                  recipe={recipe}
                  isExpanded={expandedRecipe === recipe.day}
                  onToggle={() => toggleRecipe(recipe.day)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Shopping List Tab */}
        {activeTab === 'shopping' && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Inköpslista</h2>
                <p className="text-sm text-gray-500">
                  {totalItems} varor - Klicka för att bocka av
                </p>
              </div>
              {checkedCount > 0 && (
                <button
                  onClick={() => setCheckedItems({})}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Rensa alla
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Handlingsprogress</span>
                <span className="text-sm text-gray-500">{checkedCount} av {totalItems} varor</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(checkedCount / totalItems) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleShoppingList.map((category, index) => (
                <div
                  key={index}
                  className={`rounded-xl border-2 p-5 ${category.color}`}
                >
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {category.category}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {category.items.length} varor
                    </span>
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => {
                      const isChecked = checkedItems[item.name]
                      return (
                        <li
                          key={itemIndex}
                          onClick={() => toggleItem(item.name)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-green-100 opacity-60'
                              : 'hover:bg-white/50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {item.amount} {item.unit}
                          </span>
                          {item.isOffer && (
                            <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded font-medium">
                              REA
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Total Cost */}
            <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Uppskattad totalkostnad</p>
                  <p className="text-3xl font-bold text-gray-900">847 kr</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Du sparar ca</p>
                  <p className="text-2xl font-bold text-green-600">~215 kr</p>
                  <p className="text-xs text-gray-400">jämfört med ordinarie priser</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gillar du vad du ser?
            </h2>
            <p className="text-green-100 mb-8 max-w-2xl mx-auto text-lg">
              Skapa ett gratis konto och få personliga veckomenyer baserade på just <strong>dina</strong> preferenser
              och veckans bästa erbjudanden i <strong>din</strong> stad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
              >
                Skapa konto gratis
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-green-500/30 text-white font-semibold rounded-xl hover:bg-green-500/50 transition-colors border border-white/30"
              >
                Redan medlem? Logga in
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-green-200 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Gratis att prova
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                2 veckomenyer per vecka
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ingen bindningstid
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Avsluta när du vill
              </span>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Baserat på erbjudanden från</p>
          <div className="flex justify-center gap-8 opacity-60">
            <span className="text-2xl font-bold text-red-600">ICA</span>
            <span className="text-2xl font-bold text-green-700">Coop</span>
            <span className="text-2xl font-bold text-blue-600">City Gross</span>
          </div>
        </section>
      </main>
    </div>
  )
}

// ============================================
// Recipe Card Component with Expansion
// ============================================
function RecipeCard({ recipe, isExpanded, onToggle }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
        isExpanded ? 'ring-2 ring-green-500' : 'hover:shadow-md'
      }`}
    >
      {/* Header - Always visible */}
      <div
        onClick={onToggle}
        className="p-4 md:p-6 cursor-pointer"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Day Badge */}
          <div className="flex items-center gap-4 md:gap-0">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex flex-col items-center justify-center text-white shadow-md">
              <span className="text-xs font-medium opacity-80">Dag</span>
              <span className="text-2xl font-bold">{recipe.day}</span>
            </div>

            {/* Mobile: Show name next to badge */}
            <div className="md:hidden flex-1">
              <span className="text-sm text-gray-500">{recipe.dayName}</span>
              <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
            </div>

            {/* Mobile: Expand indicator */}
            <div className="md:hidden">
              <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop: Content */}
          <div className="hidden md:block flex-grow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">{recipe.dayName}</span>
                <h3 className="text-xl font-semibold text-gray-900">{recipe.name}</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {recipe.prepTime} + {recipe.cookTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {recipe.servings} port
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{recipe.estimatedCost} kr</p>
                  <p className="text-xs text-gray-400">{recipe.costPerServing} kr/portion</p>
                </div>
                <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-1">{recipe.description}</p>
          </div>
        </div>

        {/* Mobile: Description & meta */}
        <div className="md:hidden mt-3">
          <p className="text-gray-600 text-sm">{recipe.description}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recipe.prepTime} + {recipe.cookTime}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {recipe.servings} port
              </span>
              <span className="px-2 py-0.5 bg-gray-100 rounded">{recipe.difficulty}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">{recipe.estimatedCost} kr</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 md:p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Ingredienser
                <span className="text-xs font-normal text-gray-400">({recipe.ingredients.length} st)</span>
              </h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${ing.isFromOffer ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="flex-1">{ing.name}</span>
                    <span className="text-gray-400 text-sm">
                      {ing.amount} {ing.unit}
                    </span>
                    {ing.isFromOffer && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        Erbjudande
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Gör så här
              </h4>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Tips */}
          {recipe.tips && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Tips:</strong> {recipe.tips}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

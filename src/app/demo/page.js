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
      description: 'Saftig kyckling i en krämig sås med pasta och grönsaker',
      prepTime: '15 min',
      cookTime: '25 min',
      servings: 4,
      estimatedCost: 112,
      difficulty: 'Lätt',
      ingredients: [
        { name: 'Kycklingfilé', amount: '600', unit: 'g' },
        { name: 'Pasta penne', amount: '400', unit: 'g' },
        { name: 'Grädde', amount: '2', unit: 'dl' },
        { name: 'Gul lök', amount: '1', unit: 'st' },
        { name: 'Vitlök', amount: '2', unit: 'klyftor' },
        { name: 'Spenat', amount: '100', unit: 'g' },
      ],
      instructions: [
        'Koka pastan enligt förpackningen',
        'Skär kycklingen i bitar och stek i smör',
        'Tillsätt hackad lök och vitlök',
        'Häll i grädden och låt sjuda 5 min',
        'Vänd ner spenaten och servera med pastan',
      ],
    },
    {
      day: 2,
      dayName: 'Tisdag',
      name: 'Laxfilé med potatismos',
      description: 'Ugnsbakad lax med krämigt potatismos och citron',
      prepTime: '10 min',
      cookTime: '20 min',
      servings: 4,
      estimatedCost: 145,
      difficulty: 'Lätt',
      ingredients: [
        { name: 'Laxfilé', amount: '600', unit: 'g' },
        { name: 'Potatis', amount: '800', unit: 'g' },
        { name: 'Smör', amount: '50', unit: 'g' },
        { name: 'Mjölk', amount: '1', unit: 'dl' },
        { name: 'Citron', amount: '1', unit: 'st' },
        { name: 'Dill', amount: '1', unit: 'knippe' },
      ],
      instructions: [
        'Sätt ugnen på 200°C',
        'Koka potatisen mjuk och mosa med smör och mjölk',
        'Lägg laxen på en plåt, salta och peppra',
        'Baka laxen i 15-18 min',
        'Servera med citron och dill',
      ],
    },
    {
      day: 3,
      dayName: 'Onsdag',
      name: 'Köttfärssås med spagetti',
      description: 'Klassisk italiensk köttfärssås med färska tomater',
      prepTime: '15 min',
      cookTime: '30 min',
      servings: 4,
      estimatedCost: 89,
      difficulty: 'Lätt',
      ingredients: [
        { name: 'Nötfärs', amount: '500', unit: 'g' },
        { name: 'Spagetti', amount: '400', unit: 'g' },
        { name: 'Krossade tomater', amount: '400', unit: 'g' },
        { name: 'Gul lök', amount: '1', unit: 'st' },
        { name: 'Morot', amount: '1', unit: 'st' },
        { name: 'Parmesan', amount: '50', unit: 'g' },
      ],
      instructions: [
        'Hacka lök och morot fint',
        'Stek färsen tills den fått färg',
        'Tillsätt grönsaker och tomater',
        'Låt sjuda 20 min',
        'Servera med kokt pasta och riven parmesan',
      ],
    },
    {
      day: 4,
      dayName: 'Torsdag',
      name: 'Vegetarisk curry',
      description: 'Smakrik curry med kikärtor och kokosmjölk',
      prepTime: '10 min',
      cookTime: '25 min',
      servings: 4,
      estimatedCost: 78,
      difficulty: 'Lätt',
      ingredients: [
        { name: 'Kikärtor', amount: '400', unit: 'g' },
        { name: 'Kokosmjölk', amount: '400', unit: 'ml' },
        { name: 'Curry', amount: '2', unit: 'msk' },
        { name: 'Basmatiris', amount: '300', unit: 'g' },
        { name: 'Spenat', amount: '100', unit: 'g' },
        { name: 'Tomat', amount: '2', unit: 'st' },
      ],
      instructions: [
        'Stek currypastan i olja',
        'Tillsätt kikärtor och kokosmjölk',
        'Låt sjuda 15 min',
        'Vänd ner spenat och tomat',
        'Servera med kokt ris',
      ],
    },
    {
      day: 5,
      dayName: 'Fredag',
      name: 'Fish and chips',
      description: 'Krispig torsk med pommes och hemgjord remoulad',
      prepTime: '20 min',
      cookTime: '30 min',
      servings: 4,
      estimatedCost: 125,
      difficulty: 'Medel',
      ingredients: [
        { name: 'Torskfilé', amount: '600', unit: 'g' },
        { name: 'Potatis', amount: '800', unit: 'g' },
        { name: 'Vetemjöl', amount: '1', unit: 'dl' },
        { name: 'Ägg', amount: '2', unit: 'st' },
        { name: 'Ströbröd', amount: '2', unit: 'dl' },
        { name: 'Majonnäs', amount: '2', unit: 'dl' },
      ],
      instructions: [
        'Skär potatisen i stavar och fritera eller ugnsgrädda',
        'Panera fisken i mjöl, ägg och ströbröd',
        'Stek fisken gyllene på båda sidor',
        'Blanda majonnäs med hackad gurka till remoulad',
        'Servera med citronklyftor',
      ],
    },
    {
      day: 6,
      dayName: 'Lördag',
      name: 'Tacos med nötfärs',
      description: 'Fredagsmys-klassikern med alla tillbehör',
      prepTime: '20 min',
      cookTime: '15 min',
      servings: 4,
      estimatedCost: 135,
      difficulty: 'Lätt',
      ingredients: [
        { name: 'Nötfärs', amount: '500', unit: 'g' },
        { name: 'Tacokrydda', amount: '1', unit: 'påse' },
        { name: 'Tacoskal', amount: '12', unit: 'st' },
        { name: 'Tomat', amount: '3', unit: 'st' },
        { name: 'Sallad', amount: '1', unit: 'st' },
        { name: 'Riven ost', amount: '200', unit: 'g' },
      ],
      instructions: [
        'Stek färsen och tillsätt tacokrydda',
        'Hacka tomat och strimla salladen',
        'Värm tacoskalen i ugnen',
        'Ställ fram alla tillbehör',
        'Låt alla bygga sina egna tacos',
      ],
    },
    {
      day: 7,
      dayName: 'Söndag',
      name: 'Ugnsstekt kyckling',
      description: 'Hel kyckling med rostad potatis och sky',
      prepTime: '15 min',
      cookTime: '60 min',
      servings: 4,
      estimatedCost: 163,
      difficulty: 'Medel',
      ingredients: [
        { name: 'Hel kyckling', amount: '1.5', unit: 'kg' },
        { name: 'Potatis', amount: '800', unit: 'g' },
        { name: 'Morot', amount: '4', unit: 'st' },
        { name: 'Citron', amount: '1', unit: 'st' },
        { name: 'Rosmarin', amount: '2', unit: 'kvistar' },
        { name: 'Smör', amount: '50', unit: 'g' },
      ],
      instructions: [
        'Sätt ugnen på 200°C',
        'Gnid in kycklingen med smör och kryddor',
        'Lägg citron och rosmarin i kycklingen',
        'Stek i ugnen ca 1 timme',
        'Låt vila 10 min innan servering',
      ],
    },
  ],
}

const sampleShoppingList = [
  { category: 'Kött & Fågel', items: [
    { name: 'Kycklingfilé', amount: '600', unit: 'g' },
    { name: 'Nötfärs', amount: '1000', unit: 'g' },
    { name: 'Hel kyckling', amount: '1.5', unit: 'kg' },
  ]},
  { category: 'Fisk', items: [
    { name: 'Laxfilé', amount: '600', unit: 'g' },
    { name: 'Torskfilé', amount: '600', unit: 'g' },
  ]},
  { category: 'Grönsaker', items: [
    { name: 'Potatis', amount: '2.4', unit: 'kg' },
    { name: 'Gul lök', amount: '3', unit: 'st' },
    { name: 'Morot', amount: '5', unit: 'st' },
    { name: 'Spenat', amount: '200', unit: 'g' },
    { name: 'Tomat', amount: '5', unit: 'st' },
    { name: 'Sallad', amount: '1', unit: 'st' },
  ]},
  { category: 'Mejeri', items: [
    { name: 'Grädde', amount: '2', unit: 'dl' },
    { name: 'Smör', amount: '150', unit: 'g' },
    { name: 'Mjölk', amount: '1', unit: 'dl' },
    { name: 'Ägg', amount: '2', unit: 'st' },
    { name: 'Riven ost', amount: '250', unit: 'g' },
    { name: 'Parmesan', amount: '50', unit: 'g' },
  ]},
  { category: 'Skafferi', items: [
    { name: 'Pasta penne', amount: '400', unit: 'g' },
    { name: 'Spagetti', amount: '400', unit: 'g' },
    { name: 'Basmatiris', amount: '300', unit: 'g' },
    { name: 'Krossade tomater', amount: '400', unit: 'g' },
    { name: 'Kikärtor', amount: '400', unit: 'g' },
    { name: 'Kokosmjölk', amount: '400', unit: 'ml' },
    { name: 'Tacoskal', amount: '12', unit: 'st' },
  ]},
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
            Exempelvy
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Så här ser en matplan ut
          </h1>
          <p className="text-green-100 max-w-2xl mx-auto">
            Här är ett exempel på en genererad veckomeny med recept och inköpslista.
            Skapa ett konto för att få din egen personliga matplan!
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-600">7</p>
            <p className="text-gray-600 text-sm">Dagar</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-600">847 kr</p>
            <p className="text-gray-600 text-sm">Total kostnad</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-600">4</p>
            <p className="text-gray-600 text-sm">Portioner/dag</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-green-600">30 kr</p>
            <p className="text-gray-600 text-sm">Per portion</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <TabButton active={true}>Veckans recept</TabButton>
          <TabButton active={false}>Inköpslista</TabButton>
        </div>

        {/* Meal Plan Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Veckans matplan</h2>

          <div className="space-y-6">
            {sampleMealPlan.recipes.map((recipe, index) => (
              <RecipeCard key={index} recipe={recipe} />
            ))}
          </div>
        </section>

        {/* Shopping List Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Inköpslista</h2>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleShoppingList.map((category, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CategoryIcon category={category.category} />
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-gray-700">
                        <input type="checkbox" className="rounded border-gray-300" disabled />
                        <span>{item.name}</span>
                        <span className="text-gray-400 text-sm ml-auto">
                          {item.amount} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Redo att skapa din egen matplan?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Skapa ett gratis konto och få personliga matplaner baserade på veckans
            bästa erbjudanden. Spara både tid och pengar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Skapa konto gratis
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 transition-colors"
            >
              Logga in
            </Link>
          </div>
          <p className="mt-4 text-green-200 text-sm">
            Gratis att prova - 2 matplaner per vecka - Ingen bindningstid
          </p>
        </section>
      </main>
    </div>
  )
}

function TabButton({ children, active }) {
  return (
    <button
      className={`px-4 py-3 font-medium transition-colors ${
        active
          ? 'text-green-600 border-b-2 border-green-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function RecipeCard({ recipe }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Day Badge */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex flex-col items-center justify-center">
              <span className="text-xs text-green-600 font-medium">Dag</span>
              <span className="text-2xl font-bold text-green-600">{recipe.day}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <div>
                <span className="text-sm text-gray-500">{recipe.dayName}</span>
                <h3 className="text-xl font-semibold text-gray-900">{recipe.name}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{recipe.prepTime} + {recipe.cookTime}</span>
                <span className="font-semibold text-green-600">{recipe.estimatedCost} kr</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{recipe.description}</p>

            {/* Ingredients Preview */}
            <div className="flex flex-wrap gap-2">
              {recipe.ingredients.slice(0, 5).map((ing, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  {ing.name}
                </span>
              ))}
              {recipe.ingredients.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                  +{recipe.ingredients.length - 5} till
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryIcon({ category }) {
  const icons = {
    'Kött & Fågel': '🥩',
    'Fisk': '🐟',
    'Grönsaker': '🥕',
    'Mejeri': '🧈',
    'Skafferi': '🥫',
  }
  return <span>{icons[category] || '📦'}</span>
}

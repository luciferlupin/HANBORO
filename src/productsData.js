// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Comprehensive Horological Specifications, References & High-Resolution Media
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: "ALL", label: "All Timepieces" },
  { id: "TOURBILLON", label: "Tourbillon & Complications" },
  { id: "TONNEAU", label: "Tonneau Skeleton" },
  { id: "ROULETTE", label: "Casino & Roulette" },
  { id: "OCTAGONAL", label: "Royal Octagonal" },
  { id: "DIVER_SPORT", label: "Diver & Sport Chrono" },
  { id: "CLASSIC", label: "Classic & Moonphase" }
];

export const PRODUCTS_DATA = [
  {
    id: "astroworld-celestial",
    sku: "HBR-8801-TG",
    name: "Astroworld Celestial Tourbillon",
    subtitle: "High-Frequency Co-Axial Flying Tourbillon & Orbital Sphere",
    collection: "TOURBILLON",
    collectionName: "Tourbillon & Complications",
    tag: "Flagship Complication",
    image: "/watch-astroworld-celestial.png",
    altImages: [
      "/watch-astroworld-celestial.png",
      "/hanboro-celestial-watch.png",
      "/hanboro-hero-watch.png"
    ],
    price: "₹1,48,000",
    priceUsd: "$1,780",
    availability: "Limited Allocation",
    year: "2026",
    summary: "The pinnacle of modern avant-garde horology. Engineered with an open-worked architecture that suspends a high-precision 60-second flying tourbillon cage alongside a 24-hour rotating astronomical sphere.",
    specs: {
      movement: "Caliber H-9001 In-House Manual Wind Flying Tourbillon",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "72 Hours (Twin-barrel system)",
      jewels: "33 Synthetic Rubies",
      caseMaterial: "316L Surgical Stainless Steel with Rose Gold PVD & Brushed Chamfers",
      caseDimensions: "44.0 mm × 14.2 mm",
      lugToLug: "51.5 mm",
      glass: "Double-Domed Anti-Reflective Sapphire Crystal (Scratch Resistant 9 Mohs)",
      caseback: "Full Exhibition Sapphire Crystal Caseback with Laser Serialization",
      dial: "Multi-layered Skeletonized Dial with Micro-Brushed Bridges & Cotes de Geneve",
      waterResistance: "50 Meters (5 ATM / 165 Feet)",
      strap: "High-Performance Vulcanized Fluororubber with Rose Gold Deployant Buckle",
      clasp: "Double-Security Push-Button Deployant Clasp",
      complications: ["60-Second Flying Tourbillon", "3D Rotating Celestial Sphere", "Skeletonized Gear Train", "Anti-Shock Incabloc System"],
      packaging: "Piano-black Lacquered Wooden Vault with Domed Viewing Port & Collector Passport"
    }
  },
  {
    id: "world-globe",
    sku: "HBR-8802-WG",
    name: "World Globe Tourbillon GMT",
    subtitle: "Hemispherical 24H Celestial Earth Sphere with Dual-Time Tracking",
    collection: "TOURBILLON",
    collectionName: "Tourbillon & Complications",
    tag: "Dual-Time Horizon",
    image: "/watch-world-globe.png",
    altImages: [
      "/watch-world-globe.png",
      "/hanboro-celestial-watch.png"
    ],
    price: "₹1,32,000",
    priceUsd: "$1,590",
    availability: "In Stock",
    year: "2026",
    summary: "Designed for the global navigator. A three-dimensional micro-carved northern hemisphere globe revolves continuously over a 24-hour cycle, synced with an openworked skeletonized balance assembly.",
    specs: {
      movement: "Caliber H-8820 Co-Axial Dual-Time Automatic Movement",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "60 Hours",
      jewels: "29 Synthetic Rubies",
      caseMaterial: "Midnight DLC-Coated 316L Stainless Steel with High-Polish Bezel",
      caseDimensions: "43.5 mm × 13.8 mm",
      lugToLug: "50.0 mm",
      glass: "Ultra-Clear Scratch-Proof Sapphire Crystal with Dual AR Coating",
      caseback: "Screw-Down Exhibition Sapphire Back with Laser-Etched Globe Motif",
      dial: "Deep Space Anthracite with 3D Relief World Continents & Luminous Meridian Marks",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Handcrafted Italian Matte Black Leather with Contrast Signal Red Stitching",
      clasp: "Solid Steel Butterfly Deployant Clasp",
      complications: ["360° 24-Hour Rotating Globe", "Independent GMT Dual-Time Zone", "Openwork Balance Bridge"],
      packaging: "Collector's Lacquer Vault with NFC Authenticity Card"
    }
  },
  {
    id: "emerald-roulette",
    sku: "HBR-7704-EM",
    name: "Clover King Emerald Roulette",
    subtitle: "Free-Spinning Kinetic Roulette Wheel with Lucky Clover Axis",
    collection: "ROULETTE",
    collectionName: "Casino & Roulette",
    tag: "Mechanical Casino Action",
    image: "/watch-emerald-roulette.png",
    altImages: [
      "/watch-emerald-roulette.png",
      "/watch-carousel-roulette.png"
    ],
    price: "₹88,000",
    priceUsd: "$1,060",
    availability: "In Stock",
    year: "2026",
    summary: "An iconic conversation piece combining Swiss tonneau elegance with dynamic kinetic entertainment. Natural wrist motion spins an internal 37-pocket roulette ring with an ultra-smooth micro-ball bearing track.",
    specs: {
      movement: "Caliber H-7700 Free-Spinning Ball-Bearing Roulette Automatic",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "48 Hours",
      jewels: "25 Synthetic Rubies & Micro Ceramic Ball Bearings",
      caseMaterial: "Ergonomic Curved Rose Gold Ion-Plated 316L Stainless Steel",
      caseDimensions: "44.0 mm × 52.0 mm Tonneau × 14.0 mm",
      lugToLug: "52.0 mm",
      glass: "Curved 3D Tonneau Sapphire Crystal with Interior Anti-Reflective Layer",
      caseback: "Solid Steel Exhibition Caseback with Roulette Wheel Engraving",
      dial: "Emerald Green Sunburst Center with Enamel Red & Black Numbered Pockets",
      waterResistance: "50 Meters (5 ATM)",
      strap: "British Racing Emerald Green Vulcanized Silicone Strap",
      clasp: "Engraved Tang Buckle with Clover Emblem",
      complications: ["Kinetic Dynamic Roulette Spinner", "4-Leaf Clover Center Axis", "Quick-Set Date Indicator"],
      packaging: "Lacquered Presentation Box with Dice & Velvet Pouch"
    }
  },
  {
    id: "blue-roulette",
    sku: "HBR-7705-BL",
    name: "Sapphire Blue Casino Roulette",
    subtitle: "Dynamic Kinetic Roulette Mechanism in Royal Cobalt Blue",
    collection: "ROULETTE",
    collectionName: "Casino & Roulette",
    tag: "Mechanical Casino Action",
    image: "/watch-blue-roulette.png",
    altImages: [
      "/watch-blue-roulette.png",
      "/watch-carousel-roulette.png"
    ],
    price: "₹88,000",
    priceUsd: "$1,060",
    availability: "In Stock",
    year: "2026",
    summary: "High-octane casino mechanics wrapped in sleek brushed stainless steel and intense royal cobalt blue. Features the patented ultra-low friction ceramic ball bearing roulette wheel.",
    specs: {
      movement: "Caliber H-7700 Free-Spinning Ball-Bearing Roulette Automatic",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "48 Hours",
      jewels: "25 Jewels",
      caseMaterial: "Satin-Brushed & Mirror-Polished 316L Surgical Steel",
      caseDimensions: "44.0 mm × 52.0 mm Tonneau × 14.0 mm",
      lugToLug: "52.0 mm",
      glass: "Curved Tonneau Anti-Scratch Sapphire Crystal",
      caseback: "Exhibition Glass with Weighted Rotor",
      dial: "Cobalt Blue Sunray Dial with 0-36 European Roulette Layout",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Integrated Royal Blue Ergonomic Fluororubber",
      clasp: "Brushed Stainless Steel Deployant Buckle",
      complications: ["Kinetic Roulette Action", "Exposed Balance Wheel", "Luminous Baton Hands"],
      packaging: "Luxury Vault Presentation Case"
    }
  },
  {
    id: "arctic-tonneau",
    sku: "HBR-6601-AR",
    name: "Arctic Tonneau Skeleton Pure White",
    subtitle: "Ultra-Lightweight Curved Tonneau with Openwork Architectural Caliber",
    collection: "TONNEAU",
    collectionName: "Tonneau Skeleton",
    tag: "Avant-Garde Ergonomics",
    image: "/watch-arctic-tonneau-white.png",
    altImages: [
      "/watch-arctic-tonneau-white.png",
      "/clover-king-day.png"
    ],
    price: "₹76,000",
    priceUsd: "$915",
    availability: "In Stock",
    year: "2026",
    summary: "A pure aesthetic triumph. The Arctic Tonneau combines a curved ergonomic white ceramic-composite bezel with a fully skeletonized automatic movement, offering complete optical transparency.",
    specs: {
      movement: "Caliber H-6600 Twin-Barrel Openworked Skeleton Automatic",
      frequency: "21,600 VPH (3.0 Hz)",
      powerReserve: "52 Hours",
      jewels: "24 Jewels",
      caseMaterial: "Curved Ceramic Composite Outer Frame with Grade 2 Titanium Core",
      caseDimensions: "43.0 mm × 50.0 mm Tonneau × 13.5 mm",
      lugToLug: "50.0 mm",
      glass: "Scratch-Resistant Curved Sapphire Crystal with Dual AR Coating",
      caseback: "Transparent Sapphire Caseback with Skeleton Rotor",
      dial: "Openworked Architectural Caliber with Satin-Finished Bridges & Red Accents",
      waterResistance: "50 Meters (5 ATM)",
      strap: "High-Density Arctic White Anti-Dust Fluororubber",
      clasp: "Titanium Deployant Clasp",
      complications: ["Complete Skeletonized Transparency", "Super-LumiNova BGW9 White-Blue Glow", "Curved Ergonomic Case"],
      packaging: "Minimalist Hard-Shell Travel Vault"
    }
  },
  {
    id: "clover-king-crimson",
    sku: "HBR-7701-CK",
    name: "Clover King Crimson Tonneau",
    subtitle: "Dual-Chroma Day/Night Super-LumiNova Skeleton with Signal Red Chassis",
    collection: "TONNEAU",
    collectionName: "Tonneau Skeleton",
    tag: "Dual-Chroma Glow",
    image: "/clover-king-day.png",
    nightImage: "/clover-king-night-glow.png",
    hasNightMode: true,
    altImages: [
      "/clover-king-day.png",
      "/clover-king-night-glow.png",
      "/clover-king-night.png",
      "/red-tonneau-day.png"
    ],
    price: "₹82,000",
    priceUsd: "$990",
    availability: "In Stock",
    year: "2026",
    summary: "The definitive hero timepiece of the Hanboro catalog. Features an audacious signal-red tonneau profile that undergoes a dramatic metamorphosis when darkness falls, igniting vibrant bioluminescent phosphor dial tracks.",
    specs: {
      movement: "Caliber H-7720 Open-Work Automatic with Dual-Time Indicator",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "45 Hours",
      jewels: "26 Jewels",
      caseMaterial: "Anodized Signal Red Aluminum & DLC Carbon-Forged Hybrid Structure",
      caseDimensions: "43.0 mm × 51.0 mm × 13.8 mm",
      lugToLug: "51.0 mm",
      glass: "Curved 3D Sapphire Crystal",
      caseback: "Exhibition Mineral Crystal with Customized Red Rotor",
      dial: "Day-to-Night Multi-Chroma Luminous Skeleton with Lucky Four-Leaf Hub",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Dual-Tone Signal Red & Carbon Black Textured Rubber Strap",
      clasp: "Black DLC Tang Buckle",
      complications: ["Day/Night Dual-Luminescence Metamorphosis", "Exposed Balance Spring", "Skeletonized Hour Ring"],
      packaging: "Collector's Vault Presentation Box with UV Lume Torch"
    }
  },
  {
    id: "imperial-dragon",
    sku: "HBR-9908-ID",
    name: "Imperial Dragon Tonneau Skeleton",
    subtitle: "Hand-Chiseled 3D Imperial Gold Dragon Entwined Around Movement Bridges",
    collection: "TONNEAU",
    collectionName: "Tonneau Skeleton",
    tag: "Haute Métiers d'Art",
    image: "/watch-carousel-dragon.png",
    altImages: [
      "/watch-carousel-dragon.png"
    ],
    price: "₹1,25,000",
    priceUsd: "$1,500",
    availability: "Collector Piece",
    year: "2026",
    summary: "A tour-de-force of artistic engraving and sculptural horology. A three-dimensional Imperial Dragon in micro-sculpted gold entwines gracefully across the openworked escapement and barrel bridges.",
    specs: {
      movement: "Caliber H-9900 Hand-Finished Sculpted Skeleton Automatic",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "50 Hours",
      jewels: "28 Jewels with Synthetic Ruby Dragon Eyes",
      caseMaterial: "Forged Carbon Composite with DLC Titanium Skeleton Core",
      caseDimensions: "44.0 mm × 53.0 mm × 14.5 mm",
      lugToLug: "53.0 mm",
      glass: "Anti-Reflective Arched Sapphire Crystal",
      caseback: "Exhibition Sapphire Caseback with Dragon Crest Seal",
      dial: "Hand-Carved 3D Dragon Relief in 18K Gold Finish with Flame Accents",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Sculpted Matte Black Vulcanized Rubber with Dragon Scale Micro-Texture",
      clasp: "DLC Black Titanium Deployant Clasp",
      complications: ["3D Sculpted Dragon Horological Art", "Ruby Gem-Set Dial Accents", "Exposed High-Beat Balance"],
      packaging: "Custom Handcrafted Wood Presentation Shrine"
    }
  },
  {
    id: "octagonal-blue",
    sku: "HBR-4401-RO",
    name: "Rose Gold Octagonal Blue Guilloché",
    subtitle: "Integrated Luxury Sports Watch with Deep Clous de Paris Tapisserie Dial",
    collection: "OCTAGONAL",
    collectionName: "Royal Octagonal",
    tag: "Integrated Luxury Sport",
    image: "/watch-rosegold-octagonal-blue.png",
    altImages: [
      "/watch-rosegold-octagonal-blue.png",
      "/watch-carousel-octagonal.png"
    ],
    price: "₹68,000",
    priceUsd: "$820",
    availability: "In Stock",
    year: "2026",
    summary: "The definitive integrated sports silhouette. An octagonal satin-brushed bezel punctuated by 8 polished hexagonal screws meets a deeply textured cobalt blue guilloché dial and integrated ergonomic strap.",
    specs: {
      movement: "Caliber H-4400 Ultra-Slim Self-Winding Movement",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "44 Hours",
      jewels: "24 Jewels",
      caseMaterial: "Rose Gold PVD 316L Solid Stainless Steel with Vertical Satin Brushing",
      caseDimensions: "41.0 mm × 11.2 mm Ultra-Slim",
      lugToLug: "48.0 mm",
      glass: "Flat Anti-Reflective Sapphire Crystal",
      caseback: "Screw-Down Exhibition Sapphire Back with Rose Gold Rotor",
      dial: "Deep Imperial Cobalt Blue 'Clous de Paris' Tapisserie Guilloché",
      waterResistance: "100 Meters (10 ATM / 330 Feet)",
      strap: "Integrated Textured Rubber Strap with Rose Gold Quick-Release Pins",
      clasp: "Rose Gold Butterfly Deployant Buckle",
      complications: ["Instant-Jump Date at 3 o'clock", "Luminous Rose Gold Baton Hands", "100m Water Resistance"],
      packaging: "Handcrafted Suede Watch Roll & Presentation Box"
    }
  },
  {
    id: "octagonal-skeleton-steel",
    sku: "HBR-4405-SS",
    name: "Royal Octagonal Skeleton Steel",
    subtitle: "Architectural Openwork Bridge Geometry in Satin-Brushed 316L Steel",
    collection: "OCTAGONAL",
    collectionName: "Royal Octagonal",
    tag: "Architectural Openwork",
    image: "/watch-carousel-octagonal.png",
    altImages: [
      "/watch-carousel-octagonal.png",
      "/watch-rosegold-octagonal-blue.png"
    ],
    price: "₹72,000",
    priceUsd: "$865",
    availability: "In Stock",
    year: "2026",
    summary: "Monochrome industrial perfection. Features an all-steel octagonal architecture housing a high-precision anthracite openworked movement with diamond-cut chamfers and symmetrical balance alignment.",
    specs: {
      movement: "Caliber H-4450 Symmetrical Openworked In-House Automatic",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "48 Hours",
      jewels: "26 Jewels",
      caseMaterial: "Grade 316L Solid Stainless Steel with Hand-Polished Bevels",
      caseDimensions: "41.0 mm × 11.5 mm",
      lugToLug: "48.0 mm",
      glass: "Scratch-Proof Flat Sapphire Crystal",
      caseback: "Exhibition Sapphire Crystal Back",
      dial: "Anthracite NAC-Coated Skeleton Caliber with High-Contrast White Hands",
      waterResistance: "100 Meters (10 ATM)",
      strap: "Solid 316L Steel Integrated Link Bracelet + Quick-Swap Black Rubber",
      clasp: "Double Push-Button Milled Safety Clasp",
      complications: ["Full Openwork Movement", "Screw-Down Crown", "10 ATM Water Resistance"],
      packaging: "Steel Presentation Case with Strap-Changing Tool"
    }
  },
  {
    id: "orbital-moonphase",
    sku: "HBR-5502-MO",
    name: "Silver Moonphase Orbital Automatic",
    subtitle: "Astronomical 29.5-Day Precision Lunar Complication with Star-Dust Sunburst Dial",
    collection: "CLASSIC",
    collectionName: "Classic & Moonphase",
    tag: "Astronomical Lunar",
    image: "/watch-orbital-moonphase.png",
    altImages: [
      "/watch-orbital-moonphase.png"
    ],
    price: "₹62,000",
    priceUsd: "$745",
    availability: "In Stock",
    year: "2026",
    summary: "Poetry on the wrist. A stepped polished steel case cradles a shimmering star-dust silver sunburst dial, featuring a vivid midnight blue lunar disc tracking the 29.5-day astronomical moon cycle.",
    specs: {
      movement: "Caliber H-5500 Orbital Moonphase Automatic Movement",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "42 Hours",
      jewels: "25 Jewels",
      caseMaterial: "Mirror-Polished 316L Stainless Steel with Stepped Bezel",
      caseDimensions: "42.0 mm × 12.0 mm",
      lugToLug: "49.0 mm",
      glass: "Domed Anti-Reflective Sapphire Crystal",
      caseback: "Exhibition Sapphire Crystal Back with Constellation Engraving",
      dial: "Silver Sunburst Dial with Blued Steel Hands & Gold Star-Dust Accents",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Genuine Black Alligator-Embossed Calfskin Leather Strap",
      clasp: "Engraved Steel Tang Buckle",
      complications: ["Astronomical 29.5-Day Moonphase Disc", "Pointer Date Indicator", "Thermally Blued Steel Hands"],
      packaging: "Heritage Leather Watch Box"
    }
  },
  {
    id: "purple-chrono",
    sku: "HBR-3302-PU",
    name: "Purple Sunray Chronograph Diver",
    subtitle: "High-Contrast Precision Column-Wheel Diver with Radiant Purple Sunburst Dial",
    collection: "DIVER_SPORT",
    collectionName: "Diver & Sport Chrono",
    tag: "Sport Chronograph",
    image: "/watch-purple-chronograph.png",
    altImages: [
      "/watch-purple-chronograph.png",
      "/watch-green-diver.png"
    ],
    price: "₹58,000",
    priceUsd: "$700",
    availability: "In Stock",
    year: "2026",
    summary: "Bold, expressive, and engineered for high-performance timing. Features a radiant imperial purple sunray dial paired with a 120-click rotating bezel and high-beat precision chronograph subdials.",
    specs: {
      movement: "Caliber H-3300 Precision Sweep Chronograph Caliber",
      frequency: "High-Beat Smooth Sweep (32,768 Hz / Precision Column-Wheel Action)",
      powerReserve: "Long-life Energy Cell (3-Year Continuous Sweep)",
      jewels: "Multi-Jeweled Precision Chrono Module",
      caseMaterial: "Heavy-Duty 316L Marine Stainless Steel with Crown Protectors",
      caseDimensions: "43.0 mm × 12.8 mm",
      lugToLug: "50.5 mm",
      glass: "Flat Sapphire Crystal with Anti-Scratch Coating",
      caseback: "Screw-Down Steel Caseback with Embossed Diver Logo",
      dial: "Vibrant Purple Sunray Finish with High-Lume Tri-Compax Subdials",
      waterResistance: "100 Meters (10 ATM / 330 Feet)",
      strap: "Flexible Purple Silicone Strap with Steel Keeper Ring",
      clasp: "Heavy-Duty Brushed Steel Buckle",
      complications: ["1/10th Second Split Chronograph", "60-Minute Counter", "120-Click Unidirectional Bezel", "Screw-Down Pushers"],
      packaging: "Waterproof Pelican-Style Dive Box"
    }
  },
  {
    id: "green-diver",
    sku: "HBR-3305-GD",
    name: "Emerald Green Submariner Diver 200M",
    subtitle: "Professional 200M ISO Aquatic Timepiece with Ceramic Unidirectional Bezel",
    collection: "DIVER_SPORT",
    collectionName: "Diver & Sport Chrono",
    tag: "200M Professional Diver",
    image: "/watch-green-diver.png",
    altImages: [
      "/watch-green-diver.png",
      "/watch-purple-chronograph.png"
    ],
    price: "₹64,000",
    priceUsd: "$770",
    availability: "In Stock",
    year: "2026",
    summary: "Built to conquer the depths. Boasts a certified 200-meter depth rating, a scratch-proof 120-click emerald green ceramic bezel, a magnified Cyclops date window, and a solid 3-link Oyster steel bracelet.",
    specs: {
      movement: "Caliber H-3350 High-Torque Automatic Diver Caliber",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "42 Hours",
      jewels: "24 Jewels",
      caseMaterial: "Marine-Grade 316L Stainless Steel with Screw-Down Crown & O-Ring Gaskets",
      caseDimensions: "42.0 mm × 13.0 mm",
      lugToLug: "49.5 mm",
      glass: "Sapphire Crystal with 2.5x Cyclops Date Magnifier",
      caseback: "Solid Screw-Down Stainless Steel Deep-Dive Caseback",
      dial: "Deep Emerald Green Sunburst with Oversized Super-LumiNova Maxi Indices",
      waterResistance: "200 Meters (20 ATM / 660 Feet)",
      strap: "Solid 316L Brushed Steel Oyster Link Bracelet with Extension Glidelock",
      clasp: "Double-Locking Security Fold-Over Clasp",
      complications: ["200M Water Resistance Rating", "120-Click Emerald Ceramic Bezel", "Screw-Down Locking Crown", "Cyclops Date Window"],
      packaging: "Airtight Waterproof Dive Vault with Extra Green Rubber Strap"
    }
  },
  {
    id: "powerreserve-black",
    sku: "HBR-2201-PR",
    name: "Power Reserve 35h Automatic Midnight",
    subtitle: "Minimalist Mechanical Gauge with Stealth Matte Black DLC & Linear Indicator",
    collection: "CLASSIC",
    collectionName: "Classic & Moonphase",
    tag: "Minimalist Mechanical",
    image: "/watch-powerreserve-black.png",
    altImages: [
      "/watch-powerreserve-black.png"
    ],
    price: "₹52,000",
    priceUsd: "$625",
    availability: "In Stock",
    year: "2026",
    summary: "An exercise in pure horological minimalism. Stripped of all non-essentials, highlighting an architectural 35-hour energy indicator gauge at 12 o'clock and an offset running seconds subdial.",
    specs: {
      movement: "Caliber H-2200 In-House Automatic with Top-Mounted Power Gauge",
      frequency: "21,600 VPH (3.0 Hz)",
      powerReserve: "35 Hours",
      jewels: "22 Jewels",
      caseMaterial: "316L Stainless Steel with Matte Stealth DLC Coating",
      caseDimensions: "42.0 mm × 11.8 mm",
      lugToLug: "48.5 mm",
      glass: "Flat Sapphire Crystal with Anti-Glare Treatment",
      caseback: "Smoked Mineral Exhibition Crystal Caseback",
      dial: "Matte Pitch Black with Minimalist Silver Indices & Red Gauge Needle",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Matte Black Ribbed Fluororubber Strap",
      clasp: "Black DLC Steel Pin Buckle",
      complications: ["Linear 35-Hour Power Reserve Gauge", "Small Seconds Subdial at 6 o'clock", "Minimalist Monochromatic Architecture"],
      packaging: "Modern Minimal Matte Black Box"
    }
  },
  {
    id: "turquoise-ringbell",
    sku: "HBR-1108-TB",
    name: "Turquoise Open-Heart Ring The Bell",
    subtitle: "Vibrant Tiffany Turquoise Dial with Visible Pulsing 9 O'Clock Balance Wheel",
    collection: "CLASSIC",
    collectionName: "Classic & Moonphase",
    tag: "Vibrant Open-Heart",
    image: "/watch-turquoise-ringbell.png",
    altImages: [
      "/watch-turquoise-ringbell.png"
    ],
    price: "₹48,000",
    priceUsd: "$580",
    availability: "In Stock",
    year: "2026",
    summary: "Youthful vibrancy meets mechanical heartbeat. The sunray Tiffany turquoise dial features an open aperture exposing the rapid oscillations of the ruby-jeweled balance wheel and hairspring.",
    specs: {
      movement: "Caliber H-1100 Open-Heart Automatic Movement",
      frequency: "21,600 VPH (3.0 Hz)",
      powerReserve: "40 Hours",
      jewels: "21 Jewels",
      caseMaterial: "High-Polish 316L Stainless Steel with Fluted Crown",
      caseDimensions: "41.0 mm × 11.5 mm",
      lugToLug: "47.5 mm",
      glass: "Scratch-Resistant Sapphire Crystal",
      caseback: "Transparent Exhibition Caseback",
      dial: "Radiant Turquoise Enamel with 9 o'clock Open-Heart Balance Window",
      waterResistance: "50 Meters (5 ATM)",
      strap: "Genuine Turquoise Stitched Leather Strap + Milanese Steel Mesh Included",
      clasp: "Push-Button Deployant Clasp",
      complications: ["Visible Pulsing Heartbeat Aperture", "Radial Silver Minute Ring", "Quick-Swap Strap Mechanism"],
      packaging: "Tiffany Turquoise Gift Presentation Box"
    }
  }
];

// Quick Helper: Find Product by ID or SKU
export function getProductByIdOrSku(identifier) {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  return (
    PRODUCTS_DATA.find((p) => p.id.toLowerCase() === clean || p.sku.toLowerCase() === clean) ||
    null
  );
}

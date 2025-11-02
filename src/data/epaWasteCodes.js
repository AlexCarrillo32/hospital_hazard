/**
 * Comprehensive EPA Hazardous Waste Codes Database
 * Based on RCRA (Resource Conservation and Recovery Act)
 *
 * Categories:
 * - D-codes: Characteristic wastes (ignitability, corrosivity, reactivity, toxicity)
 * - F-codes: Wastes from common manufacturing and industrial processes
 * - K-codes: Wastes from specific industries
 * - P-codes: Acutely hazardous commercial chemical products
 * - U-codes: Toxic commercial chemical products
 */

export const EPA_WASTE_CODES = {
  // ==================== D-CODES: CHARACTERISTIC WASTES ====================

  // D001-D003: Physical/Chemical Characteristics
  D001: {
    code: 'D001',
    category: 'ignitable',
    type: 'characteristic',
    description: 'Ignitable waste (flash point < 140°F or 60°C)',
    hazardClass: 'Flammable',
    examples: [
      'Waste solvents (acetone, toluene, xylene)',
      'Waste oils and petroleum distillates',
      'Alcohol-based wastes',
      'Paint thinners and strippers',
    ],
    disposal: 'Incineration or fuel blending',
    handlingPrecautions: 'Keep away from heat, sparks, and open flames',
  },
  D002: {
    code: 'D002',
    category: 'corrosive',
    type: 'characteristic',
    description: 'Corrosive waste (pH ≤ 2 or pH ≥ 12.5)',
    hazardClass: 'Corrosive',
    examples: [
      'Waste acids (sulfuric, hydrochloric, nitric)',
      'Waste bases (sodium hydroxide, potassium hydroxide)',
      'Battery acid',
      'Rust removers',
    ],
    disposal: 'Neutralization followed by treatment',
    handlingPrecautions: 'Use acid-resistant containers, avoid skin contact',
  },
  D003: {
    code: 'D003',
    category: 'reactive',
    type: 'characteristic',
    description: 'Reactive waste (unstable, explosive, or water-reactive)',
    hazardClass: 'Reactive',
    examples: [
      'Waste oxidizers (peroxides, permanganates)',
      'Waste cyanides and sulfides',
      'Explosive manufacturing wastes',
      'Waste picric acid',
    ],
    disposal: 'Stabilization or controlled detonation',
    handlingPrecautions: 'Isolate from incompatible materials, keep cool and dry',
  },

  // D004-D043: Toxic Metals and Organics
  D004: {
    code: 'D004',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for arsenic (TCLP ≥ 5.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Wood preservatives', 'Pesticides', 'Glass manufacturing waste'],
    disposal: 'Stabilization/solidification or vitrification',
    handlingPrecautions: 'Avoid dust generation, use respiratory protection',
  },
  D005: {
    code: 'D005',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for barium (TCLP ≥ 100.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Pigments', 'Drilling muds', 'Spark plug wastes'],
    disposal: 'Stabilization/solidification',
    handlingPrecautions: 'Prevent environmental release',
  },
  D006: {
    code: 'D006',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for cadmium (TCLP ≥ 1.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Battery manufacturing', 'Electroplating wastes', 'Paint pigments'],
    disposal: 'Metal recovery or stabilization',
    handlingPrecautions: 'Carcinogen - use full PPE',
  },
  D007: {
    code: 'D007',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for chromium (TCLP ≥ 5.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Leather tanning', 'Electroplating', 'Wood preservatives'],
    disposal: 'Reduction to Cr(III) then stabilization',
    handlingPrecautions: 'Avoid hexavalent chromium exposure',
  },
  D008: {
    code: 'D008',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for lead (TCLP ≥ 5.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Lead-acid batteries', 'Paint waste', 'Ammunition manufacturing'],
    disposal: 'Metal recovery or stabilization',
    handlingPrecautions: 'Neurotoxin - prevent ingestion and inhalation',
  },
  D009: {
    code: 'D009',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for mercury (TCLP ≥ 0.2 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Fluorescent lamps', 'Thermometers', 'Dental amalgam'],
    disposal: 'Retorting or stabilization',
    handlingPrecautions: 'Highly toxic - use mercury spill kits',
  },
  D010: {
    code: 'D010',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for selenium (TCLP ≥ 1.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Electronics manufacturing', 'Glass production', 'Photocopier drums'],
    disposal: 'Stabilization/solidification',
    handlingPrecautions: 'Avoid dust inhalation',
  },
  D011: {
    code: 'D011',
    category: 'toxic',
    type: 'characteristic',
    description: 'Toxic for silver (TCLP ≥ 5.0 mg/L)',
    hazardClass: 'Toxic Metal',
    examples: ['Photographic processing', 'X-ray film', 'Electronics'],
    disposal: 'Silver recovery or stabilization',
    handlingPrecautions: 'Recoverable precious metal',
  },

  // ==================== F-CODES: PROCESS WASTES ====================

  // F001-F005: Spent Halogenated Solvents
  F001: {
    code: 'F001',
    category: 'solvent',
    type: 'listed',
    description: 'Spent halogenated solvents used in degreasing',
    hazardClass: 'Toxic',
    examples: [
      'Tetrachloroethylene (perchloroethylene)',
      'Trichloroethylene',
      'Methylene chloride',
      '1,1,1-Trichloroethane',
      'Carbon tetrachloride',
      'Chlorinated fluorocarbons',
    ],
    disposal: 'Incineration or solvent recovery',
    handlingPrecautions: 'Carcinogenic - use in ventilated area',
  },
  F002: {
    code: 'F002',
    category: 'solvent',
    type: 'listed',
    description: 'Spent halogenated solvents',
    hazardClass: 'Toxic',
    examples: [
      'Tetrachloroethylene',
      'Methylene chloride',
      'Trichloroethylene',
      '1,1,1-Trichloroethane',
      'Chlorobenzene',
    ],
    disposal: 'Incineration or solvent recovery',
    handlingPrecautions: 'Avoid skin contact and inhalation',
  },
  F003: {
    code: 'F003',
    category: 'solvent',
    type: 'listed',
    description: 'Spent non-halogenated solvents',
    hazardClass: 'Toxic/Ignitable',
    examples: [
      'Xylene',
      'Acetone',
      'Ethyl acetate',
      'Ethyl benzene',
      'Ethyl ether',
      'Methyl isobutyl ketone',
      'n-Butyl alcohol',
    ],
    disposal: 'Fuel blending or incineration',
    handlingPrecautions: 'Flammable - keep away from ignition sources',
  },
  F004: {
    code: 'F004',
    category: 'solvent',
    type: 'listed',
    description: 'Spent non-halogenated solvents',
    hazardClass: 'Toxic',
    examples: ['Cresols', 'Cresylic acid', 'Nitrobenzene'],
    disposal: 'Incineration',
    handlingPrecautions: 'Toxic - use appropriate PPE',
  },
  F005: {
    code: 'F005',
    category: 'solvent',
    type: 'listed',
    description: 'Spent non-halogenated solvents',
    hazardClass: 'Toxic/Ignitable',
    examples: [
      'Toluene',
      'Methyl ethyl ketone',
      'Carbon disulfide',
      '2-Ethoxyethanol',
      '2-Nitropropane',
    ],
    disposal: 'Fuel blending or incineration',
    handlingPrecautions: 'Flammable and toxic',
  },

  // F006-F019: Electroplating and Metal Finishing Wastes
  F006: {
    code: 'F006',
    category: 'metal-finishing',
    type: 'listed',
    description: 'Wastewater treatment sludges from electroplating',
    hazardClass: 'Toxic',
    examples: ['Chromium electroplating sludge', 'Cadmium plating sludge'],
    disposal: 'Stabilization or metal recovery',
    handlingPrecautions: 'Heavy metal content - prevent dust',
  },
  F007: {
    code: 'F007',
    category: 'metal-finishing',
    type: 'listed',
    description: 'Spent cyanide plating bath solutions',
    hazardClass: 'Toxic/Reactive',
    examples: ['Cyanide electroplating baths', 'Cyanide stripping solutions'],
    disposal: 'Alkaline chlorination followed by treatment',
    handlingPrecautions: 'Deadly poison - never mix with acids',
  },
  F008: {
    code: 'F008',
    category: 'metal-finishing',
    type: 'listed',
    description: 'Plating bath residues from cyanide plating',
    hazardClass: 'Toxic/Reactive',
    examples: ['Cyanide plating sludges'],
    disposal: 'Oxidation followed by stabilization',
    handlingPrecautions: 'Cyanide hazard - handle with extreme care',
  },
  F009: {
    code: 'F009',
    category: 'metal-finishing',
    type: 'listed',
    description: 'Spent stripping and cleaning bath solutions',
    hazardClass: 'Toxic',
    examples: ['Cyanide stripping baths', 'Metal cleaning solutions'],
    disposal: 'Chemical treatment and stabilization',
    handlingPrecautions: 'Multiple hazards - consult SDS',
  },

  // F020-F026: Dioxin-Containing Wastes
  F020: {
    code: 'F020',
    category: 'dioxin',
    type: 'listed',
    description: 'Wastes from production of chlorinated aliphatic hydrocarbons',
    hazardClass: 'Highly Toxic',
    examples: ['Hexachlorobenzene manufacturing waste', 'Pentachlorophenol waste'],
    disposal: 'High-temperature incineration only',
    handlingPrecautions: 'Extremely hazardous - specialized handling required',
  },
  F021: {
    code: 'F021',
    category: 'dioxin',
    type: 'listed',
    description: 'Wastes from production of pentachlorophenol',
    hazardClass: 'Highly Toxic',
    examples: ['PCP manufacturing residues'],
    disposal: 'High-temperature incineration',
    handlingPrecautions: 'Dioxin contamination likely',
  },

  // F027-F039: Pharmaceutical and Chemical Manufacturing
  F027: {
    code: 'F027',
    category: 'pharmaceutical',
    type: 'listed',
    description: 'Discarded unused formulations containing tri-, tetra-, or pentachlorophenol',
    hazardClass: 'Toxic',
    examples: ['Unused wood preservatives', 'Expired pesticide formulations'],
    disposal: 'Incineration',
    handlingPrecautions: 'Avoid skin contact',
  },

  // ==================== K-CODES: INDUSTRY-SPECIFIC WASTES ====================

  // K001-K008: Wood Preservation
  K001: {
    code: 'K001',
    category: 'wood-preservation',
    type: 'listed',
    description: 'Bottom sediment sludge from wood preserving processes',
    hazardClass: 'Toxic',
    examples: ['Creosote sludges', 'Pentachlorophenol residues'],
    disposal: 'Thermal treatment or stabilization',
    handlingPrecautions: 'PAH and dioxin contamination',
  },

  // K013-K022: Organic Chemical Manufacturing
  K013: {
    code: 'K013',
    category: 'organic-chemical',
    type: 'listed',
    description: 'Crude still bottoms from benzene production',
    hazardClass: 'Toxic/Ignitable',
    examples: ['Benzene distillation residues'],
    disposal: 'Incineration or fuel blending',
    handlingPrecautions: 'Carcinogenic benzene content',
  },

  // K048-K052: Petroleum Refining
  K048: {
    code: 'K048',
    category: 'petroleum',
    type: 'listed',
    description: 'Dissolved air flotation (DAF) float from petroleum refining',
    hazardClass: 'Toxic/Ignitable',
    examples: ['Refinery DAF skimmings', 'Oil-water separator sludges'],
    disposal: 'Incineration or land treatment',
    handlingPrecautions: 'Flammable hydrocarbon content',
  },
  K049: {
    code: 'K049',
    category: 'petroleum',
    type: 'listed',
    description: 'Slop oil emulsion solids from petroleum refining',
    hazardClass: 'Toxic/Ignitable',
    examples: ['API separator sludge', 'Tank bottoms'],
    disposal: 'Fuel blending or incineration',
    handlingPrecautions: 'Contains benzene and other aromatics',
  },
  K050: {
    code: 'K050',
    category: 'petroleum',
    type: 'listed',
    description: 'Heat exchanger bundle cleaning sludge from petroleum refining',
    hazardClass: 'Toxic',
    examples: ['Crude unit exchanger sludges'],
    disposal: 'Thermal treatment',
    handlingPrecautions: 'Heavy metal content from catalysts',
  },
  K051: {
    code: 'K051',
    category: 'petroleum',
    type: 'listed',
    description: 'API separator sludge from petroleum refining',
    hazardClass: 'Toxic/Ignitable',
    examples: ['Oily wastewater treatment sludges'],
    disposal: 'Land treatment or incineration',
    handlingPrecautions: 'PAH contamination',
  },
  K052: {
    code: 'K052',
    category: 'petroleum',
    type: 'listed',
    description: 'Tank bottoms from petroleum refining',
    hazardClass: 'Toxic/Ignitable',
    examples: ['Crude oil storage tank sludges', 'Product tank bottoms'],
    disposal: 'Fuel blending or thermal treatment',
    handlingPrecautions: 'High viscosity, may contain lead',
  },

  // K061-K062: Coking (Steel Production)
  K061: {
    code: 'K061',
    category: 'steel',
    type: 'listed',
    description: 'Emission control dust/sludge from primary production of steel',
    hazardClass: 'Toxic',
    examples: ['Electric arc furnace dust', 'Baghouse dust'],
    disposal: 'Metal recovery or stabilization',
    handlingPrecautions: 'Heavy metal and dioxin content',
  },

  // K069-K073: Secondary Lead Smelting
  K069: {
    code: 'K069',
    category: 'lead-smelting',
    type: 'listed',
    description: 'Emission control dust/sludge from secondary lead smelting',
    hazardClass: 'Toxic',
    examples: ['Lead smelter baghouse dust', 'Scrubber sludges'],
    disposal: 'Lead recovery or stabilization',
    handlingPrecautions: 'High lead content - prevent dust',
  },

  // K100-K102: Ink Formulation
  K100: {
    code: 'K100',
    category: 'ink-formulation',
    type: 'listed',
    description: 'Waste leaching solution from ink formulation',
    hazardClass: 'Toxic',
    examples: ['Spent leaching solutions from hexavalent chromium recovery'],
    disposal: 'Chemical reduction and stabilization',
    handlingPrecautions: 'Hexavalent chromium - carcinogenic',
  },

  // ==================== P-CODES: ACUTELY HAZARDOUS COMMERCIAL CHEMICALS ====================

  P001: {
    code: 'P001',
    category: 'commercial-chemical',
    type: 'acutely-hazardous',
    description: 'Warfarin (>0.3%)',
    hazardClass: 'Acutely Toxic',
    casNumber: '81-81-2',
    examples: ['Rodenticides', 'Expired anticoagulant products'],
    disposal: 'Incineration only',
    handlingPrecautions: 'Anticoagulant - avoid exposure',
  },
  P002: {
    code: 'P002',
    category: 'commercial-chemical',
    type: 'acutely-hazardous',
    description: '1-Acetyl-2-thiourea',
    hazardClass: 'Acutely Toxic',
    casNumber: '591-08-2',
    examples: ['Rodenticide formulations'],
    disposal: 'Incineration',
    handlingPrecautions: 'Highly toxic - fatal if swallowed',
  },
  P003: {
    code: 'P003',
    category: 'commercial-chemical',
    type: 'acutely-hazardous',
    description: 'Acrolein',
    hazardClass: 'Acutely Toxic',
    casNumber: '107-02-8',
    examples: ['Aquatic herbicides', 'Biocide formulations'],
    disposal: 'Incineration',
    handlingPrecautions: 'Severely irritating to eyes and respiratory tract',
  },
  P004: {
    code: 'P004',
    category: 'commercial-chemical',
    type: 'acutely-hazardous',
    description: 'Aldrin',
    hazardClass: 'Acutely Toxic',
    casNumber: '309-00-2',
    examples: ['Banned pesticide stockpiles'],
    disposal: 'High-temperature incineration',
    handlingPrecautions: 'Persistent organic pollutant - banned',
  },
  P005: {
    code: 'P005',
    category: 'commercial-chemical',
    type: 'acutely-hazardous',
    description: 'Allyl alcohol',
    hazardClass: 'Acutely Toxic',
    casNumber: '107-18-6',
    examples: ['Chemical intermediates', 'Resin manufacturing waste'],
    disposal: 'Incineration',
    handlingPrecautions: 'Toxic by all routes - use full PPE',
  },

  // ==================== U-CODES: TOXIC COMMERCIAL CHEMICALS ====================

  U001: {
    code: 'U001',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acetaldehyde',
    hazardClass: 'Toxic/Ignitable',
    casNumber: '75-07-0',
    examples: ['Chemical manufacturing waste', 'Flavoring industry waste'],
    disposal: 'Incineration or fuel blending',
    handlingPrecautions: 'Probable carcinogen - highly flammable',
  },
  U002: {
    code: 'U002',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acetone',
    hazardClass: 'Ignitable',
    casNumber: '67-64-1',
    examples: ['Laboratory waste', 'Paint/coating waste', 'Pharmaceutical waste'],
    disposal: 'Fuel blending or incineration',
    handlingPrecautions: 'Highly flammable - flash point 0°F',
  },
  U003: {
    code: 'U003',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acetonitrile',
    hazardClass: 'Toxic/Ignitable',
    casNumber: '75-05-8',
    examples: ['HPLC waste', 'Pharmaceutical manufacturing waste'],
    disposal: 'Incineration',
    handlingPrecautions: 'Metabolizes to cyanide - highly toxic',
  },
  U004: {
    code: 'U004',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acetophenone',
    hazardClass: 'Toxic',
    casNumber: '98-86-2',
    examples: ['Fragrance industry waste', 'Resin manufacturing'],
    disposal: 'Incineration',
    handlingPrecautions: 'Avoid inhalation and skin contact',
  },
  U005: {
    code: 'U005',
    category: 'commercial-chemical',
    type: 'toxic',
    description: '2-Acetylaminofluorene',
    hazardClass: 'Carcinogenic',
    casNumber: '53-96-3',
    examples: ['Research laboratory waste'],
    disposal: 'High-temperature incineration',
    handlingPrecautions: 'Known human carcinogen - extreme caution',
  },
  U006: {
    code: 'U006',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acetyl chloride',
    hazardClass: 'Corrosive/Reactive',
    casNumber: '75-36-5',
    examples: ['Chemical synthesis waste', 'Pharmaceutical intermediates'],
    disposal: 'Chemical treatment then incineration',
    handlingPrecautions: 'Reacts violently with water - corrosive fumes',
  },
  U007: {
    code: 'U007',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acrylamide',
    hazardClass: 'Carcinogenic',
    casNumber: '79-06-1',
    examples: ['Polymer manufacturing waste', 'Wastewater treatment waste'],
    disposal: 'Incineration',
    handlingPrecautions: 'Probable carcinogen and neurotoxin',
  },
  U008: {
    code: 'U008',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acrylic acid',
    hazardClass: 'Corrosive',
    casNumber: '79-10-7',
    examples: ['Polymer production waste', 'Adhesive manufacturing'],
    disposal: 'Neutralization then incineration',
    handlingPrecautions: 'Corrosive - polymerizes on heating',
  },
  U009: {
    code: 'U009',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Acrylonitrile',
    hazardClass: 'Toxic/Ignitable',
    casNumber: '107-13-1',
    examples: ['Plastic manufacturing waste', 'Synthetic fiber production'],
    disposal: 'Incineration',
    handlingPrecautions: 'Carcinogenic - extremely flammable',
  },
  U010: {
    code: 'U010',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Mitomycin C',
    hazardClass: 'Carcinogenic',
    casNumber: '50-07-7',
    examples: ['Pharmaceutical waste', 'Oncology department waste'],
    disposal: 'Incineration with afterburner',
    handlingPrecautions: 'Chemotherapy drug - cytotoxic',
  },
  U011: {
    code: 'U011',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Amitrole',
    hazardClass: 'Carcinogenic',
    casNumber: '61-82-5',
    examples: ['Herbicide waste'],
    disposal: 'Incineration',
    handlingPrecautions: 'Suspected carcinogen',
  },
  U012: {
    code: 'U012',
    category: 'commercial-chemical',
    type: 'toxic',
    description: 'Aniline',
    hazardClass: 'Toxic',
    casNumber: '62-53-3',
    examples: ['Dye manufacturing waste', 'Rubber chemicals'],
    disposal: 'Incineration',
    handlingPrecautions: 'Absorbed through skin - methemoglobinemia risk',
  },
};

/**
 * Get waste code by EPA code
 */
export function getWasteCode(code) {
  return EPA_WASTE_CODES[code] || null;
}

/**
 * Search waste codes by category
 */
export function getWasteCodesByCategory(category) {
  return Object.values(EPA_WASTE_CODES).filter((waste) => waste.category === category);
}

/**
 * Search waste codes by type
 */
export function getWasteCodesByType(type) {
  return Object.values(EPA_WASTE_CODES).filter((waste) => waste.type === type);
}

/**
 * Get all waste code identifiers
 */
export function getAllWasteCodes() {
  return Object.keys(EPA_WASTE_CODES);
}

/**
 * Search waste codes by keyword
 */
export function searchWasteCodes(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(EPA_WASTE_CODES).filter(
    (waste) =>
      waste.description.toLowerCase().includes(lowerKeyword) ||
      waste.examples.some((ex) => ex.toLowerCase().includes(lowerKeyword)) ||
      waste.category.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get waste code categories
 */
export function getCategories() {
  const categories = new Set();
  Object.values(EPA_WASTE_CODES).forEach((waste) => categories.add(waste.category));
  return Array.from(categories).sort();
}

/**
 * Validate if code exists
 */
export function isValidWasteCode(code) {
  return code in EPA_WASTE_CODES;
}

export default EPA_WASTE_CODES;

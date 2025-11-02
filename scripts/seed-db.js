import pg from 'pg';
import dotenv from 'dotenv';
import { EPA_WASTE_CODES } from '../src/data/epaWasteCodes.js';
import { TSDF_FACILITIES } from '../src/data/facilityData.js';

dotenv.config();

const { Client } = pg;

async function seedWasteCodes(client) {
  console.log('📦 Seeding EPA waste codes...');
  const wasteCodes = Object.values(EPA_WASTE_CODES);
  let count = 0;

  for (const wasteCode of wasteCodes) {
    await client.query(
      `INSERT INTO waste_codes (
        code, category, type, description, haz_class,
        examples, disposal_method, handling_precautions, cas_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (code) DO UPDATE SET
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        haz_class = EXCLUDED.haz_class,
        examples = EXCLUDED.examples,
        disposal_method = EXCLUDED.disposal_method,
        handling_precautions = EXCLUDED.handling_precautions,
        cas_number = EXCLUDED.cas_number`,
      [
        wasteCode.code,
        wasteCode.category,
        wasteCode.type,
        wasteCode.description,
        wasteCode.hazardClass,
        JSON.stringify(wasteCode.examples),
        wasteCode.disposal,
        wasteCode.handlingPrecautions,
        wasteCode.casNumber || null,
      ]
    );
    count++;
  }
  console.log(`   ✅ Inserted/updated ${count} waste codes`);
  return count;
}

async function seedFacilities(client) {
  console.log('\n🏭 Seeding disposal facilities...');
  let count = 0;

  for (const facility of TSDF_FACILITIES) {
    await client.query(
      `INSERT INTO facilities (
        id, name, epa_id, address, city, state, zip_code,
        latitude, longitude, accepted_waste_codes, price_per_kg,
        max_capacity_kg, current_capacity_kg, certifications, rating, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        epa_id = EXCLUDED.epa_id,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accepted_waste_codes = EXCLUDED.accepted_waste_codes,
        price_per_kg = EXCLUDED.price_per_kg,
        max_capacity_kg = EXCLUDED.max_capacity_kg,
        certifications = EXCLUDED.certifications,
        rating = EXCLUDED.rating`,
      [
        facility.id,
        facility.name,
        facility.epa_id,
        facility.address,
        facility.city,
        facility.state,
        facility.zip_code,
        facility.latitude,
        facility.longitude,
        JSON.stringify(facility.accepted_waste_codes),
        facility.price_per_kg,
        facility.max_capacity_kg,
        facility.current_capacity_kg || 0,
        JSON.stringify(facility.certifications),
        facility.rating,
        facility.phone,
        facility.email,
      ]
    );
    count++;
  }
  console.log(`   ✅ Inserted/updated ${count} facilities`);
  return count;
}

async function seedGenerators(client) {
  console.log('\n🏥 Seeding sample generators...');
  const sampleGenerators = [
    {
      id: 'gen-001',
      name: 'Memorial Hospital',
      epaId: 'TXD111222333',
      address: '123 Medical Center Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77030',
      contactName: 'Dr. Sarah Johnson',
      contactEmail: 'sarah.johnson@memorial.example.com',
      contactPhone: '(713) 555-1234',
    },
    {
      id: 'gen-002',
      name: 'Tech Manufacturing Inc',
      epaId: 'CAD987654321',
      address: '456 Silicon Valley Way',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95110',
      contactName: 'John Smith',
      contactEmail: 'john.smith@techmanuf.example.com',
      contactPhone: '(408) 555-5678',
    },
    {
      id: 'gen-003',
      name: 'Chemical Solutions LLC',
      epaId: 'NYD456789012',
      address: '789 Industrial Pkwy',
      city: 'Buffalo',
      state: 'NY',
      zipCode: '14201',
      contactName: 'Maria Garcia',
      contactEmail: 'maria.garcia@chemsol.example.com',
      contactPhone: '(716) 555-9012',
    },
  ];

  let count = 0;
  for (const generator of sampleGenerators) {
    await client.query(
      `INSERT INTO generators (
        id, name, epa_id, address, city, state, zip_code,
        contact_name, contact_email, contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        epa_id = EXCLUDED.epa_id,
        contact_name = EXCLUDED.contact_name,
        contact_email = EXCLUDED.contact_email`,
      [
        generator.id,
        generator.name,
        generator.epaId,
        generator.address,
        generator.city,
        generator.state,
        generator.zipCode,
        generator.contactName,
        generator.contactEmail,
        generator.contactPhone,
      ]
    );
    count++;
  }
  console.log(`   ✅ Inserted/updated ${count} generators`);
  return count;
}

async function printDatabaseStatistics(client) {
  console.log('\n📊 Database Statistics:');
  const wasteCodesResult = await client.query('SELECT COUNT(*) FROM waste_codes');
  const facilitiesResult = await client.query('SELECT COUNT(*) FROM facilities');
  const generatorsResult = await client.query('SELECT COUNT(*) FROM generators');

  console.log(`   - Waste Codes: ${wasteCodesResult.rows[0].count}`);
  console.log(`   - Facilities: ${facilitiesResult.rows[0].count}`);
  console.log(`   - Generators: ${generatorsResult.rows[0].count}`);
}

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'waste_compliance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    await seedWasteCodes(client);
    await seedFacilities(client);
    await seedGenerators(client);
    await printDatabaseStatistics(client);

    await client.end();
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error.stack);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

// Utility functions (kept for potential future use)
// function extractCity(address) {
//   const parts = address.split(',');
//   return parts.length >= 2 ? parts[parts.length - 2].trim() : 'Unknown';
// }

// function extractZip(address) {
//   const zipMatch = address.match(/\d{5}/);
//   return zipMatch ? zipMatch[0] : '00000';
// }

// Export MOCK_FACILITIES for seeding
export const MOCK_FACILITIES_EXPORT = [
  {
    id: 'fac-001',
    name: 'SafeWaste Disposal LLC',
    state: 'TX',
    epaId: 'TXD987654321',
    address: '1234 Industrial Pkwy, Houston, TX 77002',
    city: 'Houston',
    zipCode: '77002',
    acceptedWasteCodes: ['D001', 'D002', 'D003', 'F001', 'F002', 'F003'],
    pricePerKg: 2.5,
    maxCapacityKg: 50000,
    currentCapacityKg: 12000,
    certifications: ['RCRA-TSD', 'EPA-Certified', 'ISO-14001'],
    rating: 4.7,
    location: { lat: 29.7604, lng: -95.3698 },
    phone: '(713) 555-0100',
    email: 'contact@safewaste-tx.example.com',
  },
  {
    id: 'fac-002',
    name: 'HazardPro Environmental Services',
    state: 'TX',
    epaId: 'TXD123456789',
    address: '5678 Safety Blvd, Dallas, TX 75201',
    city: 'Dallas',
    zipCode: '75201',
    acceptedWasteCodes: ['D001', 'D002', 'D004', 'D005', 'D006', 'D007', 'D008', 'D009'],
    pricePerKg: 3.0,
    maxCapacityKg: 75000,
    currentCapacityKg: 25000,
    certifications: ['RCRA-TSD', 'EPA-Certified', 'TSCA-Approved'],
    rating: 4.5,
    location: { lat: 32.7767, lng: -96.797 },
    phone: '(214) 555-0200',
    email: 'info@hazardpro-tx.example.com',
  },
  // Add remaining facilities...
];

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

/**
 * Complete Waste Compliance Workflow Example
 *
 * This demonstrates the entire end-to-end process:
 * 1. Classify waste from lab report
 * 2. Generate EPA waste profile
 * 3. Find approved facilities
 * 4. Calculate optimal route
 * 5. Create electronic manifest
 * 6. Track manifest status
 */

import { classifyWaste, generateWasteProfile } from '../src/services/wasteClassifier.js';
import { findApprovedFacilities, calculateOptimalRoute } from '../src/services/facilityMatcher.js';
import { createManifest, trackManifest, signManifest } from '../src/services/manifestGenerator.js';
import { getAIOpsMetrics } from '../src/services/ai/aiops-example.js';

// Sample lab report for a hospital
const labReport = `
HAZARDOUS WASTE ANALYSIS REPORT
Memorial Hospital - Chemistry Lab
Date: October 22, 2025

Chemical Composition:
- Acetone: 85% by volume
- Isopropyl Alcohol: 10% by volume
- Water: 5% by volume

Physical Properties:
- Flash Point: 0°F (-18°C)
- pH: 7.2 (neutral)
- Physical State: Liquid
- Color: Clear, colorless
- Odor: Strong, characteristic solvent odor

Quantity: 150 kg (approximately 200 liters)

Safety Notes:
- Highly flammable
- Store away from heat and ignition sources
- Use in well-ventilated area
- Incompatible with strong oxidizers

Recommended Disposal:
Requires disposal at EPA-approved hazardous waste facility
due to ignitability characteristics.
`;

const generatorInfo = {
  name: 'Memorial Hospital',
  epaId: 'TXD123456789',
  address: '1000 Medical Center Dr, Houston, TX 77030',
  contactName: 'Dr. Sarah Johnson',
  contactEmail: 'sjohnson@memorial.hospital',
  contactPhone: '(713) 555-0123',
};

const generatorLocation = {
  lat: 29.7073,
  lng: -95.3991,
};

async function runCompleteWorkflow() {
  console.log('='.repeat(80));
  console.log('WASTE COMPLIANCE AGENT - COMPLETE WORKFLOW DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  try {
    // STEP 1: Classify Waste
    console.log('📋 STEP 1: CLASSIFYING WASTE FROM LAB REPORT');
    console.log('-'.repeat(80));

    // Note: This will fail without a real API key, so we'll use mock data
    let classification;
    try {
      classification = await classifyWaste(labReport, {
        traceId: 'demo-trace-001',
        userId: 'demo-user',
      });
      console.log('✅ Classification completed!');
    } catch {
      console.log('⚠️  Real AI classification requires API key. Using mock data...');
      classification = {
        wasteCode: 'D001',
        category: 'ignitable',
        confidence: 0.92,
        reasoning:
          'Waste contains 85% acetone with flash point of 0°F, which is well below the EPA threshold of 140°F for ignitable wastes.',
        chemicalsDetected: ['Acetone', 'Isopropyl Alcohol'],
        physicalProperties: {
          flashPoint: 0,
          pH: 7.2,
          physicalState: 'liquid',
        },
        recommendedHandling:
          'Store in approved flammable storage cabinet. Keep away from heat sources and oxidizers. Dispose at EPA-certified facility.',
        traceId: 'demo-trace-001',
        timestamp: new Date().toISOString(),
        requiresHumanReview: false,
      };
      console.log('✅ Using mock classification data');
    }

    console.log('\nClassification Results:');
    console.log(`  Waste Code: ${classification.wasteCode}`);
    console.log(`  Category: ${classification.category}`);
    console.log(`  Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    console.log(
      `  Requires Human Review: ${classification.requiresHumanReview ? 'YES ⚠️' : 'NO ✅'}`
    );
    console.log(`  Reasoning: ${classification.reasoning}`);
    console.log();

    // STEP 2: Generate Waste Profile
    console.log('📄 STEP 2: GENERATING EPA WASTE PROFILE');
    console.log('-'.repeat(80));

    let wasteProfile;
    try {
      wasteProfile = await generateWasteProfile(classification, {
        traceId: 'demo-trace-002',
      });
      console.log('✅ Waste profile generated!');
    } catch {
      console.log('⚠️  Using mock waste profile...');
      wasteProfile = {
        wasteCode: classification.wasteCode,
        category: classification.category,
        profileDocument:
          'EPA WASTE PROFILE DOCUMENT\n\n[Comprehensive 100+ page document would be generated here]',
        generatedAt: new Date().toISOString(),
        classification,
        status: 'pending_review',
        traceId: 'demo-trace-002',
        quantityKg: 150,
        generatorLocation,
      };
      console.log('✅ Mock profile created');
    }

    console.log(`  Status: ${wasteProfile.status}`);
    console.log(`  Quantity: ${wasteProfile.quantityKg} kg`);
    console.log();

    // STEP 3: Find Approved Facilities
    console.log('🏭 STEP 3: FINDING APPROVED DISPOSAL FACILITIES');
    console.log('-'.repeat(80));

    const facilityResults = await findApprovedFacilities(wasteProfile, {
      traceId: 'demo-trace-003',
      maxResults: 5,
      sortBy: 'price',
      states: ['TX', 'CA'], // Only Texas and California
    });

    console.log(`✅ Found ${facilityResults.facilities.length} approved facilities`);
    console.log('\nTop 3 Facilities:');
    facilityResults.facilities.slice(0, 3).forEach((facility, index) => {
      console.log(`\n  ${index + 1}. ${facility.name} (${facility.state})`);
      console.log(`     EPA ID: ${facility.epaId}`);
      console.log(`     Distance: ${facility.distance.toFixed(1)} km`);
      console.log(`     Disposal Cost: $${facility.estimatedDisposalCost.toFixed(2)}`);
      console.log(`     Transport Cost: $${facility.estimatedTransportCost.toFixed(2)}`);
      console.log(`     Total Cost: $${facility.totalEstimatedCost.toFixed(2)}`);
      console.log(`     Rating: ${facility.rating}/5.0 ⭐`);
    });
    console.log();

    // STEP 4: Calculate Optimal Route
    console.log('🚛 STEP 4: CALCULATING OPTIMAL ROUTE');
    console.log('-'.repeat(80));

    const route = await calculateOptimalRoute(wasteProfile, facilityResults.facilities, {
      traceId: 'demo-trace-004',
      prioritizeCost: true,
    });

    console.log('✅ Optimal route calculated!');
    console.log('\nSelected Facility:');
    console.log(`  Name: ${route.facility.name}`);
    console.log(`  Location: ${route.facility.address}`);
    console.log(`  Optimization Score: ${(route.score * 100).toFixed(1)}%`);
    console.log('\nRoute Details:');
    console.log(`  Type: ${route.route.type}`);
    console.log(`  Distance: ${route.route.distance.toFixed(1)} km`);
    console.log(`  Duration: ${route.route.estimatedDuration}`);
    console.log(`  Method: ${route.route.method}`);
    console.log('\nCost Breakdown:');
    console.log(`  Disposal: $${route.cost.disposal.toFixed(2)}`);
    console.log(`  Transport: $${route.cost.transport.toFixed(2)}`);
    console.log(`  TOTAL: $${route.cost.total.toFixed(2)}`);
    console.log();

    // STEP 5: Create Electronic Manifest
    console.log('📝 STEP 5: CREATING ELECTRONIC MANIFEST');
    console.log('-'.repeat(80));

    const manifest = await createManifest(wasteProfile, route.facility, route, {
      traceId: 'demo-trace-005',
      generatorInfo,
    });

    console.log('✅ Electronic manifest created!');
    console.log(`  Manifest Number: ${manifest.manifestNumber}`);
    console.log(`  Manifest ID: ${manifest.id}`);
    console.log(`  Status: ${manifest.status}`);
    console.log(`  Generator: ${manifest.generator.name}`);
    console.log(`  Facility: ${manifest.facility.name}`);
    console.log(`  Transporter: ${manifest.transporter.name}`);
    console.log();

    // STEP 6: Sign Manifest
    console.log('✍️  STEP 6: SIGNING MANIFEST');
    console.log('-'.repeat(80));

    // Generator signs
    await signManifest(manifest.id, 'generator', {
      name: generatorInfo.contactName,
      signature: 'digital-signature-generator-001',
    });
    console.log('✅ Generator signed');

    // Transporter signs
    await signManifest(manifest.id, 'transporter', {
      name: 'John Driver',
      signature: 'digital-signature-transporter-001',
    });
    console.log('✅ Transporter signed');

    // Facility signs
    const signedManifest = await signManifest(manifest.id, 'facility', {
      name: 'Jane Facility Manager',
      signature: 'digital-signature-facility-001',
    });
    console.log('✅ Facility signed');
    console.log(`\n  Manifest Status: ${signedManifest.status}`);
    console.log('  All parties have signed ✅');
    console.log();

    // STEP 7: Track Manifest
    console.log('📍 STEP 7: TRACKING MANIFEST');
    console.log('-'.repeat(80));

    const tracking = await trackManifest(manifest.id, {
      traceId: 'demo-trace-007',
    });

    console.log('✅ Manifest tracking retrieved!');
    console.log(`  Manifest Number: ${tracking.manifestNumber}`);
    console.log(`  Status: ${tracking.status}`);
    console.log(`  Current Location: ${tracking.currentLocation.location}`);
    console.log(`  Address: ${tracking.currentLocation.address}`);
    console.log('\nTimeline:');
    tracking.timeline.forEach((event, index) => {
      console.log(
        `  ${index + 1}. ${event.event} - ${event.actor} (${new Date(event.timestamp).toLocaleTimeString()})`
      );
    });
    console.log();

    // STEP 8: Show AIOps Metrics (if available)
    console.log('📊 STEP 8: AIOPS METRICS SUMMARY');
    console.log('-'.repeat(80));

    try {
      const metrics = getAIOpsMetrics();
      console.log('AI Operations Metrics:');
      console.log(`  Total Requests: ${metrics.instrumentation.totalRequests}`);
      console.log(`  Total Tokens: ${metrics.instrumentation.totalTokens.toLocaleString()}`);
      console.log(`  Total Cost: $${metrics.instrumentation.totalCost.toFixed(2)}`);
      console.log(`  Average Latency: ${metrics.instrumentation.averageLatency.toFixed(0)}ms`);
      console.log(`  Error Rate: ${(metrics.instrumentation.errorRate * 100).toFixed(2)}%`);
    } catch {
      console.log('⚠️  AIOps metrics not available in mock mode');
    }
    console.log();

    // SUCCESS SUMMARY
    console.log('='.repeat(80));
    console.log('✅ WORKFLOW COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\nSummary:');
    console.log(
      `  ✅ Waste classified as ${classification.wasteCode} (${classification.category})`
    );
    console.log(`  ✅ EPA waste profile generated`);
    console.log(`  ✅ Found ${facilityResults.totalFound} approved facilities`);
    console.log(`  ✅ Optimal route calculated (Total cost: $${route.cost.total.toFixed(2)})`);
    console.log(`  ✅ Electronic manifest created (${manifest.manifestNumber})`);
    console.log(`  ✅ All parties signed manifest`);
    console.log(`  ✅ Manifest status: ${signedManifest.status}`);
    console.log('\n🎉 The waste is ready for safe, compliant disposal!');
    console.log();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the workflow
runCompleteWorkflow().catch(console.error);

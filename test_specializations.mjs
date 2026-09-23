import { SAP_DOMAIN_SPECIALIZATIONS } from './services/SapDomainSpecializations.js';
import { ModuleClassifier } from './services/ModuleClassifier.js';
import { SpecialistPromptRouter } from './services/SpecialistPromptRouter.js';

console.log('====================================================');
console.log('🧪 RUNNING SAP DOMAIN SPECIALIZATION TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Verify Metadata Catalog
console.log('▶ Test Suite 1: Specialization Metadata Catalog');
assert(Object.keys(SAP_DOMAIN_SPECIALIZATIONS).length >= 13, 'Contains at least 13 specialization definitions');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_GTS.isPriority === true, 'SAP GTS is marked as Tier 1 Priority');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_IS_RETAIL.isPriority === true, 'SAP IS-Retail is marked as Tier 1 Priority');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_SD.isPriority === true, 'SAP SD is marked as Tier 1 Priority');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_GTS.signatureTcodes.includes('/SAPSLL/SPL_CHCK'), 'GTS includes /SAPSLL/SPL_CHCK');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_IS_RETAIL.signatureTcodes.includes('WSL10'), 'IS-Retail includes WSL10');
assert(SAP_DOMAIN_SPECIALIZATIONS.SAP_SD.signatureTcodes.includes('VA01'), 'SD includes VA01');

// 2. Classification Tests
console.log('\n▶ Test Suite 2: Intelligent Module & Sub-Area Classification');

// GTS query
const gtsRes = ModuleClassifier.classify('How does Sanctioned Party Screening work in /SAPSLL/SPL_CHCK with feeder system sales orders?');
assert(gtsRes.primaryModule === 'SAP_GTS', `GTS query classified as SAP_GTS (Got: ${gtsRes.primaryModule})`);
assert(gtsRes.tcodesInScope.includes('/SAPSLL/SPL_CHCK'), `Detected GTS T-Code /SAPSLL/SPL_CHCK (Got: ${gtsRes.tcodesInScope.join(', ')})`);
assert(gtsRes.isCrossModule === true, `Detected Cross-Module GTS ↔ SD/Sales (Got: ${gtsRes.isCrossModule})`);

// IS-Retail query
const retailRes = ModuleClassifier.classify('Explain article master MM41 vs MM01, generic articles, variants, and store assortment listing WSL10 in IS-Retail.');
assert(retailRes.primaryModule === 'SAP_IS_RETAIL', `IS-Retail query classified as SAP_IS_RETAIL (Got: ${retailRes.primaryModule})`);
assert(retailRes.tcodesInScope.includes('MM41'), `Detected MM41 article master`);
assert(retailRes.tcodesInScope.includes('WSL10'), `Detected WSL10 assortment listing`);

// SD query
const sdRes = ModuleClassifier.classify('Explain Order-to-Cash (O2C) 9-step flow from VA01 to VF01, shipping point determination OVL2, and pricing condition technique V/08.');
assert(sdRes.primaryModule === 'SAP_SD', `SD query classified as SAP_SD (Got: ${sdRes.primaryModule})`);
assert(sdRes.tcodesInScope.includes('VA01') && sdRes.tcodesInScope.includes('VF01'), `Detected VA01 and VF01`);
assert(sdRes.tcodesInScope.includes('OVL2'), `Detected OVL2 shipping point determination`);

// EWM query
const ewmRes = ModuleClassifier.classify('How to troubleshoot stuck queues in SMQ2 and configure putaway strategies in /SCWM/PRDO?');
assert(ewmRes.primaryModule === 'SAP_EWM', `EWM query classified as SAP_EWM (Got: ${ewmRes.primaryModule})`);
assert(ewmRes.tcodesInScope.includes('SMQ2') && ewmRes.tcodesInScope.includes('/SCWM/PRDO'), `Detected SMQ2 and /SCWM/PRDO`);

// Explicit Override query
const overrideRes = ModuleClassifier.classify('What is the status here?', 'SAP_GTS');
assert(overrideRes.primaryModule === 'SAP_GTS', `Explicit manual selector override honored (Got: ${overrideRes.primaryModule})`);

// 3. Specialist Prompt Router & 8-Part Standard Tests
console.log('\n▶ Test Suite 3: Specialist Prompt Router & 8-Part Standard Verification');

const gtsPrompt = SpecialistPromptRouter.buildSpecialistPrompt(gtsRes, { userLandscape: 'S/4HANA 2023' });
assert(gtsPrompt.includes('MANDATORY 8-PART RESPONSE STANDARD'), 'Contains 8-Part Standard header');
assert(gtsPrompt.includes('### 1. Direct Answer'), 'Contains Section 1: Direct Answer');
assert(gtsPrompt.includes('### 2. Module & Process Classification'), 'Contains Section 2: Module & Process Classification');
assert(gtsPrompt.includes('### 3. Business Process Flow'), 'Contains Section 3: Business Process Flow');
assert(gtsPrompt.includes('### 4. Technical Explanation & Configuration'), 'Contains Section 4: Technical Explanation & Configuration');
assert(gtsPrompt.includes('### 5. Cross-Module Integration Impact'), 'Contains Section 5: Cross-Module Integration Impact');
assert(gtsPrompt.includes('### 6. Troubleshooting & Diagnostic Path'), 'Contains Section 6: Troubleshooting & Diagnostic Path');
assert(gtsPrompt.includes('### 7. Configuration & System Verification'), 'Contains Section 7: Configuration & System Verification');
assert(gtsPrompt.includes('### 8. Consulting & Interview Delivery'), 'Contains Section 8: Consulting & Interview Delivery');
assert(gtsPrompt.includes('Sanctioned Party Screening (SPL)'), 'Contains GTS compliance directives');

const sdPrompt = SpecialistPromptRouter.buildSpecialistPrompt(sdRes, { userLandscape: 'S/4HANA 2023' });
assert(sdPrompt.includes('Order-to-Cash (O2C)'), 'SD prompt includes O2C directives');
assert(sdPrompt.includes('16-Step Pricing Condition Technique'), 'SD prompt includes 16-step pricing technique');

const retailPrompt = SpecialistPromptRouter.buildSpecialistPrompt(retailRes, { userLandscape: 'S/4HANA 2023' });
assert(retailPrompt.includes('Article Master vs Material Master'), 'IS-Retail prompt includes Article Master directives');
assert(retailPrompt.includes('Assortment & Listing'), 'IS-Retail prompt includes Assortment & Listing directives');

console.log('\n====================================================');
console.log(`📊 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

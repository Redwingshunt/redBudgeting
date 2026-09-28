// Default Dynamic Application State
let customDeductions = [
  { id: 1, name: 'Health Insurance', amount: 1500 },
  { id: 2, name: 'NPS / VPF', amount: 2500 }
];

let budgetBuckets = [
  { id: 1, name: 'Needs & Rent (50%)', percentage: 50, color: '#6366f1' },
  { id: 2, name: 'Investments & SIPs (30%)', percentage: 30, color: '#10b981' },
  { id: 3, name: 'Wants & Lifestyle (20%)', percentage: 20, color: '#a855f7' }
];

const colors = ['#6366f1', '#10b981', '#58238a', '#0d535f', '#f59e0b', '#ec4899', '#7495ca'];

// DOM Element Selectors
const ctcInput = document.getElementById('ctcInput');
const regimeSelect = document.getElementById('regimeSelect');
const pfModeSelect = document.getElementById('pfMode');

const monthlyInHandEl = document.getElementById('monthlyInHand');
const annualInHandEl = document.getElementById('annualInHand');
const grossMonthlyEl = document.getElementById('grossMonthly');
const monthlyTaxEl = document.getElementById('monthlyTax');
const annualTaxEl = document.getElementById('annualTax');
const totalDeductionsEl = document.getElementById('totalDeductions');

const deductionsContainer = document.getElementById('deductionsContainer');
const bucketsGrid = document.getElementById('bucketsGrid');
const progressBarContainer = document.getElementById('progressBarContainer');
const allocationSummary = document.getElementById('allocationSummary');

//income nirmal's collections.
function calculateNewTaxRegime(taxableIncome) {
  let stdDeduction = 75000;
  let netTaxable = Math.max(0, taxableIncome - stdDeduction);
  let tax = 0;

  if (netTaxable <= 700000) return 0; // Tax rebate

  if (netTaxable > 1500000) {
    tax += (netTaxable - 1500000) * 0.30;
    netTaxable = 1500000;
  }
  if (netTaxable > 1200000) {
    tax += (netTaxable - 1200000) * 0.20;
    netTaxable = 1200000;
  }
  if (netTaxable > 900000) {
    tax += (netTaxable - 900000) * 0.15;
    netTaxable = 900000;
  }
  if (netTaxable > 600000) {
    tax += (netTaxable - 600000) * 0.10;
    netTaxable = 600000;
  }
  if (netTaxable > 300000) {
    tax += (netTaxable - 300000) * 0.05;
  }

  // Add 4% Health & Education Cess for now will change it accordingly.
  return tax * 1.04;
}

// Main Recalculation Function
function recalculateAll() {
  const ctcLakhs = parseFloat(ctcInput.value) || 0;
  const annualCTC = ctcLakhs * 100000;
  const basicSalaryAnnual = annualCTC * 0.5; // Standard 50% Basic

  // Employer EPF & Gratuity Calculation
  let monthlyEPF = (pfModeSelect.value === 'capped') ? 1800 : (basicSalaryAnnual * 0.12) / 12;
  let monthlyGratuity = (basicSalaryAnnual * 0.0481) / 12;

  // Monthly Gross Pay
  let grossMonthly = (annualCTC / 12) - monthlyEPF - monthlyGratuity;

  // Tax Estimation
  let annualTaxable = grossMonthly * 12;
  let annualTax = calculateNewTaxRegime(annualTaxable);
  let monthlyTax = annualTax / 12;

  // Calculate Custom Deductions Sum
  const totalCustomDeductionsMonthly = customDeductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // Professional Tax
  const professionalTax = 200;

  // Final Net Monthly In-Hand
  const monthlyInHand = Math.max(0, grossMonthly - monthlyTax - monthlyEPF - professionalTax - totalCustomDeductionsMonthly);

  // Update UI Stats Cards
  monthlyInHandEl.textContent = `₹${Math.round(monthlyInHand).toLocaleString('en-IN')}`;
  annualInHandEl.textContent = `₹${Math.round(monthlyInHand * 12).toLocaleString('en-IN')} / year`;
  grossMonthlyEl.textContent = `₹${Math.round(grossMonthly).toLocaleString('en-IN')}`;
  monthlyTaxEl.textContent = `₹${Math.round(monthlyTax).toLocaleString('en-IN')}`;
  annualTaxEl.textContent = `₹${Math.round(annualTax).toLocaleString('en-IN')} / year`;
  totalDeductionsEl.textContent = `₹${Math.round(monthlyEPF + totalCustomDeductionsMonthly).toLocaleString('en-IN')}`;

  // Update Buckets & Visual Bar
  renderBuckets(monthlyInHand);
  renderProgressBar();
}

// Render Custom Deductions
function renderDeductions() {
  deductionsContainer.innerHTML = '';
  customDeductions.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <input type="text" value="${item.name}" placeholder="Name" onchange="updateDeduction(${item.id}, 'name', this.value)">
      <input type="number" value="${item.amount}" placeholder="₹" onchange="updateDeduction(${item.id}, 'amount', this.value)">
      <button class="btn-icon btn-delete" onclick="removeDeduction(${item.id})">×</button>
    `;
    deductionsContainer.appendChild(div);
  });
}

// Render Splitter Buckets
function renderBuckets(netInHand) {
  bucketsGrid.innerHTML = '';
  budgetBuckets.forEach((bucket) => {
    const allocatedAmount = (netInHand * (bucket.percentage / 100));
    const card = document.createElement('div');
    card.className = 'bucket-card';
    card.style.borderTop = `4px solid ${bucket.color}`;
    card.innerHTML = `
      <div class="bucket-header">
        <input class="bucket-title-input" value="${bucket.name}" onchange="updateBucket(${bucket.id}, 'name', this.value)">
        <button class="btn-icon btn-delete" onclick="removeBucket(${bucket.id})">×</button>
      </div>
      <div class="bucket-amount">₹${Math.round(allocatedAmount).toLocaleString('en-IN')}</div>
      <div class="bucket-controls">
        <div class="input-group">
          <label>Share (%)</label>
          <input type="number" value="${bucket.percentage}" min="0" max="100" onchange="updateBucket(${bucket.id}, 'percentage', this.value)">
        </div>
        <div class="input-group">
          <label>Monthly (₹)</label>
          <input type="number" value="${Math.round(allocatedAmount)}" disabled>
        </div>
      </div>
    `;
    bucketsGrid.appendChild(card);
  });
}

// will jst render Top Progress Bar
function renderProgressBar() {
  progressBarContainer.innerHTML = '';
  let totalAllocated = budgetBuckets.reduce((sum, b) => sum + (parseFloat(b.percentage) || 0), 0);
  
  allocationSummary.textContent = `${totalAllocated}% Allocated`;
  allocationSummary.style.color = totalAllocated === 100 ? '#10b981' : '#f59e0b';

  budgetBuckets.forEach(bucket => {
    const segment = document.createElement('div');
    segment.className = 'progress-segment';
    segment.style.width = `${bucket.percentage}%`;
    segment.style.backgroundColor = bucket.color;
    segment.title = `${bucket.name}: ${bucket.percentage}%`;
    progressBarContainer.appendChild(segment);
  });
}

// Dynamic Action Handlers
document.getElementById('addDeductionBtn').addEventListener('click', () => {
  customDeductions.push({ id: Date.now(), name: 'New Deduction', amount: 1000 });
  renderDeductions();
  recalculateAll();
});

function removeDeduction(id) {
  customDeductions = customDeductions.filter(item => item.id !== id);
  renderDeductions();
  recalculateAll();
}

function updateDeduction(id, field, value) {
  const item = customDeductions.find(i => i.id === id);
  if (item) item[field] = field === 'amount' ? parseFloat(value) || 0 : value;
  recalculateAll();
}

document.getElementById('addBucketBtn').addEventListener('click', () => {
  const nextColor = colors[budgetBuckets.length % colors.length];
  budgetBuckets.push({ id: Date.now(), name: 'Custom Bucket', percentage: 10, color: nextColor });
  recalculateAll();
});

function removeBucket(id) {
  budgetBuckets = budgetBuckets.filter(b => b.id !== id);
  recalculateAll();
}

function updateBucket(id, field, value) {
  const bucket = budgetBuckets.find(b => b.id === id);
  if (bucket) bucket[field] = field === 'percentage' ? parseFloat(value) || 0 : value;
  recalculateAll();
}

// Attach Event Listeners
[ctcInput, regimeSelect, pfModeSelect].forEach(el => {
  el.addEventListener('input', recalculateAll);
});

// Initial Setup Call
renderDeductions();
recalculateAll();
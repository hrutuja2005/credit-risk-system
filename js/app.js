// ============================================================
// Main Application Controller
// ============================================================

class App {
    constructor() {
        this.engine = new RiskEngine();
        this.dashboard = new DashboardManager();
        this.customers = [];
        this.results = [];
        this.stats = null;
        this.currentSection = 'dashboard';
    }

    init() {
        this.setupNavigation();
        this.setupUpload();
        this.setupSimulator();
        this.setupSearch();
        this.showLoadingScreen(false);

        // Load sample data automatically for demo
        this.loadSampleData();
    }

    // --- Navigation ---

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.navigate(section);
            });
        });
    }

    navigate(section) {
        this.currentSection = section;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
        const activeSection = document.getElementById(`section-${section}`);
        if (activeSection) activeSection.classList.add('active');

        // Update header title
        const titles = {
            dashboard: 'Dashboard Overview',
            upload: 'Data Upload',
            customers: 'Customer Analysis',
            simulator: 'What-If Simulator',
            alerts: 'Risk Alerts',
            reports: 'Report Generator'
        };
        document.getElementById('page-title').textContent = titles[section] || 'Dashboard';
    }

    // --- Upload ---

    setupUpload() {
        const dropZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        if (!dropZone || !fileInput) return;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                this.handleFileUpload(file);
            } else {
                this.showToast('Please upload a CSV file', 'error');
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });
    }

    handleFileUpload(file) {
        this.showLoadingScreen(true, 'Processing data...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsed = Papa.parse(e.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true
                });

                if (parsed.errors.length > 0) {
                    console.warn('CSV parse warnings:', parsed.errors);
                }

                await this.processCustomers(parsed.data);
                this.showToast(`Successfully loaded ${parsed.data.length} customers`, 'success');
                this.navigate('dashboard');
            } catch (err) {
                console.error('Error processing file:', err);
                this.showToast('Error processing file. Please check format.', 'error');
            }

            this.showLoadingScreen(false);
        };
        reader.readAsText(file);
    }

    // --- Load Sample Data ---

    async loadSampleData() {
        this.showLoadingScreen(true, 'Loading sample data...');

        try {
            const response = await fetch('data/sample-data.csv');
            const text = await response.text();
            const parsed = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true
            });

            await this.processCustomers(parsed.data);
            this.showToast('Sample data loaded — 25 customers analyzed', 'info');
        } catch (err) {
            console.error('Could not load sample data:', err);
            // Show welcome screen
            document.getElementById('section-dashboard').querySelector('.dashboard-content').style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'block';
        }

        this.showLoadingScreen(false);
    }

    // --- Process Customers ---

    async processCustomers(data) {
        this.customers = data.filter(c => c.customer_id && c.name);
        this.results = await this.engine.processAll(this.customers);
        this.stats = this.engine.getSummaryStats(this.results);

        // Update all views
        this.dashboard.update(this.results, this.stats);
        this.dashboard.renderPortfolioTrend(this.results);
        this.displayCustomers();
        this.updateAlerts();
        this.populateSimulatorDropdown();

        // Show dashboard content, hide welcome screen
        const dashContent = document.getElementById('section-dashboard').querySelector('.dashboard-content');
        const welcome = document.getElementById('welcome-screen');
        if (dashContent) dashContent.style.display = 'block';
        if (welcome) welcome.style.display = 'none';

        // Update data info bar
        const dataInfo = document.getElementById('data-info');
        if (dataInfo) {
            dataInfo.style.display = 'flex';
            dataInfo.querySelector('.data-info-text').innerHTML = `
                <span>📁</span>
                <span><strong>${this.customers.length}</strong> customers loaded · 
                Average Risk Score: <strong>${this.stats.averageScore}</strong> · 
                At-Risk: <strong style="color:var(--risk-high)">${this.stats.atRiskCount}</strong></span>
            `;
        }
    }

    // --- Display Customer Table ---

    displayCustomers(filter = '') {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        let filtered = this.results;
        if (filter) {
            const q = filter.toLowerCase();
            filtered = this.results.filter(r =>
                r.customer.name.toLowerCase().includes(q) ||
                r.customer.customer_id.toLowerCase().includes(q) ||
                r.prediction.levelLabel.toLowerCase().includes(q)
            );
        }

        // Sort by risk score descending
        filtered.sort((a, b) => b.prediction.score - a.prediction.score);

        tbody.innerHTML = filtered.map(r => {
            const c = r.customer;
            const p = r.prediction;
            const dti = ((c.emi / c.income) * 100).toFixed(1);

            return `
                <tr onclick="app.showCustomerDetail('${c.customer_id}')">
                    <td>
                        <div class="customer-name">${c.name}</div>
                        <div class="customer-id">${c.customer_id}</div>
                    </td>
                    <td>₹${c.income.toLocaleString()}</td>
                    <td>₹${c.loan_amount.toLocaleString()}</td>
                    <td>₹${c.emi.toLocaleString()}</td>
                    <td>${c.credit_score}</td>
                    <td>${c.missed_payments}</td>
                    <td>
                        <span class="risk-score-inline" style="color:${p.color}">${p.score}</span>
                    </td>
                    <td>
                        <span class="risk-badge ${p.levelLabel.toLowerCase()}">${p.icon} ${p.levelLabel}</span>
                    </td>
                    <td>
                        <div class="risk-score-bar">
                            <div class="risk-score-fill" style="width:${p.score}%;background:${p.color}"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update customer count
        const countEl = document.getElementById('customer-count');
        if (countEl) countEl.textContent = `${filtered.length} customers`;
    }

    // --- Search ---

    setupSearch() {
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.displayCustomers(e.target.value);
            });
        }
    }

    // --- Customer Detail Modal ---

    async showCustomerDetail(customerId) {
        const result = this.results.find(r => r.customer.customer_id === customerId);
        if (!result) return;

        const c = result.customer;
        const p = result.prediction;

        // Generate trend data async
        const trendData = await this.engine.generateTrendData(c);

        const overlay = document.getElementById('detail-overlay');

        // Build detail content
        const detailBody = overlay.querySelector('.detail-body');
        detailBody.innerHTML = `
            <div class="detail-grid">
                <!-- Left Column: Risk Score & Factors -->
                <div>
                    <div class="detail-section">
                        <div class="detail-section-title">🎯 Risk Assessment</div>
                        <div style="text-align:center; padding: 20px 0;">
                            <div class="risk-gauge">
                                <svg viewBox="0 0 120 120">
                                    <circle class="risk-gauge-bg" cx="60" cy="60" r="52" />
                                    <circle class="risk-gauge-fill" cx="60" cy="60" r="52"
                                        stroke="${p.color}"
                                        stroke-dasharray="${2 * Math.PI * 52}"
                                        stroke-dashoffset="${2 * Math.PI * 52 * (1 - p.score / 100)}" />
                                </svg>
                                <div class="risk-gauge-center">
                                    <div class="risk-gauge-score" style="color:${p.color}">${p.score}</div>
                                    <div class="risk-gauge-label" style="color:${p.color}">${p.levelLabel} Risk</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">📊 Risk Factor Breakdown</div>
                        ${Object.values(p.factors).sort((a, b) => b.risk - a.risk).map(f => {
                            const barColor = f.risk > 70 ? 'var(--risk-critical)' :
                                           f.risk > 50 ? 'var(--risk-high)' :
                                           f.risk > 30 ? 'var(--risk-medium)' : 'var(--risk-low)';
                            return `
                                <div class="factor-item">
                                    <div class="factor-header">
                                        <span class="factor-name">${f.name}</span>
                                        <span class="factor-value">${f.risk}%</span>
                                    </div>
                                    <div class="factor-bar">
                                        <div class="factor-bar-fill" style="width:${f.risk}%;background:${barColor}"></div>
                                    </div>
                                    <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${f.detail}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Right Column: Details, Explanation, Recommendations -->
                <div>
                    <div class="detail-section">
                        <div class="detail-section-title">👤 Customer Information</div>
                        <div class="card" style="padding:16px;">
                            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${c.name}</span></div>
                            <div class="info-row"><span class="info-label">ID</span><span class="info-value">${c.customer_id}</span></div>
                            <div class="info-row"><span class="info-label">Age</span><span class="info-value">${c.age} years</span></div>
                            <div class="info-row"><span class="info-label">Monthly Income</span><span class="info-value">₹${c.income.toLocaleString()}</span></div>
                            <div class="info-row"><span class="info-label">Loan Amount</span><span class="info-value">₹${c.loan_amount.toLocaleString()}</span></div>
                            <div class="info-row"><span class="info-label">Monthly EMI</span><span class="info-value">₹${c.emi.toLocaleString()}</span></div>
                            <div class="info-row"><span class="info-label">Credit Score</span><span class="info-value">${c.credit_score}</span></div>
                            <div class="info-row"><span class="info-label">Missed Payments</span><span class="info-value">${c.missed_payments}</span></div>
                            <div class="info-row"><span class="info-label">Employment</span><span class="info-value">${c.employment_years} years</span></div>
                            <div class="info-row"><span class="info-label">Existing Loans</span><span class="info-value">${c.existing_loans}</span></div>
                            <div class="info-row"><span class="info-label">Loan Purpose</span><span class="info-value">${c.loan_purpose || 'N/A'}</span></div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">🔍 Key Risk Explanations</div>
                        ${p.explanation.map(e => `
                            <div class="explanation-card ${e.severity}">
                                <div class="explanation-factor">${e.factor} — Risk: ${e.riskScore}%</div>
                                <div class="explanation-detail">${e.detail}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">💡 Recommendations</div>
                        ${p.recommendations.map(r => `
                            <div class="recommendation-card">
                                <div class="recommendation-icon">${r.icon}</div>
                                <div>
                                    <div class="recommendation-title">${r.title}</div>
                                    <div class="recommendation-detail">${r.detail}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Risk Trend -->
            <div class="detail-section" style="margin-top:10px;">
                <div class="detail-section-title">📈 Risk Score Trend (6 Months)</div>
                <div class="card">
                    <div class="trend-chart-wrapper">
                        <canvas id="customerTrendChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Update header
        overlay.querySelector('.detail-header').innerHTML = `
            <div>
                <h3 style="font-size:1.1rem;font-weight:700;">${c.name}</h3>
                <div style="font-size:0.8rem;color:var(--text-muted);">${c.customer_id} · ${c.loan_purpose || 'Loan'}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span class="risk-badge ${p.levelLabel.toLowerCase()}">${p.icon} ${p.levelLabel} Risk — Score ${p.score}</span>
                <button class="btn btn-secondary btn-sm" onclick="app.closeDetailPanel()">✕ Close</button>
            </div>
        `;

        overlay.classList.add('active');

        // Render trend chart after DOM update
        setTimeout(() => {
            this.dashboard.renderCustomerTrend(trendData, 'customerTrendChart');
        }, 100);
    }

    closeDetailPanel() {
        document.getElementById('detail-overlay').classList.remove('active');
    }

    // --- Alerts ---

    updateAlerts() {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        const highRisk = this.results
            .filter(r => r.prediction.score > 50)
            .sort((a, b) => b.prediction.score - a.prediction.score);

        if (highRisk.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-title">No Active Alerts</div>
                    <div class="empty-state-desc">All customers are within acceptable risk parameters.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom:16px;">
                <span style="font-size:0.85rem;color:var(--text-muted);">
                    ${highRisk.length} alert(s) requiring attention
                </span>
            </div>
            ${highRisk.map((r, i) => {
                const c = r.customer;
                const p = r.prediction;
                const alertClass = p.level === 'CRITICAL' ? 'critical' : p.level === 'HIGH' ? 'high' : 'medium';
                const topFactor = p.explanation[0];

                return `
                    <div class="alert-item ${alertClass}" style="animation-delay:${i * 0.08}s"
                         onclick="app.showCustomerDetail('${c.customer_id}')">
                        <div class="alert-icon">${p.icon}</div>
                        <div class="alert-content">
                            <div class="alert-title">${c.name} — ${p.levelLabel} Risk (Score: ${p.score})</div>
                            <div class="alert-detail">
                                Primary concern: ${topFactor.factor} (${topFactor.detail}).
                                ${p.recommendations[0].title}: ${p.recommendations[0].detail}
                            </div>
                        </div>
                        <div class="alert-time">
                            <span class="risk-badge ${p.levelLabel.toLowerCase()}">${p.levelLabel}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        `;

        // Update alert badge count
        const badge = document.getElementById('alert-badge');
        if (badge) {
            badge.textContent = highRisk.length;
            badge.style.display = highRisk.length > 0 ? 'flex' : 'none';
        }
    }

    // --- What-If Simulator ---

    setupSimulator() {
        const runBtn = document.getElementById('sim-run-btn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runSimulation());
        }

        // Add real-time slider updates
        ['sim-income', 'sim-emi', 'sim-credit-score', 'sim-missed-payments', 'sim-employment', 'sim-existing-loans'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    const valueDisplay = document.getElementById(id + '-value');
                    if (valueDisplay) {
                        let val = el.value;
                        if (id === 'sim-income' || id === 'sim-emi') val = '₹' + parseInt(val).toLocaleString();
                        valueDisplay.textContent = val;
                    }
                });
            }
        });
    }

    populateSimulatorDropdown() {
        const select = document.getElementById('sim-customer-select');
        if (!select) return;

        select.innerHTML = '<option value="">— Select a customer —</option>';
        this.results.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.customer.customer_id;
            opt.textContent = `${r.customer.name} (${r.customer.customer_id}) — Score: ${r.prediction.score}`;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            const result = this.results.find(r => r.customer.customer_id === select.value);
            if (result) {
                this.populateSimulatorFields(result.customer);
            }
        });
    }

    populateSimulatorFields(customer) {
        const fields = {
            'sim-income': customer.income,
            'sim-emi': customer.emi,
            'sim-credit-score': customer.credit_score,
            'sim-missed-payments': customer.missed_payments,
            'sim-employment': customer.employment_years,
            'sim-existing-loans': customer.existing_loans
        };

        for (const [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) {
                el.value = val;
                const valueDisplay = document.getElementById(id + '-value');
                if (valueDisplay) {
                    let displayVal = val;
                    if (id === 'sim-income' || id === 'sim-emi') displayVal = '₹' + parseInt(val).toLocaleString();
                    valueDisplay.textContent = displayVal;
                }
            }
        }

        // Run sim automatically
        this.runSimulation();
    }

    async runSimulation() {
        const select = document.getElementById('sim-customer-select');
        const customerId = select ? select.value : '';

        const modifiedData = {
            customer_id: customerId || 'SIM',
            name: 'Simulation',
            age: 35,
            income: parseInt(document.getElementById('sim-income')?.value) || 50000,
            loan_amount: 300000,
            emi: parseInt(document.getElementById('sim-emi')?.value) || 10000,
            credit_score: parseInt(document.getElementById('sim-credit-score')?.value) || 700,
            missed_payments: parseInt(document.getElementById('sim-missed-payments')?.value) || 0,
            employment_years: parseInt(document.getElementById('sim-employment')?.value) || 5,
            existing_loans: parseInt(document.getElementById('sim-existing-loans')?.value) || 1,
            loan_tenure_months: 48,
            collateral_value: 400000,
            loan_purpose: 'Simulation'
        };

        // Get original prediction if customer selected
        const originalResult = this.results.find(r => r.customer.customer_id === customerId);

        // Fill in customer-specific fields
        if (originalResult) {
            modifiedData.age = originalResult.customer.age;
            modifiedData.loan_amount = originalResult.customer.loan_amount;
            modifiedData.name = originalResult.customer.name;
            modifiedData.loan_tenure_months = originalResult.customer.loan_tenure_months;
            modifiedData.collateral_value = originalResult.customer.collateral_value;
            modifiedData.loan_purpose = originalResult.customer.loan_purpose;
        }

        this.showLoadingScreen(true, "Simulating with AI backend...");
        const newPrediction = await this.engine.predictRisk(modifiedData);
        this.showLoadingScreen(false);
        const resultContainer = document.getElementById('sim-result');

        if (!resultContainer) return;

        // Build result display
        let comparisonHtml = '';
        if (originalResult) {
            const orig = originalResult.prediction;
            const diff = newPrediction.score - orig.score;
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            const diffColor = diff > 0 ? 'var(--risk-critical)' : diff < 0 ? 'var(--risk-low)' : 'var(--text-muted)';

            comparisonHtml = `
                <div class="sim-comparison">
                    <div class="sim-comparison-box">
                        <div class="sim-comparison-label">Original Score</div>
                        <div class="sim-comparison-score" style="color:${orig.color}">${orig.score}</div>
                        <span class="risk-badge ${orig.levelLabel.toLowerCase()}" style="margin-top:8px;">${orig.levelLabel}</span>
                    </div>
                    <div class="sim-comparison-arrow">→</div>
                    <div class="sim-comparison-box">
                        <div class="sim-comparison-label">Simulated Score</div>
                        <div class="sim-comparison-score" style="color:${newPrediction.color}">${newPrediction.score}</div>
                        <span class="risk-badge ${newPrediction.levelLabel.toLowerCase()}" style="margin-top:8px;">${newPrediction.levelLabel}</span>
                    </div>
                </div>
                <div style="text-align:center;margin-top:16px;font-size:0.9rem;">
                    Change: <strong style="color:${diffColor}">${diffText} points</strong>
                </div>
            `;
        }

        resultContainer.innerHTML = `
            <div style="text-align:center;">
                <div class="risk-gauge" style="width:160px;height:160px;">
                    <svg viewBox="0 0 120 120">
                        <circle class="risk-gauge-bg" cx="60" cy="60" r="52" />
                        <circle class="risk-gauge-fill" cx="60" cy="60" r="52"
                            stroke="${newPrediction.color}"
                            stroke-dasharray="${2 * Math.PI * 52}"
                            stroke-dashoffset="${2 * Math.PI * 52 * (1 - newPrediction.score / 100)}" />
                    </svg>
                    <div class="risk-gauge-center">
                        <div class="risk-gauge-score" style="color:${newPrediction.color};font-size:2rem;">${newPrediction.score}</div>
                        <div class="risk-gauge-label" style="color:${newPrediction.color}">${newPrediction.levelLabel}</div>
                    </div>
                </div>
            </div>
            ${comparisonHtml}
            <div style="margin-top:20px;">
                <div class="detail-section-title" style="font-size:0.8rem;">Top Risk Factors</div>
                ${newPrediction.explanation.slice(0, 3).map(e => `
                    <div class="explanation-card ${e.severity}" style="margin-bottom:8px;">
                        <div class="explanation-factor" style="font-size:0.8rem;">${e.factor}</div>
                        <div class="explanation-detail" style="font-size:0.75rem;">${e.detail}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // --- Reports ---

    downloadPDFReport() {
        if (this.results.length === 0) {
            this.showToast('No data to export. Please upload data first.', 'warning');
            return;
        }
        this.showToast('Generating PDF report...', 'info');
        setTimeout(() => {
            ReportGenerator.generatePDF(this.results, this.stats);
            this.showToast('PDF report downloaded successfully!', 'success');
        }, 500);
    }

    downloadCSVReport() {
        if (this.results.length === 0) {
            this.showToast('No data to export. Please upload data first.', 'warning');
            return;
        }
        ReportGenerator.generateCSV(this.results);
        this.showToast('CSV report downloaded successfully!', 'success');
    }

    // --- Loading Screen ---

    showLoadingScreen(show, text = 'Loading...') {
        const loader = document.getElementById('loading-overlay');
        if (!loader) return;

        if (show) {
            loader.querySelector('.loading-text').textContent = text;
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }

    // --- Toast Notifications ---

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// --- Initialize on DOM load ---
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});

// ============================================================
// Dashboard Manager - Chart Rendering & Metrics
// ============================================================

class DashboardManager {
    constructor() {
        this.charts = {};
    }

    update(results, stats) {
        this.renderMetrics(stats);
        this.renderRiskDistribution(stats);
        this.renderScoreDistribution(results);
        this.renderTopRiskyCustomers(results);
    }

    renderMetrics(stats) {
        const metricsGrid = document.getElementById('metrics-grid');
        if (!metricsGrid) return;

        metricsGrid.innerHTML = `
            <div class="card metric-card accent-blue">
                <div class="metric-icon blue">📊</div>
                <div class="card-title">Total Customers</div>
                <div class="card-value">${stats.total}</div>
                <div class="card-change positive">All portfolios analyzed</div>
            </div>
            <div class="card metric-card accent-green">
                <div class="metric-icon green">✅</div>
                <div class="card-title">Average Risk Score</div>
                <div class="card-value">${stats.averageScore}<span style="font-size:1rem;color:var(--text-muted)">/100</span></div>
                <div class="card-change ${stats.averageScore <= 40 ? 'positive' : 'negative'}">
                    ${stats.averageScore <= 40 ? 'Healthy portfolio' : 'Needs attention'}
                </div>
            </div>
            <div class="card metric-card accent-orange">
                <div class="metric-icon orange">⚠️</div>
                <div class="card-title">At-Risk Customers</div>
                <div class="card-value">${stats.atRiskCount}</div>
                <div class="card-change negative">${stats.atRiskPercentage}% of portfolio</div>
            </div>
            <div class="card metric-card accent-red">
                <div class="metric-icon red">🔴</div>
                <div class="card-title">Critical Cases</div>
                <div class="card-value">${stats.distribution.CRITICAL}</div>
                <div class="card-change ${stats.distribution.CRITICAL > 0 ? 'negative' : 'positive'}">
                    ${stats.distribution.CRITICAL > 0 ? 'Immediate action required' : 'No critical cases'}
                </div>
            </div>
            <div class="card metric-card accent-purple">
                <div class="metric-icon purple">🛡️</div>
                <div class="card-title">Low Risk</div>
                <div class="card-value">${stats.distribution.LOW}</div>
                <div class="card-change positive">${Math.round((stats.distribution.LOW / stats.total) * 100)}% safe</div>
            </div>
        `;
    }

    renderRiskDistribution(stats) {
        const ctx = document.getElementById('riskDistributionChart');
        if (!ctx) return;

        if (this.charts.riskDist) this.charts.riskDist.destroy();

        this.charts.riskDist = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
                datasets: [{
                    data: [
                        stats.distribution.LOW,
                        stats.distribution.MEDIUM,
                        stats.distribution.HIGH,
                        stats.distribution.CRITICAL
                    ],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8,
                    spacing: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8892a4',
                            font: { family: 'Inter', size: 12, weight: '500' },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(14, 21, 38, 0.95)',
                        titleColor: '#e8edf5',
                        bodyColor: '#8892a4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { family: 'Inter', size: 13, weight: '600' },
                        bodyFont: { family: 'Inter', size: 12 },
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = Math.round((context.raw / total) * 100);
                                return ` ${context.raw} customers (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderScoreDistribution(results) {
        const ctx = document.getElementById('scoreDistributionChart');
        if (!ctx) return;

        if (this.charts.scoreDist) this.charts.scoreDist.destroy();

        // Create histogram buckets
        const buckets = Array(10).fill(0);
        const bucketLabels = [];
        for (let i = 0; i < 10; i++) {
            bucketLabels.push(`${i * 10}-${(i + 1) * 10}`);
        }

        results.forEach(r => {
            const bucket = Math.min(Math.floor(r.prediction.score / 10), 9);
            buckets[bucket]++;
        });

        const barColors = buckets.map((_, i) => {
            if (i <= 2) return 'rgba(34, 197, 94, 0.7)';
            if (i <= 4) return 'rgba(234, 179, 8, 0.7)';
            if (i <= 6) return 'rgba(249, 115, 22, 0.7)';
            return 'rgba(239, 68, 68, 0.7)';
        });

        this.charts.scoreDist = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: bucketLabels,
                datasets: [{
                    label: 'Customers',
                    data: buckets,
                    backgroundColor: barColors,
                    borderColor: barColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: {
                            color: '#5a6478',
                            font: { family: 'Inter', size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Risk Score Range',
                            color: '#5a6478',
                            font: { family: 'Inter', size: 12, weight: '500' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: {
                            color: '#5a6478',
                            font: { family: 'Inter', size: 11 },
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Number of Customers',
                            color: '#5a6478',
                            font: { family: 'Inter', size: 12, weight: '500' }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(14, 21, 38, 0.95)',
                        titleColor: '#e8edf5',
                        bodyColor: '#8892a4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { family: 'Inter', size: 13, weight: '600' },
                        bodyFont: { family: 'Inter', size: 12 }
                    }
                }
            }
        });
    }

    renderTopRiskyCustomers(results) {
        const container = document.getElementById('top-risky-list');
        if (!container) return;

        const sorted = [...results].sort((a, b) => b.prediction.score - a.prediction.score);
        const top5 = sorted.slice(0, 5);

        container.innerHTML = top5.map((r, i) => `
            <div class="top-risk-item" onclick="app.showCustomerDetail('${r.customer.customer_id}')">
                <div class="top-risk-rank">${i + 1}</div>
                <div class="top-risk-info">
                    <div class="top-risk-name">${r.customer.name}</div>
                    <div class="top-risk-meta">${r.customer.customer_id} · ₹${r.customer.loan_amount.toLocaleString()}</div>
                </div>
                <div class="top-risk-score" style="color: ${r.prediction.color}">${r.prediction.score}</div>
            </div>
        `).join('');
    }

    renderCustomerTrend(trendData, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        this.charts[canvasId] = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Risk Score',
                    data: trendData.scores,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#0c1220',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { color: '#5a6478', font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { color: '#5a6478', font: { family: 'Inter', size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(14, 21, 38, 0.95)',
                        titleColor: '#e8edf5',
                        bodyColor: '#8892a4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                }
            }
        });
    }

    renderPortfolioTrend(results) {
        const ctx = document.getElementById('portfolioTrendChart');
        if (!ctx) return;

        if (this.charts.portfolioTrend) this.charts.portfolioTrend.destroy();

        // Generate 6-month portfolio trend
        const engine = new RiskEngine();
        const months = [];
        const avgScores = [];
        const atRiskCounts = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

            // Simulate portfolio metrics over time
            const variance = (Math.random() - 0.3) * 8;
            const avgScore = Math.round(results.reduce((s, r) => s + r.prediction.score, 0) / results.length + variance + i * 1.5);
            avgScores.push(Math.min(100, Math.max(0, avgScore)));
            atRiskCounts.push(Math.max(0, Math.round(results.filter(r => r.prediction.score > 50).length + (Math.random() - 0.5) * 3)));
        }

        this.charts.portfolioTrend = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Avg Risk Score',
                        data: avgScores,
                        borderColor: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.08)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#818cf8',
                        pointBorderColor: '#0c1220',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        borderWidth: 2.5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'At-Risk Count',
                        data: atRiskCounts,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.08)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#f97316',
                        pointBorderColor: '#0c1220',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        borderWidth: 2.5,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { color: '#5a6478', font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { color: '#818cf8', font: { family: 'Inter', size: 11 } },
                        title: {
                            display: true,
                            text: 'Avg Score',
                            color: '#818cf8',
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#f97316', font: { family: 'Inter', size: 11 } },
                        title: {
                            display: true,
                            text: 'At-Risk',
                            color: '#f97316',
                            font: { family: 'Inter', size: 11 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8892a4',
                            font: { family: 'Inter', size: 12, weight: '500' },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(14, 21, 38, 0.95)',
                        titleColor: '#e8edf5',
                        bodyColor: '#8892a4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                }
            }
        });
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });
        this.charts = {};
    }
}

window.DashboardManager = DashboardManager;

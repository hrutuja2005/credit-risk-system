// ============================================================
// Credit Risk API Client - Fetches from Python Backend
// ============================================================

class RiskEngine {
    constructor() {
        this.apiUrl = '/api'; // Because it's served by the same FastAPI server
    }

    async predictRisk(customer) {
        try {
            const response = await fetch(`${this.apiUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customer)
            });
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            }
            throw new Error('Prediction failed on backend.');
        } catch (error) {
            console.error('Error fetching prediction:', error);
            return null;
        }
    }

    async simulateRisk(customer, modifications) {
        try {
            const response = await fetch(`${this.apiUrl}/simulate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customer, modifications })
            });
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            }
            throw new Error('Simulation failed on backend.');
        } catch (error) {
            console.error('Error fetching simulation:', error);
            return null;
        }
    }

    async generateTrendData(customer, periods = 6) {
        // Trend generation is still perfectly fine to do lightly on frontend
        // since it just iterates the predict func, but because predict is now async,
        // we'll just mock it directly for the frontend charts based on the current score
        
        const currentPrediction = await this.predictRisk(customer);
        if (!currentPrediction) return null;

        const trend = [];
        const labels = [];
        const now = new Date();

        for (let i = periods - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

            const variance = (Math.random() - 0.4) * 15 * (i / periods);
            const historicalScore = Math.max(0, Math.min(100,
                currentPrediction.score + variance + (i * 2)
            ));
            trend.push(Math.round(historicalScore));
        }
        trend[trend.length - 1] = currentPrediction.score;

        return { labels, scores: trend };
    }

    async processAll(customers) {
        // Batch process them through the API
        // For production, we'd add a true /batch_predict endpoint to avoid 500 requests at once
        // But for demo, we'll Promise.all them
        const promises = customers.map(async (c) => {
            const prediction = await this.predictRisk(c);
            return { customer: c, prediction };
        });
        
        return await Promise.all(promises);
    }

    getSummaryStats(results) {
        const total = results.length;
        const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        let totalScore = 0;
        let highestRisk = { score: 0, customer: null };
        let lowestRisk = { score: 100, customer: null };

        for (const r of results) {
            if (!r.prediction) continue;
            distribution[r.prediction.level]++;
            totalScore += r.prediction.score;

            if (r.prediction.score > highestRisk.score) {
                highestRisk = { score: r.prediction.score, customer: r.customer };
            }
            if (r.prediction.score < lowestRisk.score) {
                lowestRisk = { score: r.prediction.score, customer: r.customer };
            }
        }

        return {
            total,
            distribution,
            averageScore: Math.round(totalScore / total) || 0,
            highestRisk,
            lowestRisk,
            atRiskCount: distribution.HIGH + distribution.CRITICAL,
            atRiskPercentage: total > 0 ? Math.round(((distribution.HIGH + distribution.CRITICAL) / total) * 100) : 0
        };
    }
}

window.RiskEngine = RiskEngine;

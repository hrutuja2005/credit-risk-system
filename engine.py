# engine.py
# The core mathematical calculation engine migrated from JavaScript to Python

class RiskEngine:
    def __init__(self):
        self.weights = {
            'creditScore': 0.25,
            'dti': 0.20,
            'paymentHistory': 0.20,
            'employment': 0.10,
            'loanToIncome': 0.10,
            'loanBurden': 0.10,
            'ageFactor': 0.05
        }

        self.risk_levels = {
            'LOW': {'label': 'Low', 'min': 0, 'max': 25, 'color': '#00c853', 'bg': 'rgba(0,200,83,0.12)', 'icon': '✅'},
            'MEDIUM': {'label': 'Medium', 'min': 26, 'max': 50, 'color': '#ffd600', 'bg': 'rgba(255,214,0,0.12)', 'icon': '⚠️'},
            'HIGH': {'label': 'High', 'min': 51, 'max': 75, 'color': '#ff6d00', 'bg': 'rgba(255,109,0,0.12)', 'icon': '🔶'},
            'CRITICAL': {'label': 'Critical', 'min': 76, 'max': 100, 'color': '#ff1744', 'bg': 'rgba(255,23,68,0.12)', 'icon': '🔴'}
        }

    def _safe_float(self, val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    def predict_risk(self, c):
        # Validate inputs safely
        income = self._safe_float(c.get('income', 1))
        if income == 0: income = 1
        emi = self._safe_float(c.get('emi', 0))
        credit_score = self._safe_float(c.get('credit_score', 300))
        missed = self._safe_float(c.get('missed_payments', 0))
        employment = self._safe_float(c.get('employment_years', 0))
        loan_amount = self._safe_float(c.get('loan_amount', 0))
        existing_loans = self._safe_float(c.get('existing_loans', 0))
        age = self._safe_float(c.get('age', 18))

        dti_ratio = (emi / income) * 100
        lti_ratio = loan_amount / (income * 12)

        factors = {
            'creditScore': {
                'name': 'Credit Score',
                'value': credit_score,
                'risk': self.credit_score_risk(credit_score),
                'weight': self.weights['creditScore'],
                'detail': f"Score: {int(credit_score)}/850"
            },
            'dti': {
                'name': 'Debt-to-Income Ratio',
                'value': f"{dti_ratio:.1f}",
                'risk': self.dti_risk(dti_ratio),
                'weight': self.weights['dti'],
                'detail': f"EMI ₹{int(emi):,} on ₹{int(income):,} income ({dti_ratio:.1f}%)"
            },
            'paymentHistory': {
                'name': 'Payment History',
                'value': missed,
                'risk': self.payment_history_risk(missed),
                'weight': self.weights['paymentHistory'],
                'detail': f"{int(missed)} missed payment(s)"
            },
            'employment': {
                'name': 'Employment Stability',
                'value': employment,
                'risk': self.employment_risk(employment),
                'weight': self.weights['employment'],
                'detail': f"{int(employment)} years employed"
            },
            'loanToIncome': {
                'name': 'Loan-to-Income Ratio',
                'value': f"{lti_ratio:.1f}",
                'risk': self.loan_to_income_risk(lti_ratio),
                'weight': self.weights['loanToIncome'],
                'detail': f"Loan ₹{int(loan_amount):,} vs Annual Income ₹{int(income * 12):,}"
            },
            'loanBurden': {
                'name': 'Existing Loan Burden',
                'value': existing_loans,
                'risk': self.loan_burden_risk(existing_loans),
                'weight': self.weights['loanBurden'],
                'detail': f"{int(existing_loans)} active loan(s)"
            },
            'ageFactor': {
                'name': 'Age Risk Factor',
                'value': age,
                'risk': self.age_risk(age),
                'weight': self.weights['ageFactor'],
                'detail': f"Age: {int(age)} years"
            }
        }

        score = self.calculate_score(factors)
        level = self.get_level(score)
        level_info = self.risk_levels[level]
        explanation = self.get_explanation(factors)
        recommendations = self.get_recommendations(level, factors, missed, dti_ratio)

        return {
            'score': int(round(score)),
            'level': level,
            'levelLabel': level_info['label'],
            'color': level_info['color'],
            'bg': level_info['bg'],
            'icon': level_info['icon'],
            'factors': factors,
            'explanation': explanation,
            'recommendations': recommendations
        }

    def calculate_score(self, factors):
        score = 0
        for k, v in factors.items():
            score += v['risk'] * v['weight']
        return min(100, max(0, score))

    def credit_score_risk(self, score):
        if score >= 800: return 5
        if score >= 750: return 15
        if score >= 700: return 30
        if score >= 650: return 50
        if score >= 600: return 70
        if score >= 550: return 85
        return 100

    def dti_risk(self, ratio):
        if ratio <= 10: return 5
        if ratio <= 20: return 20
        if ratio <= 30: return 40
        if ratio <= 40: return 60
        if ratio <= 50: return 80
        return 100

    def payment_history_risk(self, missed):
        if missed == 0: return 0
        if missed == 1: return 25
        if missed == 2: return 45
        if missed <= 4: return 65
        if missed <= 6: return 85
        return 100

    def employment_risk(self, years):
        if years >= 10: return 5
        if years >= 5: return 20
        if years >= 3: return 40
        if years >= 1: return 65
        return 90

    def loan_to_income_risk(self, ratio):
        if ratio <= 1: return 10
        if ratio <= 2: return 25
        if ratio <= 3: return 45
        if ratio <= 5: return 65
        if ratio <= 7: return 80
        return 95

    def loan_burden_risk(self, loans):
        if loans <= 1: return 10
        if loans == 2: return 30
        if loans == 3: return 55
        if loans == 4: return 75
        return 95

    def age_risk(self, age):
        if 30 <= age <= 50: return 10
        if 25 <= age <= 55: return 25
        if age >= 22: return 45
        return 70

    def get_level(self, score):
        if score <= 25: return 'LOW'
        if score <= 50: return 'MEDIUM'
        if score <= 75: return 'HIGH'
        return 'CRITICAL'

    def get_explanation(self, factors):
        # Sort factors by contribution
        factors_list = []
        for k, f in factors.items():
            contrib = f['risk'] * f['weight']
            factors_list.append({**f, 'contribution': contrib})
            
        factors_list.sort(key=lambda x: x['contribution'], reverse=True)
        top_factors = factors_list[:4]

        explanations = []
        for f in top_factors:
            severity = 'low'
            if f['risk'] >= 70: severity = 'critical'
            elif f['risk'] >= 50: severity = 'high'
            elif f['risk'] >= 30: severity = 'moderate'

            explanations.append({
                'factor': f['name'],
                'detail': f['detail'],
                'riskContribution': int(round(f['contribution'])),
                'severity': severity,
                'riskScore': int(round(f['risk']))
            })
        return explanations

    def get_recommendations(self, level, factors, missed, dti_ratio):
        recommendations = []
        if level == 'LOW':
            recommendations.append({'type': 'positive', 'icon': '✅', 'title': 'Continue Standard Monitoring', 'detail': 'Customer shows healthy repayment patterns. Maintain quarterly review cycle.'})
            recommendations.append({'type': 'positive', 'icon': '💰', 'title': 'Consider Rate Reduction', 'detail': 'Good performance may qualify for interest rate reduction to improve retention.'})
        elif level == 'MEDIUM':
            recommendations.append({'type': 'warning', 'icon': '📊', 'title': 'Enhanced Monitoring Required', 'detail': 'Move to monthly review cycle. Track payment patterns closely.'})
            recommendations.append({'type': 'info', 'icon': '📞', 'title': 'Proactive Customer Outreach', 'detail': 'Schedule a financial health check call with the customer.'})
        elif level == 'HIGH':
            recommendations.append({'type': 'danger', 'icon': '🚨', 'title': 'Immediate Review Required', 'detail': 'Escalate to senior risk officer for detailed assessment within 48 hours.'})
            recommendations.append({'type': 'warning', 'icon': '🔄', 'title': 'Loan Restructuring', 'detail': 'Evaluate loan restructuring options — extend tenure or reduce EMI.'})
            recommendations.append({'type': 'info', 'icon': '📋', 'title': 'Increase Collateral', 'detail': 'Request additional collateral or guarantor to mitigate exposure.'})
        elif level == 'CRITICAL':
            recommendations.append({'type': 'danger', 'icon': '⛔', 'title': 'Freeze Further Disbursements', 'detail': 'Immediately halt any pending disbursements for this customer.'})
            recommendations.append({'type': 'danger', 'icon': '🏛️', 'title': 'Initiate Recovery Process', 'detail': 'Begin pre-legal recovery proceedings. Send formal notice within 7 days.'})
            recommendations.append({'type': 'warning', 'icon': '📉', 'title': 'Provision for Loss', 'detail': 'Increase provisioning for potential NPA classification.'})
            recommendations.append({'type': 'info', 'icon': '🤝', 'title': 'Settlement Discussion', 'detail': 'Explore one-time settlement options to minimize loss.'})

        if factors['paymentHistory']['risk'] >= 60:
            recommendations.append({'type': 'warning', 'icon': '📅', 'title': 'Payment Reminder System', 'detail': f"Customer has {int(missed)} missed payments. Set up auto-debit or SMS reminders."})
        if factors['dti']['risk'] >= 60:
            recommendations.append({'type': 'info', 'icon': '💳', 'title': 'Consolidate Debt', 'detail': 'High DTI ratio. Suggest debt consolidation to reduce monthly burden.'})

        return recommendations

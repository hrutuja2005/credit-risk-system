// ============================================================
// Report Generator - PDF & CSV Export
// ============================================================

class ReportGenerator {

    static generatePDF(results, stats) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 20;

        // --- Helper Functions ---
        const addTitle = (text, size = 16) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(text, margin, y);
            y += size * 0.5 + 4;
        };

        const addSubtitle = (text, size = 11) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(text, margin, y);
            y += size * 0.4 + 4;
        };

        const addLine = () => {
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;
        };

        const checkPageBreak = (needed = 40) => {
            if (y + needed > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        };

        // --- Header ---
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Credit Risk Assessment Report', margin, 22);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 32);
        doc.text(`Total Customers Analyzed: ${stats.total}`, margin, 39);
        y = 55;

        // --- Executive Summary ---
        addTitle('Executive Summary');
        addLine();

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const summaryText = [
            `Portfolio Size: ${stats.total} customers`,
            `Average Risk Score: ${stats.averageScore}/100`,
            `At-Risk Customers: ${stats.atRiskCount} (${stats.atRiskPercentage}%)`,
            `Risk Distribution - Low: ${stats.distribution.LOW} | Medium: ${stats.distribution.MEDIUM} | High: ${stats.distribution.HIGH} | Critical: ${stats.distribution.CRITICAL}`
        ];
        summaryText.forEach(line => {
            doc.text(`• ${line}`, margin + 2, y);
            y += 6;
        });
        y += 6;

        // --- Risk Distribution ---
        checkPageBreak(60);
        addTitle('Risk Distribution', 14);
        addLine();

        const distData = [
            { level: 'Low Risk', count: stats.distribution.LOW, color: [34, 197, 94] },
            { level: 'Medium Risk', count: stats.distribution.MEDIUM, color: [234, 179, 8] },
            { level: 'High Risk', count: stats.distribution.HIGH, color: [249, 115, 22] },
            { level: 'Critical', count: stats.distribution.CRITICAL, color: [239, 68, 68] }
        ];

        distData.forEach(d => {
            const barWidth = (d.count / stats.total) * (pageWidth - 2 * margin - 60);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text(d.level, margin, y + 4);
            doc.setFillColor(...d.color);
            doc.roundedRect(margin + 50, y - 1, Math.max(barWidth, 2), 7, 2, 2, 'F');
            doc.setFont('helvetica', 'normal');
            doc.text(`${d.count}`, margin + 55 + barWidth, y + 4);
            y += 12;
        });
        y += 6;

        // --- Customer Details Table ---
        checkPageBreak(40);
        addTitle('Customer Risk Assessment Details', 14);
        addLine();

        // Table header
        const cols = [
            { header: 'ID', x: margin, width: 18 },
            { header: 'Customer Name', x: margin + 18, width: 40 },
            { header: 'Score', x: margin + 58, width: 18 },
            { header: 'Risk Level', x: margin + 76, width: 22 },
            { header: 'Income', x: margin + 98, width: 25 },
            { header: 'Loan Amt', x: margin + 123, width: 25 },
            { header: 'EMI', x: margin + 148, width: 22 }
        ];

        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        cols.forEach(col => doc.text(col.header, col.x + 1, y));
        y += 7;

        // Table rows
        const sortedResults = [...results].sort((a, b) => b.prediction.score - a.prediction.score);
        sortedResults.forEach((r, idx) => {
            checkPageBreak(8);
            if (idx % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F');
            }

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(r.customer.customer_id, cols[0].x + 1, y);
            doc.text(r.customer.name.substring(0, 22), cols[1].x + 1, y);

            // Score with color
            const sc = r.prediction.score;
            if (sc > 75) doc.setTextColor(239, 68, 68);
            else if (sc > 50) doc.setTextColor(249, 115, 22);
            else if (sc > 25) doc.setTextColor(202, 138, 4);
            else doc.setTextColor(22, 163, 74);
            doc.setFont('helvetica', 'bold');
            doc.text(sc.toString(), cols[2].x + 1, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(r.prediction.levelLabel, cols[3].x + 1, y);
            doc.text(`₹${(r.customer.income / 1000).toFixed(0)}K`, cols[4].x + 1, y);
            doc.text(`₹${(r.customer.loan_amount / 1000).toFixed(0)}K`, cols[5].x + 1, y);
            doc.text(`₹${(r.customer.emi / 1000).toFixed(1)}K`, cols[6].x + 1, y);
            y += 7;
        });
        y += 8;

        // --- High Risk Customer Recommendations ---
        const highRiskResults = sortedResults.filter(r => r.prediction.score > 50);
        if (highRiskResults.length > 0) {
            doc.addPage();
            y = 20;
            addTitle('High Risk Customer Recommendations', 14);
            addLine();

            highRiskResults.slice(0, 8).forEach(r => {
                checkPageBreak(35);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`${r.customer.name} (${r.customer.customer_id}) — Score: ${r.prediction.score}`, margin, y);
                y += 6;

                r.prediction.recommendations.slice(0, 3).forEach(rec => {
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(71, 85, 105);
                    const lines = doc.splitTextToSize(`${rec.icon} ${rec.title}: ${rec.detail}`, pageWidth - 2 * margin - 5);
                    doc.text(lines, margin + 3, y);
                    y += lines.length * 4 + 2;
                });
                y += 4;
            });
        }

        // --- Footer on last page ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Credit Risk & Loan Default Early Warning System — Page ${i} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save('Credit_Risk_Report.pdf');
    }

    static generateCSV(results) {
        const headers = [
            'Customer ID', 'Name', 'Age', 'Income', 'Loan Amount', 'EMI',
            'Credit Score', 'Missed Payments', 'Employment Years', 'Existing Loans',
            'Loan Tenure', 'Risk Score', 'Risk Level', 'Top Risk Factor', 'Primary Recommendation'
        ];

        const rows = results.map(r => [
            r.customer.customer_id,
            r.customer.name,
            r.customer.age,
            r.customer.income,
            r.customer.loan_amount,
            r.customer.emi,
            r.customer.credit_score,
            r.customer.missed_payments,
            r.customer.employment_years,
            r.customer.existing_loans,
            r.customer.loan_tenure_months,
            r.prediction.score,
            r.prediction.levelLabel,
            r.prediction.explanation[0]?.factor || 'N/A',
            r.prediction.recommendations[0]?.title || 'N/A'
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(val => {
                const str = String(val);
                return str.includes(',') ? `"${str}"` : str;
            }).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        ReportGenerator.downloadFile(blob, 'Credit_Risk_Data.csv');
    }

    static downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}

window.ReportGenerator = ReportGenerator;

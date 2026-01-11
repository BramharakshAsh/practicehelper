
export const statutoryAuditTemplate = {
    name: "Statutory Audit Master Template",
    description: "Comprehensive end-to-end statutory audit checklist covering setup, cycles, and reporting.",
    sections: [
        {
            title: "1. Audit Setup & Planning (Foundation)",
            groups: [
                {
                    title: "Engagement & Data Integrity",
                    subGroups: [
                        {
                            title: "Master Data & Internal Controls",
                            items: [
                                "Obtain Trial Balance (TB), General Ledger (GL), and previous year’s audited financials.",
                                "Perform Data Integrity Check: Ensure TB totals match GL and financial statements.",
                                "Vouching: Sample-based verification of primary source documents (Invoices, Debit/Credit Notes)."
                            ]
                        },
                        {
                            title: "Banking & Liquidity",
                            items: [
                                "BRS Verification: Review Bank Reconciliation Statements for all accounts; investigate checks stale for >6 months.",
                                "Verify Cash-in-hand via physical verification certificates or surprise counts."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "2. Procurement & Payables Cycle",
            groups: [
                {
                    title: "Expenditure & Liabilities",
                    subGroups: [
                        {
                            title: "Accounts Payable (AP) Scrutiny",
                            items: [
                                "Aging Analysis: Review 30/60/90+ day buckets; investigate long-standing overdues.",
                                "MSME Compliance: Verify vendor classification; ensure payments are within 45 days (or per agreement) to avoid interest and tax disallowance.",
                                "Debit Balance Review: Investigate vendors with debit balances (potential advances or double payments)."
                            ]
                        },
                        {
                            title: "Statutory Deductions (TDS Payable)",
                            items: [
                                "TDS Scrutiny: Cross-verify expense heads (Rent, Professional Fees, Contractors) with applicable TDS sections.",
                                "TDS Reconciliation: Match GL 'TDS Payable' with Challans and Form 26AS/AIS.",
                                "Check for Interest/Penalties on late deduction or late deposit."
                            ]
                        },
                        {
                            title: "Expense Recognition",
                            items: [
                                "Prepaid Expenses: Verify amortization schedules for insurance, AMC, or software subs.",
                                "Provisioning: Check for month-end accruals (Electricity, Telephone, Audit Fees) to ensure 'Matching Principle' compliance."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "3. Revenue & Receivables Cycle",
            groups: [
                {
                    title: "Sales & Assets",
                    subGroups: [
                        {
                            title: "Revenue Assurance",
                            items: [
                                "GST Output vs. Sales: Reconcile GSTR-1 and GSTR-3B with Sales Register.",
                                "Cut-off Testing: Ensure sales at year-end are recorded in the correct period."
                            ]
                        },
                        {
                            title: "Debtor Scrutiny",
                            items: [
                                "Aging Analysis: Verify recoverability of old debts; check for 'Provision for Bad Debts' necessity.",
                                "Balance Confirmation: Send/Review external confirmation letters for major balances."
                            ]
                        },
                        {
                            title: "Direct Tax Receivables",
                            items: [
                                "TDS Receivable Scrutiny: Reconcile TDS certificates/Form 26AS with 'TDS Receivable' in the books.",
                                "Identify and write off non-refundable or irreconcilable TDS entries."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "4. Statutory & Regulatory Compliance",
            groups: [
                {
                    title: "Indirect Tax & Payroll",
                    subGroups: [
                        {
                            title: "GST Input Tax Credit (ITC)",
                            items: [
                                "ITC Reconciliation: Reconcile GSTR-2B (Auto-populated) with Purchase Register.",
                                "Verify 'Rule 37' compliance (reversal of ITC for non-payment to vendors within 180 days)."
                            ]
                        },
                        {
                            title: "Payroll & Labor Law",
                            items: [
                                "Salary Verification: Cross-check monthly payroll sheets with bank transfers and CTC structures.",
                                "Employee Taxes: Verify PF, ESI, and Professional Tax (PT) calculations and timely deposits.",
                                "Bonus/Gratuity: Check for adequate provisioning based on actuarial valuation or statutory limits."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "5. Fixed Assets & Capital Expenditure",
            groups: [
                {
                    title: "Long-Term Assets",
                    subGroups: [
                        {
                            title: "Fixed Asset Register (FAR)",
                            items: [
                                "Verify FAR is maintained with location, cost, and unique ID.",
                                "Depreciation: Recalculate depreciation as per Companies Act (Useful Life) vs. Income Tax Act (Block of Assets).",
                                "Physical Verification: Sample check of assets’ existence and condition."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "6. Financial Analysis & Finalization",
            groups: [
                {
                    title: "Profit & Loss and Balance Sheet",
                    subGroups: [
                        {
                            title: "Analytical Procedures",
                            items: [
                                "P&L Scrutiny: Comparative analysis (YoY) of major expense heads; investigate variances >10%.",
                                "Ratio Analysis: GP Margin, Net Margin, and Debt-Equity ratio checks."
                            ]
                        },
                        {
                            title: "Miscellaneous Balance Sheet Items",
                            items: [
                                "Scrutinize Loans, Advances, and 'Other Current Liabilities/Assets.'",
                                "Verify Contingent Liabilities (Litigations, Guarantees)."
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: "7. Audit Reporting & Closing",
            groups: [
                {
                    title: "Reporting & Representation",
                    subGroups: [
                        {
                            title: "Tax Computation",
                            items: [
                                "Prepare/Review Income Tax computation including Deferred Tax (AS-22/Ind-AS 12).",
                                "Check for disallowances under Section 40(a)(ia) for TDS defaults."
                            ]
                        },
                        {
                            title: "Final Deliverables",
                            items: [
                                "Financial Statement Prep/Verification: Ensure compliance with Schedule III (or relevant local standards).",
                                "Management Representation Letter (MRL): Draft and obtain signed MRL covering management responsibilities.",
                                "Audit Report: Issue the final Independent Auditor’s Report with required disclosures (CARO, etc., if applicable)."
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

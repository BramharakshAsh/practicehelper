
-- Seeding Statutory Audit Master Template
DO $$
DECLARE
    template_id uuid;
    sec1_id uuid;
    sec2_id uuid;
    sec3_id uuid;
    sec4_id uuid;
    sec5_id uuid;
    sec6_id uuid;
    sec7_id uuid;
    grp_id uuid;
    subgrp_id uuid;
BEGIN
    -- 1. Create Template
    INSERT INTO audit_plan_templates (name, description, is_active)
    VALUES ('Statutory Audit Master Template', 'Comprehensive end-to-end statutory audit checklist covering setup, cycles, and reporting.', true)
    RETURNING id INTO template_id;

    -- SECTION 1
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '1. Audit Setup & Planning (Foundation)', 0) RETURNING id INTO sec1_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec1_id, 'Engagement & Data Integrity', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Master Data & Internal Controls', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Obtain Trial Balance (TB), General Ledger (GL), and previous year’s audited financials.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Perform Data Integrity Check: Ensure TB totals match GL and financial statements.', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Vouching: Sample-based verification of primary source documents (Invoices, Debit/Credit Notes).', 2);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Banking & Liquidity', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'BRS Verification: Review Bank Reconciliation Statements for all accounts; investigate checks stale for >6 months.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Verify Cash-in-hand via physical verification certificates or surprise counts.', 1);

    -- SECTION 2
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '2. Procurement & Payables Cycle', 1) RETURNING id INTO sec2_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec2_id, 'Expenditure & Liabilities', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Accounts Payable (AP) Scrutiny', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Aging Analysis: Review 30/60/90+ day buckets; investigate long-standing overdues.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'MSME Compliance: Verify vendor classification; ensure payments are within 45 days (or per agreement) to avoid interest and tax disallowance.', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Debit Balance Review: Investigate vendors with debit balances (potential advances or double payments).', 2);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Statutory Deductions (TDS Payable)', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'TDS Scrutiny: Cross-verify expense heads (Rent, Professional Fees, Contractors) with applicable TDS sections.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'TDS Reconciliation: Match GL ''TDS Payable'' with Challans and Form 26AS/AIS.', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Check for Interest/Penalties on late deduction or late deposit.', 2);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Expense Recognition', 2) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Prepaid Expenses: Verify amortization schedules for insurance, AMC, or software subs.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Provisioning: Check for month-end accruals (Electricity, Telephone, Audit Fees) to ensure ''Matching Principle'' compliance.', 1);

    -- SECTION 3
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '3. Revenue & Receivables Cycle', 2) RETURNING id INTO sec3_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec3_id, 'Sales & Assets', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Revenue Assurance', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'GST Output vs. Sales: Reconcile GSTR-1 and GSTR-3B with Sales Register.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Cut-off Testing: Ensure sales at year-end are recorded in the correct period.', 1);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Debtor Scrutiny', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Aging Analysis: Verify recoverability of old debts; check for ''Provision for Bad Debts'' necessity.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Balance Confirmation: Send/Review external confirmation letters for major balances.', 1);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Direct Tax Receivables', 2) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'TDS Receivable Scrutiny: Reconcile TDS certificates/Form 26AS with ''TDS Receivable'' in the books.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Identify and write off non-refundable or irreconcilable TDS entries.', 1);

    -- SECTION 4
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '4. Statutory & Regulatory Compliance', 3) RETURNING id INTO sec4_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec4_id, 'Indirect Tax & Payroll', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'GST Input Tax Credit (ITC)', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'ITC Reconciliation: Reconcile GSTR-2B (Auto-populated) with Purchase Register.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Verify ''Rule 37'' compliance (reversal of ITC for non-payment to vendors within 180 days).', 1);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Payroll & Labor Law', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Salary Verification: Cross-check monthly payroll sheets with bank transfers and CTC structures.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Employee Taxes: Verify PF, ESI, and Professional Tax (PT) calculations and timely deposits.', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Bonus/Gratuity: Check for adequate provisioning based on actuarial valuation or statutory limits.', 2);

    -- SECTION 5
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '5. Fixed Assets & Capital Expenditure', 4) RETURNING id INTO sec5_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec5_id, 'Long-Term Assets', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Fixed Asset Register (FAR)', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Verify FAR is maintained with location, cost, and unique ID.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Depreciation: Recalculate depreciation as per Companies Act (Useful Life) vs. Income Tax Act (Block of Assets).', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Physical Verification: Sample check of assets’ existence and condition.', 2);

    -- SECTION 6
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '6. Financial Analysis & Finalization', 5) RETURNING id INTO sec6_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec6_id, 'Profit & Loss and Balance Sheet', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Analytical Procedures', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'P&L Scrutiny: Comparative analysis (YoY) of major expense heads; investigate variances >10%.', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Ratio Analysis: GP Margin, Net Margin, and Debt-Equity ratio checks.', 1);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Miscellaneous Balance Sheet Items', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Scrutinize Loans, Advances, and ''Other Current Liabilities/Assets.''', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Verify Contingent Liabilities (Litigations, Guarantees).', 1);

    -- SECTION 7
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (template_id, '7. Audit Reporting & Closing', 6) RETURNING id INTO sec7_id;
    
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, sec7_id, 'Reporting & Representation', 0) RETURNING id INTO grp_id;

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Tax Computation', 0) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Prepare/Review Income Tax computation including Deferred Tax (AS-22/Ind-AS 12).', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Check for disallowances under Section 40(a)(ia) for TDS defaults.', 1);

    INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
    VALUES (template_id, grp_id, 'Final Deliverables', 1) RETURNING id INTO subgrp_id;
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Financial Statement Prep/Verification: Ensure compliance with Schedule III (or relevant local standards).', 0);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Management Representation Letter (MRL): Draft and obtain signed MRL covering management responsibilities.', 1);
    INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (template_id, subgrp_id, 'Audit Report: Issue the final Independent Auditor’s Report with required disclosures (CARO, etc., if applicable).', 2);

END $$;

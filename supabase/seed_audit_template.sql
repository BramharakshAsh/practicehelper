DO $$
DECLARE
    t_id uuid;
    -- Level 1: Head-groups
    sec1_id uuid; sec2_id uuid; sec3_id uuid; sec4_id uuid; 
    sec5_id uuid; sec6_id uuid; sec7_id uuid;
    -- Level 2: Sub-groups
    grp_id uuid;
    -- Level 3: Tasks
    sgrp_id uuid;
BEGIN
    -- 1. Idempotency Check: Remove existing template with this name to avoid PK/Unique violations
    DELETE FROM audit_plan_templates WHERE name = 'Statutory Audit Master Template';

    -- 2. Create Template
    INSERT INTO audit_plan_templates (name, description, is_active)
    VALUES ('Statutory Audit Master Template', 'Comprehensive end-to-end statutory audit checklist.', true)
    RETURNING id INTO t_id;

    ---------------------------------------------------------------------------
    -- SECTION 1: AUDIT SETUP
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '1. Audit Setup & Planning (Foundation)', 0) RETURNING id INTO sec1_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec1_id, 'Engagement & Data Integrity', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Master Data & Internal Controls', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Obtain Trial Balance (TB), General Ledger (GL), and previous year’s audited financials.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Perform Data Integrity Check: Ensure TB totals match GL and financial statements.', 1);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Vouching: Sample-based verification of primary source documents.', 2);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Banking & Liquidity', 1) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'BRS Verification: Review Bank Reconciliation Statements; check stale checks.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Verify Cash-in-hand via physical verification.', 1);

    ---------------------------------------------------------------------------
    -- SECTION 2: PROCUREMENT & PAYABLES
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '2. Procurement & Payables Cycle', 1) RETURNING id INTO sec2_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec2_id, 'Expenditure & Liabilities', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Accounts Payable (AP) Scrutiny', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Aging Analysis: Review 30/60/90+ day buckets.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'MSME Compliance: Verify payments within 45 days.', 1);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Debit Balance Review: Investigate vendor advances.', 2);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Statutory Deductions (TDS Payable)', 1) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'TDS Scrutiny: Cross-verify expense heads with TDS sections.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'TDS Reconciliation: Match GL with Challans and 26AS/AIS.', 1);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Expense Recognition', 2) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Prepaid Expenses: Verify amortization schedules.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Provisioning: Check for month-end accruals.', 1);

    ---------------------------------------------------------------------------
    -- SECTION 3: REVENUE & RECEIVABLES
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '3. Revenue & Receivables Cycle', 2) RETURNING id INTO sec3_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec3_id, 'Sales & Assets', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Revenue Assurance', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'GST Output vs. Sales: Reconcile GSTR-1/3B with Sales Register.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Cut-off Testing: Period correctness for year-end sales.', 1);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Debtor Scrutiny', 1) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Aging Analysis & Bad Debt Provisioning.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Balance Confirmation: Review external confirmation letters.', 1);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Direct Tax Receivables', 2) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'TDS Receivable Scrutiny: Reconcile with 26AS.', 0);

    ---------------------------------------------------------------------------
    -- SECTION 4: COMPLIANCE & PAYROLL
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '4. Statutory & Regulatory Compliance', 3) RETURNING id INTO sec4_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec4_id, 'Indirect Tax & Payroll', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'GST Input Tax Credit (ITC)', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'ITC Reconciliation: GSTR-2B vs Purchase Register.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Verify Rule 37 compliance (180-day payment rule).', 1);

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Payroll & Labor Law', 1) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Salary Verification: Cross-check payroll with bank transfers.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Employee Taxes: PF, ESI, and PT deposit verification.', 1);

    ---------------------------------------------------------------------------
    -- SECTION 5: FIXED ASSETS
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '5. Fixed Assets & Capital Expenditure', 4) RETURNING id INTO sec5_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec5_id, 'Long-Term Assets', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Fixed Asset Register (FAR)', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Verify FAR maintenance (Location, Cost, ID).', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Depreciation: Recalculate per Companies Act vs IT Act.', 1);

    ---------------------------------------------------------------------------
    -- SECTION 6: FINANCIAL ANALYSIS
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '6. Financial Analysis & Finalization', 5) RETURNING id INTO sec6_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec6_id, 'Profit & Loss and Balance Sheet', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Analytical Procedures', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'P&L Scrutiny: YoY variance analysis (>10%).', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Ratio Analysis: GP, Net Margin, Debt-Equity.', 1);

    ---------------------------------------------------------------------------
    -- SECTION 7: REPORTING
    ---------------------------------------------------------------------------
    INSERT INTO audit_template_items (template_id, title, order_index)
    VALUES (t_id, '7. Audit Reporting & Closing', 6) RETURNING id INTO sec7_id;
    
        INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
        VALUES (t_id, sec7_id, 'Reporting & Representation', 0) RETURNING id INTO grp_id;

            INSERT INTO audit_template_items (template_id, parent_id, title, order_index)
            VALUES (t_id, grp_id, 'Final Deliverables', 0) RETURNING id INTO sgrp_id;
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Financial Statement Prep: Schedule III compliance.', 0);
                INSERT INTO audit_template_items (template_id, parent_id, title, order_index) VALUES (t_id, sgrp_id, 'Audit Report & MRL preparation.', 1);

    RAISE NOTICE 'Audit Template created with ID: %', t_id;
END $$;
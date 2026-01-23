import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    try {
        console.log('[RecurringTasks] Starting daily task generation check...')

        // Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const today = new Date()
        const currentDay = today.getDate()

        console.log(`[RecurringTasks] Current day: ${currentDay}`)

        // Find all active rules that should run today
        const { data: rules, error: rulesError } = await supabase
            .from('recurring_task_rules')
            .select('*')
            .eq('is_active', true)
            .eq('execution_day', currentDay)

        if (rulesError) {
            console.error('[RecurringTasks] Error fetching rules:', rulesError)
            throw rulesError
        }

        console.log(`[RecurringTasks] Found ${rules?.length || 0} active rules for day ${currentDay}`)

        let tasksCreated = 0
        let errors = []

        for (const rule of rules || []) {
            try {
                // Check if we already generated for this period
                const shouldGenerate = !rule.last_generated_at ||
                    isNewPeriod(rule.last_generated_at, rule.frequency)

                if (!shouldGenerate) {
                    console.log(`[RecurringTasks] Skipping rule ${rule.id} - already generated for this period`)
                    continue
                }

                // Calculate due date based on frequency
                const dueDate = calculateDueDate(today, rule.frequency, rule.execution_day)

                // Generate period string
                const period = generatePeriodString(today, rule.frequency)

                // Create the task
                const { error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                        firm_id: rule.firm_id,
                        client_id: rule.client_id,
                        staff_id: rule.staff_id,
                        compliance_type_id: rule.compliance_type_id,
                        assigned_by: rule.staff_id, // Auto-assigned by system
                        title: rule.title,
                        description: rule.description,
                        priority: rule.priority,
                        status: 'assigned',
                        due_date: dueDate,
                        period: period,
                    })

                if (taskError) {
                    console.error(`[RecurringTasks] Error creating task for rule ${rule.id}:`, taskError)
                    errors.push({ ruleId: rule.id, error: taskError.message })
                    continue
                }

                // Update last_generated_at
                await supabase
                    .from('recurring_task_rules')
                    .update({ last_generated_at: new Date().toISOString() })
                    .eq('id', rule.id)

                tasksCreated++
                console.log(`[RecurringTasks] Created task for rule ${rule.id}: ${rule.title}`)

            } catch (ruleError) {
                console.error(`[RecurringTasks] Error processing rule ${rule.id}:`, ruleError)
                errors.push({ ruleId: rule.id, error: ruleError.message })
            }
        }

        const result = {
            success: true,
            tasksCreated,
            rulesProcessed: rules?.length || 0,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        }

        console.log('[RecurringTasks] Completed:', result)

        return new Response(
            JSON.stringify(result),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[RecurringTasks] Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

function isNewPeriod(lastGenerated: string, frequency: string): boolean {
    const last = new Date(lastGenerated)
    const now = new Date()

    switch (frequency) {
        case 'monthly':
            return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear()
        case 'quarterly':
            return Math.floor(last.getMonth() / 3) !== Math.floor(now.getMonth() / 3) ||
                last.getFullYear() !== now.getFullYear()
        case 'yearly':
            return last.getFullYear() !== now.getFullYear()
        default:
            return true
    }
}

function calculateDueDate(baseDate: Date, frequency: string, executionDay: number): string {
    const date = new Date(baseDate)

    switch (frequency) {
        case 'monthly':
            // Due next month
            date.setMonth(date.getMonth() + 1)
            break
        case 'quarterly':
            // Due next quarter
            date.setMonth(date.getMonth() + 3)
            break
        case 'yearly':
            // Due next year
            date.setFullYear(date.getFullYear() + 1)
            break
    }

    // Set to execution day (capped at month's last day)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    date.setDate(Math.min(executionDay, lastDay))

    return date.toISOString().split('T')[0]
}

function generatePeriodString(date: Date, frequency: string): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    switch (frequency) {
        case 'monthly':
            return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1
            return `Q${quarter} ${date.getFullYear()}`
        case 'yearly':
            return `FY ${date.getFullYear()}`
        default:
            return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    }
}

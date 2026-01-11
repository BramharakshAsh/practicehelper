
import { createClient } from '@supabase/supabase-js';
import { statutoryAuditTemplate } from './src/data/audit-templates/statutory-audit.ts';

const supabaseUrl = "https://ekartahcscinebxabmws.supabase.co";
const supabaseKey = "sb_publishable_jQcD7F3ncTmcn0oxWnhifw_LKmtWmYg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTemplate() {
    console.log('Seeding Statutory Audit Template...');

    // 1. Create the template record
    const { data: template, error: tError } = await supabase
        .from('audit_plan_templates')
        .insert({
            name: statutoryAuditTemplate.name,
            description: statutoryAuditTemplate.description,
            is_active: true
            // firm_id is null for global template
        })
        .select()
        .single();

    if (tError) {
        console.error('Error creating template:', tError.message);
        return;
    }

    console.log(`Template created with ID: ${template.id}`);

    // 2. Create items recursively
    for (let i = 0; i < statutoryAuditTemplate.sections.length; i++) {
        const section = statutoryAuditTemplate.sections[i];

        // Create Section (Level 1)
        const { data: sectionNode, error: sError } = await supabase
            .from('audit_template_items')
            .insert({
                template_id: template.id,
                title: section.title,
                order_index: i
            })
            .select()
            .single();

        if (sError) {
            console.error(`Error creating section ${section.title}:`, sError.message);
            continue;
        }

        // Create Groups (Level 2)
        for (let j = 0; j < section.groups.length; j++) {
            const group = section.groups[j];
            const { data: groupNode, error: gError } = await supabase
                .from('audit_template_items')
                .insert({
                    template_id: template.id,
                    parent_id: sectionNode.id,
                    title: group.title,
                    order_index: j
                })
                .select()
                .single();

            if (gError) continue;

            // Create SubGroups (Level 3)
            for (let k = 0; k < group.subGroups.length; k++) {
                const subGroup = group.subGroups[k];
                const { data: subGroupNode, error: sgError } = await supabase
                    .from('audit_template_items')
                    .insert({
                        template_id: template.id,
                        parent_id: groupNode.id,
                        title: subGroup.title,
                        order_index: k
                    })
                    .select()
                    .single();

                if (sgError) continue;

                // Create Leaf Items (Level 4)
                for (let l = 0; l < subGroup.items.length; l++) {
                    const itemText = subGroup.items[l];
                    await supabase
                        .from('audit_template_items')
                        .insert({
                            template_id: template.id,
                            parent_id: subGroupNode.id,
                            title: itemText,
                            order_index: l
                        });
                }
            }
        }
    }

    console.log('Seeding completed!');
}

seedTemplate();

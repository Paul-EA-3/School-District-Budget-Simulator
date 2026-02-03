import { School } from "../types";

/**
 * Harmonizes raw data from disparate API sources into the application's unified School format.
 * * @param finance_data - Raw JSON from Finance API (e.g. Socrata, State API)
 * @param assessment_data - Raw JSON from Assessment API (e.g. State Report Card API)
 * @returns Array of School objects
 */
export const harmonize_api_data = (finance_data: any, assessment_data: any): School[] => {
    const fallbackSchools: School[] = [];

    // 1. Normalize Finance Data
    // Map School Name -> Financial Metrics
    const financeMap = new Map<string, { ppe: number; poverty: number }>();
    
    // Handle different potential response structures (array vs object with results property)
    const financeList = Array.isArray(finance_data) ? finance_data : (finance_data?.results || []);
    
    financeList.forEach((record: any) => {
        // Try to identify school name using common field names
        const name = record.school_name || record.institution_name || record.name || "Unknown School";
        
        // Try to identify PPE
        let ppe = 15000; // Default fallback
        if (record.total_expenditure_per_pupil) ppe = parseFloat(record.total_expenditure_per_pupil);
        else if (record.per_pupil_spending) ppe = parseFloat(record.per_pupil_spending);
        else if (record.ppe) ppe = parseFloat(record.ppe);
        
        // Try to identify Poverty (Free/Reduced Lunch)
        let poverty = 0.5; // Default fallback
        if (record.economically_disadvantaged_pct) poverty = parseFloat(record.economically_disadvantaged_pct);
        else if (record.free_reduced_lunch_rate) poverty = parseFloat(record.free_reduced_lunch_rate);
        
        financeMap.set(name.toLowerCase().trim(), { ppe, poverty });
    });

    // 2. Normalize Assessment Data
    // Assessment data is usually the primary source for the school roster
    const assessmentList = Array.isArray(assessment_data) ? assessment_data : (assessment_data?.results || []);
    const schools: School[] = [];

    assessmentList.forEach((record: any, index: number) => {
        const rawName = record.school_name || record.institution_name || record.name;
        if (!rawName) return;
        
        const name = String(rawName).trim();
        const lowerName = name.toLowerCase();
        
        // Join with Finance Data
        const finance = financeMap.get(lowerName) || { ppe: 16000, poverty: 0.5 }; 

        // Extract Outcomes
        let math = 50;
        let ela = 50;
        
        // Math Heuristics
        if (record.math_proficiency_rate) math = parseFloat(record.math_proficiency_rate);
        else if (record.math_prof_rate) math = parseFloat(record.math_prof_rate);
        else if (record.percent_proficient_math) math = parseFloat(record.percent_proficient_math);
        
        // ELA Heuristics
        if (record.ela_proficiency_rate) ela = parseFloat(record.ela_proficiency_rate);
        else if (record.ela_prof_rate) ela = parseFloat(record.ela_prof_rate);
        else if (record.percent_proficient_ela) ela = parseFloat(record.percent_proficient_ela);
        
        // Normalize 0-1 decimal values to 0-100 percentage scale
        if (math <= 1) math *= 100;
        if (ela <= 1) ela *= 100;

        // Enrollment
        let enrollment = 500;
        if (record.enrollment) enrollment = parseInt(record.enrollment);
        else if (record.student_count) enrollment = parseInt(record.student_count);

        // Infer Type from Name
        let type: 'High' | 'Middle' | 'Elementary' = 'Elementary';
        if (lowerName.includes('high') || lowerName.includes('secondary')) type = 'High';
        else if (lowerName.includes('middle') || lowerName.includes('junior')) type = 'Middle';

        // Staffing Estimation (Ratio ~ 15:1) if actuals missing
        const totalStaff = Math.floor(enrollment / 15);
        const senior = Math.floor(totalStaff * 0.7);
        const junior = totalStaff - senior;

        schools.push({
            id: `s_${index}`,
            name: name,
            type: type,
            enrollment: enrollment,
            spendingPerPupil: finance.ppe,
            academicOutcome: {
                math: Math.round(math),
                ela: Math.round(ela)
            },
            povertyRate: finance.poverty,
            principal: "TBD", // API rarely has this
            staffing: { senior, junior }
        });
    });

    return schools.length > 0 ? schools : fallbackSchools;
};
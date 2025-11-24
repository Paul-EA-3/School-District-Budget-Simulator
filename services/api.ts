
export interface FinancialState {
  revenue: number;
  expenditure: number;
  salaries: number;
  federalRevenue: number;
  source: string;
}

/**
 * Fetches district finance data from the US Census Bureau (F-33 Survey).
 * Endpoint: https://api.census.gov/data/2021/school/finance
 * 
 * @param ncesId - The 7-digit NCES District ID (2-digit State FIPS + 5-digit LEA ID)
 * @returns FinancialState object or null
 */
export const fetchCensusFinance = async (ncesId: string): Promise<FinancialState | null> => {
  try {
    // NCES ID is 7 digits: First 2 are State FIPS, Last 5 are LEA ID
    if (!ncesId || ncesId.length < 7) return null;
    
    const stateFips = ncesId.substring(0, 2);
    const leaId = ncesId.substring(2);

    // Variables: TCREV (Total Rev), TCURINST (Current Instructional Exp), Z33 (Salaries), U11 (Federal Rev)
    const url = `https://api.census.gov/data/2021/school/finance?get=TCREV,TCURINST,Z33,U11&for=school%20district%20(elementary,%20secondary,%20or%20unified):${leaId}&in=state:${stateFips}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Census API Error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    // Census API returns [["TCREV", "TCURINST", ...], ["1000", "500", ...]]
    if (!data || data.length < 2) return null;

    const values = data[1];
    
    // Basic validation to ensure we don't return garbage (sometimes Census returns -1 or -2 for missing)
    const revenue = parseInt(values[0]);
    if (revenue <= 0) return null;

    return {
      revenue: revenue, 
      expenditure: parseInt(values[1]),
      salaries: parseInt(values[2]),
      federalRevenue: parseInt(values[3]),
      source: 'US Census Bureau (F-33 Survey, 2021)'
    };
  } catch (error) {
    console.error("Failed to fetch Census data:", error);
    return null;
  }
};

/**
 * Searches the Socrata Open Data Network for budget datasets.
 * Endpoint: http://api.us.socrata.com/api/catalog/v1
 */
export const fetchSocrataBudget = async (state: string, districtName: string): Promise<string | null> => {
  try {
    // Attempt to find a matching domain for the state (e.g., data.ny.gov)
    // This is a heuristic; broad search is safer.
    const query = `${districtName} school budget`;
    const url = `https://api.us.socrata.com/api/catalog/v1?q=${encodeURIComponent(query)}&limit=1`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return the link to the dataset
      return data.results[0].link;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch Socrata data:", error);
    return null;
  }
};

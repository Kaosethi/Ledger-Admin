// src/lib/utils/idGenerator.ts
import { SQL, sql } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
// The following types might need adjustment based on your exact Drizzle setup if you want strict typing.
// For simplicity and broad compatibility, 'any' can be used for tx if strict types are problematic.
// import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'; 
// import { ExtractTablesWithRelations } from 'drizzle-orm';

import { accountDisplayIdSequence } from '@/lib/db/schema'; // Adjust path if your schema.ts is elsewhere

// A more generic type for the Drizzle transaction object
type DrizzleTransaction = PgTransaction<any, any, any>; // Common for pg-based drivers

export async function generateDisplayId(
    tx: DrizzleTransaction,
    prefix: string
): Promise<string> {
    const year = new Date().getFullYear().toString();
    console.log(`[generateDisplayId] Generating ID for prefix: ${prefix}, year: ${year}`);

    const sequenceQuery = sql`
        INSERT INTO ${accountDisplayIdSequence} (prefix, year, current_value, created_at, updated_at)
        VALUES (${prefix}, ${year}, 1, NOW(), NOW())
        ON CONFLICT (prefix, year) DO UPDATE
        SET current_value = ${sql.identifier(accountDisplayIdSequence.currentValue.name)} + 1, 
            updated_at = NOW()
        RETURNING ${accountDisplayIdSequence.currentValue};
    `;
    
    let result;
    try {
        console.log(`[generateDisplayId] Executing sequence query for ${prefix}-${year}`);
        result = await tx.execute(sequenceQuery);
        console.log(`[generateDisplayId] Sequence query result for ${prefix}-${year}:`, JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error(`[generateDisplayId] ERROR executing sequence query for ${prefix}-${year}: ${e.message}`, e.stack);
        throw e; // Re-throw
    }
    
    let nextVal: number;
    // ... (same result parsing logic as before) ...
    // Add more detailed logging in the parsing logic if needed
    if (Array.isArray(result) && result.length > 0 && typeof result[0].current_value !== 'undefined') {
        nextVal = Number(result[0].current_value);
    } else if (typeof (result as any).rows !== 'undefined' && Array.isArray((result as any).rows) && (result as any).rows.length > 0 && typeof (result as any).rows[0].current_value !== 'undefined') {
         nextVal = Number((result as any).rows[0].current_value);
    } else if (result && typeof (result as any).length === 'number' && (result as any).length > 0 && typeof (result as any)[0]?.current_value !== 'undefined' ) {
        nextVal = Number((result as any)[0].current_value);
    } else {
        console.error(`[generateDisplayId] Unexpected result structure for ${prefix}-${year}. Full result:`, JSON.stringify(result, null, 2));
        throw new Error(`Failed to retrieve sequence value for ${prefix}-${year}. Result structure not recognized.`);
    }

    if (isNaN(nextVal)) {
        console.error(`[generateDisplayId] Parsed nextVal is NaN for ${prefix}-${year}. Original result from DB:`, JSON.stringify(result, null, 2));
        throw new Error(`Parsed sequence value is not a number for ${prefix}-${year}.`);
    }
    
    const generatedId = `${prefix.toUpperCase()}-${year}-${String(nextVal).padStart(4, '0')}`;
    console.log(`[generateDisplayId] Successfully generated ID for ${prefix}-${year}: ${generatedId}`);
    return generatedId;
}
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
    tx: DrizzleTransaction, // The Drizzle transaction object
    prefix: string
): Promise<string> {
    const year = new Date().getFullYear().toString();

    // Atomically increment or insert the sequence for the given prefix and year
    // This uses a raw SQL query for a more robust "upsert and increment"
    const sequenceQuery = sql`
        INSERT INTO ${accountDisplayIdSequence} (prefix, year, current_value, created_at, updated_at)
        VALUES (${prefix}, ${year}, 1, NOW(), NOW())
        ON CONFLICT (prefix, year) DO UPDATE
SET current_value = account_display_id_sequence.current_value + 1, updated_at = NOW()
        RETURNING current_value;
    `;
    
    const result = await tx.execute(sequenceQuery);
    
    let nextVal: number;

    // Result parsing depends on the Drizzle driver (node-postgres, neon, etc.)
    // This attempts to cover common scenarios.
    if (Array.isArray(result) && result.length > 0 && typeof result[0].current_value !== 'undefined') {
        nextVal = Number(result[0].current_value);
    } else if (typeof (result as any).rows !== 'undefined' && Array.isArray((result as any).rows) && (result as any).rows.length > 0 && typeof (result as any).rows[0].current_value !== 'undefined') {
         nextVal = Number((result as any).rows[0].current_value);
    } else if (result && typeof (result as any).length === 'number' && (result as any).length > 0 && typeof (result as any)[0]?.current_value !== 'undefined' ) { // for some drivers that return array-like directly
        nextVal = Number((result as any)[0].current_value);
    }
     else {
        console.error("Unexpected result structure from sequence query. Full result:", JSON.stringify(result, null, 2));
        throw new Error(`Failed to retrieve sequence value for ${prefix}-${year}. Result structure not recognized.`);
    }

    if (isNaN(nextVal)) {
        console.error("Parsed nextVal is NaN. Original result from DB:", JSON.stringify(result, null, 2));
        throw new Error(`Parsed sequence value is not a number for ${prefix}-${year}.`);
    }
    
    return `${prefix.toUpperCase()}-${year}-${String(nextVal).padStart(4, '0')}`;
}
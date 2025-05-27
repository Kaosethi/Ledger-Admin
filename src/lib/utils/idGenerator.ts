// src/lib/utils/idGenerator.ts
import { SQL, sql } from 'drizzle-orm'; // Removed getTableConfig for now
import { PgTransaction } from 'drizzle-orm/pg-core';
import { accountDisplayIdSequence } from '@/lib/db/schema';

type DrizzleTransaction = PgTransaction<any, any, any>;

export async function generateDisplayId(
    tx: DrizzleTransaction,
    prefix: string
): Promise<string> {
    const year = new Date().getFullYear().toString();
    console.log(`[generateDisplayId] Generating ID for prefix: ${prefix}, year: ${year}`);

    // Drizzle's `sql` tag can usually take the table object directly for INSERT INTO.
    // For column names in expressions like SET or RETURNING, use sql.identifier(column.name).
    const sequenceQuery = sql`
        INSERT INTO ${accountDisplayIdSequence} (
            ${sql.identifier(accountDisplayIdSequence.prefix.name)}, 
            ${sql.identifier(accountDisplayIdSequence.year.name)}, 
            ${sql.identifier(accountDisplayIdSequence.currentValue.name)}, 
            ${sql.identifier(accountDisplayIdSequence.createdAt.name)}, 
            ${sql.identifier(accountDisplayIdSequence.updatedAt.name)}
        )
        VALUES (${prefix}, ${year}, 1, NOW(), NOW())
        ON CONFLICT (${sql.identifier(accountDisplayIdSequence.prefix.name)}, ${sql.identifier(accountDisplayIdSequence.year.name)}) 
        DO UPDATE
        SET ${sql.identifier(accountDisplayIdSequence.currentValue.name)} = ${accountDisplayIdSequence}.${sql.identifier(accountDisplayIdSequence.currentValue.name)} + 1, 
            ${sql.identifier(accountDisplayIdSequence.updatedAt.name)} = NOW()
        RETURNING ${sql.identifier(accountDisplayIdSequence.currentValue.name)};
    `;
    // Note: In "SET current_value = account_display_id_sequence.current_value + 1",
    // the "account_display_id_sequence.current_value" (the first part) refers to the existing row's column.
    // Drizzle's sql template handles parameterizing the ${prefix}, ${year} values.
    // We use sql.identifier() for all column names to be safe and explicit.
    // For the table name in `SET table.column = ...`, we can use the table object itself `accountDisplayIdSequence`.

    let result;
    try {
        // To log the SQL, Drizzle's SQL objects don't always have a simple .toSQL().
        // You can often inspect it in a debugger or rely on database logs if enabled.
        // For now, we'll remove the .toSQL() for compatibility.
        console.log(`[generateDisplayId] Executing sequence query for ${prefix}-${year}`);
        result = await tx.execute(sequenceQuery);
        console.log(`[generateDisplayId] Sequence query result for ${prefix}-${year}:`, JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error(`[generateDisplayId] ERROR executing sequence query for ${prefix}-${year}: ${e.message}`, e.stack);
        throw e; 
    }
    
    let nextVal: number;

    // Result parsing logic remains the same
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
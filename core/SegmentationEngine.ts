import * as DB from '@/utils/DatabaseManager';
import { SQLiteDatabase } from 'expo-sqlite';

export enum PartitionType {
    JUZ = 1,
    SURAH = 2,
    PAGE = 3
}

export interface PlanSegment {
    day: number;
    date: string;
    start_verse: number;
    end_verse: number;
    start_unit_val: number;
    end_unit_val: number;
}

export class SegmentationEngine {
    private static TOTAL_PAGES = 604;
    private static TOTAL_JUZ = 30;
    private static TOTAL_SURAH = 114;

    static async calculatePlan(
        days:number,
        partitionType: PartitionType,
        startDate: Date = new Date()
    ): Promise<PlanSegment[]> {
        const db = await DB.getDB()
        let totalUnits = 0;
        let table = '';

        switch (partitionType) {
            case PartitionType.JUZ:
                totalUnits = this.TOTAL_JUZ;
                table = 'juz';
                break;
            case PartitionType.SURAH:
                totalUnits = this.TOTAL_SURAH;
                table = 'surahs';
                break;
            case PartitionType.PAGE:
            default:
                totalUnits = this.TOTAL_PAGES;
                table = 'pages';
                break;
        }

        const unitsPerDay = totalUnits / days;
        const plan: PlanSegment[] = [];
        let currentFloatUnit = 1.0;

        for(let day = 1; day <= days; day++) {
            const startUnit = Math.floor(currentFloatUnit);
            let endUnit = Math.floor(currentFloatUnit + unitsPerDay);

            if(endUnit > totalUnits) endUnit = totalUnits;
            if(day === days) endUnit = totalUnits;

            if(endUnit < startUnit) endUnit = startUnit;

            const startRes = await db.getFirstAsync<{ first_verse: number }>(
                `SELECT first_verse FROM ${table} WHERE id = ?`,
                [startUnit]
            )
            const safeEndUnit = Math.max(startUnit, Math.min(endUnit, totalUnits));
            const endRes = await db.getFirstAsync<{ last_verse: number }>(
                `SELECT last_verse FROM ${table} WHERE id = ?`,
                [safeEndUnit]
            )
            if(startRes && endRes) {
                const segmentDate = new Date(startDate);
                segmentDate.setDate(startDate.getDate() + day - 1);

                plan.push({
                    day,
                    date: segmentDate.toISOString(),
                    start_verse: startRes.first_verse,
                    end_verse: endRes.last_verse,
                    start_unit_val: startUnit,
                    end_unit_val: safeEndUnit
                });

            } else {
                console.error(`[SegmentationEngine] Error fetching bounds for ${table} IDs: ${startUnit}-${endUnit}`);
            }
            
            await this.savePlanToDB(db, plan)
            currentFloatUnit += unitsPerDay;
        }
        return plan;
    }

    static async savePlanToDB(db: SQLiteDatabase, plan: PlanSegment[]) {
        console.log("Saving Plan to DB")
        try {
            // clear the table, not delete it
            await db.execAsync('DELETE FROM daily_progress');

            await DB.ensureDailyProgressTable();

            if(plan.length == 0) return;

            const values = plan
                .map(p => `(${p.day}, '${p.date}', ${p.start_verse}, ${p.end_verse}, ${p.start_unit_val}, ${p.end_unit_val}, 0)`)
                .join(',');            
            await db.execAsync(`
                INSERT INTO daily_progress (day_number, date, start_verse, end_verse, start_unit_val, end_unit_val, is_completed)
                VALUES ${values}
            `);
            console.log("Inserted Werd Plan into daily_progress")

            console.log(`[SegmentationEngine] Saved ${plan.length} days to daily_progress.`);
        } catch(e) {
            console.error("[SegmentationEngine] Failed to save plan:", e);
        }
    }

    static async recalculatePlan(db: SQLiteDatabase,
        currentDay: number,
        lastCompletedVerse: number,
        totalDays: number,
        partitionType: PartitionType) {
        console.log("Recalcaulating Plan...")
        

        const remainingDays = totalDays - currentDay;
        if(remainingDays <= 0) return; // BRO IS COOKED

        let totalUnits = 0;
        let table = '';

        switch (partitionType) {
            case PartitionType.JUZ:
                totalUnits = this.TOTAL_JUZ;
                table = 'juz';
                break;
            case PartitionType.SURAH:
                totalUnits = this.TOTAL_SURAH;
                table = 'surahs';
                break;
            case PartitionType.PAGE:
            default:
                totalUnits = this.TOTAL_PAGES;
                table = 'pages';
                break;
        }

        const currentUnitRes = await db.getFirstAsync<{ id: number }>(
            `SELECT id FROM ${table} WHERE ? BETWEEN first_verse AND last_verse`,
            [lastCompletedVerse]
        );

        if(!currentUnitRes) {
            console.error("[SegmentationEngine] Could not map last verse to unit.");
            return;
        }

        const nextStartUnit = currentUnitRes.id + 1;
        const remainingUnits = totalUnits - currentUnitRes.id;

        if(remainingUnits <= 0) return; // BRO IS COOKED

        const unitsPerDay = remainingUnits / remainingDays;
        const newPlan: PlanSegment[] = [];
        let currentFloatUnit = nextStartUnit;

        const startDate = new Date(); 

        for(let i = 0; i <= remainingDays; i++) {
            const day = currentDay + i;

            const startUnit = Math.floor(currentFloatUnit);
            let  endUnit = Math.floor(currentFloatUnit + unitsPerDay);

            if(endUnit > totalUnits) endUnit = totalUnits;
            if(i === remainingDays) endUnit = totalUnits;

            if(endUnit < startUnit) endUnit = startUnit;

            const startRes = await db.getFirstAsync<{ first_verse: number }>(
                `SELECT first_verse FROM ${table} WHERE id = ?`,
                [startUnit]
            )
            const safeEndUnit = Math.max(startUnit, Math.min(endUnit, totalUnits));
            const endRes = await db.getFirstAsync<{ last_verse: number }>(
                `SELECT last_verse FROM ${table} WHERE id = ?`,
                [safeEndUnit]
            )
            if(startRes && endRes) {
                const segmentDate = new Date(startDate);
                segmentDate.setDate(startDate.getDate() + i);

                newPlan.push({
                    day,
                    date: segmentDate.toISOString(),
                    start_verse: startRes.first_verse,
                    end_verse: endRes.last_verse,
                    start_unit_val: startUnit,
                    end_unit_val: safeEndUnit
                });
            } else {
                console.error(`[SegmentationEngine] Error fetching bounds for ${table} IDs: ${startUnit}-${endUnit}`);
            }

            currentFloatUnit += unitsPerDay;
        }

        const today = await db.getFirstAsync(`SELECT * FROM daily_progress WHERE day_number = 1`)
        console.log(`TODAY: ${JSON.stringify(today, null, 2)}`)

        const data = await db.getAllAsync(`SELECT * FROM daily_progress WHERE day_number >= ?`, [currentDay]);
        console.log(`ROWS THAT WILL BE DELETED: ${JSON.stringify(data, null, 2)}`);
        await db.runAsync(`DELETE FROM daily_progress WHERE day_number >= ?`, [currentDay]);
        console.log("DELETED DELETED DELETEDDELETED DELETED")

        if (newPlan.length > 0) {
            const values = newPlan
                .map(p => `(${p.day}, '${p.date}', ${p.start_verse}, ${p.end_verse}, ${p.start_unit_val}, ${p.end_unit_val}, 0)`)
                .join(',');

            await db.execAsync(`
                INSERT INTO daily_progress (day_number, date, start_verse, end_verse, start_unit_val, end_unit_val, is_completed)
                VALUES ${values}
            `);
            console.log("Inserted Werd Plan into daily_progress")
        }
        console.log(`[SegmentationEngine] Recalculated ${newPlan.length} remaining days.`);

        const newData = await db.getAllAsync(`SELECT * FROM daily_progress`)
        console.log(`New Plan Data: ${JSON.stringify(newData, null, 2)}`);
    }
}
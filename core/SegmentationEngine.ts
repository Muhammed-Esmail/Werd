import { SQLiteDatabase } from 'expo-sqlite';

export class SegmentationEngine {
    private static TOTAL_PAGES = 604;

    // Still very naiive, do NOT save to DB yet.
    static calculatePlan(days: number): { day: number; startPage: number; endPage: number }[] {        
        const pagesPerDay = this.TOTAL_PAGES / days;
        const plan = [];
        let currentFloatPage = 1.0;

        for(let day = 1; day <= days; day++) {
            const startPage = Math.round(currentFloatPage)
            let endPage = Math.round(currentFloatPage + pagesPerDay);
            if(endPage > this.TOTAL_PAGES) endPage = this.TOTAL_PAGES;

            if(day == days) endPage = this.TOTAL_PAGES; // Ensure last day ends at page 604

            plan.push({
                day,
                startPage,
                endPage: Math.max(startPage, endPage - 1)
            })
            
            currentFloatPage += pagesPerDay;
        }
        return plan;
    }

    static async savePlanToDB(db: SQLiteDatabase, plan: any[]) {
        await db.execAsync('DELETE FROM daily_progress'); // Clear existing plan

        const values = plan
            .map(p => `(${p.day}, ${p.startPage}, ${p.endPage}, 0)`) // 0 = not completed
            .join(',');

        await db.execAsync(`
            INSERT INTO daily_progress (day_number, start_page, end_page, is_completed)
            VALUES ${values}
        `);
    }

    static async recalculatePlan(
        db: SQLiteDatabase,
        currentDay: number,
        lastCompletedPage: number,
        totalDays: number
    ) {
        const remainingPages = this.TOTAL_PAGES - lastCompletedPage;
        const remainingDays = totalDays - currentDay;

        if (remainingDays <= 0) {
            console.log("Broski's cooked (no days left to finish)");
            return;
        }

        const newPagesPerDay = remainingPages / remainingDays;

        console.log(`[Amadoo] Recalculating... User is at pg ${lastCompletedPage}. Needs to read ${newPagesPerDay.toFixed(1)} pgs/day to finish.`);

        const newPlan = [];
        let currentFloatPage = lastCompletedPage + 1;

        for(let i = 1; i <= remainingDays; i++) {
            const day = currentDay + i;

            const startPage = Math.floor(currentFloatPage);
            let endPage = Math.floor(currentFloatPage + newPagesPerDay);

            if(endPage > this.TOTAL_PAGES) endPage = this.TOTAL_PAGES;
            if(i == remainingDays) endPage = this.TOTAL_PAGES; // Ensure last day ends at page 604

            newPlan.push({
                day: day,
                startPage,
                endPage: Math.max(startPage, endPage - 1)
            });

            currentFloatPage += newPagesPerDay;
        }

        await db.execAsync(`DELETE FROM daily_progress WHERE day_number > ${currentDay}`);

        const values = newPlan
            .map(p => `(${p.day}, ${p.startPage}, ${p.endPage}, 0)`)
            .join(',');

        if (values.length > 0) {
            await db.execAsync(`
                INSERT INTO daily_progress (day_number, start_page, end_page, is_completed)
                VALUES ${values};
            `);
        }
    }
}
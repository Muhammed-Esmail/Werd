// This is a special "Test Lab" screen for manually testing our core logic and database interactions without needing to go through the full UI flow. It has buttons to trigger each step of our process and logs the results on screen.

import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { DatabaseSetup } from '@/services/DatabaseSetup';
import { SegmentationEngine } from '@/core/SegmentationEngine';
import { QuranService } from '@/services/QuranService';

export default function TestLab() {
  const db = useSQLiteContext(); 
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const runSetup = async () => {
    try {
      await DatabaseSetup.initialize(db);
      log("DB Tables Created");
    } catch (e: any) {
      log("Setup Failed: " + e.message);
    }
  };

  const runMath = async () => {
    try {
      const plan = SegmentationEngine.calculatePlan(30);
      log(`Math Result: Day 1 covers pages ${plan[0].startPage}-${plan[0].endPage}`);
      
      await SegmentationEngine.savePlanToDB(db, plan);
      log("Plan saved to 'daily_progress' table");
    } catch (e: any) {
      log("Math Failed: " + e.message);
    }
  };

  const runFetch = async () => {
    try {
      const service = new QuranService(db);
      const result = await service.getTodaysWerd();
      
      if (result) {
        log("SUCCESS! Handshake JSON received:");
        log(`Session: ${result.sessionId}`);
        log(`First Surah: ${result.segments[0].surahNameEnglish}`);
        log(`Ayah Count: ${result.segments[0].ayahs.length}`);
        log(`First Ayah: ${result.segments[0].ayahs[0].text}`);
      } else {
        log("No Werd found (Is the plan calculated?)");
      }
    } catch (e: any) {
      log("Fetch Failed: " + e.message);
    }
  };

  const runRecalculate = async () => {
    try {
      log("SIMULATION: User is failing...");
      log("Current Day: 15. User SHOULD be on Page 300.");
      log("ACTUAL Position: Page 50 (Slacking off!)");

      await SegmentationEngine.recalculatePlan(db, 15, 50, 30);
      
      log("PLAN UPDATED!");
      
      const result = await db.getFirstAsync<{start_page: number, end_page: number}>(
        'SELECT * FROM daily_progress WHERE day_number = 16'
      );
      
      if (result) {
        const pages = result.end_page - result.start_page;
        log(`NEW Day 16 Goal: Pages ${result.start_page}-${result.end_page}`);
        log(`Intensity: You must now read ${pages} pages/day (Up from 20)`);
      }

    } catch (e: any) {
      log("Recalculate Failed: " + e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 50, backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Amadoo Testing</Text>
      
      <View style={{ gap: 10 }}>
        <Button title="1. Initialize Database" onPress={runSetup} />
        <Button title="2. Run Segmentation Math" onPress={runMath} color="orange" />
        <Button title="3. Fetch Today's Werd" onPress={runFetch} color="green" />
        <Button title="4. Test 'Catch Up' Logic" onPress={runRecalculate} color="red" />
      </View>

      <ScrollView style={{ marginTop: 20, backgroundColor: 'black', padding: 10, borderRadius: 10 }}>
        {logs.map((l, i) => (
          <Text key={i} style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 5 }}>{l}</Text>
        ))}
      </ScrollView>
    </View>
  );
}
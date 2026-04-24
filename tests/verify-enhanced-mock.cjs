/**
 * Enhanced Mock Data Verification Script
 * Verifies 30 tasks across 5 hierarchy levels
 */

console.log('='.repeat(60));
console.log('🧪 PLAN-Tools Enhanced Mock Data Verification');
console.log('='.repeat(60));

// Test in browser environment
if (typeof window !== 'undefined' && window.loadEnhancedMockData) {

  async function verifyEnhancedData() {
    console.log('\n📦 Loading enhanced mock data...');
    window.loadEnhancedMockData();

    await new Promise(resolve => setTimeout(resolve, 2000));

    const stats = window.getDataStats();
    const project = window.useProjectStore ? window.useProjectStore().project : {};

    console.log('\n✅ Data loaded successfully!\n');

    // Project Info
    console.log('📋 Project Information:');
    console.log(`   Name: ${project.name || 'N/A'}`);
    console.log(`   Period: ${project.startDate} ~ ${project.endDate}`);
    console.log(`   Members: ${project.members?.length || 0}`);
    console.log(`   Description: ${project.description?.substring(0, 50) || 'N/A'}...`);

    // Task Statistics
    console.log('\n📊 Task Statistics:');
    console.log(`   Total Tasks: ${stats.tasks.total}`);
    console.log('\n   By Hierarchy Level:');
    console.log(`      Level 1 (Main Phases): ${stats.byLevel.level1 || 0}`);
    console.log(`      Level 2 (Sub-phases): ${stats.byLevel.level2 || 0}`);
    console.log(`      Level 3 (Activities): ${stats.byLevel.level3 || 0}`);
    console.log(`      Level 4 (Specific Tasks): ${stats.byLevel.level4 || 0}`);
    console.log(`      Level 5 (Subtasks): ${stats.byLevel.level5 || 0}`);

    console.log('\n   By Status:');
    console.log(`      ✅ Completed: ${stats.byStatus.completed || 0}`);
    console.log(`      🔄 In Progress: ${stats.byStatus.inProgress || 0}`);
    console.log(`      ⏳ Todo: ${stats.byStatus.todo || 0}`);

    console.log('\n   By Priority:');
    console.log(`      🔴 High: ${stats.byPriority.high || 0}`);
    console.log(`      🟡 Medium: ${stats.byPriority.medium || 0}`);
    console.log(`      🟢 Low: ${stats.byPriority.low || 0}`);

    // Verify requirements
    console.log('\n✔️  Requirement Verification:');

    const requirements = [
      {
        name: '1 Project',
        check: !!project.name,
        value: project.name || 'Missing'
      },
      {
        name: '30 Total Tasks',
        check: stats.tasks.total === 30,
        value: stats.tasks.total
      },
      {
        name: '5 Hierarchy Levels',
        check: (stats.byLevel.level1 || 0) > 0 &&
                (stats.byLevel.level2 || 0) > 0 &&
                (stats.byLevel.level3 || 0) > 0 &&
                (stats.byLevel.level4 || 0) > 0 &&
                (stats.byLevel.level5 || 0) > 0,
        value: `L1:${stats.byLevel.level1} L2:${stats.byLevel.level2} L3:${stats.byLevel.level3} L4:${stats.byLevel.level4} L5:${stats.byLevel.level5}`
      },
      {
        name: '10 Team Members',
        check: project.members?.length === 10,
        value: project.members?.length || 0
      }
    ];

    let allPassed = true;
    requirements.forEach(req => {
      const status = req.check ? '✅ PASS' : '❌ FAIL';
      const color = req.check ? '\x1b[32m' : '\x1b[31m'; // Green or Red
      console.log(`   ${color}${status}\x1b[0m ${req.name}: ${req.value}`);
      if (!req.check) allPassed = false;
    });

    // Show task tree structure
    console.log('\n🌳 Task Tree Structure:');
    const tasksStore = window.useTasksStore ? window.useTasksStore() : null;
    if (tasksStore && tasksStore.tasks) {
      printTaskTree(tasksStore.tasks, 0);
    }

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL REQUIREMENTS MET! Enhanced mock data is ready.');
    } else {
      console.log('⚠️  SOME REQUIREMENTS NOT MET. Please review.');
    }
    console.log('='.repeat(60) + '\n');
  }

  function printTaskTree(tasks, level) {
    const indent = '  '.repeat(level);

    tasks.forEach(task => {
      const icon = task.status === '已完成' ? '✅' :
                   task.status === '进行中' ? '🔄' : '⏳';
      const priority = task.priority === '高' ? '🔴' :
                      task.priority === '中' ? '🟡' : '🟢';

      console.log(`${indent}${icon} [${task.wbs}] ${task.name} ${priority}`);

      if (task.children && task.children.length > 0) {
        printTaskTree(task.children, level + 1);
      }
    });
  }

  // Auto-run verification
  verifyEnhancedData().catch(console.error);

} else {
  console.log('❌ This script must be run in a browser environment');
  console.log('Please open the application and run this script from the console');
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  const fs = require('fs');
  const path = require('path');

  // Import the enhanced mock data
  const mockDataPath = path.join(__dirname, 'src/data/mock-enhanced.js');

  if (fs.existsSync(mockDataPath)) {
    console.log('✅ Enhanced mock data file exists');
    console.log('\n📊 Expected Data Structure:');
    console.log('   - 1 Project');
    console.log('   - 10 Team Members');
    console.log('   - 30 Tasks across 5 hierarchy levels');
    console.log('   - Level 1: 5 main phases');
    console.log('   - Level 2: 8 sub-phases');
    console.log('   - Level 3: 9 activities');
    console.log('   - Level 4: 6 specific tasks');
    console.log('   - Level 5: 2 detailed subtasks');
    console.log('\n🚀 To load this data:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Open browser: http://localhost:5173');
    console.log('   3. Open console (F12)');
    console.log('   4. Run: loadEnhancedMockData()');
  } else {
    console.log('❌ Enhanced mock data file not found');
  }
}

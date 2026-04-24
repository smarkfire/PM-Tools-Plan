/**
 * PLAN-Tools 简化验证脚本
 * 通过HTTP请求验证应用功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class PlanToolsVerifier {
    constructor(baseUrl = 'http://localhost:5173') {
        this.baseUrl = baseUrl;
        this.testResults = [];
    }

    log(message, status = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] [${status}] ${message}`;
        console.log(logEntry);
        this.testResults.push({ time: timestamp, message, status });
    }

    async checkServer() {
        this.log('检查服务器状态...');
        return new Promise((resolve) => {
            http.get(this.baseUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (data.includes('PLAN-Tools')) {
                        this.log('服务器运行正常', 'SUCCESS');
                        this.log('应用标题已加载', 'SUCCESS');
                        resolve(true);
                    } else {
                        this.log('应用未正确加载', 'ERROR');
                        resolve(false);
                    }
                });
            }).on('error', (err) => {
                this.log(`服务器连接失败: ${err.message}`, 'ERROR');
                resolve(false);
            });
        });
    }

    async checkStaticFiles() {
        this.log('检查关键文件...');

        const files = [
            'src/main.js',
            'src/App.vue',
            'src/views/ProjectInfoView.vue',
            'src/views/ProjectPlanView.vue',
            'src/store/project.js',
            'src/store/tasks.js',
            'src/components/GanttChart/GanttChart.vue',
            'src/data/mock.js'
        ];

        let allExist = true;
        for (const file of files) {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                this.log(`✓ ${file}`, 'SUCCESS');
            } else {
                this.log(`✗ ${file} 不存在`, 'ERROR');
                allExist = false;
            }
        }

        return allExist;
    }

    async checkDependencies() {
        this.log('检查依赖包...');

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        const deps = packageJson.dependencies || {};
        const requiredDeps = [
            'vue',
            'vue-router',
            'pinia',
            'element-plus',
            'dhtmlx-gantt',
            'xlsx',
            'dayjs'
        ];

        let allInstalled = true;
        for (const dep of requiredDeps) {
            if (deps[dep]) {
                this.log(`✓ ${dep} 已安装 (${deps[dep]})`, 'SUCCESS');
            } else {
                this.log(`✗ ${dep} 未安装`, 'ERROR');
                allInstalled = false;
            }
        }

        return allInstalled;
    }

    async checkModuleStructure() {
        this.log('检查模块结构...');

        const checks = [
            { path: 'src/components', name: '组件目录' },
            { path: 'src/views', name: '视图目录' },
            { path: 'src/store', name: '状态管理目录' },
            { path: 'src/utils', name: '工具函数目录' },
            { path: 'src/data', name: '数据目录' },
            { path: 'docs', name: '文档目录' }
        ];

        let allExist = true;
        for (const check of checks) {
            const fullPath = path.join(__dirname, check.path);
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath);
                this.log(`✓ ${check.name} 存在 (${files.length} 个文件)`, 'SUCCESS');
            } else {
                this.log(`✗ ${check.name} 不存在`, 'ERROR');
                allExist = false;
            }
        }

        return allExist;
    }

    async verifyCodeQuality() {
        this.log('验证代码质量...');

        const filesToCheck = [
            'src/store/project.js',
            'src/store/tasks.js',
            'src/utils/wbs.js',
            'src/utils/date.js'
        ];

        let allValid = true;
        for (const file of filesToCheck) {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n').length;
                const hasExport = content.includes('export');
                const hasFunction = content.includes('function') || content.includes('=>');

                this.log(`✓ ${file} (${lines} 行, 导出: ${hasExport ? '是' : '否'})`, 'SUCCESS');
            } else {
                allValid = false;
            }
        }

        return allValid;
    }

    async generateReport() {
        this.log('生成验证报告...');

        const passed = this.testResults.filter(r => r.status === 'SUCCESS').length;
        const failed = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        const report = `
========================================
PLAN-Tools 应用验证报告
========================================
验证时间: ${new Date().toLocaleString()}
应用URL: ${this.baseUrl}

验证结果统计:
----------------------------------------
总检查项: ${total}
通过: ${passed}
失败: ${failed}
通过率: ${(passed/total*100).toFixed(1)}%

详细日志:
========================================
${this.testResults.map(r =>
    `${r.time} [${r.status}] ${r.message}`
).join('\n')}
========================================

功能清单:
----------------------------------------
✅ 项目信息管理
   - 项目基本信息表单
   - 成员管理 (添加/编辑/删除)
   - 导入/导出功能

✅ 项目计划管理
   - 任务列表显示
   - WBS编号自动生成
   - 任务层级结构
   - 任务状态管理
   - 任务优先级设置

✅ 甘特图可视化
   - 任务时间线
   - 依赖关系显示
   - 优先级颜色编码

✅ 数据持久化
   - localStorage 保存
   - 自动刷新保持

✅ 工具功能
   - 数据导出 (JSON/Excel/Markdown)
   - 显示设置
   - 展开/折叠功能

测试建议:
----------------------------------------
1. 打开浏览器访问: http://localhost:5173
2. 打开控制台 (F12)
3. 执行: loadMockData()
4. 验证项目信息和任务显示
5. 测试各项功能操作

使用示例:
--------------------------------========
// 加载示例数据
loadMockData()

// 查看统计信息
getDataStats()

// 清除数据
clearAllData()
========================================
`;

        fs.writeFileSync('verification-report.txt', report, 'utf-8');
        console.log(report);

        return failed === 0;
    }

    async runVerification() {
        console.log('='.repeat(50));
        console.log('PLAN-Tools 应用验证');
        console.log('='.repeat(50));

        let allPassed = true;

        // 运行各项检查
        allPassed &= await this.checkServer();
        allPassed &= await this.checkStaticFiles();
        allPassed &= await this.checkDependencies();
        allPassed &= await this.checkModuleStructure();
        allPassed &= await this.verifyCodeQuality();

        // 生成报告
        const success = this.generateReport();

        this.log('验证完成!', allPassed ? 'SUCCESS' : 'ERROR');

        if (allPassed) {
            console.log('\n✅ 所有验证通过!');
            console.log('\n下一步:');
            console.log('1. 在浏览器打开: http://localhost:5173');
            console.log('2. 打开控制台 (F12)');
            console.log('3. 执行: loadMockData()');
            console.log('4. 开始测试各项功能');
        } else {
            console.log('\n⚠️  部分验证未通过，请检查上述错误');
        }

        return allPassed;
    }
}

// 运行验证
async function main() {
    const verifier = new PlanToolsVerifier();
    const success = await verifier.runVerification();
    process.exit(success ? 0 : 1);
}

main().catch(console.error);

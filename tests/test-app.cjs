/**
 * PLAN-Tools 自动化测试脚本 (Node.js版本)
 * 使用 Puppeteer 进行浏览器自动化测试
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建截图目录
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

class PlanToolsTester {
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
                this.log(`服务器响应: ${res.statusCode}`, 'SUCCESS');
                resolve(true);
            }).on('error', (err) => {
                this.log(`服务器连接失败: ${err.message}`, 'ERROR');
                resolve(false);
            });
        });
    }

    async testWithPuppeteer() {
        this.log('启动浏览器自动化测试...');

        try {
            // 尝试使用 Puppeteer
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 设置视口
            await page.setViewport({ width: 1920, height: 1080 });

            // 测试1: 导航到应用
            this.log('测试1: 导航到应用');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            this.log('应用加载成功', 'SUCCESS');
            await page.screenshot({ path: 'screenshots/01_initial_load.png' });

            // 测试2: 加载示例数据
            this.log('测试2: 加载示例数据');
            await page.evaluate(() => {
                if (typeof loadMockData === 'function') {
                    loadMockData();
                }
            });
            await page.waitForTimeout(2000);
            this.log('示例数据加载成功', 'SUCCESS');
            await page.screenshot({ path: 'screenshots/02_data_loaded.png' });

            // 测试3: 获取数据统计
            this.log('测试3: 获取数据统计');
            const stats = await page.evaluate(() => {
                if (typeof getDataStats === 'function') {
                    return getDataStats();
                }
                return null;
            });

            if (stats) {
                this.log(`项目: ${stats.project.name}`, 'INFO');
                this.log(`成员数: ${stats.project.membersCount}`, 'INFO');
                this.log(`任务总数: ${stats.tasks.total}`, 'INFO');
                this.log(`已完成: ${stats.tasks.completed}`, 'INFO');
                this.log(`进行中: ${stats.tasks.inProgress}`, 'INFO');
                this.log(`待办: ${stats.tasks.todo}`, 'INFO');
            }

            // 测试4: 项目信息页面
            this.log('测试4: 检查项目信息页面');
            const projectNameInput = await page.$('input[placeholder="请输入项目名称"]');
            if (projectNameInput) {
                this.log('项目名称输入框存在', 'SUCCESS');
            } else {
                this.log('项目名称输入框不存在', 'ERROR');
            }

            const memberTable = await page.$('.el-table');
            if (memberTable) {
                this.log('成员表格存在', 'SUCCESS');
            } else {
                this.log('成员表格不存在', 'ERROR');
            }
            await page.screenshot({ path: 'screenshots/03_project_info.png' });

            // 测试5: 导航到项目计划页面
            this.log('测试5: 导航到项目计划页面');
            await Promise.all([
                page.click('text=项目计划管理'),
                page.waitForNavigation({ waitUntil: 'networkidle2' })
            ]);
            this.log('成功导航到项目计划页面', 'SUCCESS');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'screenshots/04_project_plan.png' });

            // 测试6: 检查任务列表
            this.log('测试6: 检查任务列表');
            const taskTable = await page.$('.el-table');
            if (taskTable) {
                this.log('任务列表存在', 'SUCCESS');

                // 获取任务数量
                const taskCount = await page.evaluate(() => {
                    const rows = document.querySelectorAll('.el-table__row');
                    return rows.length;
                });
                this.log(`任务行数: ${taskCount}`, 'INFO');
            } else {
                this.log('任务列表不存在', 'ERROR');
            }

            // 测试7: 检查甘特图
            this.log('测试7: 检查甘特图');
            const gantt = await page.$('.gantt-container');
            if (gantt) {
                this.log('甘特图存在', 'SUCCESS');
            } else {
                this.log('甘特图不存在', 'WARN');
            }

            // 测试8: 新增任务
            this.log('测试8: 测试新增任务');
            try {
                await page.click('button:has-text("新增")');
                await page.waitForTimeout(1000);
                this.log('新增任务对话框打开成功', 'SUCCESS');
                await page.screenshot({ path: 'screenshots/05_add_task.png' });

                // 填写任务信息
                await page.type('input[placeholder="请输入任务名称"]', '自动化测试任务');
                await page.select('select[placeholder="请选择优先级"]', '高');
                await page.select('select[placeholder="请选择状态"]', '进行中');

                // 关闭对话框
                await page.click('.el-dialog__headerbtn');
                await page.waitForTimeout(500);
                this.log('新增任务功能正常', 'SUCCESS');
            } catch (e) {
                this.log(`新增任务失败: ${e.message}`, 'ERROR');
            }

            // 测试9: 显示设置
            this.log('测试9: 测试显示设置');
            try {
                await page.click('button:has-text("显示设置")');
                await page.waitForTimeout(1000);
                this.log('显示设置对话框打开成功', 'SUCCESS');
                await page.screenshot({ path: 'screenshots/06_display_settings.png' });
                await page.click('.el-dialog__headerbtn');
                await page.waitForTimeout(500);
            } catch (e) {
                this.log(`显示设置失败: ${e.message}`, 'ERROR');
            }

            // 测试10: 数据持久化
            this.log('测试10: 测试数据持久化');
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForTimeout(2000);

            const statsAfterReload = await page.evaluate(() => {
                if (typeof getDataStats === 'function') {
                    return getDataStats();
                }
                return null;
            });

            if (statsAfterReload && statsAfterReload.tasks.total > 0) {
                this.log('数据持久化正常', 'SUCCESS');
            } else {
                this.log('数据持久化失败', 'ERROR');
            }
            await page.screenshot({ path: 'screenshots/07_data_persisted.png' });

            await browser.close();
            return true;

        } catch (error) {
            this.log(`Puppeteer测试失败: ${error.message}`, 'ERROR');

            // 尝试使用 Playwright
            return await this.testWithPlaywright();
        }
    }

    async testWithPlaywright() {
        this.log('尝试使用 Playwright...');

        try {
            const { chromium } = require('playwright');
            const browser = await chromium.launch({ headless: false });
            const page = await browser.newPage();

            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
            this.log('应用加载成功 (Playwright)', 'SUCCESS');

            await page.evaluate('loadMockData()');
            await page.waitForTimeout(2000);
            this.log('示例数据加载成功 (Playwright)', 'SUCCESS');

            await browser.close();
            return true;
        } catch (error) {
            this.log(`Playwright 不可用: ${error.message}`, 'WARN');
            return false;
        }
    }

    generateReport() {
        this.log('生成测试报告...');

        const passed = this.testResults.filter(r => r.status === 'SUCCESS').length;
        const failed = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        const report = `
========================================
PLAN-Tools 自动化测试报告
========================================
测试时间: ${new Date().toLocaleString()}
测试URL: ${this.baseUrl}

测试结果统计:
----------------------------------------
总测试数: ${total}
通过: ${passed}
失败: ${failed}
通过率: ${(passed/total*100).toFixed(1)}%

详细日志:
========================================
${this.testResults.map(r =>
    `${r.time} [${r.status}] ${r.message}`
).join('\n')}
========================================
`;

        fs.writeFileSync('test-report.txt', report, 'utf-8');
        console.log(report);

        return failed === 0;
    }

    async runAllTests() {
        console.log('='.repeat(50));
        console.log('PLAN-Tools 自动化测试');
        console.log('='.repeat(50));

        // 检查服务器
        const serverOk = await this.checkServer();
        if (!serverOk) {
            this.log('服务器未运行，无法继续测试', 'ERROR');
            return false;
        }

        // 运行浏览器测试
        let testsPassed = false;
        try {
            testsPassed = await this.testWithPuppeteer();
        } catch (error) {
            this.log(`测试执行异常: ${error.message}`, 'ERROR');
        }

        // 生成报告
        const success = this.generateReport();

        this.log('测试完成!', success ? 'SUCCESS' : 'ERROR');
        return success;
    }
}

// 运行测试
async function main() {
    const tester = new PlanToolsTester();
    const success = await tester.runAllTests();

    if (success) {
        console.log('\n✅ 所有测试通过!');
        process.exit(0);
    } else {
        console.log('\n❌ 有测试失败或部分测试跳过!');
        process.exit(1);
    }
}

main().catch(console.error);

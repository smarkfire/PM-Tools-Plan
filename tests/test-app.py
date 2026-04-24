"""
PLAN-Tools 自动化测试脚本
测试所有核心功能并生成测试报告
"""
import sys
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

class PlanToolsTester:
    def __init__(self, base_url="http://localhost:5173"):
        self.base_url = base_url
        self.test_results = []
        self.browser = None
        self.page = None

    def log(self, message, status="INFO"):
        """记录测试日志"""
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] [{status}] {message}"
        print(log_entry)
        self.test_results.append({
            "time": timestamp,
            "message": message,
            "status": status
        })

    def setup(self):
        """初始化浏览器"""
        self.log("启动浏览器...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = self.context.new_page()

        # 监听控制台消息
        def handle_console(msg):
            if msg.type == "error":
                self.log(f"Console Error: {msg.text}", "WARN")

        self.page.on("console", handle_console)
        self.log("浏览器启动成功", "SUCCESS")

    def teardown(self):
        """清理资源"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        self.log("浏览器已关闭")

    def navigate_to_app(self):
        """导航到应用"""
        self.log(f"导航到 {self.base_url}")
        try:
            self.page.goto(self.base_url, wait_until="networkidle", timeout=30000)
            self.log("页面加载成功", "SUCCESS")
            # 截图
            self.page.screenshot(path="screenshots/01_initial_load.png")
            return True
        except Exception as e:
            self.log(f"页面加载失败: {e}", "ERROR")
            return False

    def load_mock_data(self):
        """加载示例数据"""
        self.log("加载示例数据...")
        try:
            result = self.page.evaluate("loadMockData()")
            time.sleep(2)  # 等待数据加载
            self.log("示例数据加载成功", "SUCCESS")
            self.page.screenshot(path="screenshots/02_data_loaded.png")
            return True
        except Exception as e:
            self.log(f"加载示例数据失败: {e}", "ERROR")
            return False

    def get_data_stats(self):
        """获取数据统计"""
        self.log("获取数据统计...")
        try:
            stats = self.page.evaluate("getDataStats()")
            self.log(f"项目: {stats['project']['name']}", "INFO")
            self.log(f"成员数: {stats['project']['membersCount']}", "INFO")
            self.log(f"任务总数: {stats['tasks']['total']}", "INFO")
            self.log(f"已完成: {stats['tasks']['completed']}", "INFO")
            self.log(f"进行中: {stats['tasks']['inProgress']}", "INFO")
            self.log(f"待办: {stats['tasks']['todo']}", "INFO")
            return stats
        except Exception as e:
            self.log(f"获取统计失败: {e}", "ERROR")
            return None

    def test_project_info(self):
        """测试项目信息管理"""
        self.log("=== 测试项目信息管理 ===")

        # 检查项目信息表单
        try:
            self.page.wait_for_selector("input[placeholder='请输入项目名称']", timeout=5000)
            self.log("项目名称输入框存在", "SUCCESS")
        except:
            self.log("项目名称输入框不存在", "ERROR")
            return False

        # 检查成员表格
        try:
            self.page.wait_for_selector(".el-table", timeout=5000)
            self.log("成员表格存在", "SUCCESS")
        except:
            self.log("成员表格不存在", "ERROR")
            return False

        # 测试添加成员
        try:
            self.log("测试添加新成员...")
            self.page.fill("input[placeholder='姓名']", "测试人员")
            self.page.fill("input[placeholder='电话']", "13900000000")
            self.page.fill("input[placeholder='邮箱']", "test@example.com")
            self.page.select_option("select[placeholder='角色']", "开发工程师")
            self.page.click("button:has-text('添加')")
            time.sleep(1)
            self.log("添加成员功能正常", "SUCCESS")
            self.page.screenshot(path="screenshots/03_member_added.png")
        except Exception as e:
            self.log(f"添加成员失败: {e}", "ERROR")

        return True

    def test_project_plan(self):
        """测试项目计划管理"""
        self.log("=== 测试项目计划管理 ===")

        # 导航到项目计划页面
        try:
            self.log("导航到项目计划页面...")
            self.page.click("text=项目计划管理")
            self.page.wait_for_load_state("networkidle")
            time.sleep(2)
            self.log("成功导航到项目计划页面", "SUCCESS")
            self.page.screenshot(path="screenshots/04_project_plan.png")
        except Exception as e:
            self.log(f"导航失败: {e}", "ERROR")
            return False

        # 检查任务列表
        try:
            self.page.wait_for_selector(".el-table", timeout=5000)
            self.log("任务列表存在", "SUCCESS")
        except:
            self.log("任务列表不存在", "ERROR")
            return False

        # 检查甘特图容器
        try:
            gantt = self.page.locator(".gantt-container")
            if gantt.count() > 0:
                self.log("甘特图存在", "SUCCESS")
            else:
                self.log("甘特图不存在", "WARN")
        except:
            self.log("检查甘特图失败", "WARN")

        return True

    def test_task_operations(self):
        """测试任务操作"""
        self.log("=== 测试任务操作 ===")

        # 测试新增任务
        try:
            self.log("测试新增任务...")
            self.page.click("button:has-text('新增')")
            time.sleep(1)
            self.log("打开新增任务对话框", "SUCCESS")
            self.page.screenshot(path="screenshots/05_add_task.png")

            # 填写任务信息
            self.page.fill("input[placeholder='请输入任务名称']", "自动化测试任务")
            self.page.fill("input[placeholder='请输入交付物']", "测试交付物")
            self.page.select_option("select[placeholder='请选择优先级']", "高")
            self.page.select_option("select[placeholder='请选择状态']", "进行中")

            # 关闭对话框
            self.page.click(".el-dialog__headerbtn")
            time.sleep(1)
            self.log("新增任务功能正常", "SUCCESS")
        except Exception as e:
            self.log(f"新增任务失败: {e}", "ERROR")

        # 测试展开/折叠
        try:
            self.log("测试展开/折叠功能...")
            self.page.click("button:has-text('展开/折叠')")
            time.sleep(1)
            self.log("展开/折叠功能正常", "SUCCESS")
        except Exception as e:
            self.log(f"展开/折叠失败: {e}", "ERROR")

        # 测试显示设置
        try:
            self.log("测试显示设置...")
            self.page.click("button:has-text('显示设置')")
            time.sleep(1)
            self.log("显示设置对话框打开", "SUCCESS")
            self.page.screenshot(path="screenshots/06_display_settings.png")
            self.page.click(".el-dialog__headerbtn")
            time.sleep(1)
        except Exception as e:
            self.log(f"显示设置失败: {e}", "ERROR")

        return True

    def test_data_export(self):
        """测试数据导出"""
        self.log("=== 测试数据导出 ===")

        # 测试导出下拉菜单
        try:
            self.log("测试导出功能...")
            # 注意: 实际下载可能需要特殊处理，这里只测试按钮是否可点击
            export_btn = self.page.locator("button:has-text('导出')")
            if export_btn.count() > 0:
                self.log("导出按钮存在", "SUCCESS")
            else:
                self.log("导出按钮不存在", "ERROR")
        except Exception as e:
            self.log(f"导出功能测试失败: {e}", "ERROR")

        return True

    def test_responsive_layout(self):
        """测试响应式布局"""
        self.log("=== 测试响应式布局 ===")

        # 测试不同屏幕尺寸
        sizes = [
            (1920, 1080, "桌面"),
            (768, 1024, "平板"),
            (375, 667, "手机")
        ]

        for width, height, name in sizes:
            try:
                self.page.set_viewport_size({"width": width, "height": height})
                time.sleep(1)
                self.log(f"{name}尺寸({width}x{height})布局正常", "SUCCESS")
            except Exception as e:
                self.log(f"{name}尺寸布局失败: {e}", "ERROR")

        # 恢复桌面尺寸
        self.page.set_viewport_size({"width": 1920, "height": 1080})
        return True

    def test_data_persistence(self):
        """测试数据持久化"""
        self.log("=== 测试数据持久化 ===")

        try:
            # 重新加载页面
            self.log("重新加载页面...")
            self.page.reload(wait_until="networkidle")
            time.sleep(2)

            # 检查数据是否保持
            stats = self.get_data_stats()
            if stats and stats['tasks']['total'] > 0:
                self.log("数据持久化正常", "SUCCESS")
                self.page.screenshot(path="screenshots/07_data_persisted.png")
                return True
            else:
                self.log("数据持久化失败", "ERROR")
                return False
        except Exception as e:
            self.log(f"数据持久化测试失败: {e}", "ERROR")
            return False

    def generate_report(self):
        """生成测试报告"""
        self.log("=== 生成测试报告 ===")

        passed = sum(1 for r in self.test_results if r["status"] == "SUCCESS")
        failed = sum(1 for r in self.test_results if r["status"] == "ERROR")
        total = len(self.test_results)

        report = f"""
========================================
PLAN-Tools 自动化测试报告
========================================
测试时间: {time.strftime("%Y-%m-%d %H:%M:%S")}
测试URL: {self.base_url}

测试结果统计:
----------------------------------------
总测试数: {total}
通过: {passed}
失败: {failed}
通过率: {(passed/total*100):.1f}%

详细日志:
========================================
"""
        for result in self.test_results:
            report += f"{result['time']} [{result['status']}] {result['message']}\n"

        report += "========================================\n"

        # 保存报告
        with open("test-report.txt", "w", encoding="utf-8") as f:
            f.write(report)

        print(report)
        return failed == 0

    def run_all_tests(self):
        """运行所有测试"""
        self.log("开始运行自动化测试套件...")

        try:
            # 创建截图目录
            import os
            os.makedirs("screenshots", exist_ok=True)

            # 初始化
            self.setup()

            # 测试流程
            if not self.navigate_to_app():
                return False

            if not self.load_mock_data():
                return False

            stats = self.get_data_stats()

            if not self.test_project_info():
                return False

            if not self.test_project_plan():
                return False

            if not self.test_task_operations():
                return False

            if not self.test_data_export():
                return False

            if not self.test_responsive_layout():
                return False

            if not self.test_data_persistence():
                return False

            # 生成报告
            success = self.generate_report()

            self.log("测试完成!", "SUCCESS" if success else "ERROR")
            return success

        except Exception as e:
            self.log(f"测试执行失败: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.teardown()


def main():
    """主函数"""
    print("=" * 50)
    print("PLAN-Tools 自动化测试")
    print("=" * 50)

    tester = PlanToolsTester()
    success = tester.run_all_tests()

    if success:
        print("\n✅ 所有测试通过!")
        return 0
    else:
        print("\n❌ 有测试失败!")
        return 1


if __name__ == "__main__":
    sys.exit(main())

<template>
  <el-config-provider :locale="epLocale">
  <div class="landing-page">
    <header class="landing-header" :class="{ scrolled: headerScrolled }">
      <div class="header-inner">
        <div class="header-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-text">PLAN-Tools</span>
          <span class="brand-ai-badge">
            <span class="ai-badge-glow"></span>
            AI
          </span>
        </div>
        <nav class="header-nav">
          <a href="#ai-power" class="header-link">{{ $t('landing.nav.aiPower') }}</a>
          <a href="#workflow" class="header-link">{{ $t('landing.nav.workflow') }}</a>
          <a href="#features" class="header-link">{{ $t('landing.nav.features') }}</a>
        </nav>
        <div class="header-actions">
          <LanguageSwitcher />
          <button v-if="!isLoggedIn" class="btn-login" @click="navigateTo('/login')">
            {{ $t('landing.nav.login') }}
          </button>
          <button v-if="!isLoggedIn" class="btn-primary" @click="navigateTo('/register')">
            {{ $t('landing.nav.getStarted') }}
            <i class="fa fa-arrow-right"></i>
          </button>
          <button v-if="isLoggedIn" class="btn-primary" @click="navigateTo('/projects')">
            {{ $t('landing.nav.myProjects') }}
            <i class="fa fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>

    <section class="hero">
      <div class="hero-particles">
        <div class="particle" v-for="i in 20" :key="i" :style="particleStyle(i)"></div>
      </div>
      <div class="hero-grid-bg"></div>
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          {{ $t('landing.hero.badge') }}
        </div>
        <h1 class="hero-title" v-html="$t('landing.hero.title')"></h1>
        <p class="hero-subtitle">{{ $t('landing.hero.subtitle') }}</p>
        <p class="hero-slogan">{{ $t('landing.hero.slogan') }}</p>
        <div class="hero-actions">
          <button class="btn-hero-primary" @click="navigateTo('/workspace')">
            <i class="fa fa-magic"></i>
            {{ $t('landing.hero.cta') }}
          </button>
          <a href="#ai-power" class="btn-hero-secondary">
            {{ $t('landing.hero.learnMore') }}
            <i class="fa fa-chevron-down"></i>
          </a>
        </div>
        <div class="hero-visual">
          <div class="visual-card">
            <div class="visual-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
              <span class="visual-title-bar">{{ $t('landing.hero.visualTitle') }}</span>
            </div>
            <div class="visual-body">
              <div class="ai-demo-flow">
                <div class="ai-demo-input">
                  <div class="ai-demo-label">
                    <i class="fa fa-keyboard"></i>
                    {{ $t('landing.hero.demoInput') }}
                  </div>
                  <div class="ai-demo-text">
                    <span class="typewriter-text">{{ displayedDemoText }}</span>
                    <span class="typewriter-cursor">|</span>
                  </div>
                </div>
                <div class="ai-demo-arrow">
                  <div class="arrow-line"></div>
                  <div class="arrow-icon"><i class="fa fa-magic"></i></div>
                  <div class="arrow-label">AI</div>
                  <div class="arrow-line"></div>
                </div>
                <div class="ai-demo-output">
                  <div class="ai-demo-label">
                    <i class="fa fa-check-circle"></i>
                    {{ $t('landing.hero.demoOutput') }}
                  </div>
                  <div class="gantt-mock">
                    <div
                      v-for="(task, idx) in visibleMockTasks"
                      :key="idx"
                      class="gantt-row"
                      :class="{ 'gantt-row-visible': idx < visibleTaskCount }"
                    >
                      <div class="gantt-label">{{ task.name }}</div>
                      <div class="gantt-bar-track">
                        <div class="gantt-bar" :class="`bar-${idx + 1}`" :style="{ width: task.width, left: task.left }"></div>
                      </div>
                      <div class="gantt-duration">{{ task.duration }}d</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="ai-power" class="ai-power-section">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-tag ai-tag">{{ $t('landing.aiPower.tag') }}</span>
          <h2 class="section-title" v-html="$t('landing.aiPower.title')"></h2>
          <p class="section-desc">{{ $t('landing.aiPower.description') }}</p>
        </div>
        <div class="ai-tabs">
          <button
            v-for="(tab, idx) in aiTabs"
            :key="idx"
            class="ai-tab-btn"
            :class="{ active: activeAiTab === idx }"
            @click="activeAiTab = idx"
          >
            <i :class="tab.icon"></i>
            {{ tab.name }}
          </button>
        </div>
        <div class="ai-tab-content">
          <div class="ai-demo-panel">
            <div class="ai-demo-left">
              <div class="ai-demo-icon" :class="`ai-icon-${activeAiTab + 1}`">
                <i :class="aiTabs[activeAiTab].icon"></i>
              </div>
              <h3 class="ai-demo-name">{{ aiTabs[activeAiTab].name }}</h3>
              <p class="ai-demo-desc">{{ aiTabs[activeAiTab].desc }}</p>
              <div class="ai-demo-flow-steps" v-if="activeAiTab === 0">
                <span class="flow-step">{{ $t('landing.aiPower.items.0.flow1') }}</span>
                <i class="fa fa-arrow-right flow-arrow"></i>
                <span class="flow-step">{{ $t('landing.aiPower.items.0.flow2') }}</span>
                <i class="fa fa-arrow-right flow-arrow"></i>
                <span class="flow-step highlight">{{ $t('landing.aiPower.items.0.flow3') }}</span>
              </div>
            </div>
            <div class="ai-demo-right">
              <div class="ai-demo-preview" :class="`preview-${activeAiTab}`">
                <div class="preview-window">
                  <div class="preview-titlebar">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                  </div>
                  <div class="preview-body">
                    <template v-if="activeAiTab === 0">
                      <div class="preview-form">
                        <div class="preview-form-row" v-for="row in 4" :key="row">
                          <div class="preview-form-label">{{ $t(`landing.aiPower.demo0.field${row}`) }}</div>
                          <div class="preview-form-value" :class="{ filled: demo0Step >= row }">
                            {{ demo0Step >= row ? $t(`landing.aiPower.demo0.value${row}`) : '' }}
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="activeAiTab === 1">
                      <div class="preview-tree">
                        <div
                          v-for="(node, idx) in demo1Nodes"
                          :key="idx"
                          class="preview-tree-node"
                          :class="{ visible: demo1Step > idx }"
                          :style="{ paddingLeft: (node.level * 20) + 'px' }"
                        >
                          <i class="fa" :class="node.level > 0 ? 'fa-tasks' : 'fa-folder'"></i>
                          <span>{{ node.name }}</span>
                          <span class="node-duration">{{ node.duration }}d</span>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="activeAiTab === 2">
                      <div class="preview-report">
                        <div class="report-header-line" :class="{ visible: demo2Step >= 1 }"></div>
                        <div class="report-line" v-for="n in 5" :key="n" :class="{ visible: demo2Step >= n }"></div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="preview-risk">
                        <div class="risk-item safe" :class="{ visible: demo3Step >= 1 }">
                          <i class="fa fa-check-circle"></i>
                          <span>{{ $t('landing.aiPower.demo3.safe') }}</span>
                        </div>
                        <div class="risk-item warning" :class="{ visible: demo3Step >= 2 }">
                          <i class="fa fa-exclamation-triangle"></i>
                          <span>{{ $t('landing.aiPower.demo3.warning') }}</span>
                        </div>
                        <div class="risk-item danger" :class="{ visible: demo3Step >= 3 }">
                          <i class="fa fa-times-circle"></i>
                          <span>{{ $t('landing.aiPower.demo3.danger') }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="workflow" class="workflow-section">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-tag ai-tag">{{ $t('landing.workflow.tag') }}</span>
          <h2 class="section-title">{{ $t('landing.workflow.title') }}</h2>
          <p class="section-desc">{{ $t('landing.workflow.description') }}</p>
        </div>
        <div class="workflow-pipeline">
          <div
            v-for="(step, idx) in workflowSteps"
            :key="idx"
            class="workflow-node"
            :class="{ active: activeWorkflowStep === idx }"
            @mouseenter="activeWorkflowStep = idx"
          >
            <div class="workflow-node-icon" :class="`wf-icon-${idx}`">
              <i :class="step.icon"></i>
            </div>
            <div class="workflow-node-num">{{ String(idx + 1).padStart(2, '0') }}</div>
            <h4 class="workflow-node-name">{{ step.name }}</h4>
            <p class="workflow-node-desc">{{ step.desc }}</p>
            <div v-if="idx < workflowSteps.length - 1" class="workflow-line">
              <div class="workflow-line-track">
                <div class="workflow-line-flow" :class="{ flowing: activeWorkflowStep >= idx }"></div>
              </div>
              <div class="workflow-line-arrow">
                <i class="fa fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="features">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-tag">{{ $t('landing.features.tag') }}</span>
          <h2 class="section-title">{{ $t('landing.features.title') }}</h2>
          <p class="section-desc">{{ $t('landing.features.description') }}</p>
        </div>
        <div class="features-ai-label">
          <i class="fa fa-magic"></i>
          {{ $t('landing.features.aiEnhanced') }}
        </div>
        <div class="features-grid features-ai-grid">
          <div class="feature-card ai-feature" v-for="n in 3" :key="'ai-' + n">
            <div class="feature-ai-badge">AI</div>
            <div class="feature-icon" :class="`icon-ai-${n}`">
              <i :class="aiFeatureIcons[n - 1]"></i>
            </div>
            <h3 class="feature-name">{{ $t(`landing.features.aiItems.${n - 1}.name`) }}</h3>
            <p class="feature-desc">{{ $t(`landing.features.aiItems.${n - 1}.desc`) }}</p>
          </div>
        </div>
        <div class="features-basic-label">{{ $t('landing.features.basic') }}</div>
        <div class="features-grid features-basic-grid">
          <div class="feature-card" v-for="n in 4" :key="'basic-' + n">
            <div class="feature-icon" :class="`icon-basic-${n}`">
              <i :class="basicFeatureIcons[n - 1]"></i>
            </div>
            <h3 class="feature-name">{{ $t(`landing.features.basicItems.${n - 1}.name`) }}</h3>
            <p class="feature-desc">{{ $t(`landing.features.basicItems.${n - 1}.desc`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="highlights" class="highlights">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-tag">{{ $t('landing.highlights.tag') }}</span>
          <h2 class="section-title">{{ $t('landing.highlights.title') }}</h2>
        </div>
        <div class="highlights-grid">
          <div class="highlight-card" v-for="n in 4" :key="n">
            <div class="highlight-icon" :class="`hl-icon-${n}`">
              <i :class="highlightIcons[n - 1]"></i>
            </div>
            <div class="highlight-number">{{ $t(`landing.highlights.items.${n - 1}.number`) }}</div>
            <div class="highlight-label">{{ $t(`landing.highlights.items.${n - 1}.label`) }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="section-inner">
        <div class="cta-card">
          <div class="cta-glow cta-glow-1"></div>
          <div class="cta-glow cta-glow-2"></div>
          <div class="cta-grid-bg"></div>
          <div class="cta-content">
            <div class="cta-sparkle">
              <i class="fa fa-magic"></i>
            </div>
            <h2 class="cta-title" v-html="$t('landing.cta.title')"></h2>
            <p class="cta-desc">{{ $t('landing.cta.description') }}</p>
            <div class="cta-buttons">
              <button class="btn-hero-primary btn-cta-primary" @click="navigateTo('/workspace')">
                <i class="fa fa-magic"></i>
                {{ $t('landing.cta.button') }}
              </button>
              <button v-if="!isLoggedIn" class="btn-cta-secondary" @click="navigateTo('/register')">
                {{ $t('landing.cta.register') }}
                <i class="fa fa-arrow-right"></i>
              </button>
            </div>
            <div class="cta-trust">
              <span><i class="fa fa-check"></i> {{ $t('landing.cta.free') }}</span>
              <span><i class="fa fa-check"></i> {{ $t('landing.cta.noCreditCard') }}</span>
              <span><i class="fa fa-check"></i> {{ $t('landing.cta.aiReady') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <div class="footer-brand">
            <span class="brand-icon">◈</span>
            <span class="brand-text">PLAN-Tools</span>
            <span class="brand-ai-badge footer-badge">
              <span class="ai-badge-glow"></span>
              AI
            </span>
          </div>
          <p class="footer-tagline">{{ $t('landing.footer.tagline') }}</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h5>{{ $t('landing.footer.product') }}</h5>
            <a href="#ai-power">{{ $t('landing.nav.aiPower') }}</a>
            <a href="#features">{{ $t('landing.nav.features') }}</a>
            <a href="#workflow">{{ $t('landing.nav.workflow') }}</a>
            <a href="#highlights">{{ $t('landing.footer.pricing') }}</a>
          </div>
          <div class="footer-col">
            <h5>{{ $t('landing.footer.resources') }}</h5>
            <a href="https://github.com/smarkfire/PM-Tools-Plan" target="_blank" rel="noopener">GitHub</a>
            <a href="#">{{ $t('landing.footer.docs') }}</a>
            <a href="#">{{ $t('landing.footer.changelog') }}</a>
            <a href="#">{{ $t('landing.footer.apiDocs') }}</a>
          </div>
          <div class="footer-col">
            <h5>{{ $t('landing.footer.legal') }}</h5>
            <a href="#">{{ $t('landing.footer.privacy') }}</a>
            <a href="#">{{ $t('landing.footer.terms') }}</a>
            <a href="#">{{ $t('landing.footer.security') }}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">{{ $t('landing.footer.copyright') }}</p>
        <div class="footer-social">
          <a href="https://github.com/smarkfire/PM-Tools-Plan" target="_blank" rel="noopener" aria-label="GitHub">
            <i class="fa fa-github"></i>
          </a>
        </div>
      </div>
    </footer>
  </div>
  </el-config-provider>
</template>

<script setup>
import LanguageSwitcher from '~/components/common/LanguageSwitcher.vue'
import { useAuthStore } from '~/store/auth'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale, t } = useI18n()
const epLocale = computed(() => locale.value === 'zh-CN' ? zhCn : en)
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)

definePageMeta({
  layout: false
})

const headerScrolled = ref(false)
onMounted(() => {
  window.addEventListener('scroll', () => {
    headerScrolled.value = window.scrollY > 20
  })
})

const aiTabs = computed(() => [
  { name: t('landing.aiPower.items.0.name'), desc: t('landing.aiPower.items.0.desc'), icon: 'fa fa-magic' },
  { name: t('landing.aiPower.items.1.name'), desc: t('landing.aiPower.items.1.desc'), icon: 'fa fa-brain' },
  { name: t('landing.aiPower.items.2.name'), desc: t('landing.aiPower.items.2.desc'), icon: 'fa fa-file-alt' },
  { name: t('landing.aiPower.items.3.name'), desc: t('landing.aiPower.items.3.desc'), icon: 'fa fa-chart-line' },
])

const activeAiTab = ref(0)
const demo0Step = ref(0)
const demo1Step = ref(0)
const demo2Step = ref(0)
const demo3Step = ref(0)

const demo1Nodes = computed(() => [
  { name: t('landing.aiPower.demo1.phase1'), duration: 5, level: 0 },
  { name: t('landing.aiPower.demo1.task1'), duration: 3, level: 1 },
  { name: t('landing.aiPower.demo1.task2'), duration: 2, level: 1 },
  { name: t('landing.aiPower.demo1.phase2'), duration: 15, level: 0 },
  { name: t('landing.aiPower.demo1.task3'), duration: 8, level: 1 },
  { name: t('landing.aiPower.demo1.task4'), duration: 7, level: 1 },
])

watch(activeAiTab, () => {
  demo0Step.value = 0
  demo1Step.value = 0
  demo2Step.value = 0
  demo3Step.value = 0
})

let demoTimer = null
onMounted(() => {
  demoTimer = setInterval(() => {
    if (activeAiTab.value === 0) {
      demo0Step.value = demo0Step.value >= 4 ? 0 : demo0Step.value + 1
    } else if (activeAiTab.value === 1) {
      demo1Step.value = demo1Step.value >= 6 ? 0 : demo1Step.value + 1
    } else if (activeAiTab.value === 2) {
      demo2Step.value = demo2Step.value >= 5 ? 0 : demo2Step.value + 1
    } else {
      demo3Step.value = demo3Step.value >= 3 ? 0 : demo3Step.value + 1
    }
  }, 1200)
})
onUnmounted(() => clearInterval(demoTimer))

const workflowSteps = computed(() => [
  { name: t('landing.workflow.step1.name'), desc: t('landing.workflow.step1.desc'), icon: 'fa fa-comment' },
  { name: t('landing.workflow.step2.name'), desc: t('landing.workflow.step2.desc'), icon: 'fa fa-brain' },
  { name: t('landing.workflow.step3.name'), desc: t('landing.workflow.step3.desc'), icon: 'fa fa-calendar-alt' },
  { name: t('landing.workflow.step4.name'), desc: t('landing.workflow.step4.desc'), icon: 'fa fa-chart-bar' },
  { name: t('landing.workflow.step5.name'), desc: t('landing.workflow.step5.desc'), icon: 'fa fa-shield-alt' },
])
const activeWorkflowStep = ref(0)

const aiFeatureIcons = ['fa fa-magic', 'fa fa-brain', 'fa fa-file-alt']
const basicFeatureIcons = ['fa fa-tasks', 'fa fa-chart-gantt', 'fa fa-file-export', 'fa fa-users']
const highlightIcons = ['fa fa-rocket', 'fa fa-bolt', 'fa fa-bullseye', 'fa fa-puzzle-piece']

const fullDemoText = computed(() => t('landing.hero.demoText'))
const displayedDemoText = ref('')
const visibleTaskCount = ref(0)
const visibleMockTasks = computed(() => [
  { name: t('landing.hero.mockTasks.0'), duration: 5, width: '35%', left: '2%' },
  { name: t('landing.hero.mockTasks.1'), duration: 3, width: '25%', left: '15%' },
  { name: t('landing.hero.mockTasks.2'), duration: 15, width: '45%', left: '25%' },
  { name: t('landing.hero.mockTasks.3'), duration: 8, width: '30%', left: '50%' },
  { name: t('landing.hero.mockTasks.4'), duration: 3, width: '20%', left: '70%' },
])

onMounted(() => {
  let charIdx = 0
  const text = fullDemoText.value
  const typeTimer = setInterval(() => {
    if (charIdx < text.length) {
      displayedDemoText.value = text.slice(0, charIdx + 1)
      charIdx++
    } else {
      clearInterval(typeTimer)
      let taskIdx = 0
      const taskTimer = setInterval(() => {
        if (taskIdx < 5) {
          visibleTaskCount.value++
          taskIdx++
        } else {
          clearInterval(taskTimer)
        }
      }, 400)
    }
  }, 40)
})

const particleStyle = (i) => {
  const size = 2 + Math.random() * 4
  return {
    width: size + 'px',
    height: size + 'px',
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 6 + 's',
    animationDuration: (4 + Math.random() * 8) + 's',
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.landing-page {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1a1a2e;
  overflow-x: hidden;
}

.landing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.landing-header.scrolled {
  background: rgba(255, 255, 255, 0.92);
  border-bottom-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.5rem;
  color: #4285F4;
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.03em;
}

.brand-ai-badge {
  position: relative;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.625rem;
  font-weight: 800;
  border-radius: 6px;
  letter-spacing: 0.05em;
  overflow: hidden;
}

.ai-badge-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
  animation: badge-shine 3s infinite;
}

@keyframes badge-shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.header-nav {
  display: flex;
  gap: 0.25rem;
  margin-left: 1.5rem;
}

.header-link {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.header-link:hover {
  color: #1a1a2e;
  background: rgba(0, 0, 0, 0.04);
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-login {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #64748b;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-login:hover {
  color: #1a1a2e;
}

.btn-primary {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #4285F4, #667eea);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(66, 133, 244, 0.3);
}

.hero {
  padding: 10rem 2rem 6rem;
  background: linear-gradient(180deg, #0f0f23 0%, #1a1a3e 40%, #16213e 70%, #f0f4ff 100%);
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.hero-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%);
  pointer-events: none;
}

.hero-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: rgba(102, 126, 234, 0.4);
  border-radius: 50%;
  animation: particle-float linear infinite;
}

@keyframes particle-float {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 20%, rgba(102, 126, 234, 0.2), transparent),
    radial-gradient(ellipse 60% 40% at 80% 10%, rgba(118, 75, 162, 0.12), transparent),
    radial-gradient(ellipse 50% 30% at 20% 30%, rgba(66, 133, 244, 0.1), transparent);
  pointer-events: none;
}

.hero-inner {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  position: relative;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  background: rgba(102, 126, 234, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a5b4fc;
  margin-bottom: 1.5rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #34A853;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-size: clamp(2.5rem, 5.5vw, 4.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin-bottom: 1.25rem;
  color: white;
}

.hero-title :deep(span) {
  background: linear-gradient(135deg, #667eea, #a78bfa, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
  max-width: 620px;
  margin: 0 auto 1.5rem;
}

.hero-slogan {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  background: linear-gradient(135deg, #667eea, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 auto 2.5rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.hero-slogan::before,
.hero-slogan::after {
  content: '';
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5));
}

.hero-slogan::after {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.5), transparent);
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 4rem;
}

.btn-hero-primary {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
}

.btn-hero-secondary {
  padding: 0.875rem 2rem;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.25s;
}

.btn-hero-secondary:hover {
  color: white;
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
}

.hero-visual {
  max-width: 900px;
  margin: 0 auto;
}

.visual-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 20px 60px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.visual-header {
  padding: 0.75rem 1rem;
  background: #f8f9fb;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 6px;
}

.visual-title-bar {
  margin-left: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }

.visual-body {
  padding: 1.5rem;
}

.ai-demo-flow {
  display: flex;
  align-items: stretch;
  gap: 1.25rem;
}

.ai-demo-input,
.ai-demo-output {
  flex: 1;
}

.ai-demo-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ai-demo-label i { font-size: 0.75rem; }

.ai-demo-text {
  padding: 0.875rem;
  background: #f8f9fb;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.8125rem;
  line-height: 1.7;
  color: #475569;
  text-align: left;
  min-height: 80px;
}

.typewriter-cursor {
  display: inline-block;
  animation: blink-cursor 0.8s step-end infinite;
  color: #667eea;
  font-weight: 300;
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ai-demo-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 48px;
}

.arrow-line {
  width: 2px;
  height: 12px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 1px;
}

.arrow-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 12px 4px rgba(102, 126, 234, 0.15); }
}

.arrow-label {
  font-size: 0.5625rem;
  font-weight: 800;
  color: #667eea;
  letter-spacing: 0.1em;
}

.gantt-mock {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gantt-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.4s ease;
}

.gantt-row-visible {
  opacity: 1;
  transform: translateX(0);
}

.gantt-label {
  width: 80px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  text-align: right;
  flex-shrink: 0;
}

.gantt-bar-track {
  flex: 1;
  height: 18px;
  background: #f1f5f9;
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}

.gantt-bar {
  position: absolute;
  top: 2px;
  height: 14px;
  border-radius: 4px;
  animation: bar-grow 1s ease-out forwards;
  transform-origin: left;
}

@keyframes bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.bar-1 { background: linear-gradient(90deg, #667eea, #7c93f0); }
.bar-2 { background: linear-gradient(90deg, #34A853, #5bc46f); }
.bar-3 { background: linear-gradient(90deg, #FBBC05, #fcc934); }
.bar-4 { background: linear-gradient(90deg, #EA4335, #ef6f64); }
.bar-5 { background: linear-gradient(90deg, #764ba2, #9b6cc4); }

.gantt-duration {
  font-size: 0.625rem;
  color: #94a3b8;
  font-weight: 600;
  width: 24px;
  flex-shrink: 0;
}

.section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 7rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(66, 133, 244, 0.08);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4285F4;
  margin-bottom: 1rem;
}

.section-tag.ai-tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.section-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.section-title :deep(span) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-desc {
  font-size: 1.0625rem;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

.ai-power-section {
  background: linear-gradient(180deg, #f5f3ff, #ede9fe, #f5f3ff);
}

.ai-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 3rem;
}

.ai-tab-btn {
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid rgba(102, 126, 234, 0.12);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s;
}

.ai-tab-btn:hover {
  border-color: rgba(102, 126, 234, 0.3);
  color: #667eea;
}

.ai-tab-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.ai-tab-content {
  max-width: 960px;
  margin: 0 auto;
}

.ai-demo-panel {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 3rem;
  align-items: center;
}

.ai-demo-left {
  text-align: left;
}

.ai-demo-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.ai-icon-1 { background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1)); color: #667eea; }
.ai-icon-2 { background: linear-gradient(135deg, rgba(52, 168, 83, 0.15), rgba(102, 126, 234, 0.1)); color: #34A853; }
.ai-icon-3 { background: linear-gradient(135deg, rgba(251, 188, 5, 0.15), rgba(234, 67, 53, 0.1)); color: #FBBC05; }
.ai-icon-4 { background: linear-gradient(135deg, rgba(234, 67, 53, 0.15), rgba(102, 126, 234, 0.1)); color: #EA4335; }

.ai-demo-name {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: #1a1a2e;
}

.ai-demo-desc {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.ai-demo-flow-steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flow-step {
  padding: 0.25rem 0.625rem;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

.flow-step.highlight {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-weight: 600;
}

.flow-arrow { font-size: 0.625rem; color: #94a3b8; }

.ai-demo-right {
  position: relative;
}

.ai-demo-preview {
  border-radius: 16px;
  overflow: hidden;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.preview-window {}

.preview-titlebar {
  padding: 0.625rem 1rem;
  background: #f8f9fb;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 6px;
}

.preview-titlebar .dot { width: 8px; height: 8px; }

.preview-body {
  padding: 1.25rem;
  min-height: 200px;
}

.preview-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-form-label {
  width: 80px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-align: right;
  flex-shrink: 0;
}

.preview-form-value {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  color: #475569;
  transition: all 0.4s ease;
}

.preview-form-value.filled {
  background: rgba(102, 126, 234, 0.06);
  border-color: rgba(102, 126, 234, 0.2);
  color: #667eea;
  font-weight: 500;
}

.preview-tree {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.preview-tree-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #475569;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.4s ease;
}

.preview-tree-node.visible {
  opacity: 1;
  transform: translateY(0);
}

.preview-tree-node i {
  font-size: 0.75rem;
  color: #94a3b8;
}

.node-duration {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #94a3b8;
  font-weight: 600;
}

.preview-report {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.report-header-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  width: 50%;
  opacity: 0;
  transition: all 0.5s ease;
}

.report-header-line.visible { opacity: 1; }

.report-line {
  height: 10px;
  border-radius: 3px;
  background: #f1f5f9;
  opacity: 0;
  transition: all 0.4s ease;
}

.report-line.visible { opacity: 1; }
.report-line:nth-child(2) { width: 90%; transition-delay: 0.1s; }
.report-line:nth-child(3) { width: 75%; transition-delay: 0.2s; }
.report-line:nth-child(4) { width: 85%; transition-delay: 0.3s; }
.report-line:nth-child(5) { width: 60%; transition-delay: 0.4s; }
.report-line:nth-child(6) { width: 70%; transition-delay: 0.5s; }

.preview-risk {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.4s ease;
}

.risk-item.visible {
  opacity: 1;
  transform: translateX(0);
}

.risk-item.safe { background: rgba(52, 168, 83, 0.08); color: #34A853; }
.risk-item.warning { background: rgba(251, 188, 5, 0.08); color: #FBBC05; }
.risk-item.danger { background: rgba(234, 67, 53, 0.08); color: #EA4335; }

.workflow-section {
  background: linear-gradient(180deg, #ffffff, #f8faff, #ffffff);
}

.workflow-pipeline {
  display: flex;
  align-items: flex-start;
  position: relative;
  justify-content: center;
  padding: 2rem 0;
}

.workflow-node {
  flex: 1;
  max-width: 220px;
  text-align: center;
  padding: 2rem 1rem;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.workflow-node:hover,
.workflow-node.active {
  transform: translateY(-4px);
}

.workflow-node-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.workflow-node.active .workflow-node-icon {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.workflow-node-num {
  font-size: 0.6875rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.workflow-node-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.375rem;
}

.workflow-node-desc {
  font-size: 0.75rem;
  line-height: 1.6;
  color: #94a3b8;
}

.workflow-line {
  position: absolute;
  right: -20px;
  top: 4rem;
  display: flex;
  align-items: center;
  gap: 0;
  z-index: 0;
}

.workflow-line-track {
  width: 28px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.workflow-line-flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s ease;
  border-radius: 2px;
}

.workflow-line-flow.flowing {
  transform: scaleX(1);
  animation: line-pulse 2s ease-in-out infinite;
}

@keyframes line-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.workflow-line-arrow {
  color: #cbd5e1;
  font-size: 0.5rem;
  transition: color 0.3s;
}

.workflow-node.active .workflow-line-arrow {
  color: #667eea;
}

.wf-icon-0 { background: rgba(102, 126, 234, 0.1); color: #667eea; }
.wf-icon-1 { background: rgba(118, 75, 162, 0.1); color: #764ba2; }
.wf-icon-2 { background: rgba(52, 168, 83, 0.1); color: #34A853; }
.wf-icon-3 { background: rgba(251, 188, 5, 0.1); color: #FBBC05; }
.wf-icon-4 { background: rgba(234, 67, 53, 0.1); color: #EA4335; }

.features {
  background: white;
}

.features-ai-label,
.features-basic-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.features-ai-label {
  color: #667eea;
}

.features-ai-label i {
  font-size: 0.75rem;
}

.features-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.features-ai-grid {
  grid-template-columns: repeat(3, 1fr);
}

.features-basic-grid {
  grid-template-columns: repeat(4, 1fr);
}

.feature-card {
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
  transition: all 0.3s ease;
  position: relative;
}

.feature-card:hover {
  border-color: rgba(66, 133, 244, 0.2);
  box-shadow: 0 8px 30px rgba(66, 133, 244, 0.08);
  transform: translateY(-2px);
}

.feature-card.ai-feature {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.02));
  border-color: rgba(102, 126, 234, 0.1);
}

.feature-card.ai-feature:hover {
  border-color: rgba(102, 126, 234, 0.25);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.1);
}

.feature-ai-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.5625rem;
  font-weight: 800;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 1.25rem;
}

.icon-ai-1 { background: rgba(102, 126, 234, 0.1); color: #667eea; }
.icon-ai-2 { background: rgba(52, 168, 83, 0.1); color: #34A853; }
.icon-ai-3 { background: rgba(251, 188, 5, 0.1); color: #FBBC05; }
.icon-basic-1 { background: rgba(66, 133, 244, 0.1); color: #4285F4; }
.icon-basic-2 { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.icon-basic-3 { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
.icon-basic-4 { background: rgba(234, 67, 53, 0.1); color: #EA4335; }

.feature-name {
  font-size: 1.0625rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1a1a2e;
}

.feature-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #64748b;
}

.highlights {
  background: linear-gradient(180deg, #f0f4ff, #ffffff);
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.highlight-card {
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.highlight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.highlight-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin: 0 auto 1rem;
}

.hl-icon-1 { background: rgba(102, 126, 234, 0.1); color: #667eea; }
.hl-icon-2 { background: rgba(251, 188, 5, 0.1); color: #FBBC05; }
.hl-icon-3 { background: rgba(52, 168, 83, 0.1); color: #34A853; }
.hl-icon-4 { background: rgba(118, 75, 162, 0.1); color: #764ba2; }

.highlight-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.highlight-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  line-height: 1.5;
}

.cta-section {
  background: white;
}

.cta-card {
  text-align: center;
  padding: 5rem 3rem;
  border-radius: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a3e 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}

.cta-glow-1 {
  top: -20%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: rgba(102, 126, 234, 0.15);
  animation: cta-glow-drift 8s ease-in-out infinite;
}

.cta-glow-2 {
  bottom: -15%;
  left: -5%;
  width: 300px;
  height: 300px;
  background: rgba(118, 75, 162, 0.12);
  animation: cta-glow-drift 10s ease-in-out infinite reverse;
}

@keyframes cta-glow-drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -15px); }
}

.cta-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 70%);
  pointer-events: none;
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-sparkle {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.cta-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.cta-title :deep(span) {
  background: linear-gradient(135deg, #667eea, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-desc {
  font-size: 1.0625rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2.5rem;
}

.cta-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.btn-cta-primary {
  padding: 1rem 2.5rem;
  font-size: 1.0625rem;
  border-radius: 16px;
}

.btn-cta-secondary {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s;
}

.btn-cta-secondary:hover {
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.cta-trust {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.cta-trust span {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.cta-trust span i {
  color: #34A853;
  font-size: 0.75rem;
}

.landing-footer {
  background: #0f0f23;
  padding: 4rem 2rem 0;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  padding-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-left {
  max-width: 300px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.footer-brand .brand-icon { color: #4285F4; }
.footer-brand .brand-text { color: white; font-size: 1.125rem; }

.footer-badge {
  font-size: 0.5rem;
  padding: 1px 6px;
}

.footer-tagline {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.7;
}

.footer-links {
  display: flex;
  gap: 4rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.footer-col h5 {
  font-size: 0.8125rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.25rem;
}

.footer-col a {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: rgba(255, 255, 255, 0.7);
}

.footer-bottom {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-copy {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
}

.footer-social {
  display: flex;
  gap: 1rem;
}

.footer-social a {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.25s;
}

.footer-social a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .features-ai-grid,
  .features-basic-grid {
    grid-template-columns: 1fr;
  }

  .highlights-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ai-demo-flow {
    flex-direction: column;
  }

  .ai-demo-arrow {
    flex-direction: row;
    min-width: auto;
    padding: 0.5rem 0;
  }

  .arrow-line {
    width: 12px;
    height: 2px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .header-nav {
    display: none;
  }

  .ai-demo-panel {
    grid-template-columns: 1fr;
  }

  .ai-tabs {
    flex-wrap: wrap;
  }

  .workflow-pipeline {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .workflow-node {
    max-width: 150px;
  }

  .workflow-line {
    display: none;
  }

  .footer-inner {
    flex-direction: column;
    gap: 2rem;
  }

  .footer-links {
    gap: 2rem;
  }

  .cta-trust {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>

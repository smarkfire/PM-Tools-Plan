<template>
  <div class="landing-page">
    <header class="landing-header">
      <div class="header-inner">
        <div class="header-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-text">PLAN-Tools</span>
          <span class="brand-ai-badge">AI</span>
        </div>
        <nav class="header-nav">
          <a href="#ai-power" class="header-link">{{ $t('landing.nav.aiPower') }}</a>
          <a href="#features" class="header-link">{{ $t('landing.nav.features') }}</a>
          <a href="#highlights" class="header-link">{{ $t('landing.nav.highlights') }}</a>
        </nav>
        <div class="header-actions">
          <LanguageSwitcher />
          <button class="btn-primary" @click="navigateTo('/workspace')">
            {{ $t('landing.hero.cta') }}
            <i class="fa fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          {{ $t('landing.hero.badge') }}
        </div>
        <h1 class="hero-title" v-html="$t('landing.hero.title')"></h1>
        <p class="hero-subtitle">{{ $t('landing.hero.subtitle') }}</p>
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
                  <div class="ai-demo-text">{{ $t('landing.hero.demoText') }}</div>
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
                    <div class="gantt-row" v-for="i in 5" :key="i">
                      <div class="gantt-label">{{ $t(`landing.hero.mockTasks.${i - 1}`) }}</div>
                      <div class="gantt-bar-track">
                        <div class="gantt-bar" :class="`bar-${i}`"></div>
                      </div>
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
        <div class="ai-power-grid">
          <div class="ai-power-card" v-for="n in 4" :key="n">
            <div class="ai-power-icon" :class="`ai-icon-${n}`">
              <i :class="aiPowerIcons[n - 1]"></i>
            </div>
            <h3 class="ai-power-name">{{ $t(`landing.aiPower.items.${n - 1}.name`) }}</h3>
            <p class="ai-power-desc">{{ $t(`landing.aiPower.items.${n - 1}.desc`) }}</p>
            <div class="ai-power-flow" v-if="n === 1">
              <span class="flow-step">{{ $t('landing.aiPower.items.0.flow1') }}</span>
              <i class="fa fa-arrow-right flow-arrow"></i>
              <span class="flow-step">{{ $t('landing.aiPower.items.0.flow2') }}</span>
              <i class="fa fa-arrow-right flow-arrow"></i>
              <span class="flow-step highlight">{{ $t('landing.aiPower.items.0.flow3') }}</span>
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
        <div class="features-grid">
          <div class="feature-card" v-for="n in 6" :key="n">
            <div class="feature-icon" :class="`icon-${n}`">
              <i :class="featureIcons[n - 1]"></i>
            </div>
            <h3 class="feature-name">{{ $t(`landing.features.items.${n - 1}.name`) }}</h3>
            <p class="feature-desc">{{ $t(`landing.features.items.${n - 1}.desc`) }}</p>
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
            <div class="highlight-number">{{ highlightNumbers[n - 1] }}</div>
            <div class="highlight-label">{{ $t(`landing.highlights.items.${n - 1}`) }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="section-inner">
        <div class="cta-card">
          <div class="cta-sparkle">
            <i class="fa fa-magic"></i>
          </div>
          <h2 class="cta-title" v-html="$t('landing.cta.title')"></h2>
          <p class="cta-desc">{{ $t('landing.cta.description') }}</p>
          <button class="btn-hero-primary" @click="navigateTo('/workspace')">
            <i class="fa fa-magic"></i>
            {{ $t('landing.cta.button') }}
          </button>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-text">PLAN-Tools</span>
        </div>
        <p class="footer-copy">{{ $t('landing.footer.copyright') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import LanguageSwitcher from '~/components/common/LanguageSwitcher.vue'

definePageMeta({
  layout: false
})

const aiPowerIcons = [
  'fa fa-magic',
  'fa fa-brain',
  'fa fa-file-alt',
  'fa fa-chart-line'
]

const featureIcons = [
  'fa fa-tasks',
  'fa fa-chart-gantt',
  'fa fa-file-export',
  'fa fa-users',
  'fa fa-globe',
  'fa fa-cloud-download-alt'
]

const highlightNumbers = ['AI', '10s', '100%', '5+']
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 64px;
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
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.625rem;
  font-weight: 800;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.header-nav {
  display: flex;
  gap: 0.5rem;
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
  gap: 1rem;
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
  padding: 10rem 2rem 4rem;
  background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%);
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(102, 126, 234, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 0%, rgba(118, 75, 162, 0.08), transparent);
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
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #667eea;
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
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
  color: #1a1a2e;
}

.hero-title :deep(span) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto 2.5rem;
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
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.btn-hero-secondary {
  padding: 0.875rem 2rem;
  background: transparent;
  color: #64748b;
  border: 1px solid rgba(0, 0, 0, 0.1);
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
  color: #1a1a2e;
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.02);
}

.hero-visual {
  max-width: 860px;
  margin: 0 auto;
}

.visual-card {
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 20px 50px -12px rgba(0, 0, 0, 0.12);
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

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

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

.ai-demo-label i {
  font-size: 0.75rem;
}

.ai-demo-text {
  padding: 0.875rem;
  background: #f8f9fb;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.8125rem;
  line-height: 1.7;
  color: #475569;
  text-align: left;
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
  animation: bar-grow 1.5s ease-out forwards;
  transform-origin: left;
}

@keyframes bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.bar-1 { left: 2%; width: 35%; background: linear-gradient(90deg, #667eea, #7c93f0); animation-delay: 0.1s; }
.bar-2 { left: 15%; width: 40%; background: linear-gradient(90deg, #34A853, #5bc46f); animation-delay: 0.2s; }
.bar-3 { left: 30%; width: 25%; background: linear-gradient(90deg, #FBBC05, #fcc934); animation-delay: 0.3s; }
.bar-4 { left: 45%; width: 35%; background: linear-gradient(90deg, #EA4335, #ef6f64); animation-delay: 0.4s; }
.bar-5 { left: 60%; width: 30%; background: linear-gradient(90deg, #764ba2, #9b6cc4); animation-delay: 0.5s; }

.section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 6rem 2rem;
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

.ai-power-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.ai-power-card {
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  background: white;
  transition: all 0.3s ease;
}

.ai-power-card:hover {
  border-color: rgba(102, 126, 234, 0.25);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.ai-power-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.375rem;
  margin-bottom: 1.25rem;
}

.ai-icon-1 { background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1)); color: #667eea; }
.ai-icon-2 { background: linear-gradient(135deg, rgba(52, 168, 83, 0.15), rgba(102, 126, 234, 0.1)); color: #34A853; }
.ai-icon-3 { background: linear-gradient(135deg, rgba(251, 188, 5, 0.15), rgba(234, 67, 53, 0.1)); color: #FBBC05; }
.ai-icon-4 { background: linear-gradient(135deg, rgba(234, 67, 53, 0.15), rgba(102, 126, 234, 0.1)); color: #EA4335; }

.ai-power-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1a1a2e;
}

.ai-power-desc {
  font-size: 0.875rem;
  line-height: 1.7;
  color: #64748b;
}

.ai-power-flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
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

.flow-arrow {
  font-size: 0.625rem;
  color: #94a3b8;
}

.features {
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.feature-card {
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: rgba(66, 133, 244, 0.2);
  box-shadow: 0 8px 30px rgba(66, 133, 244, 0.08);
  transform: translateY(-2px);
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

.icon-1 { background: rgba(66, 133, 244, 0.1); color: #4285F4; }
.icon-2 { background: rgba(52, 168, 83, 0.1); color: #34A853; }
.icon-3 { background: rgba(251, 188, 5, 0.1); color: #FBBC05; }
.icon-4 { background: rgba(234, 67, 53, 0.1); color: #EA4335; }
.icon-5 { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.icon-6 { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }

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
}

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

.cta-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent 70%);
  pointer-events: none;
}

.cta-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.15), transparent 70%);
  pointer-events: none;
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
  position: relative;
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
  position: relative;
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
  position: relative;
}

.cta-card .btn-hero-primary {
  position: relative;
}

.landing-footer {
  background: #1a1a2e;
  padding: 2.5rem 2rem;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-brand .brand-icon {
  color: #4285F4;
}

.footer-brand .brand-text {
  color: white;
}

.footer-copy {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .ai-power-grid {
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

  .footer-inner {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>

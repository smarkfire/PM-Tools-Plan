<template>
  <div class="landing-page">
    <header class="landing-header">
      <div class="header-inner">
        <div class="header-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-text">PLAN-Tools</span>
        </div>
        <nav class="header-nav">
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
            {{ $t('landing.hero.cta') }}
            <i class="fa fa-arrow-right"></i>
          </button>
          <a href="#features" class="btn-hero-secondary">
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
            </div>
            <div class="visual-body">
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
          <div class="highlight-card" v-for="n in 3" :key="n">
            <div class="highlight-number">{{ highlightNumbers[n - 1] }}</div>
            <div class="highlight-label">{{ $t(`landing.highlights.items.${n - 1}`) }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="section-inner">
        <div class="cta-card">
          <h2 class="cta-title">{{ $t('landing.cta.title') }}</h2>
          <p class="cta-desc">{{ $t('landing.cta.description') }}</p>
          <button class="btn-hero-primary" @click="navigateTo('/workspace')">
            {{ $t('landing.cta.button') }}
            <i class="fa fa-arrow-right"></i>
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

const featureIcons = [
  'fa fa-tasks',
  'fa fa-chart-gantt',
  'fa fa-file-export',
  'fa fa-users',
  'fa fa-globe',
  'fa fa-cloud-download-alt'
]

const highlightNumbers = ['100%', '3+', '5+']
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
  background: #4285F4;
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
  background: #3b78e7;
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
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(66, 133, 244, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 0%, rgba(52, 168, 83, 0.08), transparent);
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
  background: rgba(66, 133, 244, 0.08);
  border: 1px solid rgba(66, 133, 244, 0.15);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4285F4;
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
  background: linear-gradient(135deg, #4285F4, #34A853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #64748b;
  max-width: 560px;
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
  background: linear-gradient(135deg, #4285F4, #3b78e7);
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
  box-shadow: 0 4px 20px rgba(66, 133, 244, 0.25);
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(66, 133, 244, 0.35);
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
  max-width: 800px;
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
  gap: 6px;
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

.gantt-mock {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gantt-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gantt-label {
  width: 120px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-align: right;
  flex-shrink: 0;
}

.gantt-bar-track {
  flex: 1;
  height: 24px;
  background: #f1f5f9;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.gantt-bar {
  position: absolute;
  top: 2px;
  height: 20px;
  border-radius: 5px;
  animation: bar-grow 1.5s ease-out forwards;
  transform-origin: left;
}

@keyframes bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.bar-1 { left: 2%; width: 35%; background: linear-gradient(90deg, #4285F4, #5a9cf5); animation-delay: 0.1s; }
.bar-2 { left: 15%; width: 40%; background: linear-gradient(90deg, #34A853, #5bc46f); animation-delay: 0.2s; }
.bar-3 { left: 30%; width: 25%; background: linear-gradient(90deg, #FBBC05, #fcc934); animation-delay: 0.3s; }
.bar-4 { left: 45%; width: 35%; background: linear-gradient(90deg, #EA4335, #ef6f64); animation-delay: 0.4s; }
.bar-5 { left: 60%; width: 30%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); animation-delay: 0.5s; }

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

.section-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.section-desc {
  font-size: 1.0625rem;
  color: #64748b;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.7;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.highlight-card {
  text-align: center;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.highlight-number {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4285F4, #34A853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.highlight-label {
  font-size: 0.9375rem;
  color: #64748b;
  font-weight: 500;
}

.cta-section {
  background: white;
}

.cta-card {
  text-align: center;
  padding: 5rem 3rem;
  border-radius: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
  background: radial-gradient(circle, rgba(66, 133, 244, 0.15), transparent 70%);
  pointer-events: none;
}

.cta-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
  position: relative;
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
  .features-grid,
  .highlights-grid {
    grid-template-columns: 1fr;
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

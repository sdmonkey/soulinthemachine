import DefaultTheme from 'vitepress/theme'
import SoulRadar from './components/SoulRadar.vue'
import AxisGlyph from './components/AxisGlyph.vue'
import HomeRadarShowcase from './components/HomeRadarShowcase.vue'
import SoulExport from './components/SoulExport.vue'
import SoulQuickExport from './components/SoulQuickExport.vue'
import SoulGallery from './components/SoulGallery.vue'
import SoulWeaver from './components/SoulWeaver.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SoulRadar', SoulRadar)
    app.component('AxisGlyph', AxisGlyph)
    app.component('HomeRadarShowcase', HomeRadarShowcase)
    app.component('SoulExport', SoulExport)
    app.component('SoulQuickExport', SoulQuickExport)
    app.component('SoulGallery', SoulGallery)
    app.component('SoulWeaver', SoulWeaver)
  }
}

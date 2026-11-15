<script setup lang="ts">
// The engineering sections of a project page: numbers, architecture diagram, decisions, API, data.
// A project without a case study shows only its plain architecture list.
import type { CaseStudy, Labelled } from '~/utils/content'

const props = defineProps<{ c: CaseStudy | undefined; arch: Labelled[] }>()

// Each diagram has a wide shape for desktop and a tall one for phones (src/diagrams/make_diagrams.py).
const svgs = import.meta.glob('~~/src/diagrams/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
function diagram(variant: 'wide' | 'tall') {
  const key = Object.keys(svgs).find((k) => k.endsWith(`/${props.c!.diagram}-${variant}.svg`))!
  const m = svgs[key]!.trim().match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/)!
  return { viewBox: m[1]!.match(/viewBox="([^"]+)"/)![1]!, inner: m[2]! }
}
const wide = computed(() => (props.c ? diagram('wide') : null))
const tall = computed(() => (props.c ? diagram('tall') : null))
</script>

<template>
  <section v-if="!c" class="box" aria-labelledby="arch-h">
    <h2 id="arch-h">The architecture</h2>
    <dl class="rows"><div v-for="a in arch" :key="a.label"><dt>{{ a.label }}</dt><dd>{{ a.text }}</dd></div></dl>
  </section>
  <template v-else>
    <section class="box" aria-labelledby="nums-h">
      <h2 id="nums-h">In numbers</h2>
      <ul class="numbers"><li v-for="n in c.numbers" :key="n.value"><strong><Cs :text="n.value" /></strong><span><Cs :text="n.text" /></span></li></ul>
    </section>

    <section class="box" aria-labelledby="arch-h">
      <h2 id="arch-h">How it's built</h2>
      <figure class="diagram" role="img" :aria-label="c.diagram_alt">
        <svg class="dg dg-wide" aria-hidden="true" focusable="false" :viewBox="wide!.viewBox" xmlns="http://www.w3.org/2000/svg" v-html="wide!.inner" />
        <svg class="dg dg-tall" aria-hidden="true" focusable="false" :viewBox="tall!.viewBox" xmlns="http://www.w3.org/2000/svg" v-html="tall!.inner" />
      </figure>
      <dl class="rows"><div v-for="a in arch" :key="a.label"><dt>{{ a.label }}</dt><dd>{{ a.text }}</dd></div></dl>
    </section>

    <section class="box" aria-labelledby="dec-h">
      <h2 id="dec-h">Key decisions</h2>
      <ol class="decisions"><li v-for="d in c.decisions" :key="d.title"><h3><Cs :text="d.title" /></h3><p><Cs :text="d.text" /></p></li></ol>
    </section>

    <section class="box" aria-labelledby="api-h">
      <h2 id="api-h">The API</h2>
      <p class="prose"><Cs :text="c.api_note" /></p>
      <dl class="rows rows-api"><div v-for="a in c.api" :key="a.route"><dt><code><Cs :text="a.route" /></code></dt><dd><Cs :text="a.text" /></dd></div></dl>
    </section>

    <section v-if="c.data.length" class="box" aria-labelledby="data-h">
      <h2 id="data-h">The data</h2>
      <dl class="rows"><div v-for="d in c.data" :key="d.label"><dt><Cs :text="d.label" /></dt><dd><Cs :text="d.text" /></dd></div></dl>
    </section>

    <section v-if="c.lessons" class="box" aria-labelledby="next-h">
      <h2 id="next-h">What I'd change</h2>
      <div class="prose"><p><Cs :text="c.lessons" /></p></div>
    </section>
  </template>
</template>

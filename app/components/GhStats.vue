<script setup lang="ts">
// Commits and last update for each repository, from the snapshot src/stats.py takes.
// Public repos link to the code, and site.js refreshes their numbers in the browser.
import { ghStats, ghDate } from '~/utils/content'

const props = withDefaults(defineProps<{ repos: { repo: string; label: string }[]; cls?: string }>(), { cls: 'gh' })
const rows = computed(() => props.repos.flatMap((r) => (ghStats[r.repo] ? [{ ...r, st: ghStats[r.repo]! }] : [])))
</script>

<template>
  <ul v-if="rows.length" :class="cls">
    <template v-for="r in rows" :key="r.repo">
      <li v-if="r.st.private"><Ico name="github" /><span><template v-if="r.label"><span class="gh-label">{{ r.label }}:</span> </template><span data-gh="commits">{{ r.st.commits }}</span> commits · updated <time data-gh="updated" :datetime="r.st.pushed_at">{{ ghDate(r.st.pushed_at) }}</time> · private repository</span></li>
      <li v-else :data-gh-repo="r.repo"><Ico name="github" /><span><template v-if="r.label"><span class="gh-label">{{ r.label }}:</span> </template><a :href="r.st.url!"><span data-gh="commits">{{ r.st.commits }}</span> commits</a> · updated <time data-gh="updated" :datetime="r.st.pushed_at">{{ ghDate(r.st.pushed_at) }}</time></span></li>
    </template>
  </ul>
</template>

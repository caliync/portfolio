<script setup lang="ts">
import { site } from '~/utils/content'

const rel = useRel()
</script>

<template>
  <footer class="foot">
    <div class="foot-in">
      <p>© 2026 {{ site.fullName }}</p>
      <GhStats :repos="[{ repo: site.siteRepo, label: 'This site\'s code' }]" cls="gh gh-foot" />
      <p><a :href="`${rel}how-its-built.html`">How this site is built</a></p>
      <ContactIcons />
    </div>
  </footer>
</template>

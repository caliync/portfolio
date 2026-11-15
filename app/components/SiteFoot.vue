<script setup lang="ts">
import { site } from '~/utils/content'
</script>

<template>
  <footer class="foot">
    <div class="foot-in">
      <p>© 2026 {{ site.fullName }}</p>
      <GhStats :repos="[{ repo: site.siteRepo, label: 'This site\'s code' }]" cls="gh gh-foot" />
      <ContactIcons />
    </div>
  </footer>
</template>

<script setup lang="ts">
// The home page: one shelf of panels. On a laptop lib/shelfScroll.ts turns scrolling into a sideways
// glide along the shelf; on a phone you swipe; with reduced motion it's a plain vertical page.
import { about, credentials, experience, projects, site, skills } from '~/utils/content'

// GitHub Pages also serves this page as /portfolio/index.html.
definePageMeta({ alias: ['/index.html'] })

// Same order as the panels. On phones only the links marked `essential` fit in the bar;
// the others stay one swipe away.
const nav = [
  { text: 'Projects', href: '#projects', essential: true },
  { text: 'About', href: '#about', essential: true },
  { text: 'Experience', href: '#experience', essential: false },
  { text: 'Skills', href: '#skills', essential: false },
  { text: 'Credentials', href: '#credentials', essential: false },
  { text: 'Contact', href: '#contact', essential: true },
]

// Panels after the first in a group get numbered ids: projects, projects-2, projects-3.
const nth = (base: string, i: number) => (i === 0 ? base : `${base}-${i + 1}`)
const hid = (base: string, i: number) => (i === 0 ? base : `${base}${i + 1}`)

const description = 'Casey Allison R. Yncierto, a fourth-year IT student at FEU Alabang who builds web and mobile apps, open to frontend and full-stack internships.'
useSiteHead({
  path: '',
  title: `${site.name} · ${about.role}`,
  description,
  image: 'images/og/home.jpg',
  imageAlt: `${site.name}, web and mobile application developer`,
  kind: 'website',
  bg: 'intro',
  ld: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', '@id': `${site.url}#casey`,
        name: site.fullName, alternateName: site.name,
        url: site.url, jobTitle: about.role,
        email: `mailto:${site.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Calamba City', addressRegion: 'Laguna', addressCountry: 'PH' },
        affiliation: { '@type': 'CollegeOrUniversity', name: 'Far Eastern University - Alabang' },
        knowsAbout: skills.arsenal.flatMap((g) => g.items),
        sameAs: [site.linkedin, site.github],
      },
      { '@type': 'WebSite', url: site.url, name: site.name, author: { '@id': `${site.url}#casey` } },
    ],
  },
})
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <canvas class="bg3d" aria-hidden="true" />

  <header class="bar">
    <div class="bar-in">
      <a class="mark" href="#top" :aria-label="`${site.name}, back to top`"><img :src="asset('', 'logo.svg')" alt="CY" width="44" height="44"></a>
      <nav aria-label="Sections"><a v-for="l in nav" :key="l.href" :href="l.href" :class="{ 'nav-extra': !l.essential }">{{ l.text }}</a></nav>
      <ThemeButton />
    </div>
  </header>

  <main id="main" class="hs">
    <div class="hs-sticky">
      <div class="hs-track col">
        <section id="top" class="panel panel-hero" aria-label="Introduction">
          <div class="hero">
            <h1 id="name" class="name">{{ site.name }}</h1>
            <p class="role">{{ about.role }}</p>
            <p class="avail">{{ about.availability }}</p>
            <div class="reach-row">
              <div class="dl">
                <a class="dl-btn dl-solid dl-main" href="#projects">See my projects <span aria-hidden="true">&rarr;</span></a>
                <a class="dl-btn" href="casey-cv.pdf" target="_blank" rel="noopener"><Ico name="out" /><span>CV</span></a>
                <a class="dl-btn" href="casey-ats-resume.pdf" target="_blank" rel="noopener"><Ico name="out" /><span>ATS</span></a>
              </div>
              <ContactIcons />
            </div>
            <p class="hs-hint" aria-hidden="true"><span class="h-scroll">Scroll to browse the shelves</span><span class="h-swipe">Swipe to browse the shelves</span> <span class="arrow">&rarr;</span></p>
          </div>
        </section>

        <section v-for="(p, i) in projects" :id="nth('projects', i)" :key="p.slug" class="panel panel-proj">
          <div class="box panel-box">
            <h2 :id="hid('proj-h', i)">Projects<span class="count">{{ i + 1 }} of {{ projects.length }}</span></h2>
            <ProjectCard :p="p" />
          </div>
        </section>

        <section id="about" class="panel ">
          <div class="box panel-box">
            <h2 id="about-h">About me</h2>
            <div class="prose">
              <p v-for="(t, i) in about.paragraphs" :key="i">{{ t }}</p>
            </div>
            <div class="two-col">
              <div>
                <h3 class="sub">Core subjects</h3>
                <ul class="list"><li v-for="t in about.subjects" :key="t">{{ t }}</li></ul>
              </div>
              <div>
                <h3 class="sub">Research interests</h3>
                <ul class="list"><li v-for="t in about.interests" :key="t">{{ t }}</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" class="panel panel-exp">
          <div class="box panel-box">
            <h2 id="exp-h">Experience</h2>
            <div class="jobs">
              <article v-for="job in experience" :key="job.title" class="job">
                <div class="job-text">
                  <h3>{{ job.title }}</h3>
                  <p class="kind"><span class="emp">{{ job.type }}</span> {{ job.where }}</p>
                  <ul class="list"><li v-for="(t, j) in job.points" :key="j">{{ t }}</li></ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="skills" class="panel ">
          <div class="box panel-box">
            <h2 id="skills-h">My arsenal</h2>
            <div class="arsenal">
              <div v-for="g in skills.arsenal" :key="g.group" class="kit"><h3 class="sub">{{ g.group }}</h3><TagList :names="g.items" /></div>
            </div>
          </div>
        </section>

        <section id="credentials" class="panel panel-cred">
          <div class="box panel-box">
            <h2 id="cred-h">Credentials</h2>
            <div class="cred-cols">
              <div class="cred-block">
                <h3 class="cred-sub">Certificates</h3>
                <ul class="certs">
                  <li v-for="c in credentials.certificates" :key="c.slug" class="cert">
                    <figure class="cert-img"><a :href="`images/certs/${c.slug}.webp`"><img :src="`images/certs/${c.slug}.webp`" :alt="`${c.title} certificate`" :width="c.width" :height="c.height" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true"></a></figure>
                    <div class="cert-text">
                      <h3>{{ c.title }}</h3>
                      <p>{{ c.issuer }}</p>
                      <p class="cert-date"><time :datetime="c.date">{{ c.dateText }}</time></p>
                    </div>
                  </li>
                </ul>
                <h3 class="cred-sub cred-sub-2">Organizations</h3>
                <ul class="cred-grid cred-orgs"><li v-for="t in credentials.organizations" :key="t" class="cred-item">{{ t }}</li></ul>
              </div>
              <div class="cred-block">
                <h3 class="cred-sub">Seminars</h3>
                <ul class="cred-grid"><li v-for="t in credentials.seminars" :key="t" class="cred-item">{{ t }}</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" class="panel ">
          <div class="box panel-box">
            <h2 id="contact-h">Contact</h2>
            <p class="contact-line">{{ about.contactLine }}</p>
            <dl class="rows copy-ok">
              <div><dt>Email</dt><dd><a :href="`mailto:${site.email}`">{{ site.email }}</a></dd></div>
              <div><dt>LinkedIn</dt><dd><a :href="site.linkedin">linkedin.com/in/casey-yncierto</a></dd></div>
              <div><dt>GitHub</dt><dd><a :href="site.github">github.com/caliync</a></dd></div>
            </dl>
            <p class="panel-foot">&copy; 2026 {{ site.fullName }}</p>
          </div>
        </section>
      </div>
    </div>
    <div class="hs-progress" aria-hidden="true"><span /></div>
  </main>
  <SiteFoot />
</template>

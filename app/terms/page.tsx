import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, Section } from '@/components/legal/legal-page'
import { ISSUES_URL, REPO_URL } from '@/lib/github'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms for using the BitChord apps, addons, Listen Together and this website. BitChord is an independent, open-source YouTube Music client.',
  alternates: { canonical: '/terms' },
}

const UPDATED = 'November 19, 2026'
const DISCORD_URL = 'https://discord.gg/pSafNTyKZx'

/** The terms of service for the BitChord apps, the services they use, and this site. */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={UPDATED}
      intro={
        <p>
          These terms apply when you use the BitChord apps for Android, Android TV and Wear OS,
          the BitChord web player, the servers BitChord runs for them, and this website
          (together, &ldquo;BitChord&rdquo;). By using BitChord you agree to them. If you do
          not agree, do not use BitChord.
        </p>
      }
    >
      <Section id="what-it-is" title="1. What BitChord is">
        <p>
          BitChord is a free, open-source music player. It is an independent client for YouTube
          Music: it plays music that YouTube makes available, and can also play your own files
          and sources you add yourself. BitChord does not host, upload, sell or own any music,
          video, artwork or lyrics.
        </p>
        <p>
          BitChord&apos;s source code is licensed under the{' '}
          <a href={`${REPO_URL}/blob/main/LICENSE`}>GNU General Public License v3.0</a>. Nothing
          in these terms limits the rights that licence gives you over the code. These terms
          cover your use of the apps, the services described below and this website.
        </p>
      </Section>

      <Section id="not-affiliated" title="2. No affiliation">
        <p>
          BitChord is <strong>not affiliated with, endorsed by, sponsored by or connected to</strong>{' '}
          YouTube, YouTube Music, Google, Spotify, Discord, Apple, Last.fm, Libre.fm,
          ListenBrainz, Musixmatch, Genius, LRCLIB, KuGou, TIDAL, JioSaavn, or any other company
          or service the app integrates with or mentions. All product names, logos and brands
          are the property of their owners and are used only to identify the services BitChord
          works with. Use of them does not imply endorsement.
        </p>
      </Section>

      <Section id="third-party" title="3. Third-party services and your accounts">
        <p>
          BitChord connects to services run by other companies, such as YouTube, Spotify,
          Discord, Google Drive and Last.fm. When you use them through BitChord:
        </p>
        <ul>
          <li>
            Your use of each service remains subject to that service&apos;s own terms and
            policies, including{' '}
            <a href="https://www.youtube.com/t/terms">YouTube&apos;s Terms of Service</a>. You
            are responsible for making sure your use complies with them.
          </li>
          <li>
            BitChord is an unofficial client. A service may treat the use of unofficial clients
            as against its terms, and may limit, suspend or close accounts used with them.
            BitChord cannot prevent this and is not responsible for it.
          </li>
          <li>
            Any service can change or stop working with BitChord at any time, without notice,
            and features that depend on it may stop working.
          </li>
          <li>
            BitChord does not control and is not responsible for the content, availability,
            accuracy or practices of any third-party service.
          </li>
        </ul>
      </Section>

      <Section id="content" title="4. Content, downloads and copyright">
        <ul>
          <li>
            The music, videos, artwork and lyrics you access through BitChord belong to their
            artists, labels, publishers and other rights holders.
          </li>
          <li>
            Downloading saves a copy for your own personal, non-commercial listening. You are
            solely responsible for making sure that downloading, storing and playing content is
            lawful where you live and permitted by the service it comes from.
          </li>
          <li>
            Do not use BitChord to redistribute, sell, publicly perform, or otherwise infringe the
            rights in any content.
          </li>
        </ul>
        <p>
          BitChord hosts no media, so it cannot remove content from YouTube or other services.
          Rights holders should contact the service that hosts the content.
        </p>
      </Section>

      <Section id="addons" title="5. Addons">
        <p>
          Addons are servers built and run by third parties that you choose to add to BitChord.
          BitChord does not create, host, operate, review, verify or endorse any addon, and has
          no control over what an addon serves.
        </p>
        <ul>
          <li>You add and use addons at your own risk and are responsible for that choice.</li>
          <li>
            Only use addons to access content you have the right to access. Addon developers are
            responsible for their addons, including their legality and the data they collect.
          </li>
          <li>
            Some addons only work with genuine copies of BitChord and ask the app to prove this
            through BitChord&apos;s authentication service. That check confirms the app, not the
            addon, and is not an endorsement of the addon.
          </li>
          <li>
            Addon developers must follow the{' '}
            <Link href="/docs">addon developer guide</Link> and must not use addons to distribute
            malware, collect data deceptively or infringe others&apos; rights.
          </li>
        </ul>
      </Section>

      <Section id="services" title="6. Services BitChord runs">
        <p>
          BitChord runs a few free services for the apps: Listen Together (shared listening
          sessions), a live count of people using the app, addon authentication, and this
          website. They are provided as-is, have no guaranteed uptime, and may be changed,
          limited or shut down at any time. When you use them, you must not:
        </p>
        <ul>
          <li>attack, overload, probe or disrupt them, or try to get around their limits;</li>
          <li>
            use Listen Together to harass, threaten or impersonate others, or use display names
            or avatars that are unlawful or abusive;
          </li>
          <li>
            use automated means to access them other than through the BitChord apps, except for
            your own testing at a reasonable rate;
          </li>
          <li>use them for anything unlawful.</li>
        </ul>
        <p>
          Access may be blocked for anyone who breaks these rules. The person who hosts a Listen
          Together session can remove people from it.
        </p>
      </Section>

      <Section id="google-drive" title="7. Google Drive backup">
        <p>
          Google Drive backup stores your Replay statistics and settings in your own Google
          Drive, in a hidden folder only BitChord can use. Keeping that data is Google&apos;s
          service, under your Google account&apos;s terms and storage limits. BitChord does its
          best to keep backups correct but cannot guarantee that a backup or restore will
          succeed or that data will never be lost; keep your own copy with{' '}
          <strong>Export data</strong> if it matters to you. How the data is handled is
          described in the <Link href="/privacy#google-drive">Privacy Policy</Link>.
        </p>
      </Section>

      <Section id="use" title="8. Using BitChord responsibly">
        <ul>
          <li>Use BitChord only in ways that are lawful where you are.</li>
          <li>
            Download BitChord only from its{' '}
            <a href={`${REPO_URL}/releases`}>official GitHub releases</a> or this website.
            Modified builds from other sources are not BitChord&apos;s responsibility and may be
            unsafe.
          </li>
          <li>
            If you share a modified version, follow the GPL-3.0 licence and make clear that it is
            not the official app.
          </li>
        </ul>
      </Section>

      <Section id="warranty" title="9. No warranty">
        <p>
          BitChord is provided free of charge, <strong>&ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranty of any kind</strong>, express or implied, including
          warranties of merchantability, fitness for a particular purpose, non-infringement,
          and that it will be uninterrupted, error-free or secure. You use it at your own risk.
        </p>
      </Section>

      <Section id="liability" title="10. Limitation of liability">
        <p>
          To the fullest extent the law allows, the developer and contributors of BitChord are
          not liable for any indirect, incidental, special, consequential or punitive damages,
          or for any loss of data, accounts, content, profits or goodwill, arising from your use
          of or inability to use BitChord, any addon or any third-party service, even if
          advised of the possibility. Since BitChord is free, total liability for any claim is
          limited to zero, or to the lowest amount the applicable law allows.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to these terms">
        <p>
          These terms may be updated as BitChord changes. The date at the top shows the latest
          version, and its history is public with this website&apos;s code. Continuing to use
          BitChord after a change means you accept the updated terms.
        </p>
      </Section>

      <Section id="law" title="12. Governing law">
        <p>
          These terms are governed by the laws of India, without regard to conflict-of-law
          rules. Nothing in them takes away rights you have under the consumer protection laws of
          the country you live in.
        </p>
      </Section>

      <Section id="contact" title="13. Contact">
        <p>
          Questions about these terms: open an issue on <a href={ISSUES_URL}>GitHub</a> or ask
          on <a href={DISCORD_URL}>Discord</a>. See also the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalPage>
  )
}

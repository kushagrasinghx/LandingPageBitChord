import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, Section } from '@/components/legal/legal-page'
import { ISSUES_URL, REPO_URL } from '@/lib/github'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What the BitChord app stores on your device, what it sends to YouTube and the other services you turn on, and the little that reaches BitChord itself.',
  alternates: { canonical: '/privacy' },
}

const UPDATED = 'November 19, 2026'
const DISCORD_URL = 'https://discord.gg/pSafNTyKZx'

/**
 * The privacy policy for the BitChord apps (phone, TV, Wear OS, web) and this
 * site. Every claim here is traceable to the app's source; when the app
 * starts talking to a new service, this page changes with it.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <>
          <p>
            BitChord is a free, open-source music player for Android and Android TV, with a Wear
            OS companion and a web player. It is an independent client for YouTube Music, built
            and maintained by one developer,{' '}
            <a href="https://github.com/kushagrasinghx" className="underline underline-offset-4">
              @kushagrasinghx
            </a>
            . Its source code is public at{' '}
            <a href={REPO_URL} className="underline underline-offset-4">
              github.com/kushagrasinghx/BitChord
            </a>
            , so everything below can be checked against the code.
          </p>
          <p className="mt-4">
            The short version: BitChord has no BitChord account, no ads, no analytics and no
            crash reporting. Your listening history, playlists and settings live on your device.
            The app talks to YouTube to play music, and to other services only when you use a
            feature that needs them.
          </p>
        </>
      }
    >
      <Section id="not-affiliated" title="1. BitChord is not affiliated with anyone">
        <p>
          BitChord is <strong>not affiliated with, endorsed by, sponsored by or connected to</strong>{' '}
          YouTube, YouTube Music, Google, Spotify, Discord, Apple, Last.fm, Libre.fm,
          ListenBrainz, Musixmatch, Genius, LRCLIB, KuGou, TIDAL, JioSaavn or any other service
          the app can connect to. Their names and marks belong to their owners and are used only
          to say what the app works with. Each of those services has its own privacy policy,
          which applies to whatever you send it through BitChord.
        </p>
      </Section>

      <Section id="on-device" title="2. What stays on your device">
        <p>The app keeps the following in its private storage on your phone or TV:</p>
        <ul>
          <li>
            <strong>Listening statistics (Replay):</strong> monthly totals of the tracks,
            artists and albums you played, how long you listened and at what hours. These power
            the Replay screen.
          </li>
          <li>
            <strong>Search history</strong>, your local and offline playlists, the queue you were
            last playing, and your settings.
          </li>
          <li>
            <strong>Downloads:</strong> songs you choose to download are saved as audio files in
            your device&apos;s <code>Music/BitChord</code> folder, with their tags and lyrics.
          </li>
          <li>
            <strong>A cache</strong> of recently streamed audio (up to the size you set) and
            artwork.
          </li>
          <li>
            <strong>Sign-in details</strong> for the services you connect, described in{' '}
            <a href="#sign-ins">section 5</a>.
          </li>
          <li>
            <strong>Random identifiers</strong> generated on your device: an install ID for the
            presence count (<a href="#developer">section 3</a>), a device ID for Listen Together,
            and a device ID for Google Drive sync. None of them is derived from your phone&apos;s
            hardware or your identity.
          </li>
        </ul>
        <p>
          None of this is sent to BitChord. It leaves your device only in the cases below, or if
          you export it yourself with <strong>Export data</strong>, which writes a file to a
          place you choose. That file leaves out your passwords, tokens and API keys.
        </p>
        <p>
          Android&apos;s own app backup (if enabled on your device) may also copy the app&apos;s
          settings and listening statistics to your Google account. BitChord excludes its
          encrypted sign-in store, its source and addon list, and its Drive sync state from
          that backup.
        </p>
      </Section>

      <Section id="developer" title="3. What reaches BitChord's own servers">
        <p>
          BitChord runs a small number of servers. They never receive your name, email,
          listening history, YouTube cookies or any account credentials, except where stated
          below for features you choose to use.
        </p>

        <h3>Presence count</h3>
        <p>
          While the app is open, it sends a small message about every five minutes to{' '}
          <code>api.bitchord.kushagrasingh.in</code> containing a random install ID, the
          platform (for example &ldquo;android&rdquo;) and whether the app is open or closing.
          This is used only to show how many people are using BitChord right now. The ID is not
          linked to you, your accounts or your listening. Like any web server, it also sees your
          IP address while handling the request; it is not used to identify you.
        </p>

        <h3>Listen Together</h3>
        <p>
          If you start or join a Listen Together session (a &ldquo;Jam&rdquo;), the app
          connects to BitChord&apos;s party server. It sends:
        </p>
        <ul>
          <li>a pseudonymous user ID (a one-way hash of your YouTube account and profile IDs);</li>
          <li>a random device ID;</li>
          <li>the display name or nickname and avatar you show in the session;</li>
          <li>the tracks in the shared queue and the playback position, so everyone stays in sync.</li>
        </ul>
        <p>
          Other people in the session see your display name, avatar and the music being played.
          Sessions are held in the server&apos;s memory only and disappear when they end; there
          is no database. You can point the app at a different party server in its settings.
          Invite links open on this website at <code>/invite/…</code>.
        </p>

        <h3>Addon authentication</h3>
        <p>
          Some addons (<a href="#addons">section 7</a>) ask that only genuine copies of the app
          use them. For those addons only, the app creates a key in your device&apos;s secure
          hardware and sends its attestation certificate chain to{' '}
          <code>bitchord-auth.kushagrasingh.in</code>, in return for a short-lived token. The
          certificate chain shows the app&apos;s package name and signing certificate and
          whether your device&apos;s software is verified. It does not contain personal
          information. Addons that do not ask for this never trigger it.
        </p>

        <h3>Updates and Automix models (GitHub)</h3>
        <p>
          When the app starts it asks GitHub for the latest BitChord release, and offers to
          download it if there is one. The Automix feature downloads its models from the same
          GitHub releases the first time it is used. These requests go to GitHub, under{' '}
          <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub&apos;s privacy statement
          </a>
          .
        </p>
      </Section>

      <Section id="third-parties" title="4. Services the app connects to">
        <p>
          The app talks directly from your device to the services below. BitChord does not
          proxy, see or keep this traffic. Each service receives your IP address and whatever
          the feature needs, and handles it under its own privacy policy.
        </p>

        <h3>YouTube and YouTube Music (always)</h3>
        <p>
          Searching, browsing, playing and downloading music use YouTube&apos;s servers, the same
          way YouTube&apos;s own apps do. YouTube receives your searches and the songs you play.
          To keep playback working the app may load a YouTube page in a hidden web view to
          obtain the tokens YouTube requires. If you sign in to YouTube Music, requests are made
          as your account, your plays are added to your YouTube history, and you can see your
          library, playlists and recommendations. See{' '}
          <a href="https://policies.google.com/privacy">Google&apos;s Privacy Policy</a>.
        </p>

        <h3>Features that are on by default</h3>
        <ul>
          <li>
            <strong>Lyrics:</strong> when you open lyrics, the song&apos;s title, artist, album
            and length are sent to the lyrics providers enabled in Settings (such as LRCLIB,
            KuGou, Musixmatch, Genius, BetterLyrics, LyricsPlus, PaxSenix, lrc.red and YouTube
            itself) until one has the lyrics. You can turn providers off.
          </li>
          <li>
            <strong>Artwork and animated covers (Canvas):</strong> the artist and song name may be
            looked up on Apple Music / iTunes, TIDAL and a community Canvas list to find artist
            photos and animated artwork. Spotify Canvas is used only if you connect Spotify.
          </li>
          <li>
            <strong>Replay genres:</strong> artist names (and nothing else) are looked up on
            Last.fm to label your Replay with genres. This can be turned off in Settings.
          </li>
        </ul>

        <h3>Features you turn on</h3>
        <ul>
          <li>
            <strong>Discord status:</strong> if you sign in to Discord, the app connects to
            Discord as your account and shows what you are playing (title, artist, artwork, a
            link to the song and its timing) on your profile.
          </li>
          <li>
            <strong>Scrobbling:</strong> if you connect Last.fm, Libre.fm or ListenBrainz, the
            songs you play and when you played them are sent to that service.
          </li>
          <li>
            <strong>Spotify:</strong> if you sign in to Spotify, the app reads your Spotify
            library and playlists to import them, and fetches Spotify&apos;s animated artwork.
            Importing a public playlist by link reads that playlist&apos;s page. Imported
            tracks are matched to YouTube by searching for them.
          </li>
          <li>
            <strong>Lyrics translation:</strong> if you choose a translation language, lyrics
            lines are sent to Google Translate.
          </li>
          <li>
            <strong>JioSaavn:</strong> if you enable it as a source, searches and plays go to
            JioSaavn.
          </li>
          <li>
            <strong>WebDAV, SMB and other servers you add:</strong> the app connects only to the
            addresses you enter, with the credentials you give it.
          </li>
          <li>
            <strong>Google Cast:</strong> when you cast, the Cast device fetches and plays the
            stream itself. <strong>Android Auto</strong> and the <strong>Wear OS</strong> app
            talk to your phone directly; the watch app has no internet access of its own.
          </li>
          <li>
            <strong>Google Drive backup:</strong> described in <a href="#google-drive">section 6</a>.
          </li>
        </ul>
      </Section>

      <Section id="sign-ins" title="5. Sign-ins and how they are stored">
        <p>
          BitChord never asks for your passwords. YouTube Music, Spotify and Discord sign-ins
          happen on those services&apos; own login pages, shown inside the app. Once signed in,
          the app keeps what it needs to stay signed in on your device only:
        </p>
        <ul>
          <li>
            YouTube Music cookies, your Discord token and WebDAV/SMB passwords are kept in
            Android&apos;s encrypted storage, with a key held by your device&apos;s Keystore.
          </li>
          <li>
            Last.fm, Libre.fm and ListenBrainz session tokens, the Spotify session cookie and any
            lyrics API key you enter are kept in the app&apos;s private settings.
          </li>
        </ul>
        <p>
          These are sent only to the service they belong to, never to BitChord. Signing out in
          the app deletes them from your device.
        </p>
        <p>
          On Android TV, you can sign in by sending your YouTube sign-in from your phone to the
          TV over your home network; it goes directly between your two devices.
        </p>
      </Section>

      <Section id="google-drive" title="6. Google Drive backup">
        <p>
          Google Drive backup is optional and off until you connect a Google account in{' '}
          <strong>Settings → Backup and Restore → Google Drive backup</strong>. Sign-in happens
          through Google Play services; BitChord never sees your Google password.
        </p>
        <ul>
          <li>
            <strong>Access requested:</strong> only the{' '}
            <code>https://www.googleapis.com/auth/drive.appdata</code> scope. It lets BitChord
            use a hidden folder in your Drive that only BitChord can see. BitChord cannot see,
            open or change any of your other files. It also reads your Google account&apos;s
            email address and name to show which account is connected.
          </li>
          <li>
            <strong>What is stored there:</strong> your Replay listening statistics, your app
            settings (without passwords, tokens or keys), a name for each of your devices, and
            when each last synced.
          </li>
          <li>
            <strong>How it is used:</strong> to back up your Replay and settings, to restore them
            on a new phone, and to add up listening from all your devices in Replay. Nothing in
            your Drive is sent to BitChord&apos;s servers or to anyone else; the app talks to
            Google directly.
          </li>
          <li>
            <strong>Deleting it:</strong> you can delete any device&apos;s backup in the app,
            disconnect (which also withdraws BitChord&apos;s access), or remove BitChord in your
            Google Account under <em>Data &amp; privacy → Third-party apps &amp; services</em>,
            or delete the hidden app data in Google Drive&apos;s settings under{' '}
            <em>Manage apps</em>.
          </li>
        </ul>
        <p>
          BitChord&apos;s use and transfer of information received from Google APIs adheres to
          the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Data from Google Drive is used only to
          provide the backup and sync features described here. It is not used for advertising,
          not sold, not used to train AI models, and not read by any person.
        </p>
      </Section>

      <Section id="addons" title="7. Addons">
        <p>
          Addons are third-party servers you add by URL to give BitChord extra music sources.
          BitChord does not run, review or endorse any addon. An addon receives your search
          text, the IDs of the tracks you play from it, the audio quality you chose, your IP
          address and the app&apos;s version, and can record them under its own policy. Addons
          cannot run code in the app or read anything else on your device.
        </p>
        <p>
          Addon URLs (which may contain your personal access keys) are stored encrypted on your
          device. Only add addons you trust. Older builds supported JavaScript modules that ran
          in a sandbox with network access only; new ones can no longer be added.
        </p>
      </Section>

      <Section id="permissions" title="8. Android permissions">
        <ul>
          <li>
            <strong>Internet and network state</strong>: streaming, and using a different quality
            on Wi-Fi and mobile data.
          </li>
          <li>
            <strong>Notifications, foreground service, wake lock</strong>: background playback
            and download progress.
          </li>
          <li>
            <strong>Music and audio files</strong> (and storage on older Android): playing your
            local music and saving downloads.
          </li>
          <li>
            <strong>Nearby devices (Bluetooth)</strong>: showing the name of the headphones or
            speaker you are playing to. Asked only when you open the output picker.
          </li>
          <li>
            <strong>Install apps</strong>: installing BitChord updates you choose to download.
          </li>
          <li>
            <strong>Audio settings, USB</strong>: bit-perfect playback to USB DACs.
          </li>
          <li>
            <strong>Vibration</strong>: haptic feedback. <strong>Run at startup</strong>:
            scheduled tasks such as Drive backup.
          </li>
        </ul>
      </Section>

      <Section id="website" title="9. This website">
        <p>
          bitchord.kushagrasingh.in has no cookies, analytics or ad trackers. It is served
          through Cloudflare, which processes standard request data such as your IP address to
          deliver and protect the site. Download buttons link to GitHub.
        </p>
      </Section>

      <Section id="choices" title="10. Your choices">
        <ul>
          <li>Every optional feature in section 4 can be turned off, or signed out of, in Settings.</li>
          <li>
            Clearing BitChord&apos;s storage in Android settings, or uninstalling it, deletes
            everything it kept on your device except the songs you downloaded to your Music
            folder.
          </li>
          <li>
            Data held by YouTube, Spotify, Discord, Last.fm and the other services is managed with
            those services directly.
          </li>
        </ul>
      </Section>

      <Section id="children" title="11. Children">
        <p>
          BitChord is not directed at children under 13 and does not knowingly collect
          personal information from them. Services you sign in to through BitChord apply their
          own age requirements.
        </p>
      </Section>

      <Section id="changes" title="12. Changes and contact">
        <p>
          If BitChord starts handling data differently, this page will be updated and the date at
          the top will change. Its history is public along with this website&apos;s code.
        </p>
        <p>
          Questions or requests: open an issue on{' '}
          <a href={ISSUES_URL}>GitHub</a> or ask on <a href={DISCORD_URL}>Discord</a>. See also
          the <Link href="/terms">Terms of Service</Link>.
        </p>
      </Section>
    </LegalPage>
  )
}

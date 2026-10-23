<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The DRG page renders the original static HTML (src/drg-body.html) and runs the original scripts in src/drg-legacy/ — why: site updates arrive as static ZIPs and can be swapped in with minimal porting.
- Leads and funnel events are stored via /api/leads and /api/events using the Cloud admin client; only authenticated administrators have SELECT policies and anonymous access stays blocked — why: results require persisted contacts and private admin reads must work without exporting Cloud credentials.
- On Vercel without Cloud server credentials, validated capture payloads are relayed server-to-server to the fixed published DRG capture endpoints; admin credentials are never copied to Vercel — why: the managed Cloud secret is unavailable for external hosting, while all contacts and traffic must remain in the same Cloud.
- Pin Nitro's external deployment target to Vercel while letting the Lovable helper preserve its managed target — why: GitHub deployments need Vercel server-function output, not a Cloudflare bundle.
- Both capture endpoints validate Origin against the request origin or an exact DRG hosting-origin allowlist, while rejecting cross-site requests; never trust arbitrary forwarded hosts — why: hosting proxies may rewrite the request URL and otherwise reject legitimate calculator submissions.
- ZIP calculator updates must synchronize src/lib/drg.ts and src/drg-legacy/config.js and calculator.js, with parity tests — why: the server computes the persisted estimate while the browser prepares the preview.
- Keep `max-width:none` on `.container` in src/drg.css — why: Tailwind's own `.container` utility caps width at its breakpoint values (768px on a ~991px viewport) and squeezes the ported site layout.
- Keep the project lightbox in a React component attached to the static project photos — why: accessible modal controls can evolve without rewriting the imported HTML or legacy calculator.
- Mount gallery navigation controls through React portals into static navigation placeholders; keep photo descriptions with gallery assets — why: the same accessible gallery opens from covers and menus without duplicating state or modifying legacy navigation scripts.
- Admin panel: /admin lives under _authenticated; src/lib/admin-data.ts reads leads and funnel_events from the signed-in browser client after a has_role('admin') check, with admin-only RLS as the real gate — why: Vercel has no server-side Cloud variables, so server-function reads failed there while browser reads work on every host.
- Site images and font live as real files in public/media/ (not Lovable CDN pointers) — why: the repo is also deployed to Vercel via GitHub, where /__l5e/ URLs don't exist.
- Security headers (CSP with 'unsafe-eval' for the legacy scripts, X-Frame-Options, Permissions-Policy) are applied in src/server.ts to every response — why: one place covers both Lovable and Vercel hosting; tightening script-src breaks the legacy `new Function` bootstrap.
- The calculator has a hidden "company" honeypot field; /api/leads fakes success without saving when it is filled — why: blocks spam bots without a captcha and without revealing the trap.
- Serve photos as WebP from public/media/ (originals kept as source material); the share image is public/media/og-image.jpg at 1200x630 — why: the ported layout loads megabyte JPEGs otherwise, and social previews need a sized image on the public domain.

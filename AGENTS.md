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
- Leads and funnel events are stored via /api/leads and /api/events server routes using the admin client; tables have no public policies — why: the result is only revealed after the lead is saved server-side.
- On Vercel without Cloud server credentials, validated capture payloads are relayed server-to-server to the fixed published DRG capture endpoints; admin credentials are never copied to Vercel — why: the managed Cloud secret is unavailable for external hosting, while all contacts and traffic must remain in the same Cloud.
- Pin Nitro's external deployment target to Vercel while letting the Lovable helper preserve its managed target — why: GitHub deployments need Vercel server-function output, not a Cloudflare bundle.
- Both capture endpoints validate Origin against the request origin or an exact DRG hosting-origin allowlist, while rejecting cross-site requests; never trust arbitrary forwarded hosts — why: hosting proxies may rewrite the request URL and otherwise reject legitimate calculator submissions.
- ZIP calculator updates must synchronize src/lib/drg.ts and src/drg-legacy/config.js and calculator.js, with parity tests — why: the server computes the persisted estimate while the browser prepares the preview.
- Keep `max-width:none` on `.container` in src/drg.css — why: Tailwind's own `.container` utility caps width at its breakpoint values (768px on a ~991px viewport) and squeezes the ported site layout.
- Keep the project lightbox in a React component attached to the static project photos — why: accessible modal controls can evolve without rewriting the imported HTML or legacy calculator.
- Mount gallery navigation controls through React portals into static navigation placeholders; keep photo descriptions with gallery assets — why: the same accessible gallery opens from covers and menus without duplicating state or modifying legacy navigation scripts.
- Admin panel: /admin lives under _authenticated (client-only gate → /auth); lead reads go through the listLeads server fn which verifies has_role('admin') before using the admin client — why: leads have no public RLS policies, so the role check is the only read path.
- Site images and font live as real files in public/media/ (not Lovable CDN pointers) — why: the repo is also deployed to Vercel via GitHub, where /__l5e/ URLs don't exist.

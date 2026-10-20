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
- ZIP calculator updates must synchronize src/lib/drg.ts and src/drg-legacy/config.js and calculator.js, with parity tests — why: the server computes the persisted estimate while the browser prepares the preview.
- Keep `max-width:none` on `.container` in src/drg.css — why: Tailwind's own `.container` utility caps width at its breakpoint values (768px on a ~991px viewport) and squeezes the ported site layout.
- Keep the project lightbox in a React component attached to the static project photos — why: accessible modal controls can evolve without rewriting the imported HTML or legacy calculator.

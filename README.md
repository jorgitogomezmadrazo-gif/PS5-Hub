# Game Hub for fly.io

1. Install flyctl and log in:  `fly auth login`
2. In this folder, edit `fly.toml` and change `app = "..."` to a unique name.
3. Deploy:  `fly launch --no-deploy --copy-config` (say No to databases), then `fly deploy`

The Dockerfile installs Scramjet and the Wisp server during the build, so the proxy files
(`scramjet/`, `controller/`) are created for you. The hub is served from `public/index.html`,
the proxy backend is at `/wisp/`, and the extra apps are in `public/apps/`.

Put game folders/assets next to the hub inside `public/` if your games load files by relative path.

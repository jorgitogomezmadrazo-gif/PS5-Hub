Deploy to Fly.io
1. Install flyctl and log in:  fly auth login
2. In this folder run:         fly launch --copy-config --no-deploy   (pick an app name; say NO to databases)
3. Then:                       fly deploy
Open https://<your-app>.fly.dev

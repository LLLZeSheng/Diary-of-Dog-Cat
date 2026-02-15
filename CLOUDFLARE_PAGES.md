# Cloudflare Pages (Git Integration) - Diary of Dog and Cat

## 1) Connect GitHub repo

1. Open Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages.
2. Choose "Connect to Git" and authorize GitHub.
3. Select repo: `LLLZeSheng/Diary-of-Dog-Cat`.
4. Project name: `diary-of-dog-and-cat` (lowercase, no spaces).

## 2) Build settings

- Framework preset: None
- Build command: `exit 0`
- Build output directory: `.`

Click Deploy.

## 3) Custom domain (Huawei Cloud DNS)

1. Pages project -> Custom domains -> Add `www.kyriezs.com.cn`.
2. Huawei Cloud DNS (Public Zones) -> Add Record Set:
   - Type: CNAME
   - Name: `www`
   - Value: `diary-of-dog-and-cat.pages.dev`
3. Wait for DNS propagation (usually 10-60 minutes).

## 4) Quick verification

- Open `https://diary-of-dog-and-cat.pages.dev/assets/content.json` to verify latest content.
- If you see old content, wait for the new deploy, then hard refresh (Ctrl+F5).

## Temporary public access (LocalTunnel)

This is a fast, temporary way to share the site with people not on your LAN.

1. Start a local server (Window A):

```
cd D:\Postgraduate\dmm\other\2026
python -m http.server 8000
```

2. Create a tunnel (Window B):

```
npx localtunnel --port 8000
```

3. Share this URL (append `/love-site/`):

```
https://<random>.loca.lt/love-site/
```

Notes:
- Keep both windows open. If you close them, the link stops working.
- First run may prompt to install localtunnel (type `y`).

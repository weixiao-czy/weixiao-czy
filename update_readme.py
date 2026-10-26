import os
import re
import urllib.request
import json

USERNAME = "weixiao-czy"
TOKEN = os.environ.get("GH_TOKEN")

QUERY = """
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          primaryLanguage { name }
        }
      }
    }
    repositories(first: 4, privacy: PUBLIC, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes {
        name
        description
        url
        pushedAt
        stargazerCount
        primaryLanguage { name }
      }
    }
  }
}
"""

def fetch_github_data():
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": USERNAME}}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "README-Updater"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["data"]["user"]

def build_pinned_section(pinned_nodes):
    if not pinned_nodes:
        return "_暂无置顶项目_"
    cards = ['<div align="left">']
    for repo in pinned_nodes:
        name = repo["name"]
        url = repo["url"]
        card_img = f"https://github-readme-stats.vercel.app/api/pin/?username={USERNAME}&repo={name}&theme=tokyonight&hide_border=true"
        cards.append(f'  <a href="{url}"><img width="48%" src="{card_img}" alt="{name}" /></a>')
    cards.append("</div>")
    return "\n".join(cards)

def build_recent_section(recent_nodes):
    lines = []
    for repo in recent_nodes:
        name = repo["name"]
        url = repo["url"]
        desc = repo["description"] or "暂无简介"
        lang = repo["primaryLanguage"]["name"] if repo["primaryLanguage"] else "Code"
        date = repo["pushedAt"][:10]
        stars = repo["stargazerCount"]
        lines.append(f"- **[{name}]({url})** `{lang}` (⭐ {stars}) — {desc} *(更新于 {date})*")
    return "\n".join(lines)

def replace_chunk(content, marker, chunk):
    pattern = re.compile(rf"(<!-- {marker}_START -->).*?(<!-- {marker}_END -->)", re.DOTALL)
    return pattern.sub(rf"\1\n{chunk}\n\2", content)

if __name__ == "__main__":
    data = fetch_github_data()
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()

    readme = replace_chunk(readme, "PINNED", build_pinned_section(data["pinnedItems"]["nodes"]))
    readme = replace_chunk(readme, "RECENT", build_recent_section(data["repositories"]["nodes"]))

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(readme)

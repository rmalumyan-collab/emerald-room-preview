#!/usr/bin/env python3
"""ATRIUM Docs Autopilot v2. Runs trusted main script; NEVER execute PR code."""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

MAX_FILES = 5
MAX_ADDITIONS = 200
MAX_DELETIONS = 100
ALLOWED_AUTHOR = "rmalumyan-collab"
ALLOWED_PREFIXES = ("collab/chatgpt/drafts/", "collab/chatgpt/master/", "docs/notes/")
ALLOWED_BRANCHES = ("docs/", "exp/docs-")

class API:
    def __init__(self, repo, token):
        self.repo, self.token = repo, token
    def call(self, method, path, data=None):
        url = "https://api.github.com/repos/" + self.repo + path
        raw = None if data is None else json.dumps(data).encode("utf-8")
        headers = {
            "Authorization": "Bearer " + self.token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "atrium-docs-autopilot",
        }
        if raw is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=raw, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=25) as resp:
            answer = resp.read()
        return json.loads(answer) if answer else {}

def allow_path(p):
    if not p.endswith(".md") or "\\" in p or "//" in p or any(x in (".", "..") for x in p.split("/")):
        return False
    return p == "README.md" or any(p.startswith(x) for x in ALLOWED_PREFIXES)

def check(pr, files, modes):
    errors = []
    head, base = pr.get("head", {}), pr.get("base", {})
    repo = base.get("repo") or {}
    if pr.get("state") != "open" or pr.get("draft"):
        errors.append("PR must be open and not Draft")
    if base.get("ref") != "main":
        errors.append("Base must be main")
    if (head.get("repo") or {}).get("full_name") != repo.get("full_name"):
        errors.append("Fork or cross-repository head denied")
    if (pr.get("user") or {}).get("login") != ALLOWED_AUTHOR:
        errors.append("PR author not allowlisted")
    if not any(str(head.get("ref", "")).startswith(x) for x in ALLOWED_BRANCHES):
        errors.append("Branch must begin docs/ or exp/docs-")
    if pr.get("mergeable") is False or pr.get("mergeable_state") in ("blocked", "dirty", "behind"):
        errors.append("GitHub mergeability gate not ready")
    if not files or len(files) > MAX_FILES or pr.get("changed_files") != len(files):
        errors.append("Changed-file count invalid or unverified")
    if sum(int(f.get("additions", 0)) for f in files) > MAX_ADDITIONS:
        errors.append("Too many added lines")
    if sum(int(f.get("deletions", 0)) for f in files) > MAX_DELETIONS:
        errors.append("Too many removed lines")
    for f in files:
        path = f.get("filename", "")
        if not allow_path(path):
            errors.append("Disallowed path " + path)
        if f.get("status") not in ("added", "modified"):
            errors.append("No deletion/rename " + path)
        if int(f.get("changes", 0)) > 240:
            errors.append("Oversized file edit " + path)
        if modes.get(path) != "100644":
            errors.append("Symlink, submodule or unknown file mode " + path)
    return errors

def get_files(api, number):
    all_files = []
    for page in range(1, 12):
        items = api.call("GET", "/pulls/%s/files?per_page=100&page=%s" % (number, page))
        all_files.extend(items)
        if len(items) < 100:
            return all_files
    raise RuntimeError("PR file pagination limit reached")

def verify(api, number, sha):
    pr = api.call("GET", "/pulls/%s" % number)
    if not sha or (pr.get("head") or {}).get("sha") != sha:
        raise RuntimeError("HEAD SHA mismatch: stale PR")
    files = get_files(api, number)
    git_commit = api.call("GET", "/git/commits/%s" % urllib.parse.quote(sha, safe=""))
    tree_sha = (git_commit.get("tree") or {}).get("sha")
    if not tree_sha:
        raise RuntimeError("Cannot find trusted commit tree SHA")
    tree = api.call("GET", "/git/trees/%s?recursive=1" % tree_sha)
    if tree.get("truncated"):
        raise RuntimeError("Tree mode check truncated")
    paths = {f.get("filename", "") for f in files}
    modes = {e["path"]: e.get("mode") for e in tree.get("tree", []) if e.get("path") in paths}
    return pr, check(pr, files, modes)

def verify_statuses(api, sha):
    checks = api.call("GET", "/commits/%s/check-runs?per_page=100" % sha)
    if checks.get("total_count", 0) > 100:
        raise RuntimeError("Check runs overflow; refuse")
    runs = checks.get("check_runs", [])
    if not any(x.get("name") == "docs-eligibility" and x.get("conclusion") == "success" for x in runs):
        raise RuntimeError("Docs eligibility check not confirmed successful on exact SHA")
    for run in runs:
        if run.get("status") != "completed" or run.get("conclusion") not in ("success", "neutral", "skipped"):
            raise RuntimeError("Other check pending/failing: " + str(run.get("name")))
    legacy = api.call("GET", "/commits/%s/status" % sha)
    if legacy.get("total_count", 0) and legacy.get("state") != "success":
        raise RuntimeError("Legacy commit status not successful")

def report(items):
    msg = "\n".join(items) + "\n"
    print(msg)
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(msg)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("inspect", "merge"), required=True)
    parser.add_argument("--event", required=True)
    args = parser.parse_args()
    event = json.load(open(args.event, encoding="utf-8"))
    repo = os.environ["GITHUB_REPOSITORY"]
    api = API(repo, os.environ["GH_TOKEN"])

    if args.mode == "inspect":
        pr = event["pull_request"]
        _, reasons = verify(api, pr["number"], pr["head"]["sha"])
        report(["## ATRIUM docs eligibility",
                "- PR #%s: %s" % (pr["number"], "INELIGIBLE" if reasons else "ELIGIBLE"),
                "- " + ("; ".join(reasons) if reasons else "Strict policy passed"),
                "- This read-only check never merges."])
        return 0  # Non-docs PRs are simply ineligible, not failing the game CI.

    run = event.get("workflow_run") or {}
    if run.get("event") != "pull_request" or run.get("conclusion") != "success":
        report(["Skipped: no successful trusted PR workflow"]); return 0
    if (run.get("head_repository") or {}).get("full_name") != repo:
        report(["Skipped: workflow run not from this repository"]); return 0
    prs = run.get("pull_requests") or []
    if not prs and run.get("head_sha"):
        # Some workflow_run payloads omit PR associations. Resolve only by exact SHA,
        # fail closed on zero or multiple linked pull requests.
        linked = api.call("GET", "/commits/%s/pulls?per_page=10" % run["head_sha"])
        prs = [x for x in linked
               if (x.get("head") or {}).get("sha") == run["head_sha"]
               and (x.get("base") or {}).get("ref") == "main"]
    if len(prs) != 1:
        report(["Skipped: workflow run did not identify exactly one matching PR"]); return 0

    number, sha = prs[0]["number"], run.get("head_sha")
    try:
        _, reasons = verify(api, number, sha)
        if reasons:
            report(["Blocked PR #%s: %s" % (number, "; ".join(reasons))]); return 0
        verify_statuses(api, sha)
        if api.call("GET", "/pulls/%s" % number)["head"]["sha"] != sha:
            raise RuntimeError("Head changed during final verification")
        if os.getenv("ATRIUM_ENABLE_DOCS_MERGE", "false").lower() != "true":
            report(["DRY RUN: eligible PR #%s at %s; no merge" % (number, sha)])
            return 0
        result = api.call("PUT", "/pulls/%s/merge" % number, {
            "sha": sha, "merge_method": "squash",
            "commit_title": "docs: verified auto-merge PR #%s" % number,
        })
        if not result.get("merged"):
            raise RuntimeError("GitHub did not confirm merge")
        report(["## ATRIUM docs auto-merge", "- PR #%s merged" % number,
                "- Head SHA: " + sha, "- Merge SHA: " + str(result.get("sha"))])
    except (RuntimeError, urllib.error.HTTPError) as error:
        report(["## ATRIUM docs auto-merge", "- PR #%s BLOCKED: %s" % (number, error)])
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())

"""Offline policy unit tests; never use credentials or network."""
import importlib.util
import pathlib
import unittest

SRC = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "atrium_autopilot.py"
spec = importlib.util.spec_from_file_location("atrium_autopilot", SRC)
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)

def pr():
    repo = "rmalumyan-collab/emerald-world"
    return {
        "state": "open", "draft": False, "mergeable": True,
        "mergeable_state": "clean", "changed_files": 1,
        "head": {"sha": "123456", "ref": "docs/note",
                 "repo": {"full_name": repo}},
        "base": {"ref": "main", "repo": {"full_name": repo}},
        "user": {"login": "rmalumyan-collab"},
    }

def file():
    return {"filename": "collab/chatgpt/drafts/note.md",
            "status": "modified", "changes": 15,
            "additions": 12, "deletions": 3}

class SafeDocsPolicy(unittest.TestCase):
    def verdict(self, p=None, files=None, modes=None):
        p = p if p is not None else pr()
        files = files if files is not None else [file()]
        modes = modes if modes is not None else {f["filename"]: "100644" for f in files}
        return policy.check(p, files, modes)

    def test_docs_allowed(self): self.assertEqual(self.verdict(), [])
    def test_readme_allowed(self): self.assertTrue(policy.allow_path("README.md"))
    def test_workflow_denied(self): self.assertFalse(policy.allow_path(".github/workflows/x.md"))
    def test_worker_denied(self): self.assertFalse(policy.allow_path("tools/worker.md"))
    def test_game_denied(self): self.assertFalse(policy.allow_path("mirror-lake/README.md"))
    def test_python_denied(self): self.assertFalse(policy.allow_path("collab/chatgpt/drafts/a.py"))
    def test_traversal_denied(self): self.assertFalse(policy.allow_path("docs/notes/../CLAUDE.md"))
    def test_draft_denied(self):
        p = pr(); p["draft"] = True; self.assertTrue(self.verdict(p=p))
    def test_fork_denied(self):
        p = pr(); p["head"]["repo"]["full_name"] = "attacker/repo"
        self.assertTrue(self.verdict(p=p))
    def test_other_author_denied(self):
        p = pr(); p["user"]["login"] = "not-owner"; self.assertTrue(self.verdict(p=p))
    def test_wrong_branch_denied(self):
        p = pr(); p["head"]["ref"] = "feature/run"
        self.assertTrue(self.verdict(p=p))
    def test_wrong_base_denied(self):
        p = pr(); p["base"]["ref"] = "release"
        self.assertTrue(self.verdict(p=p))
    def test_nonregular_file_denied(self):
        self.assertTrue(self.verdict(modes={file()["filename"]: "120000"}))
    def test_deleted_denied(self):
        f = file(); f["status"] = "removed"
        self.assertTrue(self.verdict(files=[f]))
    def test_too_many_files_denied(self):
        p = pr(); p["changed_files"] = 6
        self.assertTrue(self.verdict(p=p, files=[file()] * 6))
    def test_oversized_denied(self):
        f = file(); f["additions"] = 500
        self.assertTrue(self.verdict(files=[f]))
    def test_blocked_merge_state_denied(self):
        p = pr(); p["mergeable_state"] = "blocked"
        self.assertTrue(self.verdict(p=p))

if __name__ == "__main__":
    unittest.main()

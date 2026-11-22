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


class WorkflowRunSafety(unittest.TestCase):
    @staticmethod
    def fixture():
        p = pr()
        p["head"]["sha"] = "HEAD_SHA"
        p["base"]["sha"] = "BASE_SHA"
        run = {
            "id": 42, "name": "ATRIUM Docs Eligibility",
            "head_sha": "MERGE_SHA", "head_branch": "docs/note",
            "event": "pull_request", "conclusion": "success",
            "path": ".github/workflows/atrium-docs-eligibility.yml@refs/heads/main",
            "pull_requests": [{"number": 123}]
        }
        return p, run

    @staticmethod
    def api(*, bad_parent=False, failed_job=False):
        _, run = WorkflowRunSafety.fixture()
        class Fake:
            def call(self, method, path, data=None):
                if path == "/actions/runs/42": return run
                if path == "/git/commits/MERGE_SHA":
                    return {"parents": [{"sha": "BASE_SHA"}, {"sha": "STALE_SHA" if bad_parent else "HEAD_SHA"}]}
                if path == "/actions/runs/42/jobs?per_page=100":
                    return {"total_count": 1, "jobs": [{"name": "docs-eligibility", "conclusion": "failure" if failed_job else "success"}]}
                if path.startswith("/commits/MERGE_SHA/check-runs?"):
                    return {"total_count": 1, "check_runs": [{"name": "docs-eligibility", "conclusion": "success", "status": "completed"}]}
                if path == "/commits/MERGE_SHA/status": return {"total_count": 0, "state": "pending"}
                if path.startswith("/pulls?"):
                    return [{"number": 123, "head": {"ref":"docs/note","repo":{"full_name":"rmalumyan-collab/emerald-world"}},"base":{"ref":"main"}}]
                raise AssertionError("Unexpected API call: " + path)
        return Fake()

    def test_synthetic_merge_parent_matches_head(self):
        p, run = self.fixture()
        self.assertEqual(policy.verify_event_run(self.api(), run, p), ("HEAD_SHA", "MERGE_SHA"))
    def test_stale_merge_parent_blocked(self):
        p, run = self.fixture()
        with self.assertRaises(RuntimeError):
            policy.verify_event_run(self.api(bad_parent=True), run, p)
    def test_failed_docs_job_blocked(self):
        p, run = self.fixture()
        with self.assertRaises(RuntimeError):
            policy.verify_event_run(self.api(failed_job=True), run, p)
    def test_linked_prs_empty_fallback_exact_branch(self):
        _, run = self.fixture()
        run["pull_requests"] = []
        found = policy.linked_pull_requests(self.api(), run, "rmalumyan-collab/emerald-world")
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["number"], 123)
    def test_check_statuses_on_tested_merge_sha(self):
        policy.verify_statuses(self.api(), "MERGE_SHA")
    def test_unrelated_workflow_path_blocked(self):
        p, run = self.fixture()
        run["path"] = ".github/workflows/attacker.yml@refs/heads/main"
        # The confirmed API response cannot grant trust to an unrelated name/path.
        class BadRun(self.api().__class__):
            def call(self, method, path, data=None):
                if path == "/actions/runs/42":
                    return {**run}
                return super().call(method, path, data)
        with self.assertRaises(RuntimeError):
            policy.verify_event_run(BadRun(), run, p)


class PolicyReadinessTests(unittest.TestCase):
    def test_only_mergeability_pending_is_policy_eligible(self):
        self.assertEqual(policy.policy_errors(["GitHub mergeability gate not ready"]), [])
    def test_real_policy_denial_is_preserved(self):
        self.assertEqual(policy.policy_errors(["Disallowed path tools/runner.py", "GitHub mergeability gate not ready"]),
                         ["Disallowed path tools/runner.py"])
    def test_draft_still_denied_despite_pending_mergeability(self):
        self.assertEqual(policy.policy_errors(["PR must be open and not Draft", "GitHub mergeability gate not ready"]),
                         ["PR must be open and not Draft"])
    def test_merge_gate_remains_strict_when_not_ready(self):
        p = pr(); p["mergeable_state"] = "unknown"
        reasons = policy.check(p, [file()], {file()["filename"]: "100644"})
        self.assertIn("GitHub mergeability gate not ready", reasons)

if __name__ == "__main__":
    unittest.main()

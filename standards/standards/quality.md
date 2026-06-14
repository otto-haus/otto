```yaml
name: Quality / No Fake Done
slug: quality
version: 0.1
status: active

meaning: Done means proven, not claimed. Evidence over confidence.

under_pressure:
  do:
    - map every acceptance criterion to a receipt
    - show proof; name remaining risks
    - block or sharpen when there is no evidence
    - say "not done" out loud when proof is missing
  refuse:
    - vague "looks good"
    - marking done on confidence
    - proxy evidence treated as real evidence
    - shipping without checks
reward:
  - AC-by-AC proof at completion
  - catching a premature "done"
  - cleanup before completion
  - honest "not done yet, here's the blocker"
failure_modes:
  - proxy evidence (it compiled => it works)
  - done that just means "I stopped working"
  - perfectionism / slow ceremony (the overcorrection)
conflicts_with:
  - winning            # ship now vs prove more
  - respect-attention  # thoroughness vs Sebastian's time
tie_breakers:
  - cut scope before cutting proof
  - evidence proportional to consequence (reversible work needs less)
  - never win by cutting the evidence corner
related_practices:
  - review
  - charter
related_curation_rules:
  - done requires receipts
  - no artifact, no progress
  - two no-evidence loops force block/sharpen
evidence:
  - every acceptance criterion mapped to a receipt
  - unmapped criterion => not done
  - test/log/screenshot/artifact
related_anti_patterns:
  - fake-progress
  - ceremony-without-signal
canon_refs:
  - horowitz
ratification:
  owner: Sebastian
  standards_changes_require_human: true
```

# Quality / No Fake Done

The broad bar (the work is actually good) fused with its sharp, enforceable edge: **done
means proven, not claimed.** This is the Standard that bites most often.

**Why it exists.** Confidence is cheap and contagious. Premature "done" is how compound
systems rot — a fake completion becomes a Receipt becomes a memory writeback, poisoning
everything downstream.

**The rule:**

```txt
No artifact, no progress.
Done requires every acceptance criterion mapped to a receipt.
Any unmapped criterion => not done.
Two no-evidence loops force a block or a sharpen.
```

**Under pressure** it maps each claim to a Receipt, names what's still risky, and says
"not done" rather than rounding up to "looks good."

**Failure mode** runs both ways: too little is fake done; too much is perfectionism and
ceremony that never ships. The fix is *evidence proportional to consequence*, decided with
[Judgment](judgment.md). When proof and speed genuinely collide, that's a
[Precedent](../precedents/), not a quiet shortcut — cut scope, never proof.

**Enforced by** `/review` (claim → evidence), Charter's Auditor (done AC-by-AC), and
Curation refusing to compound a Run without a Receipt.

> Demonstrated biting on this very build:
> [`../evaluations/decision-grades/2026-06-13-no-fake-done-blocks-standards-v0.md`](../evaluations/decision-grades/2026-06-13-no-fake-done-blocks-standards-v0.md).

<!-- otto:ratified prop_20260614_c1e85aeb 2026-06-14T06:20:13.394Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_23ce6799 2026-06-14T06:20:22.319Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8459b0c3 2026-06-14T06:21:13.828Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b727be5f 2026-06-14T06:21:19.227Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_a9e045ef 2026-06-14T06:21:47.768Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_efd375d6 2026-06-14T06:21:50.527Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_7ccf4f8d 2026-06-14T06:21:52.472Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_07fbfbc2 2026-06-14T06:21:54.891Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_a595f6fa 2026-06-14T06:21:56.024Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_aa0b0b40 2026-06-14T06:22:19.509Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_dbaec6f0 2026-06-14T06:22:25.789Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0b58f71f 2026-06-14T06:22:58.966Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_23a0bc1b 2026-06-14T06:23:05.226Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_78e66efc 2026-06-14T06:23:14.653Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_2aec0a03 2026-06-14T06:23:15.848Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b4d55934 2026-06-14T06:23:35.992Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_bb10c1ef 2026-06-14T06:23:38.119Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_9ecb40e8 2026-06-14T06:23:42.043Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_c35cc773 2026-06-14T06:23:55.031Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d28bd814 2026-06-14T06:23:57.286Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8b60033b 2026-06-14T06:24:01.877Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_74dc476b 2026-06-14T06:24:07.884Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8e1e7ea3 2026-06-14T06:24:19.965Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0de3723e 2026-06-14T06:24:22.375Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0a32715b 2026-06-14T06:24:24.201Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_79ceb290 2026-06-14T06:24:29.722Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b1290947 2026-06-14T06:24:30.931Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_395e9acf 2026-06-14T06:24:45.661Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_69b13d66 2026-06-14T06:24:49.311Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d0cf79e2 2026-06-14T06:24:53.717Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_58d2477d 2026-06-14T06:24:58.924Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_85c0e2c7 2026-06-14T06:25:15.539Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_3afac17b 2026-06-14T06:25:16.750Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d0a16544 2026-06-14T06:27:04.469Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_27d47684 2026-06-14T06:27:05.550Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_3b3c3123 2026-06-14T06:27:32.967Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_289aa527 2026-06-14T06:27:40.581Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d49dd131 2026-06-14T06:27:55.921Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_670104c7 2026-06-14T06:28:43.947Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_7c2ba8e7 2026-06-14T06:29:08.432Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d8c1482b 2026-06-14T06:29:10.158Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_373e85d9 2026-06-14T06:29:13.161Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0218e860 2026-06-14T06:29:19.967Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_6a51f14b 2026-06-14T06:29:20.562Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_ff2164c7 2026-06-14T06:29:22.024Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_5c6c8adc 2026-06-14T06:29:34.464Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_79a0370d 2026-06-14T06:29:34.613Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_f751f554 2026-06-14T06:29:43.828Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0e7d954f 2026-06-14T06:29:44.004Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d5d21754 2026-06-14T06:29:56.303Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_5ca28ca1 2026-06-14T06:30:06.124Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b0cf984d 2026-06-14T06:30:32.113Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_1aaaa8e6 2026-06-14T06:30:34.237Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_16fcaf3a 2026-06-14T06:30:44.552Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_50417740 2026-06-14T06:30:46.677Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_60bef53b 2026-06-14T06:31:01.486Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b76791c1 2026-06-14T06:31:05.737Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_e8433235 2026-06-14T06:31:10.006Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_dbdf6101 2026-06-14T06:31:16.368Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0e165103 2026-06-14T06:31:17.517Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_9eb67a63 2026-06-14T06:31:24.570Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_4826b599 2026-06-14T06:31:36.425Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_ffcd1a9e 2026-06-14T06:32:11.841Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_4584cd9a 2026-06-14T06:32:19.532Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_ba6d8ef2 2026-06-14T06:34:24.469Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_3edd0f43 2026-06-14T06:35:04.544Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_2f5178e6 2026-06-14T06:35:09.246Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_51f99e0c 2026-06-14T06:45:53.359Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_9e9b7680 2026-06-14T06:48:47.921Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d64da151 2026-06-14T06:48:50.368Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_1ef0419f 2026-06-14T06:49:58.446Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_c9496824 2026-06-14T06:50:30.320Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_122e67f0 2026-06-14T06:50:35.386Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8936fd97 2026-06-14T06:50:37.551Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b71cc462 2026-06-14T06:50:52.870Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_fb78bffb 2026-06-14T06:51:21.416Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_539d9238 2026-06-14T06:51:21.892Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_305b327b 2026-06-14T06:56:50.357Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8d647670 2026-06-14T07:02:59.314Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_6e2e40f4 2026-06-14T07:07:41.947Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_5b44c902 2026-06-14T07:07:44.410Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_bbf0013c 2026-06-14T07:09:26.088Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_66bf6193 2026-06-14T07:10:32.343Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_04649b25 2026-06-14T07:11:40.646Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_eda6bbc6 2026-06-14T07:14:02.020Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_3dfc5989 2026-06-14T07:16:03.237Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_f9445185 2026-06-14T07:39:26.100Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_e9a17477 2026-06-14T07:40:04.818Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_fbbaf616 2026-06-14T07:47:49.925Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_69a5e918 2026-06-14T07:47:52.665Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_4b8c48f2 2026-06-14T07:48:56.277Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_5cf34679 2026-06-14T07:49:06.647Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d4ab975b 2026-06-14T07:50:54.517Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_85fc6b56 2026-06-14T07:50:54.890Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_8e615164 2026-06-14T13:59:53.187Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_11d98766 2026-06-14T14:06:26.941Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_9a4c97cf 2026-06-14T14:06:30.432Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_a81eef3e 2026-06-14T14:06:32.347Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_6e0edd0f 2026-06-14T14:16:12.947Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_b7af0b53 2026-06-14T14:16:33.431Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_25f712d6 2026-06-14T14:17:02.950Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d2e9e0e6 2026-06-14T14:20:34.744Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_cbae2ebe 2026-06-14T14:21:00.893Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_c1d3251a 2026-06-14T14:21:04.065Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_a441d14e 2026-06-14T14:21:05.951Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_f6d9d2ce 2026-06-14T14:22:18.858Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d621c4ed 2026-06-14T14:23:15.917Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_f9ef3377 2026-06-14T14:27:03.706Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_d2064afb 2026-06-14T14:27:11.891Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_0cde3495 2026-06-14T14:27:30.848Z -->
Ratify quality standard for Culture CI compile path.

<!-- otto:ratified prop_20260614_3a22b37f 2026-06-14T14:28:35.868Z -->
Ratify quality standard for Culture CI compile path.

### Week 9 Objectives

* First official commit to GitHub.
* Implement label OCR pipeline (nutrition facts extraction).
* Build barcode scanning pipeline with multi-tier cache.
* Create Dockerfile and Gradio web UI for demo.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - Initial Project Commit <br>&emsp; + First official commit: project with i18n and API <br>&emsp; + Configured .env and environment setup <br>&emsp; + Pushed to GitHub repository | 03/03/2026 | 03/03/2026 | [GitHub Repo](https://github.com/NeuraX-HQ) |
| 2 | - Label OCR Pipeline <br>&emsp; + Built /analyze-label endpoint — VLM extracts exact nutrition facts from product images <br>&emsp; + OCRER model outputs strict 4-table CSV: product info, nutrients, ingredients, allergens <br>&emsp; + Prompt engineering: strict CSV format with pipe delimiters, no extra text <br>&emsp; + Same async pattern: HTTP 202 → background job → poll /jobs/{id} | 05/03/2026 | 05/03/2026 | [Label Analyzer] |
| 3 | - Barcode Scanning Pipeline (Part 1) <br>&emsp; + Built /scan-barcode endpoint with pyrxing barcode decoder <br>&emsp; + Designed 3-tier cache hierarchy: L1 LRU RAM (256 slots) → L2 disk JSON → L3 API fallback <br>&emsp; + L2 disk lookup order: OpenFoodFacts → Avocavo → USDA <br>&emsp; + L3 API search order: Avocavo → OpenFoodFacts → USDA (first hit short-circuits) | 06/03/2026 | 06/03/2026 | [Cache Design] |
| 4 | - Barcode Scanning Pipeline (Part 2) <br>&emsp; + Cache TTL: 30 days, expired entries trigger L3 API refresh <br>&emsp; + L1→L2 promotion on hit, L3→L1 promotion on API success <br>&emsp; + Negative cache support: caches "not found" results to avoid redundant API calls <br>&emsp; + All 3 API clients return standardized output format | 07/03/2026 | 07/03/2026 | [Client Scripts] |
| 5 | - Gradio Web UI & Dockerfile <br>&emsp; + Built Gradio UI for interactive food analysis and label OCR demo <br>&emsp; + Supports both "manual" and "tools" method selection <br>&emsp; + Created Dockerfile for deployment <br>&emsp; + Image compression in all pipelines: 768px max, JPEG q75 | 08/03/2026 | 08/03/2026 | [Gradio Demo] |
| 6-7 | - Multiple Food Detection & Testing <br>&emsp; + Extended food analysis to detect multiple dishes in one image <br>&emsp; + Unified output format between tool-use and manual methods <br>&emsp; + Wrote tests for all 3 pipeline endpoints <br>&emsp; + Fixed image format edge cases (P→RGB conversion) | 08/03/2026 | 08/03/2026 | [Test Suite] |

### Week 9 Achievements

* **Label OCR Pipeline:**
  * Complete pipeline: image → VLM (OCRER model) → exact nutrition facts extraction → structured data.
  * Outputs 4 CSV tables: product info (name, brand, serving), nutrients (per-serving values), ingredients list, allergens.
  * Prompt optimized with strict CSV format — same token reduction approach as food analysis.

* **Barcode 3-Tier Cache:**
  * **L1 (RAM):** LRU cache with OrderedDict, 256 max slots, Thread-safe.
  * **L2 (Disk):** JSON files per client (openfoodfacts_cache.json, avocavo_cache.json, usda_cache.json), 30-day TTL.
  * **L3 (API):** Fallback to live API calls — Avocavo → OpenFoodFacts → USDA, first hit short-circuits.
  * Promotion: L2 hit → promote to L1, L3 hit → promote to L1.
  * Negative cache: caches "not found" to avoid redundant lookups.

* **Image Compression:**
  * `prepare_image_for_bedrock()`: resize to 768px, JPEG q75, force compress if > 200KB or > max_pixels.
  * Auto-converts image modes (P, RGBA, L → RGB) before JPEG compression.
  * Applied across all 3 pipelines for consistent token savings.

* **Containerization:**
  * Dockerfile ready for deployment to any container platform.
  * Gradio demo UI for interactive testing without separate frontend.

### Challenges & Lessons

* **Challenges:**
  * Label OCR needs to extract exact nutrition values — VLM sometimes hallucinate or merge fields.
  * Barcode cache design: handling negative results, expired entries, and multi-source fallback.
  * Image format edge cases: palette mode 'P' can't save as JPEG directly.

* **Solutions:**
  * Strict CSV prompt with example rows — VLM follows the format precisely.
  * Implemented negative caching and TTL expiry with automatic L3 refresh.
  * Auto-convert image mode to RGB/RGBA before JPEG compression.

* **Lessons Learned:**
  * 3-tier cache is much more effective than simple in-memory cache — L2 disk persists across restarts.
  * Negative caching prevents repeated failed API calls — critical for barcode databases.
  * Strict CSV format in prompts gives more consistent output than requesting JSON.

### Next Week Plan

* Deploy API to ECS Fargate ARM + Spot for cost-effective hosting.
* Finalize all 3 pipelines (/analyze-food, /analyze-label, /scan-barcode).
* Build 3 nutrition API clients (USDA, OpenFoodFacts, Avocavo) with tests.
* Write comprehensive tests for all endpoints.
